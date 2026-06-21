---
title: Ustawienia (/settings) — redesign DS + braki UX (przekazanie do Claude Code)
type: implementation-prompt
owner: Mac
created: 2026-06-13
companion: docs/design-system.md
visual-source-of-truth: docs/landing-v2/settings-mockup.html
target-file: src/app/settings/page.tsx
---

# Cel

Redesign strony **Ustawienia** (`src/app/settings/page.tsx`) pod nasz Design System + domknięcie braków UX. Dziś strona jest off-brand: tło `#03010d` (nie tokeny), zielony status „Aktywna" i zielony komunikat sukcesu hasła (łamie DS — jeden akcent: bursztyn), brak afordancji (wyloguj, kopiuj ID, walidacja hasła na żywo).

**Logika zostaje bez zmian:** fetch `subscription-status`, portal Stripe (`create-portal-session`), sync (`sync-subscription`), `supabase.auth.updateUser`, gating karty hasła przez `isEmailProvider`, `PaywallModal`. Wymieniamy **warstwę wizualną + dokładamy 4 afordancje UX**.

Wizualny source of truth: **`docs/landing-v2/settings-mockup.html`** (stan „Aktywna"; w pliku `SUBS{}` są też warianty trial/free/past_due do podejrzenia renderu każdego stanu w DS).

Zakres uzgodniony z Makiem: **redesign 3 sekcji + braki UX**. Bez nowych funkcji produktowych (push, usuwanie konta — nie teraz).

---

# 1. Warstwa wizualna (DS)

- **Tło:** `var(--bg-base)` + radialny gradient jak na innych ekranach (`radial-gradient(120% 90% at 50% 0%, #1A1530 0%, #0B0912 70%)`), nie `bg-[#03010d]`. `star-bg` może zostać.
- **Karty:** zamiast `glass-card border-white/8` → DS: `background var(--bg-elevated)`, `border 1px solid var(--line)`, `rounded-[18px]`, padding 24px.
- **Nagłówek strony:** „Ustawienia" w **Fraunces** (`var(--font-fraunces)`), podtytuł `var(--text-muted)`: „Subskrypcja, konto i bezpieczeństwo".
- **Nagłówki sekcji:** ikona lucide w bursztynowym chipie (34×34, `rounded-[10px]`, `bg rgba(224,181,102,.10)`, `border rgba(224,181,102,.22)`, ikona `--accent-deep`) + tytuł General Sans 600.
- **Kolejność sekcji:** Subskrypcja → Konto → Bezpieczeństwo (wartość/status najwyżej). Dziś jest Konto → Hasło → Subskrypcja — przestaw.
- **Paleta:** wyłącznie tokeny DS; jedyny dozwolony „spoza" to `--tense` `#E2654A` (błędy/ostrzeżenia). **Zero zieleni i czerwieni** (`green-*`, `emerald-*`, `red-*`, `#6ee7b7`).

## Stany subskrypcji — mapa kolorów w DS (zamiast `STATUS_COLORS`)

Usuń zielono-czerwony `STATUS_COLORS`. Pigułka statusu wg stanu, tylko złoto / terakota / muted:

| stan | klasa | tło | ramka | tekst | dodatek |
|------|-------|-----|-------|-------|---------|
| `active` | ok | `rgba(255,174,61,.12)` | `rgba(224,181,102,.42)` | `#FFD9A0` | ikona check |
| `trialing` | trial | transparent | `rgba(224,181,102,.40)` | `--accent-deep` | „Trial · 7 dni" |
| `past_due` | warn | `rgba(226,101,74,.12)` | `rgba(226,101,74,.45)` | `#E89B86` | nota terakota |
| `canceled` / `free` | muted | `rgba(182,175,198,.06)` | `--line` | `--text-muted` | — |

Data odnowienia (`currentPeriodEnd`) jako linia `--text-muted` (dla `past_due` — `#E89B86`).

---

# 2. Sekcja Subskrypcja

- **Plan aktywny (`hasSubscription`):** pigułka statusu + nazwa planu „Cosmogram Plus" (z ikoną `Sparkles` w `--accent-deep`) + data odnowienia, a pod spodem **lista benefitów** zamiast jednego zdania: grid 2-kol., każdy z bursztynowym checkiem (`--accent`), tło `rgba(224,181,102,.05)`, border `rgba(224,181,102,.16)`. Treść benefitów weź z **kanonicznego źródła planu Plus** (to samo co `PaywallModal`/cennik — nie wymyślaj rozbieżnego copy). Następnie przycisk „Zarządzaj subskrypcją" (→ `handlePortal`, Stripe) + microcopy „Zmień kartę, anuluj lub pobierz faktury — przez Stripe Customer Portal."
- **Plan darmowy:** zdanie wartości + przycisk **primary** „Przejdź na Cosmogram Plus" (`var(--grad-ember)`, ciemny tekst) → `setShowPaywall(true)`; pod spodem subtelny ghost „Mam już subskrypcję — synchronizuj" (→ `handleSync`) + `syncMsg` jako `--text-muted`.
- Ikona refresh (sync) może zostać w nagłówku karty jako dyskretny przycisk (jak w mockupie).

---

# 3. Sekcja Konto + braki UX

- Wiersze: Adres e-mail, Metoda logowania, ID konta — jako lista z cienkimi separatorami (`--line-soft`), klucz `--text-muted`, wartość `--text-primary`; ID monospace `--text-secondary`.
- **Kopiuj ID konta:** przycisk obok ID — `navigator.clipboard.writeText(user.id)`, na 1.6 s zamień ikonę/label na check + „Skopiowano".
- **Wyloguj się:** przycisk na dole karty (po separatorze) — `await supabase.auth.signOut()` → redirect `/` (lub strona logowania). Ikona `LogOut`, hover terakota (`--tense`/`#E89B86`). To realna afordancja (dziś jej brak w ustawieniach).

---

# 4. Sekcja Bezpieczeństwo (zmiana hasła) — walidacja na żywo

Zostaje tylko dla `isEmailProvider`. Zamień walidację „dopiero po submit" na **inline**:

- **Pasek siły hasła:** zawsze kolor `--accent` (jeden kolor, jak intensywność w prognozie); szerokość = wynik scoringu. Obok **słowo siły** kolorowane: słabe → `--tense`, średnie → `--accent-deep`, mocne → `--voice`. Scoring prosty: +1 za ≥8 znaków, +1 za małe+wielkie, +1 za cyfrę, +1 za znak specjalny, +1 za ≥12 znaków.
- **Reguły z live-checkami:** „Minimum 8 znaków", „Hasła są zgodne" — każda z ikoną stanu (kropka neutralna przy pustym → check `--accent` / x `--tense`).
- **Przycisk „Zmień hasło"** aktywny dopiero gdy `len≥8 && match`. Submit → `supabase.auth.updateUser({password})`. Sukces → komunikat w DS „ok" (bursztyn, check `--accent`), czyść pola. Błąd Supabase → komunikat terakota (`--tense`).

---

# DS / zasady

- Tokeny globalne (`landing-tokens.css`) + General Sans/Fraunces w `layout.tsx` — już są.
- Ikony lucide (już w użyciu); bez emoji.
- Brak `localStorage` poza tym, co już jest; clipboard przez `navigator.clipboard` z guardem.
- Mobile-first; `max-w-2xl`/`640px`, single column, benefity → 1 kolumna < 560px.

# Definition of done

- Tło + karty + nagłówki w DS; **zero zieleni/czerwieni** w całej stronie (status, sukces hasła, ikony).
- Stany subskrypcji (active/trialing/past_due/canceled/free) renderują się w palecie DS wg tabeli §1; lista benefitów Plus zamiast jednego zdania.
- Kolejność: Subskrypcja → Konto → Bezpieczeństwo.
- Działa: kopiuj ID (feedback), wyloguj (`signOut` + redirect), live-walidacja hasła (siła + reguły + enable), portal Stripe, sync, paywall — bez regresji.
- Logika `subscription-status`/portal/sync/`updateUser`/`isEmailProvider` nietknięta.
- Mobile 390px OK · `npx tsc --noEmit` 0 błędów · `npm run build` OK.
