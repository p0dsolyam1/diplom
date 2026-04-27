import { Router } from 'express'
import {
  createExercise, finishExercise, listExercises,
  getExercise, getHitsByExercise, deleteExercise,
} from '../services/dbService.js'
import { onExerciseFinished } from '../websocket/handler.js'

const router = Router()

// GET /api/exercises — список упражнений текущего пользователя
router.get('/', async (req, res) => {
  try {
    const exercises = await listExercises(req.user.id)
    res.json(exercises)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/exercises/:id — упражнение с попаданиями (только своё)
router.get('/:id', async (req, res) => {
  try {
    const exercise = await getExercise(req.params.id, req.user.id)
    if (!exercise) return res.status(404).json({ error: 'Не найдено' })
    res.json(exercise)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/exercises — начать новое упражнение
router.post('/', async (req, res) => {
  try {
    const exercise = await createExercise(req.user.id)
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
    onExerciseFinished(exercise.id)
    res.json({ ...exercise, hits })
  } catch (err) {
    const status = err.message.includes('не найдено') ? 404 : 500
    res.status(status).json({ error: err.message })
  }
})

// DELETE /api/exercises/:id — удалить своё упражнение
router.delete('/:id', async (req, res) => {
  try {
    await deleteExercise(req.params.id, req.user.id)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
