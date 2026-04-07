<template>
  <div class="camera-view">
    <!-- Видео поток -->
    <div class="video-container" ref="containerRef">
      <video
        ref="videoRef"
        class="video"
        autoplay
        muted
        playsinline
      />
      <HitsOverlay
        v-if="isReady"
        :hits="store.hits"
        :frame-width="640"
        :frame-height="480"
      />
      <!-- Индикатор записи -->
      <div v-if="store.isRunning" class="recording-badge">
        <span class="dot" />
        REC
      </div>
      <!-- Счётчик попаданий -->
      <div v-if="store.isRunning" class="hits-counter">
        Попаданий: {{ store.totalHits }}
      </div>
    </div>

    <!-- Ошибка камеры -->
    <div v-if="cameraError" class="error-banner">
      {{ cameraError }}
    </div>

    <!-- Статус подключения -->
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
import { onMounted, onUnmounted, watch } from 'vue'
import HitsOverlay from './HitsOverlay.vue'
import { useCamera } from '../composables/useCamera.js'
import { useWebSocket } from '../composables/useWebSocket.js'
import { useExerciseStore } from '../stores/exercise.js'

const store = useExerciseStore()

const {
  videoRef,
  error: cameraError,
  isReady,
  startCamera,
  stopCamera,
  startSnapshots,
  stopSnapshots,
} = useCamera()

const ws = useWebSocket()

// Когда приходят координаты попаданий — добавляем в стор
ws.on('hits', (msg) => {
  if (msg.hits?.length) {
    store.addHits(msg.hits)
  }
})

ws.on('error', (msg) => {
  console.error('Ошибка от сервера:', msg.message)
})

// Запускаем/останавливаем захват кадров вместе с упражнением
watch(() => store.isRunning, (running) => {
  if (running) {
    startSnapshots((frame) => {
      ws.sendFrame(frame, store.exerciseId)
    })
  } else {
    stopSnapshots()
  }
})

onMounted(async () => {
  ws.connect()
  try {
    await startCamera()
  } catch {
    // ошибка уже в cameraError
  }
})

onUnmounted(() => {
  ws.disconnect()
  stopCamera()
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

@keyframes blink {
  50% { opacity: 0; }
}

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

.status-bar {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8b949e;
}

.ws-ok { color: #3fb950; }
.ws-err { color: #f85149; }
</style>
