import { Router } from 'express'
import { createHash, randomBytes } from 'node:crypto'
import BoardMember from '../models/BoardMember.js'
import User from '../models/User.js'
import mongoose from 'mongoose'
import requireBoardAccess from '../middleware/requireBoardAccess.js'

const router = Router({ mergeParams: true })
router.use(requireBoardAccess)

router.get('/', async (request, response) => {
  const memberFilter = { board: request.board._id, ...(request.boardRole === 'owner' ? {} : { status: 'active' }) }
  const members = await BoardMember.find(memberFilter).select('-inviteCodeHash -__v').populate('user', 'name email').populate('invitedBy', 'name email').lean()
  response.json({ ok: true, owner: request.board.owner, members })
})

router.post('/invite', async (request, response) => {
  if (request.boardRole !== 'owner') return response.status(403).json({ ok: false, message: 'Only the board owner can invite people.' })
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ ok: false, message: 'Enter a valid email address.' })
  if (email === request.user.email) return response.status(400).json({ ok: false, message: 'You already own this board.' })
  const existingUser = await User.findOne({ email }).select('_id')
  const existing = await BoardMember.findOne({ board: request.board._id, invitedEmail: email })
  if (existing?.status === 'active') return response.status(409).json({ ok: false, message: 'That person is already a board member.' })
  const code = randomBytes(24).toString('base64url')
  const values = { user: null, invitedEmail: email, invitedBy: request.user._id, status: 'pending', inviteCodeHash: createHash('sha256').update(code).digest('hex'), expiresAt: new Date(Date.now() + 7 * 86400000), joinedAt: null }
  if (existing) await BoardMember.updateOne({ _id: existing._id }, { $set: values })
  else await BoardMember.create({ board: request.board._id, ...values })
  response.status(201).json({ ok: true, inviteCode: code, expiresInDays: 7, alreadyRegistered: Boolean(existingUser) })
})

router.delete('/:memberId', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.memberId)) return response.status(400).json({ ok: false, message: 'The member ID is not valid.' })
  if (request.boardRole !== 'owner') return response.status(403).json({ ok: false, message: 'Only the board owner can remove members.' })
  const removed = await BoardMember.findOneAndDelete({ _id: request.params.memberId, board: request.board._id })
  if (!removed) return response.status(404).json({ ok: false, message: 'Member or invitation not found.' })
  response.json({ ok: true })
})

export default router
