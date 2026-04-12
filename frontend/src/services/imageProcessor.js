import { getBoundingBox } from '../utils/geometry.js'

// Переиспользуемый canvas — не создаём новый на каждый кадр (5fps)
const offscreen = document.createElement('canvas')

/**
 * Обрезает кадр по bounding box углов мишени.
 * Если углы не заданы — возвращает полный кадр 640×480.
 *
 * @returns {{ image: string, offset: {x, y} }}
 *   offset нужен бэкенду для пересчёта координат AI обратно в исходный кадр
 */
export function processFrame(videoEl, corners, frameWidth = 640, frameHeight = 480) {
  if (!corners || corners.length !== 4) {
    offscreen.width  = frameWidth
    offscreen.height = frameHeight
    offscreen.getContext('2d').drawImage(videoEl, 0, 0, frameWidth, frameHeight)
    return { image: offscreen.toDataURL('image/jpeg', 0.7), offset: { x: 0, y: 0 } }
  }

  const { left, top, width, height } = getBoundingBox(corners)
  const cropLeft   = Math.max(0, Math.floor(left))
  const cropTop    = Math.max(0, Math.floor(top))
  const cropWidth  = Math.min(frameWidth  - cropLeft, Math.ceil(width))
  const cropHeight = Math.min(frameHeight - cropTop,  Math.ceil(height))

  if (cropWidth <= 0 || cropHeight <= 0) {
    offscreen.width  = frameWidth
    offscreen.height = frameHeight
    offscreen.getContext('2d').drawImage(videoEl, 0, 0, frameWidth, frameHeight)
    return { image: offscreen.toDataURL('image/jpeg', 0.7), offset: { x: 0, y: 0 } }
  }

  offscreen.width  = cropWidth
  offscreen.height = cropHeight
  offscreen.getContext('2d').drawImage(
    videoEl,
    cropLeft, cropTop, cropWidth, cropHeight,
    0,        0,       cropWidth, cropHeight,
  )

  return {
    image:  offscreen.toDataURL('image/jpeg', 0.8),
    offset: { x: cropLeft, y: cropTop },
  }
}
