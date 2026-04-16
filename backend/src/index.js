import 'dotenv/config'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/init.js'
import { seedDb } from './db/seed.js'
import { requireAuth } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import exercisesRouter from './routes/exercises.js'
import hitsRouter from './routes/hits.js'
import { createWsServer } from './websocket/handler.js'

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Публичные маршруты
app.use('/api/auth', authRouter)

// Защищённые маршруты
app.use('/api/exercises', requireAuth, exercisesRouter)
app.use('/api',           requireAuth, hitsRouter)
app.use('/api/admin',     adminRouter)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

const httpServer = createServer(app)
createWsServer(httpServer)

async function start() {
  httpServer.listen(PORT, () => {
    console.log(`[Server] Запущен на http://localhost:${PORT}`)
    console.log(`[Server] WebSocket на ws://localhost:${PORT}/ws`)
  })

  try {
    await initDb()
    await seedDb()
    console.log('[DB] Подключено успешно')
  } catch (err) {
    console.warn(`[DB] Нет подключения: ${err.message}`)
    console.warn('[DB] Сервер работает, но сохранение в БД недоступно.')
  }
}

start()
