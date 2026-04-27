import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../db/pool.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireAdmin)

// ─── Пользователи ────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/users — создать пользователя
router.post('/users', async (req, res) => {
  const { username, password, role = 'user' } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Заполните логин и пароль' })
  }
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Роль: admin или user' })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at`,
      [username, hash, role]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Пользователь с таким логином уже существует' })
    }
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Виды упражнений ─────────────────────────────────────────────────────────

// GET /api/admin/exercise-types
router.get('/exercise-types', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM exercise_types ORDER BY name'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/exercise-types
router.post('/exercise-types', async (req, res) => {
  const { name, description } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Укажите название' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO exercise_types (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name.trim(), description?.trim() || null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/exercise-types/:id
router.delete('/exercise-types/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM exercise_types WHERE id = $1', [req.params.id])
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
