import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExerciseStore = defineStore('exercise', () => {
  const exerciseId   = ref(null)
  const isRunning    = ref(false)
  const startedAt    = ref(null)
  const finishedAt   = ref(null)
  const hits         = ref([])
  const history      = ref([])
  const view         = ref('camera')

  // null — не откалибровано, [{x,y}]×4 — углы мишени в координатах кадра 640×480
  const targetCorners = ref(null)
  const isCalibrating = ref(false)

  const totalHits    = computed(() => hits.value.length)
  // isCalibrated — производное от targetCorners, отдельный ref не нужен
  const isCalibrated = computed(() => targetCorners.value !== null)

  // ─── Упражнение ──────────────────────────────────────────────────────────

  function startExercise(id) {
    exerciseId.value = id
    isRunning.value  = true
    startedAt.value  = new Date()
    finishedAt.value = null
    hits.value       = []
    view.value       = 'camera'
  }

  function addHits(newHits) {
    for (const hit of newHits) {
      hits.value.push({ ...hit, timestamp: Date.now() })
    }
  }

  function finishExercise() {
    isRunning.value  = false
    finishedAt.value = new Date()

    history.value.unshift({
      id:         exerciseId.value,
      startedAt:  startedAt.value,
      finishedAt: finishedAt.value,
      hits:       [...hits.value],
      totalHits:  hits.value.length,
    })

    view.value = 'results'
  }

  function reset() {
    exerciseId.value = null
    isRunning.value  = false
    startedAt.value  = null
    finishedAt.value = null
    hits.value       = []
    view.value       = 'camera'
    // калибровка сохраняется между упражнениями — мишень не меняется
  }

  // ─── Калибровка ──────────────────────────────────────────────────────────

  function startCalibration() {
    isCalibrating.value = true
  }

  function setTargetCorners(corners) {
    targetCorners.value = corners
    isCalibrating.value = false
  }

  function clearCalibration() {
    targetCorners.value = null
    isCalibrating.value = false
  }

  function cancelCalibration() {
    isCalibrating.value = false
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
    targetCorners,
    isCalibrated,
    isCalibrating,
    startExercise,
    addHits,
    finishExercise,
    reset,
    startCalibration,
    setTargetCorners,
    clearCalibration,
    cancelCalibration,
  }
})
