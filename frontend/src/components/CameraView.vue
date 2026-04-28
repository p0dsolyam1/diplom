<template>
  <div class="camera-view">
    <div class="video-container" ref="containerRef">
      <!-- Видео поток -->
      <video ref="videoRef" class="video" autoplay muted playsinline />

      <!-- Попадания поверх видео -->
      <HitsOverlay
        v-if="isReady"
        :hits="store.hits"
        :frame-width="640"
        :frame-height="480"
      />

      <!-- Калибровка мишени (разметка 4 углов) -->
      <TargetCalibration
        v-if="store.isCalibrating"
        :frame-width="640"
        :frame-height="480"
      />

      <!-- Контур мишени когда калибровка завершена -->
      <canvas
        v-if="isReady && store.isCalibrated && !store.isCalibrating"
        ref="targetOutlineRef"
        class="target-outline"
      />

      <!-- Индикатор записи -->
      <div v-if="store.isRunning" class="recording-badge">
        <span class="dot" /> REC
      </div>

      <!-- Счётчик попаданий -->
      <div v-if="store.isRunning" class="hits-counter">
        Попаданий: {{ store.totalHits }}
      </div>
    </div>

    <!-- Ошибка камеры -->
    <div v-if="cameraError" class="error-banner">{{ cameraError }}</div>

    <!-- Панель калибровки -->
    <div class="calibration-bar">
      <span class="calibration-label">
        Мишень:
        <strong :class="store.isCalibrated ? 'text-green' : 'text-muted'">
          {{ store.isCalibrated ? 'откалибрована' : 'не задана' }}
        </strong>
      </span>

      <button
        v-if="!store.isCalibrating"
        class="btn-calibrate"
        @click="store.startCalibration()"
      >
        {{ store.isCalibrated ? 'Перекалибровать' : 'Разметить мишень' }}
      </button>

      <button
        v-if="store.isCalibrated && !store.isCalibrating"
        class="btn-clear-cal"
        @click="store.clearCalibration()"
      >✕</button>
    </div>

    <!-- Статус -->
    <div class="status-bar">
      <span :class="['ws-status', ws.isConnected.value ? 'ws-ok' : 'ws-err']">
        {{ ws.isConnected.value ? 'WS: подключён' : 'WS: нет соединения' }}
      </span>
      <span class="cam-status">
        {{ isReady ? 'Камера: активна' : 'Камера: ожидание' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import HitsOverlay from './HitsOverlay.vue'
import TargetCalibration from './TargetCalibration.vue'
import { useCamera } from '../composables/useCamera.js'
import { useWebSocket } from '../composables/useWebSocket.js'
import { useExerciseStore } from '../stores/exercise.js'
import { getBoundingBox } from '../utils/geometry.js'

const store = useExerciseStore()

const camera = useCamera()
const videoRef     = camera.videoRef      // template ref: привязывается к <video>
const cameraError  = camera.error
const isReady      = camera.isReady
const { startCamera, stopCamera, startSnapshots, stopSnapshots } = camera

const ws = useWebSocket()
const targetOutlineRef = ref(null)

// Получаем попадания от сервера → добавляем в стор
ws.on('hits', (msg) => {
  if (msg.hits?.length) store.addHits(msg.hits)
})

ws.on('error', (msg) => {
  console.error('Ошибка от сервера:', msg.message)
})

// Запускаем/останавливаем захват кадров вместе с упражнением
watch(() => store.isRunning, (running) => {
  if (running) {
    startSnapshots(
      ({ image, offset }) => {
        // Обработчик изображения → WS → backend (Нейронка → Фильтр → БД)
        // corners передаём для фильтрации попаданий вне плоскости калибровки
        ws.sendFrame(image, store.exerciseId, offset, store.targetCorners)
      },
      // Передаём текущие углы мишени в обработчик изображения
      () => store.targetCorners
    )
  } else {
    stopSnapshots()
  }
})

// Рисуем контур мишени поверх видео
watch(() => store.targetCorners, () => {
  nextTick(drawTargetOutline)
})

function drawTargetOutline() {
  const canvas = targetOutlineRef.value
  if (!canvas || !store.targetCorners) return

  const parent = canvas.parentElement
  canvas.width  = parent.clientWidth
  canvas.height = parent.clientHeight

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const scaleX = canvas.width  / 640
  const scaleY = canvas.height / 480
  const bb = getBoundingBox(store.targetCorners)
  const l = bb.left * scaleX, t = bb.top * scaleY
  const w = bb.width * scaleX, h = bb.height * scaleY

  ctx.strokeStyle = 'rgba(88, 166, 255, 0.6)'
  ctx.lineWidth   = 1.5
  ctx.setLineDash([5, 4])
  ctx.strokeRect(l, t, w, h)
  ctx.setLineDash([])
}

onMounted(async () => {
  ws.connect()
  window.addEventListener('resize', drawTargetOutline)
  try {
    await startCamera()
  } catch {
    // ошибка уже в cameraError
  }
})

onUnmounted(() => {
  ws.disconnect()
  stopCamera()
  window.removeEventListener('resize', drawTargetOutline)
})
</script>

<style scoped>
.camera-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  aspect-ratio: 16 / 9;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.target-outline {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.recording-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #ff4444;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 10px;
  border-radius: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
  animation: blink 1s step-start infinite;
}

@keyframes blink { 50% { opacity: 0; } }

.hits-counter {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #e6edf3;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 4px;
}

.error-banner {
  background: #3d1515;
  border: 1px solid #f85149;
  color: #ffa198;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
}

.calibration-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
}

.calibration-label {
  flex: 1;
  font-size: 13px;
  color: #8b949e;
}

.text-green { color: #3fb950; }
.text-muted { color: #8b949e; }

.btn-calibrate {
  background: #1f6feb;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.btn-calibrate:hover { background: #388bfd; }

.btn-clear-cal {
  background: transparent;
  color: #8b949e;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.btn-clear-cal:hover { color: #f85149; border-color: #f85149; }

.status-bar {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8b949e;
}

.ws-ok  { color: #3fb950; }
.ws-err { color: #f85149; }
</style>
