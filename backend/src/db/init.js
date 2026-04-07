import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pool from './pool.js'

const __dir = dirname(fileURLToPath(import.meta.url))

export async function initDb() {
  const sql = readFileSync(join(__dir, 'schema.sql'), 'utf8')
  await pool.query(sql)
  console.log('[DB] Схема инициализирована')
}
