import mongoose from 'mongoose'
import Board from '../models/Board.js'
import BoardMember from '../models/BoardMember.js'

export default async function requireBoardAccess(request, response, next) {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ ok: false, message: 'The database is not connected yet.' })
  if (!mongoose.isValidObjectId(request.params.boardId)) return response.status(400).json({ ok: false, message: 'The board ID is not valid.' })
  const board = await Board.findById(request.params.boardId)
  if (!board) return response.status(404).json({ ok: false, message: 'Board not found.' })
  const owner = String(board.owner) === String(request.user._id)
  const membership = owner ? null : await BoardMember.findOne({ board: board._id, user: request.user._id, status: 'active' })
  if (!owner && !membership) return response.status(404).json({ ok: false, message: 'Board not found.' })
  request.board = board
  request.boardRole = owner ? 'owner' : 'member'
  next()
}
