import bcrypt from 'bcrypt'
import pool from './pool.js'

export async function seedDb() {
  const adminHash = await bcrypt.hash('Admin', 10)
  const userHash  = await bcrypt.hash('User',  10)

  await pool.query(`
    INSERT INTO users (username, password_hash, role) VALUES
      ('Admin', $1, 'admin'),
      ('User',  $2, 'user')
    ON CONFLICT (username) DO NOTHING
  `, [adminHash, userHash])

  console.log('[DB] Тестовые пользователи готовы (Admin / User)')
}
