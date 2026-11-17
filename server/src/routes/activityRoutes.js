import { Router } from 'express'
import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import requireBoardAccess from '../middleware/requireBoardAccess.js'

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
  const activities = await Activity.find({ board: request.board._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
  response.json({ ok: true, activities })
})

export default router
