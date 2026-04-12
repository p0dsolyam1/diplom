import { Router } from 'express'
import { createExercise, finishExercise, listExercises, getExercise, getHitsByExercise } from '../services/dbService.js'
import { onExerciseFinished } from '../websocket/handler.js'

const router = Router()

// GET /api/exercises — список упражнений
router.get('/', async (_req, res) => {
  try {
    const exercises = await listExercises()
    res.json(exercises)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/exercises/:id — одно упражнение
router.get('/:id', async (req, res) => {
  try {
    const exercise = await getExercise(req.params.id)
    if (!exercise) return res.status(404).json({ error: 'Не найдено' })
    res.json(exercise)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/exercises — начать новое упражнение
router.post('/', async (_req, res) => {
  try {
    const exercise = await createExercise()
    res.status(201).json(exercise)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/exercises/:id/finish — завершить упражнение
router.put('/:id/finish', async (req, res) => {
  try {
    const exercise = await finishExercise(req.params.id)
    const hits = await getHitsByExercise(exercise.id)
    // Очищаем кэш фильтра попаданий для завершённого упражнения
    onExerciseFinished(exercise.id)
    res.json({ ...exercise, hits })
  } catch (err) {
    const status = err.message.includes('не найдено') ? 404 : 500
    res.status(status).json({ error: err.message })
  }
})

export default router
