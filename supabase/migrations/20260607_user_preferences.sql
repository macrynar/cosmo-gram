-- User email preferences & mailing state
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_horoscope boolean     NOT NULL DEFAULT true,
  welcome_sent    boolean     NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all (for cron)
CREATE POLICY "service_role_read"
  ON user_preferences FOR SELECT
  USING (true);
