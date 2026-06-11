# Monitoring Setup — Checklista

> Jednorazowa konfiguracja zewnętrznych usług monitoringu.
> Odhaczaj po wykonaniu.

---

## GitHub

- [ ] **Branch protection na `main`:**
  - Settings → Branches → Add rule → `main`
  - Required status checks: `Lint`, `Typecheck`, `Unit tests`, `Security audit`, `Build`
  - Require PR before merging: ON
  - Dismiss stale reviews when new commits pushed: ON

- [ ] **Repository secrets** (Settings → Secrets → Actions):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Sentry

- [ ] Utwórz projekt: [sentry.io](https://sentry.io) → New Project → Next.js → `cosmo-gram`
- [ ] Skopiuj DSN do Vercel env: `SENTRY_DSN = https://xxx@oyyy.ingest.sentry.io/zzz`
- [ ] Ustaw alert: Issues → Alerts → When error rate > 5/min → Notify email
- [ ] Verify PII scrubbing: wyślij testowy event, sprawdź że brak emaila/birth_date w payload

---

## UptimeRobot (lub Betterstack)

- [ ] Monitor: `GET https://www.cosmo-gram.com/api/health` — co 5 min
- [ ] Monitor: `GET https://www.cosmo-gram.com/api/health/cron` — co 1h
- [ ] Alert channel: email do Maca + opcjonalnie Slack

---

## Supabase

- [ ] Włącz PITR (Point-In-Time Recovery): Database → Backups → Enable
- [ ] Ustaw alert na rozmiar bazy: > 80% limitu planu → email
- [ ] Zweryfikuj RLS migrations wdrożone:
  ```sql
  -- Uruchom w Supabase Studio → SQL Editor
  \i supabase/migrations/20260610_rls_core_tables.sql
  \i supabase/migrations/20260611_cron_runs.sql
  \i supabase/migrations/20260611_ai_call_logs.sql
  ```

---

## Vercel

- [ ] Sprawdź że `AI_DISABLED` NIE jest ustawione w production (lub jest `false`)
- [ ] Sprawdź że `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN` są ustawione
- [ ] Sprawdź że `SENTRY_DSN` jest ustawione (po konfiguracji Sentry)
- [ ] Sprawdź że `CRON_SECRET` jest ustawiony

---

## Restore drill (raz na kwartał)

- [ ] Wykonaj restore na środowisku staging/dev (nie production)
- [ ] Uruchom `npx tsx scripts/backup-verify.ts`
- [ ] Zweryfikuj że główny flow działa: rejestracja → cosmogram → moduły AI

---

## Cotygodniowy checklist

- [ ] Sprawdź `ai_call_logs` pod kątem wzrostu `status='error'`
- [ ] Sprawdź `/api/health/cron` że daily-horoscope działał
- [ ] Przejrzyj Sentry Issues — nowe błędy?
- [ ] Sprawdź koszty Anthropic API w console.anthropic.com
