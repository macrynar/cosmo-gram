# Cosmo-Gram — Runbook

> Instrukcja operacyjna dla typowych incydentów i zadań administracyjnych.

---

## Spis treści

1. [Health check](#1-health-check)
2. [Wyłączenie AI (AI_DISABLED)](#2-wyłączenie-ai)
3. [Incydent: AI przestało odpowiadać](#3-incydent-ai-przestało-odpowiadać)
4. [Incydent: Supabase niedostępne](#4-incydent-supabase-niedostępne)
5. [Restore bazy danych](#5-restore-bazy-danych)
6. [Weryfikacja po restore](#6-weryfikacja-po-restore)
7. [Cron — ręczne uruchomienie](#7-cron--ręczne-uruchomienie)
8. [Czyszczenie starych logów AI](#8-czyszczenie-starych-logów-ai)
9. [Zmiana modelu AI w production](#9-zmiana-modelu-ai-w-production)
10. [Rollback deployu](#10-rollback-deployu)

---

## 1. Health check

```bash
# Status aplikacji + Supabase ping
curl https://www.cosmo-gram.com/api/health

# Status cronów (503 jeśli >28h bez uruchomienia)
curl https://www.cosmo-gram.com/api/health/cron
```

Oczekiwana odpowiedź `ok`:
```json
{ "status": "ok", "ts": "...", "latencyMs": 42, "version": "abc1234", "checks": { "db": { "ok": true, "ms": 35 } } }
```

---

## 2. Wyłączenie AI

Używaj gdy Anthropic API jest down lub koszty tokenów są niekontrolowane.

**Włącz tryb offline:**
1. Vercel Dashboard → Settings → Environment Variables
2. Dodaj: `AI_DISABLED = true` (scope: Production)
3. Vercel → Deployments → Redeploy last deployment

**Efekt:** `/api/natal-karta`, `/api/chat/message` i inne AI routes zwracają HTTP 503 z komunikatem po polsku. Użytkownik widzi komunikat "AI tymczasowo niedostępne."

**Wyłącz tryb offline:**
1. Usuń lub zmień `AI_DISABLED` na `false`
2. Redeploy

---

## 3. Incydent: AI przestało odpowiadać

**Symptomy:** natal-karta lub chat zwraca 500/502, `ai_call_logs.status = 'error'`

**Diagnostyka:**
```sql
-- Ostatnie błędy AI (Supabase Studio lub psql)
select task, model, error_msg, called_at
from ai_call_logs
where status = 'error'
order by called_at desc
limit 20;
```

**Kroki:**
1. Sprawdź [status.anthropic.com](https://status.anthropic.com) — czy to globalny incident
2. Sprawdź logi Vercel (Functions tab) — szukaj `ANTHROPIC_API_KEY not set` (brakuje zmiennej)
3. Jeśli klucz wygasł: wygeneruj nowy w Anthropic Console → zaktualizuj `ANTHROPIC_API_KEY` w Vercel → redeploy
4. Jeśli API Anthropic down: włącz `AI_DISABLED=true` (punkt 2 powyżej)

---

## 4. Incydent: Supabase niedostępne

**Symptomy:** `/api/health` zwraca `"status": "degraded"`, błędy DB w logach Vercel

**Kroki:**
1. Sprawdź [status.supabase.com](https://status.supabase.com)
2. Vercel Logs → szukaj `supabase` error patterns
3. Jeśli problem z connection pooling: Supabase Dashboard → Database → Connection Pooling → Restart
4. Jeśli projekt paused (free tier): Supabase Dashboard → Settings → General → Resume

---

## 5. Restore bazy danych

Supabase tworzy automatyczne backupy co 24h (PITR na planie Pro).

**Restore przez Supabase Dashboard:**
1. Supabase → Database → Backups
2. Wybierz punkt w czasie → "Restore"
3. Uwaga: restore jest nieodwracalny dla bieżących danych

**Restore przez CLI (jeśli masz dump):**
```bash
psql "$DATABASE_URL" < backup-YYYY-MM-DD.sql
```

---

## 6. Weryfikacja po restore

```bash
# Wymaga: NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w env
npx tsx scripts/backup-verify.ts
```

Skrypt sprawdza czy wszystkie kluczowe tabele są osiągalne i zwraca liczbę wierszy. Wyjście `exit 0` = OK, `exit 1` = błąd.

---

## 7. Cron — ręczne uruchomienie

Daily horoscope cron normalnie odpala Vercel o 06:00 UTC.

**Ręczne odpalenie:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://www.cosmo-gram.com/api/cron/daily-horoscope
```

Oczekiwana odpowiedź: `{ "sent": N, "failed": 0 }`

---

## 8. Czyszczenie starych logów AI

```sql
-- Usuń wpisy starsze niż 90 dni (uruchamiaj raz na miesiąc lub przez cron)
delete from ai_call_logs where called_at < now() - interval '90 days';
delete from cron_runs    where ran_at   < now() - interval '90 days';
```

---

## 9. Zmiana modelu AI w production

1. Zmień model string w `src/lib/deepseek.ts` (szukaj `"claude-sonnet-4-6"` lub `"claude-haiku-4-5-20251001"`)
2. Zaktualizuj fixtures w `tests/fixtures/ai/` jeśli nowy model daje inny format
3. Uruchom `npm test` — testy nie testują modelu, więc powinny przejść
4. Deploy, monitoruj `ai_call_logs` przez kilka godzin

---

## 10. Rollback deployu

```bash
# Przez Vercel CLI
vercel rollback

# Lub przez Vercel Dashboard:
# Deployments → wybierz poprzedni deployment → "Promote to Production"
```

Po rollbacku sprawdź `/api/health` i zweryfikuj logi przez 15 minut.
