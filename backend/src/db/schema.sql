-- Упражнения
CREATE TABLE IF NOT EXISTS exercises (
  id          SERIAL PRIMARY KEY,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Попадания
CREATE TABLE IF NOT EXISTS hits (
  id          SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  x           NUMERIC(8, 2) NOT NULL,
  y           NUMERIC(8, 2) NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hits_exercise_id_idx ON hits (exercise_id);
