/**
 * Фильтр попаданий.
 *
 * Задача: убирать дубли и шумовые срабатывания AI перед записью в БД.
 *
 * Правила фильтрации:
 *  1. Если новое попадание ближе MIN_DISTANCE пикселей к уже
 *     зафиксированному (в пределах TIME_WINDOW мс) — это дубль, пропускаем.
 *  2. Координаты за пределами кадра (< 0 или > размер) — отбрасываем.
 */

const MIN_DISTANCE = 15   // px — минимальное расстояние между попаданиями
const TIME_WINDOW  = 500  // ms — окно дедупликации

const FRAME_WIDTH  = 640
const FRAME_HEIGHT = 480

// Кэш недавних попаданий по упражнению: Map<exerciseId, Array<{x,y,time}>>
const cache = new Map()

export function filterHits(exerciseId, hits) {
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

    // 2. Проверяем на дубль
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
