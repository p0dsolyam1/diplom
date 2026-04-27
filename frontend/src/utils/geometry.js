/**
 * Вычисляет bounding box из массива точек.
 * @param {Array<{x: number, y: number}>} points
 * @returns {{ left, top, right, bottom, width, height }}
 */
export function getBoundingBox(points) {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const left   = Math.min(...xs)
  const top    = Math.min(...ys)
  const right  = Math.max(...xs)
  const bottom = Math.max(...ys)
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}
