-- Prompt Registry + A/B Routing + Eval Pipeline
-- Run once against your Supabase project via Dashboard SQL editor or CLI

-- 1. Prompt version registry
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name TEXT NOT NULL,
  version TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  rollout_pct INT NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  notes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_name, version)
);

CREATE INDEX IF NOT EXISTS idx_prompt_active ON prompt_versions(prompt_name, status, rollout_pct)
  WHERE status = 'active' AND rollout_pct > 0;

-- 2. Rollout sum constraint: active versions for a prompt_name must sum to 0 or 100
CREATE OR REPLACE FUNCTION check_rollout_sum() RETURNS TRIGGER AS $$
DECLARE
  total INT;
BEGIN
  SELECT COALESCE(SUM(rollout_pct), 0) INTO total
  FROM prompt_versions
  WHERE prompt_name = NEW.prompt_name AND status = 'active';

  IF total NOT IN (0, 100) THEN
    RAISE EXCEPTION 'Rollout sum for "%" = %, must be 0 or 100', NEW.prompt_name, total;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_rollout_sum ON prompt_versions;
CREATE CONSTRAINT TRIGGER tr_rollout_sum
  AFTER INSERT OR UPDATE ON prompt_versions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_rollout_sum();

-- 3. Extend readings table
ALTER TABLE readings
  ADD COLUMN IF NOT EXISTS prompt_version_id UUID REFERENCES prompt_versions,
  ADD COLUMN IF NOT EXISTS rating_thumbs SMALLINT CHECK (rating_thumbs IN (-1, 1)),
  ADD COLUMN IF NOT EXISTS rating_dimensions JSONB,
  ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_readings_version ON readings(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_readings_unrated ON readings(created_at) WHERE rating_thumbs IS NULL;

-- 4. Few-shot exemplar library
CREATE TABLE IF NOT EXISTS few_shot_exemplars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_markdown TEXT NOT NULL,
  source_reading_id UUID REFERENCES readings,
  quality_score INT CHECK (quality_score BETWEEN 1 AND 5),
  tags TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exemplars_active ON few_shot_exemplars(prompt_name, active);

-- 5. Claude-as-judge evaluations
CREATE TABLE IF NOT EXISTS reading_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID REFERENCES readings NOT NULL,
  prompt_version_id UUID REFERENCES prompt_versions,
  scores JSONB NOT NULL,
  reasoning TEXT,
  judge_model TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reading_id, judge_model)
);

CREATE INDEX IF NOT EXISTS idx_evals_version ON reading_evaluations(prompt_version_id);

-- 6. Golden test suite
CREATE TABLE IF NOT EXISTS golden_test_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  birth_data JSONB NOT NULL,
  expected_traits JSONB NOT NULL DEFAULT '[]',
  prompt_names TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS golden_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID REFERENCES prompt_versions NOT NULL,
  chart_id UUID REFERENCES golden_test_charts NOT NULL,
  output_markdown TEXT NOT NULL,
  judge_scores JSONB NOT NULL DEFAULT '{}',
  traits_matched INT DEFAULT 0,
  traits_total INT DEFAULT 0,
  passed BOOLEAN,
  run_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_golden_runs_version ON golden_test_runs(prompt_version_id, run_at DESC);

-- 7. is_admin flag on user profiles (safer than altering auth.users directly)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users
);

-- 8. RLS — admin tables only accessible to admins
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE few_shot_exemplars ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_test_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_only_prompt_versions ON prompt_versions;
CREATE POLICY admin_only_prompt_versions ON prompt_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS admin_only_few_shot ON few_shot_exemplars;
CREATE POLICY admin_only_few_shot ON few_shot_exemplars FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS admin_only_evals ON reading_evaluations;
CREATE POLICY admin_only_evals ON reading_evaluations FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS admin_only_golden_charts ON golden_test_charts;
CREATE POLICY admin_only_golden_charts ON golden_test_charts FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS admin_only_golden_runs ON golden_test_runs;
CREATE POLICY admin_only_golden_runs ON golden_test_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS admin_only_admin_users ON admin_users;
CREATE POLICY admin_only_admin_users ON admin_users FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
