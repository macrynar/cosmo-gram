CREATE TABLE calendar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  reading_id UUID REFERENCES readings(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  note_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reading_id, date)
);

ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notes" ON calendar_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_notes_lookup ON calendar_notes(user_id, reading_id, date);
