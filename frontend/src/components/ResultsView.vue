<template>
  <div class="results-view">
    <h2 class="title">Результаты упражнения</h2>

    <div v-if="lastExercise" class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ lastExercise.totalHits }}</div>
        <div class="stat-label">Всего попаданий</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ durationSeconds }}с</div>
        <div class="stat-label">Длительность</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ hitsPerMinute }}</div>
        <div class="stat-label">Попаданий/мин</div>
      </div>
    </div>

    <!-- Визуализация позиций попаданий (мишень) -->
    <div class="target-section">
      <h3>Карта попаданий</h3>
      <div class="target-container">
        <canvas ref="targetCanvas" class="target-canvas" width="300" height="300" />
      </div>
    </div>

    <!-- Таблица попаданий -->
    <div class="hits-table-section">
      <h3>Список попаданий</h3>
      <div class="hits-table-wrapper">
        <table class="hits-table" v-if="lastExercise?.hits?.length">
          <thead>
            <tr>
              <th>#</th>
              <th>X</th>
              <th>Y</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(hit, i) in lastExercise.hits" :key="i">
              <td>{{ i + 1 }}</td>
              <td>{{ hit.x.toFixed(0) }}</td>
              <td>{{ hit.y.toFixed(0) }}</td>
              <td>{{ formatTime(hit.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-hits">Попаданий не зафиксировано</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useExerciseStore } from '../stores/exercise.js'

const store = useExerciseStore()
const targetCanvas = ref(null)

const lastExercise = computed(() => store.history[0] ?? null)

const durationSeconds = computed(() => {
  if (!lastExercise.value) return 0
  const ms = lastExercise.value.finishedAt - lastExercise.value.startedAt
  return Math.round(ms / 1000)
})

const hitsPerMinute = computed(() => {
  const secs = durationSeconds.value
  if (!secs || !lastExercise.value) return 0
  return Math.round((lastExercise.value.totalHits / secs) * 60)
})

function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Рисует мишень с попаданиями на canvas
function drawTarget() {
  const canvas = targetCanvas.value
  if (!canvas || !lastExercise.value) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2

  ctx.clearRect(0, 0, W, H)

  // Фон мишени
  ctx.fillStyle = '#161b22'
  ctx.fillRect(0, 0, W, H)

  // Кольца мишени
  const rings = [130, 100, 70, 40, 15]
  const ringColors = ['#1a4d1a', '#1f5e1f', '#266426', '#2d7a2d', '#e6edf3']
  for (let i = 0; i < rings.length; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy, rings[i], 0, Math.PI * 2)
    ctx.fillStyle = ringColors[i]
    ctx.fill()
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Крестик прицела
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx - 130, cy)
  ctx.lineTo(cx + 130, cy)
  ctx.moveTo(cx, cy - 130)
  ctx.lineTo(cx, cy + 130)
  ctx.stroke()

  // Попадания (координаты ИИ в пространстве кадра 640x480, масштабируем к 300x300)
  const scaleX = W / 640
  const scaleY = H / 480
  for (const hit of lastExercise.value.hits) {
    const x = hit.x * scaleX
    const y = hit.y * scaleY

    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 60, 60, 0.85)'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

onMounted(drawTarget)
watch(lastExercise, drawTarget)
</script>

<style scoped>
.results-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #e6edf3;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #58a6ff;
}

.stat-label {
  font-size: 12px;
  color: #8b949e;
  margin-top: 4px;
}

.target-section, .hits-table-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h3 {
  font-size: 15px;
  color: #8b949e;
  font-weight: 600;
}

.target-container {
  display: flex;
  justify-content: center;
}

.target-canvas {
  border-radius: 50%;
  border: 2px solid #30363d;
}

.hits-table-wrapper {
  overflow-x: auto;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #30363d;
  border-radius: 6px;
}

.hits-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.hits-table th, .hits-table td {
  padding: 8px 14px;
  text-align: left;
  border-bottom: 1px solid #21262d;
}

.hits-table th {
  background: #161b22;
  color: #8b949e;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.hits-table tr:last-child td { border-bottom: none; }
.hits-table tr:hover td { background: #161b22; }

.no-hits {
  padding: 20px;
  text-align: center;
  color: #8b949e;
  font-size: 14px;
}
</style>
