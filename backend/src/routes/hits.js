import { Router } from 'express'
import { getHitsByExercise } from '../services/dbService.js'

const router = Router()

// GET /api/exercises/:id/hits — все попадания упражнения
router.get('/exercises/:id/hits', async (req, res) => {
  try {
    const hits = await getHitsByExercise(req.params.id)
    res.json(hits)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
