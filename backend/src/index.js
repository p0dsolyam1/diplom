import 'dotenv/config'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/init.js'
import exercisesRouter from './routes/exercises.js'
import hitsRouter from './routes/hits.js'
import { createWsServer } from './websocket/handler.js'

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' })) // base64 кадры могут быть большими

// REST API
app.use('/api/exercises', exercisesRouter)
app.use('/api', hitsRouter)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// HTTP сервер (нужен чтобы WebSocket и Express делили один порт)
const httpServer = createServer(app)

// WebSocket
createWsServer(httpServer)

// Запуск
async function start() {
  // Сервер стартует всегда; БД — опционально (можно работать без PG в dev-режиме)
  httpServer.listen(PORT, () => {
    console.log(`[Server] Запущен на http://localhost:${PORT}`)
    console.log(`[Server] WebSocket на ws://localhost:${PORT}/ws`)
  })

  try {
    await initDb()
    console.log('[DB] Подключено успешно')
  } catch (err) {
    console.warn(`[DB] Нет подключения: ${err.message}`)
    console.warn('[DB] Сервер работает, но сохранение в БД недоступно. Запустите PostgreSQL.')
  }
}

start()
