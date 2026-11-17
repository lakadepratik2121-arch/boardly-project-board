import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import mongoose from 'mongoose'

export default async function requireAuth(request, response, next) {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ ok: false, message: 'The database is not connected yet. Check the backend connection.' })
  }
  const authorization = request.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ ok: false, message: 'Sign in to continue.' })
  }

  if (!process.env.JWT_SECRET) {
    return response.status(503).json({ ok: false, message: 'Authentication is not configured.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return response.status(401).json({ ok: false, message: 'Your account could not be found.' })
    request.user = user
    next()
  } catch {
    response.status(401).json({ ok: false, message: 'Your session has expired. Please sign in again.' })
  }
}
