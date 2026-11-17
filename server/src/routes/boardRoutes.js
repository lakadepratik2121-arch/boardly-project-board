import { Router } from 'express'
import mongoose from 'mongoose'
import Board from '../models/Board.js'
import BoardMember from '../models/BoardMember.js'
import BoardList from '../models/BoardList.js'

const router = Router()

router.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({
      ok: false,
      message: 'The database is not connected yet.',
    })
  }

  next()
})

router.get('/', async (request, response) => {
  const memberships = await BoardMember.find({ user: request.user._id, status: 'active' }).select('board').lean()
  const boards = await Board.find({ $or: [{ owner: request.user._id }, { _id: { $in: memberships.map((item) => item.board) } }] }).sort({ createdAt: -1 }).lean()
  response.json({ ok: true, boards })
})

router.post('/', async (request, response) => {
  const { title, description = '' } = request.body ?? {}

  if (typeof title !== 'string' || !title.trim()) {
    return response.status(400).json({
      ok: false,
      message: 'Please provide a board title.',
    })
  }

  if (title.trim().length > 100) {
    return response.status(400).json({
      ok: false,
      message: 'A board title can be at most 100 characters.',
    })
  }

  if (typeof description !== 'string' || description.length > 500) {
    return response.status(400).json({
      ok: false,
      message: 'A board description must be text of at most 500 characters.',
    })
  }

  const board = await Board.create({
    owner: request.user._id,
    title: title.trim(),
    description: description.trim(),
  })
  await BoardList.create([
    { board: board._id, title: 'To do', status: 'todo', systemKey: 'todo', position: 0 },
    { board: board._id, title: 'In progress', status: 'in-progress', systemKey: 'in-progress', position: 1 },
    { board: board._id, title: 'Done', status: 'done', systemKey: 'done', position: 2 },
  ])
  response.status(201).json({ ok: true, board })
})

router.patch('/:boardId', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.boardId)) return response.status(400).json({ ok: false, message: 'The board ID is not valid.' })
  const updates = {}
  if (Object.hasOwn(request.body ?? {}, 'title')) {
    if (typeof request.body.title !== 'string' || !request.body.title.trim() || request.body.title.trim().length > 100) return response.status(400).json({ ok: false, message: 'Enter a board title up to 100 characters.' })
    updates.title = request.body.title.trim()
  }
  if (Object.hasOwn(request.body ?? {}, 'description')) {
    if (typeof request.body.description !== 'string' || request.body.description.length > 500) return response.status(400).json({ ok: false, message: 'The board description must be at most 500 characters.' })
    updates.description = request.body.description.trim()
  }
  if (!Object.keys(updates).length) return response.status(400).json({ ok: false, message: 'Provide a board title or description to update.' })
  const board = await Board.findOneAndUpdate({ _id: request.params.boardId, owner: request.user._id }, { $set: updates }, { new: true, runValidators: true }).lean()
  if (!board) return response.status(404).json({ ok: false, message: 'Board not found.' })
  response.json({ ok: true, board })
})

export default router
