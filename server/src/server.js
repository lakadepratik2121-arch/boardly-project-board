import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import activityRoutes from './routes/activityRoutes.js'
import authRoutes from './routes/authRoutes.js'
import boardRoutes from './routes/boardRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import listRoutes from './routes/listRoutes.js'
import teamRoutes from './routes/teamRoutes.js'
import requireAuth from './middleware/requireAuth.js'

const app = express()
const port = process.env.PORT || 5001
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url))

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/boards', requireAuth, boardRoutes)
app.use('/api/boards/:boardId/lists', requireAuth, listRoutes)
app.use('/api/boards/:boardId/team', requireAuth, teamRoutes)
app.use('/api/boards/:boardId/activities', requireAuth, activityRoutes)
app.use('/api/boards/:boardId/tasks', requireAuth, taskRoutes)
app.use('/api/boards/:boardId/tasks/:taskId/comments', requireAuth, commentRoutes)

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    message: 'Backend connected',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
  })
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist))
  app.use((request, response, next) => {
    if (request.path.startsWith('/api/')) return next()
    response.sendFile(fileURLToPath(new URL('../../client/dist/index.html', import.meta.url)), (error) => {
      if (error) next(error)
    })
  })
}

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ ok: false, message: 'Something went wrong on the server.' })
})

async function start() {
  app.listen(port, () => console.log(`Boardly API listening at http://localhost:${port}`))
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI is not set; API is running without a database connection')
    return
  }

  const databaseName = process.env.MONGODB_DB || 'boardly'
  const connect = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: databaseName })
      console.log(`Connected to MongoDB database: ${databaseName}`)
    } catch (error) {
      console.error('Could not connect to MongoDB:', error.message)
      const retry = setTimeout(connect, 15000)
      retry.unref()
    }
  }
  await connect()
}

start().catch((error) => {
  console.error('Could not start Boardly API:', error.message)
  process.exit(1)
})
