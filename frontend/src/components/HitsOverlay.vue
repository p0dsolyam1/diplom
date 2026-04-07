<template>
  <canvas ref="canvasRef" class="hits-overlay" />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  hits: {
    type: Array,
    default: () => [],
  },
  // Реальные размеры кадра, в которых возвращает координаты ИИ
  frameWidth: { type: Number, default: 640 },
  frameHeight: { type: Number, default: 480 },
})

const canvasRef = ref(null)
let animFrameId = null

// Цвета попаданий по времени: свежие — яркие, старые — тускнеют
function getHitColor(age, maxAge) {
  const ratio = Math.max(0, 1 - age / maxAge)
  const alpha = 0.3 + ratio * 0.7
  return { fill: `rgba(255, 60, 60, ${alpha})`, stroke: `rgba(255, 200, 200, ${alpha})` }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  const now = Date.now()
  const MAX_AGE = 10_000 // показывать попадания 10 секунд

  const scaleX = width / props.frameWidth
  const scaleY = height / props.frameHeight

  for (const hit of props.hits) {
    const age = now - (hit.timestamp ?? now)
    if (age > MAX_AGE) continue

    const x = hit.x * scaleX
    const y = hit.y * scaleY
    const { fill, stroke } = getHitColor(age, MAX_AGE)

    // Внешнее кольцо
    ctx.beginPath()
    ctx.arc(x, y, 14, 0, Math.PI * 2)
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()

    // Заливка
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()

    // Крестик
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 5, y)
    ctx.lineTo(x + 5, y)
    ctx.moveTo(x, y - 5)
    ctx.lineTo(x, y + 5)
    ctx.stroke()
  }

  animFrameId = requestAnimationFrame(draw)
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  canvas.width = parent.clientWidth
  canvas.height = parent.clientHeight
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  draw()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
.hits-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
