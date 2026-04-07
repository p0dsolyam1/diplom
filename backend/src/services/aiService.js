/**
 * Mock AI сервис.
 *
 * В реальной системе здесь будет HTTP-запрос к внешнему AI API:
 *   POST /ai/detect  { image: base64 }  →  { hits: [{x, y}] }
 *
 * Mock симулирует:
 * - случайную задержку обработки (50–200 мс)
 * - вероятность обнаружения попадания ~30%
 * - 1–3 попадания при обнаружении
 * - координаты в пространстве кадра 640×480
 */

const FRAME_WIDTH = 640
const FRAME_HEIGHT = 480

// Вероятность попадания на одном кадре
const HIT_PROBABILITY = 0.3

export async function detectHits(base64Image) {
  // Симуляция задержки AI
  await sleep(50 + Math.random() * 150)

  if (Math.random() > HIT_PROBABILITY) {
    return { hits: [] }
  }

  const count = Math.floor(Math.random() * 3) + 1
  const hits = Array.from({ length: count }, () => ({
    x: parseFloat((Math.random() * FRAME_WIDTH).toFixed(2)),
    y: parseFloat((Math.random() * FRAME_HEIGHT).toFixed(2)),
  }))

  return { hits }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
