/**
 * Фильтр попаданий.
 *
 * Задача: убирать дубли и шумовые срабатывания AI перед записью в БД.
 *
 * Правила фильтрации:
 *  1. Координаты за пределами кадра (< 0 или > размер) — отбрасываем.
 *  2. Если задана область калибровки (polygon) — отбрасываем попадания вне полигона.
 *  3. Если новое попадание ближе MIN_DISTANCE пикселей к уже
 *     зафиксированному (в пределах TIME_WINDOW мс) — это дубль, пропускаем.
 */

const MIN_DISTANCE = 15   // px — минимальное расстояние между попаданиями
const TIME_WINDOW  = 500  // ms — окно дедупликации

const FRAME_WIDTH  = 640
const FRAME_HEIGHT = 480

// Кэш недавних попаданий по упражнению: Map<exerciseId, Array<{x,y,time}>>
const cache = new Map()

// Ray-casting: возвращает true, если точка внутри полигона
function isInsidePolygon(point, polygon) {
  const { x, y } = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

/**
 * @param {number} exerciseId
 * @param {Array<{x,y}>} hits  — координаты в пространстве полного кадра (640×480)
 * @param {Array<{x,y}>|null} polygon — углы калибровки в том же пространстве; null = не задана
 */
export function filterHits(exerciseId, hits, polygon = null) {
  if (!cache.has(exerciseId)) {
    cache.set(exerciseId, [])
  }

  const recent = cache.get(exerciseId)
  const now = Date.now()

  // Удаляем устаревшие записи из кэша
  const fresh = recent.filter(h => now - h.time < TIME_WINDOW)

  const accepted = []

  for (const hit of hits) {
    // 1. Отбрасываем выход за пределы кадра
    if (hit.x < 0 || hit.x > FRAME_WIDTH || hit.y < 0 || hit.y > FRAME_HEIGHT) {
      continue
    }

    // 2. Если задана область калибровки — отбрасываем попадания вне полигона
    if (polygon && polygon.length >= 3 && !isInsidePolygon(hit, polygon)) {
      continue
    }

    // 3. Проверяем на дубль
    const isDuplicate = fresh.some(
      h => Math.hypot(h.x - hit.x, h.y - hit.y) < MIN_DISTANCE
    )

    if (!isDuplicate) {
      accepted.push(hit)
      fresh.push({ x: hit.x, y: hit.y, time: now })
    }
  }

  cache.set(exerciseId, fresh)
  return accepted
}

// Вызвать при завершении упражнения, чтобы освободить память
export function clearExerciseCache(exerciseId) {
  cache.delete(exerciseId)
}
