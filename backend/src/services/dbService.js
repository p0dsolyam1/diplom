import pool from '../db/pool.js'

// ─── Упражнения ────────────────────────────────────────────────────────────

export async function createExercise(userId) {
  const { rows } = await pool.query(
    `WITH inserted AS (
       INSERT INTO exercises (user_id, started_at) VALUES ($1, NOW()) RETURNING *
     )
     SELECT i.*,
       (SELECT COUNT(*) FROM exercises WHERE user_id = $1) AS user_exercise_number
     FROM inserted i`,
    [userId]
  )
  return rows[0]
}

export async function finishExercise(id) {
  const { rows } = await pool.query(
    'UPDATE exercises SET finished_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  )
  if (!rows.length) throw new Error(`Упражнение ${id} не найдено`)
  return rows[0]
}

export async function getExercise(id) {
  const { rows } = await pool.query(
    'SELECT * FROM exercises WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function listExercises(userId, limit = 20) {
  const { rows } = await pool.query(
    'SELECT * FROM exercises WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2',
    [userId, limit]
  )
  return rows
}

// ─── Попадания ──────────────────────────────────────────────────────────────

export async function saveHits(exerciseId, hits) {
  if (!hits.length) return []

  // Батч-вставка через unnest
  const xs = hits.map(h => h.x)
  const ys = hits.map(h => h.y)
  const ids = hits.map(() => exerciseId)

  const { rows } = await pool.query(
    `INSERT INTO hits (exercise_id, x, y)
     SELECT * FROM unnest($1::int[], $2::numeric[], $3::numeric[])
     RETURNING *`,
    [ids, xs, ys]
  )
  return rows
}

export async function getHitsByExercise(exerciseId) {
  const { rows } = await pool.query(
    'SELECT * FROM hits WHERE exercise_id = $1 ORDER BY timestamp ASC',
    [exerciseId]
  )
  return rows
}
