import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExerciseStore = defineStore('exercise', () => {
  // Текущее упражнение
  const exerciseId = ref(null)
  const isRunning = ref(false)
  const startedAt = ref(null)
  const finishedAt = ref(null)

  // Попадания в реальном времени
  const hits = ref([])

  // Завершённые упражнения (история)
  const history = ref([])

  // Вид: 'camera' | 'results'
  const view = ref('camera')

  const totalHits = computed(() => hits.value.length)

  function startExercise(id) {
    exerciseId.value = id
    isRunning.value = true
    startedAt.value = new Date()
    finishedAt.value = null
    hits.value = []
    view.value = 'camera'
  }

  function addHit(hit) {
    hits.value.push({ ...hit, timestamp: Date.now() })
  }

  function addHits(newHits) {
    for (const hit of newHits) {
      hits.value.push({ ...hit, timestamp: Date.now() })
    }
  }

  function finishExercise(finishedData) {
    isRunning.value = false
    finishedAt.value = new Date()

    history.value.unshift({
      id: exerciseId.value,
      startedAt: startedAt.value,
      finishedAt: finishedAt.value,
      hits: [...hits.value],
      totalHits: hits.value.length,
    })

    view.value = 'results'
  }

  function reset() {
    exerciseId.value = null
    isRunning.value = false
    startedAt.value = null
    finishedAt.value = null
    hits.value = []
    view.value = 'camera'
  }

  return {
    exerciseId,
    isRunning,
    startedAt,
    finishedAt,
    hits,
    history,
    view,
    totalHits,
    startExercise,
    addHit,
    addHits,
    finishExercise,
    reset,
  }
})
