-- RLS policies for core user-data tables.
-- Safe to re-run: DROP POLICY IF EXISTS before each CREATE POLICY.
-- service_role (supabaseAdmin) bypasses RLS entirely — no need for separate policies.

-- ─── readings ───────────────────────────────────────────────────────────────
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_readings"        ON readings;
DROP POLICY IF EXISTS "service_role_readings"     ON readings;

CREATE POLICY "users_own_readings" ON readings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── children ───────────────────────────────────────────────────────────────
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_children"    ON children;

CREATE POLICY "users_own_children" ON children
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── matches ────────────────────────────────────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_matches" ON matches;

CREATE POLICY "users_own_matches" ON matches
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── conversations ──────────────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_conversations" ON conversations;

CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── messages ───────────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_messages" ON messages;

-- Messages are owned by the conversation owner
CREATE POLICY "users_own_messages" ON messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM conversations WHERE id = conversation_id
    )
  );

-- ─── subscriptions ──────────────────────────────────────────────────────────
-- Users can read their own subscription; only service_role can write (via Stripe webhooks).
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_subscription"  ON subscriptions;
DROP POLICY IF EXISTS "users_own_subscription"        ON subscriptions;

CREATE POLICY "users_read_own_subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── purchases (if table exists) ────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchases') THEN
    EXECUTE 'ALTER TABLE purchases ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_read_own_purchases" ON purchases';
    EXECUTE $p$
      CREATE POLICY "users_read_own_purchases" ON purchases
        FOR SELECT USING (auth.uid() = user_id)
    $p$;
  END IF;
END
$$;

-- ─── user_consents: add INSERT policy (SELECT already exists) ───────────────
-- Service role inserts via API — but add explicit service-role read/insert for clarity.
DROP POLICY IF EXISTS "service_role_consents_insert" ON user_consents;
-- Note: service_role bypasses RLS; this policy is for documentation only.
-- No user-level INSERT/UPDATE/DELETE intentionally — consents are immutable once written.
