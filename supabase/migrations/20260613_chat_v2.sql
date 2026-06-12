-- P1.5 Cosmo Chat v2: session summaries, daily chips, data warning, billing period
-- SECURITY: conversations = najwrażliwsze dane; RLS + test negatywny wymagany

-- ─── conversations: add session metadata ────────────────────────────────────
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS summary              TEXT,
  ADD COLUMN IF NOT EXISTS summary_updated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_message_at     TIMESTAMPTZ;

-- ─── messages: RLS negative test documented ─────────────────────────────────
-- Existing policy: user_id IN (SELECT user_id FROM conversations WHERE id = conversation_id)
-- This ensures user B cannot read user A's messages. Test documented in CHAT-V2-VERIFY.md.

-- ─── user_preferences: chat data warning + pack add-on ─────────────────────
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS chat_data_warning_dismissed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_pack_purchased         BOOLEAN NOT NULL DEFAULT false;

-- ─── subscriptions: billing anniversary ─────────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

-- ─── chat_suggested_questions: daily chips + proactive openers ──────────────
CREATE TABLE IF NOT EXISTS chat_suggested_questions (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date        NOT NULL,
  type         text        NOT NULL DEFAULT 'chips',  -- 'chips' | 'opener'
  payload      jsonb       NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date, type)
);

ALTER TABLE chat_suggested_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_chat_questions" ON chat_suggested_questions;
CREATE POLICY "users_own_chat_questions" ON chat_suggested_questions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── RLS: re-confirm conversations + messages have RLS ──────────────────────
-- (already done in 20260610_rls_core_tables.sql — idempotent re-enable)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
