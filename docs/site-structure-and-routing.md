---
title: Struktura strony i routing — public + app
created: 2026-05-23
updated: 2026-05-23
project: cosmogram
type: spec + claude-code-prompt
status: ready
---

# Struktura strony i routing

## TL;DR decyzji

1. **URLs po angielsku** (kebab-case) — future-proof pod i18n (`/en/*`, `/pl/*`, `/de/*` w przyszłości bez zmiany ścieżek).
2. **Wyświetlane nazwy po polsku** — w nawigacji, nagłówkach, breadcrumbach, OG title. Nigdy nie pokazujemy slug-a użytkownikowi.
3. **Brand feature names:** `Cosmo Match` (sprawdzanie par), `Cosmo Chat` (pytania do swoich kosmogramów). Brand zostaje po polsku i angielsku — nie tłumaczymy, jak "Apple Watch" czy "Google Drive".
4. **Separacja:** wszystkie strony zalogowanego usera pod prefixem `/app/*`. Reszta jest publiczna.
5. **Public = SEO + lead magnety.** App = funkcjonalność, noindex.

> SEO trade-off, świadomie: PL slugi (`/horoskop-dzienny`) dałyby marginalny boost na long-tail PL queries, ale i18n-readiness wygrywa. Content, `<title>`, `<h1>` i meta description to dziś znacznie silniejsze sygnały niż slug.

---

## 1. Konwencja nazewnictwa (reguły obowiązujące)

### URLs
| Reguła | Przykład OK | Przykład źle |
|---|---|---|
| Angielski, kebab-case | `/daily-horoscope`, `/app/match` | `/dailyHoroscope`, `/horoskop-dzienny` |
| Jedno słowo gdy się da | `/pricing`, `/blog`, `/about` | `/our-pricing`, `/our-blog` |
| Bez nazw własnych w slugu (poza brand product) | `/app/match` (feature) | `/app/cosmo-match` (brand w slugu) |
| Brand product = wyjątek (Cosmogram to nazwa produktu) | `/app/cosmogram`, `/cosmogram` | – |
| Dynamic params: `[slug]` (czytelny) lub `[id]` (uuid) | `/blog/luna-in-scorpio`, `/app/library/a3f...` | `/blog/post-123`, `/app/library/joanna` (PII) |
| Akcje pod prefixem feature'a | `/app/match/new`, `/app/library/new` | `/add-match`, `/new-profile` |

### Wyświetlane nazwy (PL)
| Reguła | Przykład OK | Przykład źle |
|---|---|---|
| Po polsku, naturalne formy | "Horoskop dzienny", "Cennik", "Twój kosmogram" | "Daily Horoscope", "Pricing" w UI |
| Brand feature names zostają bez tłumaczenia | "Cosmo Match", "Cosmo Chat" | "Cosmo Dopasowanie", "Cosmo Czat" |
| Brand product: "Cosmogram" (capital C) jako nazwa marki, "kosmogram" (małe k) jako common noun w prozie | "Witaj w Cosmogramie" / "Wygeneruj swój kosmogram" | mieszanie pisowni |
| CTA = czasownik + nazwa wyświetlana | "Otwórz Cosmo Chat", "Zobacz swój kosmogram" | "Idź do /app/chat" |

### Brand feature names (proper nouns)
| Brand | Co to | Route | File / komponent |
|---|---|---|---|
| **Cosmo Match** | Sprawdzanie kompatybilności (synastria) między dwiema osobami | `/app/match`, `/match` (public) | `Match.tsx` w kodzie, "Cosmo Match" w UI |
| **Cosmo Chat** | AI chat — pytania do swoich kosmogramów | `/app/chat` | `Chat.tsx` w kodzie, "Cosmo Chat" w UI |
| **Cosmogram** | Brand i jednocześnie nazwa naturalnego kosmogramu (natal chart) | `/cosmogram`, `/app/cosmogram` | `Cosmogram.tsx`, "Kosmogram" / "Twój kosmogram" w UI |

> Jeśli w przyszłości pojawią się kolejne sub-feature'y z brandem `Cosmo ___` (np. `Cosmo Daily`, `Cosmo Kids`) — dodajemy na tej samej zasadzie: brand w UI, generic route. Plików w kodzie NIE prefixujemy `Cosmo` — `Match.tsx` / `Chat.tsx` wystarczy, brand żyje tylko w warstwie prezentacji.

---

## 2. Public — strony niezalogowane (SEO content + lead magnets)

| Route | Wyświetlana nazwa (PL) | Cel | Główny CTA | Indeksowane |
|---|---|---|---|---|
| `/` | "Strona główna" (logo wraca tu) | Landing — value prop + 3 widgety + pricing teaser | "Wygeneruj swój kosmogram (free)" → `/signup` | tak |
| `/cosmogram` | "Kosmogram" | Explainer: czym jest kosmogram, czemu jest dokładniejszy niż "horoskop ze znaku". Mini-formularz "sprawdź swój za darmo" | Form → `/signup` z prefill | tak (P0 SEO: "kosmogram", "astrologia online") |
| `/daily-horoscope` | "Horoskop dzienny" | Generyczny horoskop na dziś per znak (dropdown 12 znaków). Dla niezalogowanych — content marketing. | "Spersonalizuj horoskop" → `/signup` | tak (P0 SEO: "horoskop dzienny [znak]") |
| `/match` | "Cosmo Match" | Explainer Cosmo Match + mini-form "imię + 2 daty" → score-only preview | "Zobacz pełną analizę" → `/signup` | tak (P1 SEO: "kompatybilność znaków zodiaku", "Cosmo Match") |
| `/for-kids` | "Kosmogram dziecka" | Landing dla rodziców. Explainer + jeden przykład | "Stwórz dla swojego dziecka" → `/signup` | tak (P1 SEO: "horoskop dla dziecka") |
| `/pricing` | "Cennik" | Plany free / premium. Wyróżnione 19,90 zł "early access" | "Wypróbuj 7 dni za darmo" → `/signup?plan=premium-trial` | tak |
| `/blog` | "Blog" | Lista artykułów (kafelki + tagi) | "Czytaj" | tak |
| `/blog/[slug]` | tytuł artykułu | Artykuł SEO (1500-3000 słów) | Inline CTA do `/signup` | tak (Article schema.org) |
| `/about` | "O projekcie" | Kto stoi za projektem, czym się różni od konkurencji | – | tak |
| `/contact` | "Kontakt" | Email + formularz | – | tak |
| `/how-ai-works` | "Jak działa AI" | Transparency: modele, granice odpowiedzialności | – | tak (trust signal) |
| `/login` | "Logowanie" (page) / "Zaloguj" (CTA) | Logowanie (Supabase Auth) | – | nie (noindex) |
| `/signup` | "Rejestracja" (page) / "Załóż konto" (CTA) | Rejestracja + onboarding step 1 | – | nie (noindex) |
| `/forgot-password` | "Odzyskiwanie hasła" | Password reset | – | nie |
| `/terms` | "Regulamin" | ToS | – | tak |
| `/privacy` | "Polityka prywatności" | Privacy policy | – | tak |
| `/cookies` | "Polityka cookies" | Cookie policy | – | tak |

**Sitemap dla Google:** wszystkie powyższe z `tak` w kolumnie indeksowane. `noindex` przez `<meta name="robots" content="noindex">`.

---

## 3. Private — `/app/*` (zalogowany user, no-index)

| Route | Wyświetlana nazwa (PL) | Cel | Auth | Subscription gate |
|---|---|---|---|---|
| `/app` | – | Redirect → `/app/today` | tak | – |
| `/app/today` | "Dziś" | Dashboard: horoskop na dziś + skróty + zapisane profile + streak | tak | free OK |
| `/app/cosmogram` | "Twój kosmogram" (nav: "Kosmogram") | Pełny kosmogram usera (chart + interpretacja) | tak | free OK (1× generowanie/mc) |
| `/app/horoscope` | "Horoskop" | Pełny horoskop dzienny + transyt tygodnia | tak | free OK |
| `/app/match` | "Cosmo Match" | Lista zapisanych analiz + button "Nowa analiza" | tak | free OK (read) |
| `/app/match/new` | "Nowa analiza" | Form dodawania pary | tak | free 1×, premium ∞ |
| `/app/match/[id]` | imiona pary | Wynik konkretnej synastrii | tak | – |
| `/app/library` | "Biblioteka" | Lista zapisanych profili (dzieci, partnerzy, znajomi) | tak | free 2 profile, premium 20 |
| `/app/library/new` | "Dodaj profil" | Form dodawania profilu | tak | – |
| `/app/library/[id]` | imię profilu | Profil i jego kosmogram | tak | – |
| `/app/chat` | "Cosmo Chat" | AI chat z kontekstem usera | tak | free 5 wiadomości/dzień, premium 100 |
| `/app/settings` | "Konto" | Redirect → `/app/settings/profile` | tak | – |
| `/app/settings/profile` | "Dane" | Dane osobowe, dane urodzenia, forma gramatyczna | tak | – |
| `/app/settings/subscription` | "Subskrypcja" | Stripe portal (plan, faktury, cancel) | tak | – |
| `/app/settings/notifications` | "Powiadomienia" | Preferencje powiadomień | tak | – |
| `/app/settings/privacy` | "Prywatność" | Sharing defaults, public profile toggle, eksport RODO, usunięcie konta | tak | – |

**Subscription gating** odbywa się w środku komponentu (paywall modal "Premium feature"), nie na poziomie routingu. Wszystkie `/app/*` są dostępne dla każdego zalogowanego — tylko akcje wewnątrz mogą być zablokowane.

---

## 4. Nawigacja (wyświetlane nazwy PL, linki to EN route'y)

### Header public (niezalogowany)
```
[Logo Cosmogram → /]   Kosmogram · Horoskop dzienny · Cosmo Match · Blog · Cennik          [Zaloguj]  [Załóż konto →]
                       /cosmogram   /daily-horoscope   /match       /blog  /pricing         /login    /signup
```
- Brand CTA "Załóż konto" → `/signup`
- Mobile: hamburger z tymi samymi pozycjami, CTA sticky na dole

### Header app (zalogowany, desktop)
```
[Logo → /app/today]   Dziś · Kosmogram · Horoskop · Cosmo Match · Cosmo Chat · Biblioteka      [Avatar ▾]
                      /app/today  /app/cosmogram  /app/horoscope  /app/match  /app/chat  /app/library
                                                                                                └─ Konto       → /app/settings
                                                                                                └─ Subskrypcja → /app/settings/subscription
                                                                                                └─ Wyloguj
```

### Mobile bottom tab bar (zalogowany)
```
[Dziś]       [Kosmogram]     [Cosmo Chat]  [Biblioteka]  [Konto]
/app/today   /app/cosmogram  /app/chat     /app/library  /app/settings
```
- 5 pozycji = twardy limit UX. "Horoskop" i "Cosmo Match" siedzą jako duże kafle na ekranie "Dziś".

### Footer (na każdej publicznej i app stronie)
```
Produkt                 Zasoby              Firma             Legal
- Kosmogram             - Blog              - O projekcie     - Regulamin
  /cosmogram              /blog               /about            /terms
- Horoskop dzienny      - Jak działa AI     - Kontakt         - Polityka prywatności
  /daily-horoscope        /how-ai-works       /contact          /privacy
- Cosmo Match                                                  - Polityka cookies
  /match                                                         /cookies
- Kosmogram dziecka
  /for-kids
- Cennik
  /pricing

[Logo]  © 2026 Cosmogram. Dane astronomiczne: Swiss Ephemeris. AI: Anthropic Claude.
```

---

## 5. Auth gating + redirects

| Sytuacja | Behavior |
|---|---|
| Niezalogowany wchodzi na `/app/*` | Redirect → `/login?redirect=/app/today` (zachowaj original path) |
| Zalogowany wchodzi na `/login` lub `/signup` | Redirect → `/app/today` |
| Zalogowany wchodzi na `/daily-horoscope` | Render publicznej wersji **ale** z bannerem "Zobacz swój spersonalizowany horoskop →" → `/app/horoscope`. Nie redirectuj — public version musi pozostać dostępna dla SEO bota. |
| Niezalogowany wchodzi na `/terms`, `/privacy`, `/cookies` | Render normalnie |
| Sesja wygasła w `/app/*` | Toast "Sesja wygasła" + redirect → `/login?redirect=<current>` |
| Auth required action (POST do edge function) bez sesji | 401 → frontend pokazuje modal "Zaloguj się, żeby kontynuować" |

**robots.txt:**
```
User-agent: *
Disallow: /app/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password

Sitemap: https://cosmogram.pl/sitemap.xml
```

---

## 6. SEO meta (per public page)

Każda public strona musi mieć:
- Unikalny `<title>` (≤60 znaków, brand na końcu): `Horoskop dzienny dla Barana — Cosmogram`
- `<meta name="description">` (≤155 znaków, z value prop + CTA)
- `<link rel="canonical">` na full URL
- OG image 1200×630 (specyficzny dla strony, generowany per template lub statyczny)
- Twitter card `summary_large_image`
- JSON-LD structured data:
  - `/blog/[slug]` → `Article`
  - `/pricing` → `Product` + `Offer`
  - `/` → `Organization` + `WebSite` z `SearchAction`
  - `/about` → `AboutPage`

**Tytuły stron (template):**
| Route | `<title>` |
|---|---|
| `/` | `Cosmogram — twój kosmiczny przewodnik` |
| `/cosmogram` | `Kosmogram — czym jest i jak go interpretować — Cosmogram` |
| `/daily-horoscope` | `Horoskop dzienny — Cosmogram` |
| `/match` | `Cosmo Match — kompatybilność dwóch osób — Cosmogram` |
| `/for-kids` | `Kosmogram dziecka — Cosmogram` |
| `/pricing` | `Cennik — Cosmogram` |
| `/about` | `O projekcie — Cosmogram` |
| `/how-ai-works` | `Jak działa AI w Cosmogramie` |

---

## 7. Migracja ze stanu aktualnego

Założenie: obecny routing używa angielskich nazw, częściowo bez prefixu `/app/`. Migracja głównie dodaje prefix + niektóre zmieniają nazwy. Wszystko za 301 redirectami żeby zachować bookmarki i ewentualne backlinki.

| Stary route | Nowy route | Redirect |
|---|---|---|
| `/natal` | `/app/cosmogram` | 301 |
| `/match` (zalogowany flow) | `/app/match` | 301 |
| `/chat` | `/app/chat` | 301 |
| `/profile` | `/app/settings/profile` | 301 |
| `/dashboard` (jeśli istnieje) | `/app/today` | 301 |
| `/settings` (jeśli flat) | `/app/settings` | 301 |
| `/pricing` | `/pricing` | bez zmian |
| `/login` | `/login` | bez zmian |
| `/signup` | `/signup` | bez zmian |

> Uwaga: `/match` istnieje w obu wariantach (public explainer i app feature). Jeśli obecnie `/match` jest stroną app — przekieruj na `/app/match`, a nowe public `/match` to świeża strona explainer. Redirect 301 zadziała tylko dla starych wejść; nowy public `/match` od momentu deploy serwuje content explainera.

Redirecty robimy w Vercel `vercel.json` (`redirects: [...]`), nie w runtime kodzie.

---

## Priorytety wdrożenia

- **P0:** Konwencja URL + redirecty 301 ze starego stanu + struktura `/app/*` + auth gating + robots.txt + footer. Bez tego SEO zaczyna od zera, a użytkownicy gubią bookmarki.
- **P0 (lead magnety):** `/cosmogram`, `/daily-horoscope`, `/pricing`. To są strony na które ludzie wejdą z Google i przekonwertują.
- **P1:** `/match`, `/for-kids`, `/about`, `/contact`, `/how-ai-works`, `/blog` index (puste na start).
- **P1:** OG images per template (dynamiczne renderowanie przez `@vercel/og` lub statyczne 1 na route).
- **P2:** Pierwsze artykuły blogowe (3-5 evergreen).
- **P3:** Per-page JSON-LD structured data poza homepage.

---

# Claude Code prompt — struktura strony + routing

> Wklej całość poniżej do Claude Code w korzeniu repo. Anti-overengineering: trzymaj się scope'u, redirecty i konwencji, bez przeprojektowywania komponentów.

---

Przeczytaj `docs/site-structure-and-routing.md` — to spec. Twoim zadaniem jest zaimplementować nowy routing zgodnie z tym dokumentem.

## Krok 1 — Audyt stanu obecnego

Przed jakąkolwiek zmianą:
1. Wyświetl listę wszystkich obecnych route'ów w `apps/web/src/` (React Router config albo file-based — sprawdź co jest).
2. Zmapuj każdy obecny route na nowy zgodnie z tabelą migracji w sekcji 7 specu.
3. Wypisz route'y które istnieją w kodzie ale NIE są w specu — zapytaj mnie czy to legacy do usunięcia, czy zapomniałem ich uwzględnić.
4. Wypisz route'y które są w specu ale NIE istnieją w kodzie — to są do utworzenia jako P0/P1 placeholdery.

**STOP po kroku 1.** Pokaż mi mapping i listę różnic. Nie ruszaj kodu dopóki nie potwierdzę.

## Krok 2 — Refactor routingu (po moim ack)

1. Zaktualizuj routes config (React Router lub file-based) zgodnie z nowymi ścieżkami z sekcji 2 i 3 specu. **URLs po angielsku.**
2. Utwórz placeholdery dla route'ów których jeszcze nie ma:
   - Public placeholder = strona z `<h1>` (wyświetlana nazwa PL z tabel) i jednym akapitem "Wkrótce", z poprawnym `<title>`, `<meta description>`, `<link canonical>`. Bez Lorem Ipsum.
   - App placeholder = pusta strona `<h1>` (PL nazwa) + breadcrumb + przycisk "Wróć".
3. Dodaj `/app` redirect → `/app/today`.
4. Dodaj `/app/settings` redirect → `/app/settings/profile`.

## Krok 3 — Centralna mapa route → label PL

Utwórz `apps/web/src/lib/routes.ts` jako single source of truth dla par (route, wyświetlana nazwa PL). Komponenty nawigacji importują z tego pliku — nigdzie indziej nie hardkoduj nazw stron.

```typescript
// apps/web/src/lib/routes.ts
export const ROUTES = {
  public: {
    home:           { path: '/',                 label: 'Strona główna' },
    cosmogram:      { path: '/cosmogram',        label: 'Kosmogram' },
    dailyHoroscope: { path: '/daily-horoscope',  label: 'Horoskop dzienny' },
    match:          { path: '/match',            label: 'Cosmo Match' },
    forKids:        { path: '/for-kids',         label: 'Kosmogram dziecka' },
    pricing:        { path: '/pricing',          label: 'Cennik' },
    blog:           { path: '/blog',             label: 'Blog' },
    about:          { path: '/about',            label: 'O projekcie' },
    contact:        { path: '/contact',          label: 'Kontakt' },
    howAiWorks:     { path: '/how-ai-works',     label: 'Jak działa AI' },
    login:          { path: '/login',            label: 'Logowanie', cta: 'Zaloguj' },
    signup:         { path: '/signup',           label: 'Rejestracja', cta: 'Załóż konto' },
    forgotPassword: { path: '/forgot-password',  label: 'Odzyskiwanie hasła' },
    terms:          { path: '/terms',            label: 'Regulamin' },
    privacy:        { path: '/privacy',          label: 'Polityka prywatności' },
    cookies:        { path: '/cookies',          label: 'Polityka cookies' },
  },
  app: {
    today:                { path: '/app/today',                 label: 'Dziś' },
    cosmogram:            { path: '/app/cosmogram',             label: 'Twój kosmogram', navLabel: 'Kosmogram' },
    horoscope:            { path: '/app/horoscope',             label: 'Horoskop' },
    match:                { path: '/app/match',                 label: 'Cosmo Match' },
    matchNew:             { path: '/app/match/new',             label: 'Nowa analiza' },
    library:              { path: '/app/library',               label: 'Biblioteka' },
    libraryNew:           { path: '/app/library/new',           label: 'Dodaj profil' },
    chat:                 { path: '/app/chat',                  label: 'Cosmo Chat' },
    settings:             { path: '/app/settings',              label: 'Konto' },
    settingsProfile:      { path: '/app/settings/profile',      label: 'Dane' },
    settingsSubscription: { path: '/app/settings/subscription', label: 'Subskrypcja' },
    settingsNotifications:{ path: '/app/settings/notifications',label: 'Powiadomienia' },
    settingsPrivacy:      { path: '/app/settings/privacy',      label: 'Prywatność' },
  },
} as const;

export const BRAND = {
  product: 'Cosmogram',
  match: 'Cosmo Match',
  chat: 'Cosmo Chat',
} as const;
```

Dynamic routes (`/blog/[slug]`, `/app/match/[id]`, `/app/library/[id]`) konstruujemy funkcjami helper:
```typescript
export const buildPath = {
  blogPost: (slug: string) => `/blog/${slug}`,
  match: (id: string) => `/app/match/${id}`,
  libraryItem: (id: string) => `/app/library/${id}`,
};
```

## Krok 4 — Auth gating

1. Wszystkie route'y `/app/*` muszą być za HOC/middleware sprawdzającym sesję Supabase.
2. Niezalogowany na `/app/*` → redirect `/login?redirect=<original-path>`. Po loginie wracaj na `redirect`.
3. Zalogowany na `/login` lub `/signup` → redirect `/app/today`.
4. `/daily-horoscope` — NIE redirectuj zalogowanego. Renderuj public wersję + banner "Zobacz swój spersonalizowany horoskop →" linkujący do `/app/horoscope`.

## Krok 5 — Redirecty 301 (Vercel)

Utwórz/zaktualizuj `vercel.json` w korzeniu:

```json
{
  "redirects": [
    { "source": "/natal", "destination": "/app/cosmogram", "permanent": true },
    { "source": "/chat", "destination": "/app/chat", "permanent": true },
    { "source": "/profile", "destination": "/app/settings/profile", "permanent": true },
    { "source": "/dashboard", "destination": "/app/today", "permanent": true },
    { "source": "/settings", "destination": "/app/settings", "permanent": true }
  ]
}
```

Uwaga do `/match`: jeśli obecnie `/match` jest stroną app — dodaj redirect `{ "source": "/match/:path*", "has": [{ "type": "cookie", "key": "sb-access-token" }], "destination": "/app/match/:path*", "permanent": true }`. Inaczej `/match` jest po prostu nowym public explainerem od deploy.

Jeśli w kroku 1 znalazłeś inne legacy route'y do zmapowania — dorzuć je tutaj.

## Krok 6 — robots.txt + sitemap

1. `apps/web/public/robots.txt`:
```
User-agent: *
Disallow: /app/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password

Sitemap: https://cosmogram.pl/sitemap.xml
```

2. Sitemap: stwórz `scripts/generate-sitemap.ts` który wypisuje wszystkie public route'y do `apps/web/public/sitemap.xml` przy buildzie. Lista route'ów = wszystkie z sekcji 2 specu które mają `indeksowane: tak`. Statyczne route'y bierz z `ROUTES.public`, `/blog/[slug]` na razie zostaw pusty (dodamy gdy będą artykuły).

## Krok 7 — Nawigacja

Zaktualizuj/utwórz komponenty (wszystkie czytają z `ROUTES` z kroku 3):
- `apps/web/src/components/layout/PublicHeader.tsx` — pozycje wg sekcji 4 specu (header public). Logo → `ROUTES.public.home.path`.
- `apps/web/src/components/layout/AppHeader.tsx` — pozycje wg sekcji 4 (header app). Logo → `ROUTES.app.today.path`.
- `apps/web/src/components/layout/MobileBottomNav.tsx` — 5 pozycji wg sekcji 4 (mobile bottom).
- `apps/web/src/components/layout/Footer.tsx` — 4 kolumny wg sekcji 4 (footer). Wyświetlany na każdej public ORAZ na każdej app stronie.

Jeśli te komponenty nie istnieją — utwórz je. Jeśli istnieją pod innymi nazwami — refactor.

**Krytyczne:** żaden komponent nie powinien hardkodować ścieżki ani polskiej nazwy. Wszystko przez `ROUTES.public.X.path` i `ROUTES.public.X.label`. To gwarantuje że jak dodamy i18n w przyszłości, zmieniamy jedno miejsce.

## Krok 8 — Meta tagi (template helper)

Stwórz hook `useSeoMeta({ title, description, canonical, ogImage })` który ustawia `<title>`, `<meta description>`, `<link rel=canonical>`, OG i Twitter card przez `react-helmet-async` (zainstaluj jeśli nie ma).

Każda public strona musi go używać. Dla `/app/*` ustawiaj `<meta name="robots" content="noindex">`.

Title template z sekcji 6 specu — wszystkie kończą się `— Cosmogram` (poza homepage gdzie tagline `Cosmogram — twój kosmiczny przewodnik`).

## Krok 9 — Test akceptacyjny

Uruchom dev server i sprawdź:
1. Stare URL-e (`/natal`, `/chat`, `/profile`, `/dashboard`) prawidłowo redirectują na nowe (w prod build — w dev Vercel redirecty nie działają, więc sprawdź na deploy preview).
2. Niezalogowany wchodzi na `/app/cosmogram` → leci na `/login?redirect=/app/cosmogram`. Po loginie → `/app/cosmogram`.
3. Zalogowany wchodzi na `/login` → leci na `/app/today`.
4. `/daily-horoscope` dla zalogowanego pokazuje banner "Zobacz spersonalizowany →".
5. View source publicznej strony zawiera prawidłowy `<title>` (zgodny z tabelą w sekcji 6), `<meta description>`, `<link canonical>`, OG.
6. `/app/*` ma `<meta name="robots" content="noindex">`.
7. `/robots.txt` zwraca poprawną treść.
8. `/sitemap.xml` zwraca XML ze wszystkimi public route'ami z `ROUTES.public` (poza login/signup/forgot-password).
9. Footer renderuje się na każdej stronie z poprawnymi linkami (klik każdy, żaden nie 404).
10. Mobile bottom nav widoczny tylko na `/app/*` i tylko na viewportach <768px.
11. **Sprawdź spójność brand:** w nav i CTA pojawiają się `Cosmo Match` i `Cosmo Chat` (nie "Kompatybilność"/"Czat"). Grep w kodzie nie powinien znaleźć żadnych "Kompatybilność" ani "Czat" jako labels poza fallback opisami.
12. Grep w kodzie: żaden komponent nie powinien zawierać literałów typu `"/app/match"`, `"/login"`, `"Cosmo Match"` poza `routes.ts`. Wszystko przez `ROUTES.*` i `BRAND.*`.

Jeśli któreś z 12 nie przechodzi — nie commituj, wróć z błędem.

## Krok 10 — PROGRESS.md

Dopisz do `docs/PROGRESS.md` co zaimplementowane + co odłożone na P1/P2 + jakie pytania do mnie (np. "nie znalazłem komponentu X, utworzyłem nowy zgodnie z konwencją Y — ok?").

---

## Co NIE robimy w tym promcie

- Bez przerabiania designu komponentów — tylko routing, nawigacja, meta.
- Bez tworzenia contentu blogowego — pusty `/blog` z napisem "Wkrótce" wystarczy.
- Bez OG image generatora — placeholder PNG w `public/og-default.png` wystarczy.
- Bez JSON-LD structured data poza homepage (`Organization` + `WebSite`) — reszta to P2.
- Bez tłumaczeń i18n — produkt PL-only na start, ale architektura (EN routes + centralna mapa label-ów) już future-ready.
- Bez zmian w logice biznesowej (paywall, subscription gate, etc.) — to żyje wewnątrz komponentów i jest poza scopem.
- Bez prefixu `Cosmo` w nazwach plików — `Match.tsx`, `Chat.tsx` w kodzie, brand tylko w UI.

Jeśli kusi rozszerzenie scope'u → odpowiedz "to backlog P1/P2" i wracaj.
