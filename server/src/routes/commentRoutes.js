import { Router } from 'express'
import mongoose from 'mongoose'
import requireBoardAccess from '../middleware/requireBoardAccess.js'
import Comment from '../models/Comment.js'
import Task from '../models/Task.js'
import logActivity from '../utils/logActivity.js'

const router = Router({ mergeParams: true })

router.use(async (request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ ok: false, message: 'The database is not connected yet.' })
  }

  if (!mongoose.isValidObjectId(request.params.boardId)) {
    return response.status(400).json({ ok: false, message: 'The board ID is not valid.' })
  }
  if (!mongoose.isValidObjectId(request.params.taskId)) {
    return response.status(400).json({ ok: false, message: 'The task ID is not valid.' })
  }

  next()
})

router.use(requireBoardAccess, async (request, response, next) => {
  const task = await Task.findOne({ _id: request.params.taskId, board: request.board._id })
  if (!task) {
    return response.status(404).json({ ok: false, message: 'Task not found on this board.' })
  }

  request.task = task
  next()
})

router.get('/', async (request, response) => {
  const comments = await Comment.find({ board: request.board._id, task: request.task._id })
    .sort({ createdAt: 1 })
    .lean()
  response.json({ ok: true, comments })
})

router.post('/', async (request, response) => {
  const { text } = request.body ?? {}
  if (typeof text !== 'string' || !text.trim()) {
    return response.status(400).json({ ok: false, message: 'Please write a comment.' })
  }
  if (text.trim().length > 1000) {
    return response.status(400).json({ ok: false, message: 'A comment can be at most 1000 characters.' })
  }

  const comment = await Comment.create({
    board: request.board._id,
    task: request.task._id,
    authorName: request.user.name,
    text: text.trim(),
  })

  await logActivity({
    board: request.board._id,
    actorName: request.user.name,
    action: 'commented on task',
    targetType: 'Task',
    targetId: request.task._id,
    targetName: request.task.title,
  })

  response.status(201).json({ ok: true, comment })
})

export default router
