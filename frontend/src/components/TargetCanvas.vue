<template>
  <canvas ref="canvasRef" :width="size" :height="size" class="target-canvas" />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  hits: { type: Array, default: () => [] },
  size: { type: Number, default: 300 },
})

const canvasRef = ref(null)

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2

  ctx.clearRect(0, 0, W, H)

  ctx.fillStyle = '#161b22'
  ctx.fillRect(0, 0, W, H)

  const rings      = [130, 100, 70, 40, 15].map(r => r * (W / 300))
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

  const r = rings[0]
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy)
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r)
  ctx.stroke()

  const scaleX = W / 640
  const scaleY = H / 480
  for (const hit of props.hits) {
    const x = parseFloat(hit.x) * scaleX
    const y = parseFloat(hit.y) * scaleY
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 60, 60, 0.85)'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

onMounted(draw)
watch(() => props.hits, draw, { deep: true })
</script>

<style scoped>
.target-canvas {
  border-radius: 50%;
  border: 2px solid #30363d;
  display: block;
}
</style>
