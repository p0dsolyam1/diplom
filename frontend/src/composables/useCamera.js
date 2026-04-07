import { ref, onUnmounted } from 'vue'

const SNAPSHOT_FPS = 5
const SNAPSHOT_INTERVAL = 1000 / SNAPSHOT_FPS

// Размер кадра, отправляемого на сервер
const FRAME_WIDTH = 640
const FRAME_HEIGHT = 480

export function useCamera() {
  const videoRef = ref(null)
  const stream = ref(null)
  const error = ref(null)
  const isReady = ref(false)

  let snapshotTimer = null
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = FRAME_WIDTH
  offscreenCanvas.height = FRAME_HEIGHT
  const ctx = offscreenCanvas.getContext('2d')

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

  // Запускает периодический захват кадров, вызывает onSnapshot(base64) на каждый кадр
  function startSnapshots(onSnapshot) {
    if (snapshotTimer) return
    snapshotTimer = setInterval(() => {
      const frame = captureFrame()
      if (frame) onSnapshot(frame)
    }, SNAPSHOT_INTERVAL)
  }

  function stopSnapshots() {
    if (snapshotTimer) {
      clearInterval(snapshotTimer)
      snapshotTimer = null
    }
  }

  function captureFrame() {
    if (!videoRef.value || !isReady.value) return null
    ctx.drawImage(videoRef.value, 0, 0, FRAME_WIDTH, FRAME_HEIGHT)
    // Качество 0.7 — баланс между скоростью и точностью для ИИ
    return offscreenCanvas.toDataURL('image/jpeg', 0.7)
  }

  function getCameraErrorMessage(err) {
    if (err.name === 'NotAllowedError') return 'Доступ к камере запрещён. Разрешите доступ в настройках браузера.'
    if (err.name === 'NotFoundError') return 'Камера не найдена.'
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
    captureFrame,
  }
}
