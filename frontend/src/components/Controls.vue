<template>
  <div class="controls">
    <button
      v-if="!store.isRunning"
      class="btn btn-start"
      :disabled="loading"
      @click="handleStart"
    >
      {{ loading ? 'Запуск...' : 'Начать упражнение' }}
    </button>

    <button
      v-else
      class="btn btn-stop"
      :disabled="loading"
      @click="handleStop"
    >
      {{ loading ? 'Завершение...' : 'Завершить' }}
    </button>

    <button
      v-if="store.view === 'results'"
      class="btn btn-secondary"
      @click="handleNewExercise"
    >
      Новое упражнение
    </button>

    <div v-if="error" class="controls-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useExerciseStore } from '../stores/exercise.js'
import { authFetch } from '../utils/api.js'

const store   = useExerciseStore()
const loading = ref(false)
const error   = ref(null)

async function handleStart() {
  loading.value = true
  error.value   = null
  try {
    const res = await authFetch('/api/exercises', { method: 'POST' })
    if (!res.ok) throw new Error(`Сервер: ${res.status}`)
    const data = await res.json()
    store.startExercise(data.id, data.user_exercise_number)
  } catch (err) {
    error.value = `Не удалось начать упражнение: ${err.message}`
  } finally {
    loading.value = false
  }
}

async function handleStop() {
  loading.value = true
  error.value   = null
  try {
    const res = await authFetch(`/api/exercises/${store.exerciseId}/finish`, { method: 'PUT' })
    if (!res.ok) throw new Error(`Сервер: ${res.status}`)
    const data = await res.json()
    store.finishExercise(data)
  } catch (err) {
    error.value = `Не удалось завершить упражнение: ${err.message}`
  } finally {
    loading.value = false
  }
}

function handleNewExercise() {
  store.reset()
}
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn:not(:disabled):active { transform: scale(0.97); }

.btn-start { background: #238636; color: #fff; }
.btn-start:not(:disabled):hover { background: #2ea043; }

.btn-stop { background: #b62324; color: #fff; }
.btn-stop:not(:disabled):hover { background: #d1242f; }

.btn-secondary {
  background: #21262d;
  color: #e6edf3;
  border: 1px solid #30363d;
}
.btn-secondary:not(:disabled):hover { background: #30363d; }

.controls-error {
  color: #ffa198;
  font-size: 13px;
}
</style>
