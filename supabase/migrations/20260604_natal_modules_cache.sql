CREATE TABLE IF NOT EXISTS natal_modules_cache (
  cache_key      TEXT PRIMARY KEY,
  user_id        UUID REFERENCES auth.users NOT NULL,
  chart_id       UUID NOT NULL,
  module_id      TEXT NOT NULL,
  module_data    JSONB NOT NULL,
  prompt_version TEXT NOT NULL,
  generated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE natal_modules_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_modules" ON natal_modules_cache
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_modules_by_chart   ON natal_modules_cache(user_id, chart_id);
CREATE INDEX IF NOT EXISTS idx_modules_by_version ON natal_modules_cache(prompt_version);
