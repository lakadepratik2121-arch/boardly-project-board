import { Router } from 'express'
import mongoose from 'mongoose'
import BoardMember from '../models/BoardMember.js'
import Comment from '../models/Comment.js'
import Task from '../models/Task.js'
import logActivity from '../utils/logActivity.js'
import requireBoardAccess from '../middleware/requireBoardAccess.js'
import ensureBoardLists from '../utils/ensureBoardLists.js'
import BoardList from '../models/BoardList.js'
import User from '../models/User.js'

const router = Router({ mergeParams: true })

router.use(async (request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ ok: false, message: 'The database is not connected yet.' })
  }

  if (!mongoose.isValidObjectId(request.params.boardId)) {
    return response.status(400).json({ ok: false, message: 'The board ID is not valid.' })
  }

  next()
})
router.use(requireBoardAccess)

router.get('/', async (request, response) => {
  await ensureBoardLists(request.board._id)
  const tasks = await Task.find({ board: request.board._id }).sort({ createdAt: -1 }).populate('assignedTo', 'name email').lean()
  response.json({ ok: true, tasks })
})

router.post('/', async (request, response) => {
  const { title, description = '', dueDate = null, listId = null, assignedTo = null } = request.body ?? {}

  if (typeof title !== 'string' || !title.trim()) {
    return response.status(400).json({ ok: false, message: 'Please provide a task title.' })
  }

  if (typeof description !== 'string') {
    return response.status(400).json({ ok: false, message: 'A task description must be text.' })
  }

  let parsedDueDate = null
  if (dueDate !== null && dueDate !== '') {
    parsedDueDate = new Date(dueDate)
    if (Number.isNaN(parsedDueDate.getTime())) {
      return response.status(400).json({ ok: false, message: 'Please provide a valid due date.' })
    }
  }

  const lists = await ensureBoardLists(request.board._id)
  const list = listId ? await BoardList.findOne({ _id: listId, board: request.board._id }) : lists[0]
  if (!list) return response.status(400).json({ ok: false, message: 'Choose a valid list.' })
  if (assignedTo) {
    const boardMember = String(request.board.owner) === String(assignedTo)
      || await BoardMember.exists({ board: request.board._id, user: assignedTo, status: 'active' })
    if (!boardMember || !await User.exists({ _id: assignedTo })) return response.status(400).json({ ok: false, message: 'Choose a board member as the assignee.' })
  }
  const task = await Task.create({
    title: title.trim(),
    description: description.trim(),
    dueDate: parsedDueDate,
    board: request.board._id,
    list: list._id,
    status: list.status,
    assignedTo: assignedTo || null,
    createdBy: request.user._id,
  })

  await logActivity({
    board: request.board._id,
    actorName: request.user.name,
    action: 'created task',
    targetType: 'Task',
    targetId: task._id,
    targetName: task.title,
  })

  response.status(201).json({ ok: true, task })
})

router.patch('/:taskId', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.taskId)) {
    return response.status(400).json({ ok: false, message: 'The task ID is not valid.' })
  }

  const body = request.body ?? {}
  const updates = {}

  if (Object.hasOwn(body, 'status')) {
    if (!['todo', 'in-progress', 'done'].includes(body.status)) {
      return response.status(400).json({ ok: false, message: 'Choose a valid task status.' })
    }
    updates.status = body.status
    const target = (await ensureBoardLists(request.board._id)).find((list) => list.status === body.status)
    if (target) updates.list = target._id
  }

  if (Object.hasOwn(body, 'listId')) {
    if (!mongoose.isValidObjectId(body.listId)) return response.status(400).json({ ok: false, message: 'Choose a valid list.' })
    const list = await BoardList.findOne({ _id: body.listId, board: request.board._id })
    if (!list) return response.status(400).json({ ok: false, message: 'Choose a valid list.' })
    updates.list = list._id
    updates.status = list.status
  }

  if (Object.hasOwn(body, 'assignedTo')) {
    if (body.assignedTo === null || body.assignedTo === '') updates.assignedTo = null
    else {
      if (!mongoose.isValidObjectId(body.assignedTo)) return response.status(400).json({ ok: false, message: 'Choose a board member as the assignee.' })
      const member = await User.findById(body.assignedTo).select('_id')
      const isMember = String(request.board.owner) === String(body.assignedTo)
        || await BoardMember.exists({ board: request.board._id, user: body.assignedTo, status: 'active' })
      if (!member || !isMember) return response.status(400).json({ ok: false, message: 'Choose a board member as the assignee.' })
      updates.assignedTo = member._id
    }
  }

  if (Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return response.status(400).json({ ok: false, message: 'Please provide a task title.' })
    }
    if (body.title.trim().length > 120) {
      return response.status(400).json({ ok: false, message: 'A task title can be at most 120 characters.' })
    }
    updates.title = body.title.trim()
  }

  if (Object.hasOwn(body, 'description')) {
    if (typeof body.description !== 'string' || body.description.length > 500) {
      return response.status(400).json({ ok: false, message: 'A task description must be text of at most 500 characters.' })
    }
    updates.description = body.description.trim()
  }

  if (Object.hasOwn(body, 'dueDate')) {
    if (body.dueDate === null || body.dueDate === '') {
      updates.dueDate = null
    } else {
      const dueDate = new Date(body.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        return response.status(400).json({ ok: false, message: 'Please provide a valid due date.' })
      }
      updates.dueDate = dueDate
    }
  }

  if (Object.keys(updates).length === 0) {
    return response.status(400).json({ ok: false, message: 'Provide at least one task field to update.' })
  }

  let task = await Task.findOneAndUpdate(
    { _id: request.params.taskId, board: request.board._id },
    { $set: updates },
    { new: true, runValidators: true },
  ).populate('assignedTo', 'name email')

  if (task) task = task.toObject()

  if (!task) {
    return response.status(404).json({ ok: false, message: 'Task not found.' })
  }

  const statusLabels = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' }
  const action = Object.hasOwn(updates, 'status')
    ? `moved task to ${statusLabels[updates.status]}`
    : 'updated task details'
  await logActivity({
    board: request.board._id,
    actorName: request.user.name,
    action,
    targetType: 'Task',
    targetId: task._id,
    targetName: task.title,
  })

  response.json({ ok: true, task })
})

router.delete('/:taskId', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.taskId)) {
    return response.status(400).json({ ok: false, message: 'The task ID is not valid.' })
  }

  const task = await Task.findOneAndDelete({
    _id: request.params.taskId,
    board: request.board._id,
  }).lean()

  if (!task) {
    return response.status(404).json({ ok: false, message: 'Task not found.' })
  }

  await Comment.deleteMany({ board: request.board._id, task: task._id })
  await logActivity({
    board: request.board._id,
    actorName: request.user.name,
    action: 'deleted task',
    targetType: 'Task',
    targetId: task._id,
    targetName: task.title,
  })
  response.json({ ok: true, task })
})

export default router
