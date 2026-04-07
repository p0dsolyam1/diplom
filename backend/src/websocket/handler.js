import { WebSocketServer } from 'ws'
import { detectHits } from '../services/aiService.js'
import { saveHits } from '../services/dbService.js'

/**
 * Протокол сообщений
 *
 * Client → Server:
 *   { type: 'frame', data: '<base64>', exerciseId: <number> }
 *
 * Server → Client:
 *   { type: 'hits',  hits: [{x, y}], exerciseId: <number> }
 *   { type: 'error', message: '<string>' }
 */

export function createWsServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Новое соединение: ${req.socket.remoteAddress}`)

    ws.on('message', async (raw) => {
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        send(ws, { type: 'error', message: 'Невалидный JSON' })
        return
      }

      if (msg.type === 'frame') {
        await handleFrame(ws, msg)
      }
    })

    ws.on('close', () => {
      console.log('[WS] Соединение закрыто')
    })

    ws.on('error', (err) => {
      console.error('[WS] Ошибка:', err.message)
    })
  })

  return wss
}

async function handleFrame(ws, { data: base64, exerciseId }) {
  if (!base64 || !exerciseId) {
    send(ws, { type: 'error', message: 'Ожидается: data (base64) и exerciseId' })
    return
  }

  try {
    // Отправляем кадр в AI, получаем попадания
    const { hits } = await detectHits(base64)

    if (!hits.length) return

    // Отправляем координаты клиенту сразу, не дожидаясь БД
    send(ws, { type: 'hits', hits, exerciseId })

    // Сохраняем в БД (ошибка БД не блокирует realtime)
    try {
      await saveHits(exerciseId, hits)
    } catch (dbErr) {
      console.warn('[WS] Не удалось сохранить попадания в БД:', dbErr.message)
    }
  } catch (err) {
    console.error('[WS] Ошибка обработки кадра:', err.message)
    send(ws, { type: 'error', message: 'Ошибка обработки кадра' })
  }
}

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}
