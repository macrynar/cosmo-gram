-- Fix FK constraints so readings can be deleted even when evaluations/exemplars reference them

ALTER TABLE reading_evaluations
  DROP CONSTRAINT IF EXISTS reading_evaluations_reading_id_fkey;
ALTER TABLE reading_evaluations
  ADD CONSTRAINT reading_evaluations_reading_id_fkey
  FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE;

ALTER TABLE few_shot_exemplars
  DROP CONSTRAINT IF EXISTS few_shot_exemplars_source_reading_id_fkey;
ALTER TABLE few_shot_exemplars
  ADD CONSTRAINT few_shot_exemplars_source_reading_id_fkey
  FOREIGN KEY (source_reading_id) REFERENCES readings(id) ON DELETE SET NULL;
