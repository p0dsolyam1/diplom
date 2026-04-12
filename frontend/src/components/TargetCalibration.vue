<template>
  <div class="calibration-overlay" @click="handleClick">
    <canvas ref="canvasRef" class="calibration-canvas" />

    <!-- Инструкция -->
    <div class="instruction">
      <template v-if="corners.length < 4">
        Нажмите на угол {{ corners.length + 1 }} из 4
        <span class="corner-hint">{{ CORNER_LABELS[corners.length] }}</span>
      </template>
      <template v-else>
        Все углы размечены. Подтвердите или сбросьте.
      </template>
    </div>

    <!-- Кнопки -->
    <div class="calibration-actions">
      <button
        v-if="corners.length === 4"
        class="btn btn-confirm"
        @click.stop="confirm"
      >Подтвердить</button>

      <button
        v-if="corners.length > 0"
        class="btn btn-reset"
        @click.stop="reset"
      >Сбросить</button>

      <button class="btn btn-cancel" @click.stop="cancel">Отмена</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useExerciseStore } from '../stores/exercise.js'
import { getBoundingBox } from '../utils/geometry.js'

const props = defineProps({
  // Реальные размеры кадра (координатное пространство, в котором хранятся углы)
  frameWidth:  { type: Number, default: 640 },
  frameHeight: { type: Number, default: 480 },
})

const CORNER_LABELS = ['↖ верхний левый', '↗ верхний правый', '↘ нижний правый', '↙ нижний левый']

const store   = useExerciseStore()
const canvasRef = ref(null)
const corners   = ref([])   // накапливаем клики: [{x, y}] в координатах кадра

// ─── Обработка клика ────────────────────────────────────────────────────────

function handleClick(e) {
  if (corners.value.length >= 4) return

  const canvas = canvasRef.value
  const rect   = canvas.getBoundingClientRect()

  // Переводим клик из CSS-пикселей в координаты кадра (640×480)
  const x = (e.clientX - rect.left)  / rect.width  * props.frameWidth
  const y = (e.clientY - rect.top)   / rect.height * props.frameHeight

  corners.value.push({ x, y })
  draw()
}

// ─── Действия ───────────────────────────────────────────────────────────────

function confirm() {
  store.setTargetCorners([...corners.value])
}

function reset() {
  corners.value = []
  draw()
}

function cancel() {
  if (store.isCalibrated) {
    // Мишень уже была откалибрована — просто закрываем панель, углы сохраняются
    store.cancelCalibration()
  } else {
    // Калибровки не было вообще — полностью сбрасываем
    store.clearCalibration()
  }
}

// ─── Отрисовка ──────────────────────────────────────────────────────────────

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const scaleX = canvas.width  / props.frameWidth
  const scaleY = canvas.height / props.frameHeight

  // Полупрозрачная заливка (область вне мишени затемнена)
  if (corners.value.length === 4) {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Вырезаем внутренний прямоугольник мишени
    const bb = getBoundingBox(corners.value)
    const l = bb.left * scaleX, t = bb.top * scaleY
    const w = bb.width * scaleX, h = bb.height * scaleY

    ctx.clearRect(l, t, w, h)
    ctx.restore()

    // Рамка мишени
    ctx.strokeStyle = '#58a6ff'
    ctx.lineWidth   = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(l, t, w, h)
    ctx.setLineDash([])
  }

  // Точки углов
  corners.value.forEach((c, i) => {
    const x = c.x * scaleX
    const y = c.y * scaleY

    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#58a6ff'
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(i + 1, x, y)
  })
}

// ─── Размер canvas ──────────────────────────────────────────────────────────

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  canvas.width  = parent.clientWidth
  canvas.height = parent.clientHeight
  draw()
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.calibration-overlay {
  position: absolute;
  inset: 0;
  cursor: crosshair;
  z-index: 10;
}

.calibration-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.instruction {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.72);
  color: #e6edf3;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 6px;
  white-space: nowrap;
  display: flex;
  gap: 8px;
  align-items: center;
}

.corner-hint {
  color: #58a6ff;
  font-weight: 600;
}

.calibration-actions {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.btn {
  padding: 7px 18px;
  border: none;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm { background: #238636; color: #fff; }
.btn-reset   { background: #6e4000; color: #fff; }
.btn-cancel  { background: #21262d; color: #e6edf3; border: 1px solid #30363d; }
</style>
