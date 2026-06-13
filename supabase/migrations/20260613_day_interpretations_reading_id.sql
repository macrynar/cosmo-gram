-- Fix: day_interpretations musi być per reading, nie per user
-- Stare rekordy są stale (generated from wrong reading) — usuwamy
DELETE FROM day_interpretations;

-- Add reading_id column
ALTER TABLE day_interpretations
  ADD COLUMN reading_id uuid NOT NULL REFERENCES readings(id) ON DELETE CASCADE;

-- Replace unique constraint: (user_id, date) → (reading_id, date)
ALTER TABLE day_interpretations
  DROP CONSTRAINT IF EXISTS day_interpretations_user_id_date_key;

ALTER TABLE day_interpretations
  ADD CONSTRAINT day_interpretations_reading_id_date_key
  UNIQUE (reading_id, date);

-- Update index
DROP INDEX IF EXISTS day_interpretations_user_date_idx;

CREATE INDEX day_interpretations_reading_date_idx
  ON day_interpretations (reading_id, date DESC);
