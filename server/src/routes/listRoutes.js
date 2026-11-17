import { Router } from 'express'
import BoardList from '../models/BoardList.js'
import mongoose from 'mongoose'
import Task from '../models/Task.js'
import ensureBoardLists from '../utils/ensureBoardLists.js'
import requireBoardAccess from '../middleware/requireBoardAccess.js'

const router = Router({ mergeParams: true })
router.use(requireBoardAccess)

router.get('/', async (request, response) => {
  response.json({ ok: true, lists: await ensureBoardLists(request.board._id) })
})

router.post('/', async (request, response) => {
  if (request.boardRole !== 'owner') return response.status(403).json({ ok: false, message: 'Only the board owner can add lists.' })
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  if (!title || title.length > 60) return response.status(400).json({ ok: false, message: 'Enter a list name up to 60 characters.' })
  const lists = await ensureBoardLists(request.board._id)
  const list = await BoardList.create({ board: request.board._id, title, position: lists.length, status: 'todo' })
  response.status(201).json({ ok: true, list })
})

router.patch('/:listId', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.listId)) return response.status(400).json({ ok: false, message: 'The list ID is not valid.' })
  if (request.boardRole !== 'owner') return response.status(403).json({ ok: false, message: 'Only the board owner can edit lists.' })
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  if (!title || title.length > 60) return response.status(400).json({ ok: false, message: 'Enter a list name up to 60 characters.' })
  const list = await BoardList.findOneAndUpdate({ _id: request.params.listId, board: request.board._id }, { $set: { title } }, { new: true, runValidators: true })
  if (!list) return response.status(404).json({ ok: false, message: 'List not found.' })
  response.json({ ok: true, list })
})

router.delete('/:listId', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.listId)) return response.status(400).json({ ok: false, message: 'The list ID is not valid.' })
  if (request.boardRole !== 'owner') return response.status(403).json({ ok: false, message: 'Only the board owner can delete lists.' })
  const list = await BoardList.findOne({ _id: request.params.listId, board: request.board._id })
  if (!list) return response.status(404).json({ ok: false, message: 'List not found.' })
  if (await Task.exists({ board: request.board._id, list: list._id })) return response.status(409).json({ ok: false, message: 'Move or delete this list’s tasks before deleting it.' })
  await list.deleteOne()
  response.json({ ok: true })
})

export default router
