---
title: Cosmogram
created: 2026-05-18
status: now
horizon: 6-months
type: project
category: saas-consumer
partnership_status: pending-w0-conversation
---

# Brief — Cosmogram

> [!success] Status: NOW (główny projekt portfolio)
> Wybrany w [[Portfolio Strategy 2026-05-18]] jako #1 ze score 1500 (z partnerstwem) / 576 (solo). **CRITICAL:** strategia jest conditional na W0 partnership conversation. Wcześniejszy brief inkubujący w `decisions/2026-05-18-initial-incubator-brief.md`.

## What

Aplikacja / serwis łączący **AI z astrologią i numerologią** - personalizowane horoskopy, analizy numerologiczne, kompatybilność, prognozy. AI = silnik personalizacji + naturalna rozmowa. Pozycjonowanie: **"symboliczne lustro, nie wyrocznia"** - dystans ironiczny w stylu Co-Star, pozwalający budować z autentyczności bez wymogu wiary w gwiazdy.

## Why

- **Rynek udowodniony:** Co-Star 30M+ pobrań, The Pattern, Sanctuary, Nebula - wszystkie >$10M ARR. Trend silny, monetyzacja działa.
- **AI advantage:** większość konkurencji generuje treści ręcznie lub z prymitywnych szablonów. LLM = personalizacja 1:1.
- **Polska niche:** Astrolada (etc.) na niskim poziomie. Brak dominującego gracza.
- **Partnership advantage:** koleżanka-wróżka z 20+ lat w branży = autentyczność, content moat (prawdziwa domain knowledge w prompty), sieć (cold start), drugi operator (kompensuje sumienność 42% Maca).

## Stan na 2026-05-18

- **Brand:** TBD (nazwa Cosmogram tymczasowa, może się zmienić po W1)
- **Stack:** TBD - planowo cherry-pick z [[Alcheme.io]] (Supabase, React 18 + Vite 5 + Tailwind, edge functions, OpenAI/Anthropic API)
- **Partnership:** koleżanka-wróżka - rozmowa W0 zaplanowana
- **MVP scope:** TBD - decision W3
- **Waitlist:** N/A - pre-launch content W2-W3

## North Star Metric

> ⚠️ DO USTAWIENIA - decyzja w W4 (po pierwszych danych z waitlistu)

Kandydaci:
- **Paid subscriber 30-day retention** - bo mierzy czy produkt naprawdę działa, nie tylko czy ktoś się zarejestrował
- **MAU** - klasyczny, dobry dla consumer app
- **ARPU × MAU = revenue** - ostateczny, ale wymaga już skali

Rekomendacja: **paid subscriber retention 30d** jako primary + MRR jako counter-metric.

## Success criteria

> ⚠️ DO USTAWIENIA - decyzja po W4 review

Wstępne (do kalibracji):
- **3 mies (sierpień 2026):** Waitlist >500, MVP live, pierwsi płatni testerzy
- **6 mies (listopad 2026):** 100 płatnych subs, retention 30d >40%, break-even na infra
- **12 mies (maj 2027):** 500-1000 płatnych subs, ~5-10k zł MRR, decyzja: skalowanie marketingu vs lifestyle business

## Constraints

- **Czas:** 5-7h/tydz Maca + ? koleżanki (TBD W0)
- **Budżet:** ~200-500$/mc (Supabase + Vercel + Stripe + OpenAI/Anthropic + domena) - do potwierdzenia
- **Zespół:** Mac (strategy/produkt/AI) + koleżanka (content/voice/community) - **CONDITIONAL**, decyzja W0
- **Stack:** prawdopodobnie reuse z Alcheme (Supabase, React, edge functions, OpenAI/Anthropic)

## Hipotezy do walidacji

1. **Partnership z koleżanką wchodzi.** Bez tego score Cosmogram spada z 1500 do 576 i strategia portfolio wymaga re-evaluation. **PRIORYTET #1, do walidacji W0.**
2. **Pozycjonowanie "symboliczne lustro" rezonuje z PL publicą.** Ironiczny dystans Co-Star nie musi pasować do PL kultury (która lubi serio). **Test:** IG/TikTok content W2-W3.
3. **Polski rynek udźwignie konwersję na płatne subskrypcje za AI horoskopy.** Astrolada nie monetyzuje agresywnie - nie wiadomo czy PL userzy zapłacą. **Test:** waitlist W4.
4. **LLM costs są obstacleable.** Daily horoskop per znak (12 wywołań/dzień zamiast per user) + cache = manageable. **Test:** stack design W3.

## Otwarte pytania

- Jaką rolę proponujesz koleżance: advisor, co-founder, head of content/community? (Decyzja przed W0)
- Co Ty wnosisz, co ona - wprost na kartce? (Materiał przygotowawczy do W0)
- Czy nazwa "Cosmogram" zostaje, czy szukamy mocniejszej? (Decyzja W1)
- Polski czy angielski rynek na start? (Decyzja W1)
- Free tier vs trial-only? (Decyzja W3)

## Out of scope (na razie)

- Sklep z akcesoriami / tarot decks - to [[Sigil Wear]]
- B2B / dla wróżek-profesjonalistów - osobny segment
- Native mobile app - PWA wystarczy na MVP
- Internationalization - PL na start, EN architektura przygotowana

## Pierwszy kill switch

**W4 (16-22 czerwca 2026):** Wspólna decyzja go/pivot/kill. Kryteria:
- Waitlist >100 zapisów? (jeśli z partnerstwem = ona daje boost przez sieć)
- IG/TikTok pre-launch content >1000 view łącznie?
- Czy pozycjonowanie zarezonuje? (sygnał: komentarze, share rate)

**Jeśli kill:** wracamy do scoreboardu z [[Portfolio Strategy 2026-05-18]], Sigil Wear staje się kandydatem #1.

## Struktura projektu

- `decisions/` - kluczowe decyzje (W0 partnership decision już pierwsza)
- `specs/` - specyfikacje produktu, prompty AI, dokumentacja dev (v1 z 2026-05-18, pre-W0)
- `prototypes/` - landing pages, content tests, MVP
- `analyses/` - waitlist analytics, IG metrics, user feedback

## Specs (pre-W0, do walidacji w weekend 23-24 maj)

- `specs/2026-05-18-spec-v1.md` - pełna specyfikacja produktu (personas, funkcje, data model, roadmapa, testy) - **v1.1**: chat w core, timeline 7-dniowy
- `specs/prompts-v1.md` - prompty AI (natal, daily, synastry, fallback bez godziny, **chat**) - **v1.1**
- `specs/vibe-coding-cheatsheet.md` - dev docs dla Cursor/Claude Code (tech stack, folder structure)
- `specs/vibe-plan-7-days.md` - **GŁÓWNY DOKUMENT OPERACYJNY**: 7 dni krok po kroku, deliverables, testy per dzień
- `specs/CLAUDE-md-skeleton.md` - do skopiowania jako CLAUDE.md w repo Cosmogram (instrukcja dla Claude Code w VS)
- `specs/2026-05-W0-questions-for-astrologer.md` - lista 15 pytań na rozmowę W0

## Linki

- [[Home]]
- [[Portfolio Strategy 2026-05-18]] - kontekst decyzji
- [[Architect's Portfolio Filter]] - framework użyty do scoringu
- [[Alcheme.io]] - archived-as-reservoir, źródło komponentów
- [[Sigil Wear]] - NEXT w portfolio, natywny extension brandu
- [[Freemium with Soft AI Barrier]] - pattern stosowany
- [[about|profil]] - input do Energy Fit i Leverage
