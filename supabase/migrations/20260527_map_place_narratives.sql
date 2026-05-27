CREATE TABLE IF NOT EXISTS map_place_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  city_slug TEXT NOT NULL,
  intention_id TEXT NOT NULL,
  active_lines JSONB NOT NULL DEFAULT '[]',
  narrative JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, city_slug, intention_id)
);

CREATE INDEX IF NOT EXISTS idx_narratives_lookup ON map_place_narratives(user_id, intention_id);

ALTER TABLE map_place_narratives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_narratives" ON map_place_narratives;
CREATE POLICY "users_own_narratives" ON map_place_narratives
  FOR ALL USING (auth.uid() = user_id);
