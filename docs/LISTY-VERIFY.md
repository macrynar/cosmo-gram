---
title: Listy od Astrei — weryfikacja (P0)
type: verify
owner: Mac
created: 2026-06-23
status: P0 (Fazy 1–5) wdrożone na branchu feat/listy-od-astrei
---

# Listy od Astrei — co dowieziono (P0 / Fazy 1–5)

Mechanizm retencji: Astrea pisze dawkowane listy odsłaniające warstwy kosmogramu.
Free teaser („Twoja misja") → ściana → premium drip. Silnik gotowy też pod raporty (P1).

## Zakres wdrożony

| Faza | Co | Commit |
|---|---|---|
| 1 | Model danych + katalog 8 listów + RLS + test negatywny | `44aafd1` |
| 2 | Silnik generacji (resolver + prompt + Sonnet + cache) | `ce8c75b` |
| 3 | Scheduler dripu (frontier, pre-gen, dyscyplina częstotliwości) | `2f5bfad` |
| 4 | Skrzynka (inbox) + email open-loop | `d9e7140` |
| 5 | Free teaser + ściana paywall | `511a22e` |

## Architektura (na istniejącym stacku)

- **Tabele:** `astrea_letter_templates` (katalog, admin-only RLS), `user_letters` (instancje, owner-only), `inbox_items` (uniwersalna skrzynka, owner-only), `letter_purchases` (raporty P1, owner-only). Kolumna `email_letters` na `user_preferences`.
- **Prompty:** wersjonowane w `prompt_versions` (nie `ai_prompts` — to realna tabela rejestru). 8 promptów `v1`, wspólny głos Astrei + temat per list; `delikatny` dla cienia i karmy.
- **Silnik:** `src/lib/letters/` — `resolver` (deterministyczne punkty z `birthData` przez `calculateChart`), `generate` (Sonnet, retry+walidacja), `validate` (długość, predykcje, żargon w ciele, podpis), `store` (cache + dostarczanie), `schedule` (pure `planDripAction`), `teaser`, `email`.
- **Cron:** `/api/cron/letters-drip` (04:00 UTC) — wzór `daily-personal-horoscope`, log w `cron_runs`.
- **UI:** koperta w `Navbar` (tylko `/app/*`), `InboxProvider` + `InboxOverlay` w `/app/layout`. Drawer (desktop) / sheet (mobile), czytnik react-markdown + chip fundamentu.

## Weryfikacja

- **RLS test negatywny (najważniejszy):** na żywo przez MCP (transakcja z rollback, przełączenie na rolę `authenticated` + sfałszowany `sub`): intruz B widzi **0/0/0** w `user_letters`/`inbox_items`/`letter_purchases`, właściciel A widzi swoje **1/1/1**. Regresja: `tests/integration/letters-rls.test.ts` (`RUN_RLS_TESTS=true npm run test:rls`).
- **Jednostkowe (333 zielone łącznie):** resolver (placementy/żywioł/determinizm), walidacja (predykcje/żargon/długość/podpis), generacja pod `AI_MOCK` (fixtures standard/delikatny — asercja na treści + `ai_prompt_version`), pacing dripu (`planDripAction`: pre-gen, dostawa, dyscyplina ≥7 dni, frontier).
- **UI (przeglądarka, throwaway preview, usunięty po weryfikacji):**
  - Koperta z bursztynowym badge „2" + poświata (desktop).
  - Drawer z listą pozycji (ikony per typ, zajawka 2-line clamp, kropka nieprzeczytanego).
  - Czytnik: tytuł serif + chip fundamentu „✦ Słońce · Węzeł Północny · MC" + treść Markdown + podpis kursywą.
  - Bottom sheet na 390 px (uchwyt, pełna szerokość).
  - Ściana paywall dla free usera na liście free: „To dopiero pierwszy list… kolejne dla subskrybentów" + CTA „Odblokuj kolejne listy →" do `/pricing`.
  - Brak błędów React/hydration (jedyne błędy konsoli: PostHog 401 — brak klucza lokalnie).

## Zasady utrzymane

- Treść listów **nigdy** w `ai_call_logs` (tylko metadane), nie w logach. Pseudonimizacja: bez imienia i surowych danych urodzenia w prompcie.
- Generacja **raz + cache**, nigdy auto-regen (`.is("content_md", null)` guard).
- Sonnet dla listów; deterministyczne punkty/tranzyty/progi liczy kod.
- Częstotliwość maks. ~1 list/tydzień łącznie.

## Świadome odstępstwa (spec vs rzeczywistość)

- **Chiron** nie jest liczony przez silnik → list „Twój cień" opiera fundament na realnych punktach (Saturn, Pluton, 12 dom, węzeł płd.), bez Chirona. Jeśli Chiron ma być — to osobne zadanie w `chart-engine`.
- „Dni od natalu" interpretowane jako **dni od wygenerowania kosmogramu** (zegar retencji = `readings.created_at`), zgodnie z konceptem §4.

## Odroczone (poza P0 — do decyzji Maca)

- **Faza 6** — listy eventowe (Solar Return, powrót Saturna, sezon przemiany) z `transits.ts`.
- **Faza 7** — raporty jednorazowe + Stripe one-time (tabela `letter_purchases` już jest; flow do dołożenia).
- **Faza 8** — golden testy per szablon, E2E (drip→inbox→read pod `AI_MOCK`), PostHog (`inbox_opened`, `letter_opened`, `letter_paywall_hit`, …).
- Drobne: mail tygodniowy ma wspomnieć o nowym liście (Faza 4.5 — niewdrożone).

## TODO właściciela (NIE wdrażane — decyzje Maca)

- Aktualizacja polityki prywatności o nowe przetwarzanie (treści egzystencjalne).
- Zatwierdzenie cen raportów (test 49 zł / 99 zł pakiet) i ostatecznego zestawu MVP.
- Kontrola jakości treści listów (poza Claude) — przeczytaj wygenerowane listy na realnych kosmogramach.
- `RESEND_FROM`/`RESEND_API_KEY` na prod (mail listów) — używa istniejącego setupu Resend.
