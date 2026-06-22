-- Add horoscope_sent_at to subscriptions table to prevent duplicate emails
-- Run via: supabase migration up

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS weekly_horoscope_sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS monthly_forecast_sent_at TIMESTAMP NULL;

-- Index for efficient querying users NOT recently emailed
CREATE INDEX IF NOT EXISTS idx_subscriptions_weekly_horoscope_sent
  ON subscriptions(user_id, weekly_horoscope_sent_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_monthly_forecast_sent
  ON subscriptions(user_id, monthly_forecast_sent_at);

-- Log horoscope send attempts for monitoring
CREATE TABLE IF NOT EXISTS horoscope_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_msg TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horoscope_send_logs_user_type
  ON horoscope_send_logs(user_id, type, created_at DESC);
