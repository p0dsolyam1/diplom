import { WebSocketServer } from 'ws'
import { detectHits } from '../services/aiService.js'
import { saveHits } from '../services/dbService.js'
import { filterHits, clearExerciseCache } from '../services/hitsFilter.js'

/**
 * Протокол сообщений
 *
 * Client → Server:
 *   {
 *     type: 'frame',
 *     data: '<base64-jpeg>',      // обработанный кадр (уже обрезан по мишени на фронте)
 *     exerciseId: <number>,
 *     offset: { x: number, y: number }  // смещение обрезки в координатах исходного кадра
 *   }
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

async function handleFrame(ws, { data: base64, exerciseId, offset, corners }) {
  if (!base64 || !exerciseId) {
    send(ws, { type: 'error', message: 'Ожидается: data (base64) и exerciseId' })
    return
  }

  // offset — смещение обрезанной области относительно исходного кадра
  // нужен для перевода координат AI обратно в систему координат полного кадра
  const cropOffset = offset ?? { x: 0, y: 0 }

  // corners — углы калибровки в координатах полного кадра (640×480) или null
  const calibrationPolygon = (corners && corners.length === 4) ? corners : null

  try {
    const { hits: rawHits } = await detectHits(base64)
    if (!rawHits.length) return

    // Пересчитываем координаты из пространства обрезки в исходный кадр
    const mappedHits = rawHits.map(h => ({
      x: h.x + cropOffset.x,
      y: h.y + cropOffset.y,
    }))

    const filteredHits = filterHits(exerciseId, mappedHits, calibrationPolygon)
    if (!filteredHits.length) return

    send(ws, { type: 'hits', hits: filteredHits, exerciseId })

    // Сохраняем в БД — ошибка не блокирует realtime
    try {
      await saveHits(exerciseId, filteredHits)
    } catch (dbErr) {
      console.warn('[WS] Не удалось сохранить попадания в БД:', dbErr.message)
    }
  } catch (err) {
    console.error('[WS] Ошибка обработки кадра:', err.message)
    send(ws, { type: 'error', message: 'Ошибка обработки кадра' })
  }
}

// Вызывается при завершении упражнения — очищает кэш фильтра
export function onExerciseFinished(exerciseId) {
  clearExerciseCache(exerciseId)
}

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}
