import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Board from '../models/Board.js'
import User from '../models/User.js'
import requireAuth from '../middleware/requireAuth.js'
import BoardMember from '../models/BoardMember.js'
import { createHash } from 'node:crypto'
import mongoose from 'mongoose'

const router = Router()

router.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ ok: false, message: 'The database is not connected yet. Check the backend connection.' })
  next()
})

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email }
}

function issueToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.')
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (request, response) => {
  const { name, email, password } = request.body ?? {}
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    return response.status(400).json({ ok: false, message: 'Enter your name (up to 80 characters).' })
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return response.status(400).json({ ok: false, message: 'Enter a valid email address.' })
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return response.status(400).json({ ok: false, message: 'Use a password between 8 and 72 characters.' })
  }
  if (!process.env.JWT_SECRET) {
    return response.status(503).json({ ok: false, message: 'Authentication is not configured.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (await User.exists({ email: normalizedEmail })) {
    return response.status(409).json({ ok: false, message: 'An account with that email already exists.' })
  }

  const isFirstUser = (await User.countDocuments()) === 0
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
  })

  // The first local account takes ownership of pre-authentication seed boards.
  if (isFirstUser) {
    await Board.updateMany(
      { $or: [{ owner: null }, { owner: { $exists: false } }] },
      { $set: { owner: user._id } },
    )
  }

  response.status(201).json({ ok: true, token: issueToken(user), user: publicUser(user) })
})

router.post('/login', async (request, response) => {
  const { email, password } = request.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return response.status(400).json({ ok: false, message: 'Enter your email and password.' })
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ ok: false, message: 'Email or password is incorrect.' })
  }

  response.json({ ok: true, token: issueToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth, (request, response) => {
  response.json({ ok: true, user: publicUser(request.user) })
})

router.post('/invitations/:code/accept', requireAuth, async (request, response) => {
  const inviteCodeHash = createHash('sha256').update(request.params.code).digest('hex')
  const invitation = await BoardMember.findOne({ inviteCodeHash, status: 'pending', expiresAt: { $gt: new Date() } })
  if (!invitation) return response.status(404).json({ ok: false, message: 'This invite is invalid or has expired.' })
  if (invitation.invitedEmail !== request.user.email) return response.status(403).json({ ok: false, message: `Sign in with ${invitation.invitedEmail} to accept this invite.` })
  invitation.user = request.user._id
  invitation.status = 'active'
  invitation.joinedAt = new Date()
  invitation.inviteCodeHash = null
  invitation.expiresAt = null
  await invitation.save()
  response.json({ ok: true, boardId: invitation.board })
})

export default router
