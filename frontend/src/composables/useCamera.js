import { ref, onUnmounted } from 'vue'
import { processFrame } from '../services/imageProcessor.js'

const SNAPSHOT_FPS = 5
const SNAPSHOT_INTERVAL = 1000 / SNAPSHOT_FPS

const FRAME_WIDTH  = 640
const FRAME_HEIGHT = 480

export function useCamera() {
  const videoRef = ref(null)
  const stream   = ref(null)
  const error    = ref(null)
  const isReady  = ref(false)

  let snapshotTimer = null

  async function startCamera() {
    error.value = null
    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false,
      })
      if (videoRef.value) {
        videoRef.value.srcObject = stream.value
        await videoRef.value.play()
        isReady.value = true
      }
    } catch (err) {
      error.value = getCameraErrorMessage(err)
      throw err
    }
  }

  function stopCamera() {
    stopSnapshots()
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    isReady.value = false
  }

  /**
   * Запускает периодический захват кадров.
   * @param {Function} onSnapshot - вызывается с { image: base64, offset: {x,y} }
   * @param {Function} getCorners - функция, возвращающая текущие углы мишени (или null)
   */
  function startSnapshots(onSnapshot, getCorners = () => null) {
    if (snapshotTimer) return
    snapshotTimer = setInterval(() => {
      if (!videoRef.value || !isReady.value) return
      const corners = getCorners()
      // Обработчик изображения: обрезает кадр по углам мишени
      const result = processFrame(videoRef.value, corners, FRAME_WIDTH, FRAME_HEIGHT)
      if (result) onSnapshot(result)
    }, SNAPSHOT_INTERVAL)
  }

  function stopSnapshots() {
    if (snapshotTimer) {
      clearInterval(snapshotTimer)
      snapshotTimer = null
    }
  }

  function getCameraErrorMessage(err) {
    if (err.name === 'NotAllowedError')  return 'Доступ к камере запрещён. Разрешите доступ в настройках браузера.'
    if (err.name === 'NotFoundError')    return 'Камера не найдена.'
    if (err.name === 'NotReadableError') return 'Камера занята другим приложением.'
    return `Ошибка камеры: ${err.message}`
  }

  onUnmounted(() => {
    stopCamera()
  })

  return {
    videoRef,
    stream,
    error,
    isReady,
    startCamera,
    stopCamera,
    startSnapshots,
    stopSnapshots,
  }
}
