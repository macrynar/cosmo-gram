---
title: Cosmogram — Plan Organic Growth (SEO + GEO)
type: growth-plan
owner: Mac
last_updated: 2026-06-26
status: do realizacji (P0 przed launchem)
---

# Cosmogram — Plan Organic Growth: SEO + GEO

Cel: maksymalny napływ userów organicznie (wyszukiwarki + silniki AI) niskim kosztem, spójnie z modelem bootstrap i pętlą share. Dokument jest podzielony na **P0 → P1 → P2** (priorytet, nie czas). Każdy punkt ma konkretny action point, a fixy techniczne mają gotowe do wklejenia snippety pod Wasz stack (Next.js 16 App Router).

**Jak czytać:** najpierw werdykt audytu (co już jest dobre, czego brakuje), potem trzy fazy, na końcu pomiar i decyzje, które należą do Maca.

---

## TL;DR (big picture)

- **Fundament jest mocniejszy niż u 90% startupów na launchu.** 5 stron funkcji ma już canonical, FAQPage, BreadcrumbList, SoftwareApplication i HowTo w JSON-LD, są server-rendered (crawlowalne), `lang="pl"`, OG/Twitter, dyskalimery „symboliczne lustro" (dobre pod E-E-A-T/YMYL). Tego **nie ruszamy**.
- **Są 3 realne bugi, które trzeba ubić przed launchem:** (1) `robots.txt` wskazuje sitemapę na **złą domenę** (`cosmogram.pl`), (2) `manifest.json` ma `start_url`/skróty do nieistniejących tras (`/generate`, `/chat`), (3) brak globalnego schematu **Organization + WebSite** (kluczowy dla rozpoznania marki przez Google i AI).
- **Największa niewykorzystana dźwignia to blog/treść.** `/blog` to dziś pusta strona „wkrótce", a trasa `[slug]` istnieje bez źródła treści. To jest silnik organicznego wzrostu — bez niego SEO stoi na 14 stronach.
- **GEO ≠ osobny projekt.** W 2026 SEO i GEO się zlały: silne podstawy SEO zasilają cytowania w ChatGPT/Perplexity/AI Overviews. Robimy jedno, mierzymy dwa.

---

## Werdykt audytu (stan na 2026-06-26)

### ✅ Co już działa (nie przerabiać)

| Obszar | Stan |
|---|---|
| Per-page metadata + canonical | OK na stronach funkcji (`/cosmogram`, `/match`, `/calendar`, `/cosmo-chat`, `/pricing`) |
| JSON-LD | Bogaty: FAQPage (5), BreadcrumbList (5), SoftwareApplication (4), HowTo (3), WebPage (5), Product/Offer/Brand |
| Rendering | Strony marketingowe to server components → w pełni crawlowalne |
| Język i ton | `lang="pl"`, copy PL, dyskalimery „nie wyrocznia / nie porada medyczna" (plus dla E-E-A-T) |
| Assety | `og-default.png`, favicony, `apple-touch-icon.png`, ikony PWA — wszystkie obecne |
| Bezpieczeństwo | Nagłówki bezpieczeństwa + CSP (report-only) — neutralne dla SEO, dobre dla zaufania |

### 🔴 Co wymaga naprawy (zaadresowane w P0–P2)

| # | Problem | Waga | Faza |
|---|---|---|---|
| 1 | `public/robots.txt` → `Sitemap: https://cosmogram.pl/sitemap.xml` (zła domena) | Krytyczny | P0 |
| 2 | `manifest.json` `start_url: "/generate"` + skróty do `/generate`, `/chat` (trasy nie istnieją) | Wysoki | P0 |
| 3 | Brak schematu **Organization + WebSite** w całej witrynie | Wysoki | P0 |
| 4 | Boty AI (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) nie wpuszczone jawnie; brak w Bing WMT | Wysoki | P0 |
| 5 | Sitemap pomija `/calendar` i `/cosmo-chat` (mają pełne SEO, ale są niewykrywalne) | Średni | P0 |
| 6 | Trasy-duplikaty: `/horoskop-dzienny` vs `/daily-horoscope`, `/children` vs `/for-kids` (client, bez metadata, bez 301) | Średni | P0 |
| 7 | `/blog` pusty; brak warstwy treści, brak Article/Author schema | Krytyczny dla wzrostu | P1 |
| 8 | Slugi publiczne po angielsku na rynku PL (`/daily-horoscope`, `/for-kids`...) | Strategiczny | decyzja Maca |
| 9 | `viewport: userScalable:false, maximumScale:1` (a11y, flaga w Lighthouse) | Niski | P0 |

---

# P0 — Fundament techniczny (przed launchem)

To są rzeczy „bez których nie ma sensu lać ruchu". Każdy fix to mała zmiana w jednym pliku.

## P0.1 — Napraw `robots.txt` i wpuść boty AI

**Problem:** statyczny `public/robots.txt` kieruje crawlery do sitemapy na `cosmogram.pl` (cudza/parkowana domena). Google i Bing nie znajdą Waszej sitemapy.

**Action point:** usuń `public/robots.txt` i zastąp dynamicznym `src/app/robots.ts` (Next.js serwuje go pod `/robots.txt`; statyczny plik w `public/` koliduje — trzeba go skasować).

```ts
// src/app/robots.ts
import { MetadataRoute } from "next";

const BASE_URL = "https://www.cosmo-gram.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/", "/api/"],
      },
      // Jawnie wpuszczamy boty AI (search + grounding silników cytujących)
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User",   // OpenAI / ChatGPT
          "PerplexityBot", "Perplexity-User",            // Perplexity
          "ClaudeBot", "Claude-Web",                     // Anthropic
          "Google-Extended",                             // Gemini / AI Overviews grounding
        ],
        allow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```

**Dlaczego AI-boty osobno:** ChatGPT Search korzysta z indeksu Bing, a `Google-Extended` steruje użyciem treści w Gemini/AI Overviews. Blokada (nawet domyślna/niejasna) = wypadasz z cytowań AI. ([źródło GEO 2026](https://www.gen-optima.com/geo/generative-engine-optimization-best-practices-2026/))

## P0.2 — Dodaj globalny schema: Organization + WebSite

**Problem:** macie świetny `SoftwareApplication` na stronach funkcji, ale **żadnego** węzła `Organization`/`WebSite`. To węzeł, po którym Google buduje encję marki (Knowledge Panel, sitelinki) i po którym AI rozpoznaje „kto to jest Cosmogram".

**Action point:** dodaj komponent server-side i wstrzyknij w `layout.tsx`.

```tsx
// src/components/seo/OrganizationJsonLd.tsx  (server component — bez "use client")
const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cosmogram",
  url: "https://www.cosmo-gram.com",
  logo: "https://www.cosmo-gram.com/icons/icon-512.png",
  description:
    "Cosmogram — astrologia osobista oparta na danych astronomicznych i AI. Kosmogram natalny, synastria, kalendarz tranzytów i chat z Astreą, po polsku.",
  sameAs: [
    "https://www.instagram.com/__UZUPELNIJ__",
    "https://www.tiktok.com/@__UZUPELNIJ__",
    "https://www.facebook.com/__UZUPELNIJ__",
  ],
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cosmogram",
  url: "https://www.cosmo-gram.com",
  inLanguage: "pl-PL",
  publisher: { "@type": "Organization", name: "Cosmogram" },
};

export default function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([ORG, WEBSITE]) }}
    />
  );
}
```

```tsx
// src/app/layout.tsx — w <body>, obok reszty providerów
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
// ...
<body className={...}>
  <OrganizationJsonLd />
  {/* reszta */}
```

> **Uzupełnij `sameAs` realnymi profilami** (IG/TikTok/FB/YT). To jeden z mocniejszych sygnałów spójności encji dla AI. `SearchAction`/sitelinks-searchbox świadomie pomijam — nie macie publicznej wyszukiwarki; dodamy, jeśli powstanie.

## P0.3 — Napraw `manifest.json`

**Problem:** `start_url: "/generate"` i skróty do `/generate`, `/chat` — te trasy nie istnieją (realne: `/app/cosmogram`, `/app/chat`). Zainstalowane PWA otwiera się na 404/redirect.

**Action point:** popraw wartości funkcjonalne.

```jsonc
{
  "name": "Cosmogram",                 // było "Cosmo-gram" — patrz Decyzje (copy)
  "short_name": "Cosmogram",
  "start_url": "/app/cosmogram",       // realna trasa „dziś"; guard przekieruje do logowania jeśli trzeba
  "shortcuts": [
    { "name": "Kosmogram", "url": "/app/cosmogram", "description": "Twój kosmogram" },
    { "name": "Chat",      "url": "/app/chat",      "description": "Porozmawiaj z Astreą" }
  ]
}
```

## P0.4 — Uzupełnij sitemap + zrób ją dynamiczną pod blog

**Problem:** `/calendar` i `/cosmo-chat` mają komplet SEO (canonical, FAQPage), ale nie ma ich w sitemapie → trudniej je zindeksować. Blog posty (gdy powstaną) też muszą tam trafiać automatycznie.

**Action point:** rozbuduj `src/app/sitemap.ts`.

```ts
// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
// import { getPublishedPosts } from "@/lib/blog"; // odkomentuj, gdy powstanie warstwa bloga (P1)

const BASE_URL = "https://www.cosmo-gram.com";

const INDEXED_PUBLIC_ROUTES = [
  ROUTES.public.home,
  ROUTES.public.cosmogram,
  ROUTES.public.calendar,        // DODANE
  ROUTES.public.match,
  ROUTES.public.chatPublic,      // DODANE
  ROUTES.public.dailyHoroscope,
  ROUTES.public.forKids,
  ROUTES.public.pricing,
  ROUTES.public.blog,
  ROUTES.public.about,
  ROUTES.public.contact,
  ROUTES.public.howAiWorks,
  ROUTES.public.terms,
  ROUTES.public.privacy,
  ROUTES.public.cookies,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = INDEXED_PUBLIC_ROUTES.map(route => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.path === "/" ? "daily" as const : "weekly" as const,
    priority: route.path === "/" ? 1 : 0.7,
  }));

  // P1: gdy blog ruszy
  // const posts = await getPublishedPosts().catch(() => []);
  // const blogEntries = posts.map(p => ({
  //   url: `${BASE_URL}/blog/${p.slug}`,
  //   lastModified: p.updatedAt,
  //   changeFrequency: "monthly" as const,
  //   priority: 0.6,
  // }));

  return [...staticEntries /*, ...blogEntries */];
}
```

## P0.5 — Rozwiąż trasy-duplikaty

**Problem:** `/horoskop-dzienny` i `/children` to client-pages bez metadata, bez 301, niewidoczne w sitemapie, ale crawlowalne. Konkurują z kanonicznymi `/daily-horoscope` i `/for-kids` (ryzyko duplikatów / index bloat). To wygląda na niedokończoną migrację na polskie slugi.

**Action point (wybierz jedną drogę — patrz też Decyzje P0.8):**

- **A. Jeśli zostają angielskie slugi:** dodaj 301 z PL-slugów do kanonicznych w `next.config.ts`:
  ```ts
  async redirects() {
    return [
      { source: "/horoskop-dzienny", destination: "/daily-horoscope", permanent: true },
      { source: "/children", destination: "/for-kids", permanent: true },
    ];
  }
  ```
- **B. Jeśli te trasy to świadomie funkcjonalne narzędzia (nie marketing):** dodaj `robots: { index: false }` w ich metadata albo wpisz do `disallow` w `robots.ts`, żeby nie konkurowały.

## P0.6 — Indeksacja: Search Console + Bing Webmaster Tools

**Action points:**

1. **Google Search Console** — zweryfikuj `www.cosmo-gram.com`, wgraj sitemapę (`/sitemap.xml`), sprawdź „Pages → Indexing" po launchu.
2. **Bing Webmaster Tools** — to nie jest opcja. **ChatGPT Search indeksuje przez Bing.** Brak w Bing = brak w jednym z największych silników AI. Wgraj tę samą sitemapę.
3. Po launchu: „Request indexing" dla 14 stron publicznych + sprawdź `site:cosmo-gram.com`.

## P0.7 — Drobny fix a11y w viewport

`userScalable:false` + `maximumScale:1` blokują pinch-zoom (flaga w Lighthouse Accessibility, słaby sygnał jakości). Usuń oba — `viewportFit:"cover"` i `initialScale:1` zostają, mobile-PWA nie ucierpi.

---

# P1 — Silnik treści (topic clusters + blog)

Tu robi się wzrost. Bez treści SEO Cosmogramu kończy się na 14 stronach transakcyjnych. Strategia: **autorytet tematyczny** (Gubur) na architekturze **pillar–cluster** (HubSpot), spięty wewnętrznym linkowaniem, z każdą stroną-klastrem CTA do darmowego generatora.

## P1.1 — Mapa tematyczna (root → pillary → klastry)

**Root entity:** *kosmogram / astrologia osobista (po polsku)*.
**Pozycjonowanie (Schwartz):** Integrator — sprzedajecie własne narzędzie, więc każdy artykuł kończy się funkcjonalnym CTA („oblicz swój kosmogram"), nie linkiem do cudzego kalkulatora.

| Pillar (hub) | Strona | Klastry (spokes, przykłady) | Intencja |
|---|---|---|---|
| **Kosmogram natalny** | `/cosmogram` (jest) | czym jest kosmogram • jak czytać kosmogram • kosmogram bez godziny urodzenia • ascendent (co to) • domy astrologiczne • planety w znakach • aspekty • Słońce vs Księżyc vs ASC | Informacyjna → narzędzie |
| **Synastria / dopasowanie** | `/match` (jest) | synastria — jak czytać • kompatybilność znaków • Wenus i Mars w synastrii • aspekty synastryczne • „horoskop partnerski" | Informacyjna/komercyjna |
| **Tranzyty / kalendarz** | `/calendar` (jest) | retrogradacja Merkurego • fazy Księżyca • nów i pełnia • powrót Saturna • tranzyty (co to) • Dni Mocy | Informacyjna, świeżościowa |
| **Kosmogram dziecka** | `/for-kids` (jest) | po co kosmogram dziecka • znak Księżyca u dziecka • potrzeby emocjonalne wg kosmogramu | Informacyjna, niszowa, niskie KD |

Strony funkcji **stają się pillarami** (już są mocne i mają FAQ). Klastry to artykuły blogowe, każdy linkuje do swojego pillara, a pillar linkuje do klastrów (hub-spoke). Ok. ~1 link wewnętrzny / 150 słów (HubSpot).

**Krajobraz fraz (potwierdzony w SERP-ach PL):** `kosmogram`, `horoskop natalny`, `horoskop urodzeniowy` (synonim — celuj w oba), `synastria`, `horoskop partnerski`, `darmowy kalkulator kosmogramu`, `jak czytać kosmogram`, `ascendent`. Konkurencja: astromagia.pl, ehoroskop.pl, cudnibiru.pl (darmowy kalkulator), elle.pl, drogowskazduszy.pl, studioastro.pl. **Luka:** większość konkurentów to albo cienkie kalkulatory, albo blogi bez narzędzia. Wasz 10x = realne narzędzie AI + głęboka, osobista interpretacja PL pod artykułem.

> ⚠️ Nie mam dostępu do twardych wolumenów (Ahrefs/GSC). Frazy są zwalidowane intencyjnie i przez realne SERP-y, ale **wolumeny potwierdź w GSC/Ahrefs/Trends** zanim ustawisz kolejność produkcji.

## P1.2 — Warstwa techniczna bloga (warunek konieczny)

`/blog` to dziś placeholder, `[slug]` istnieje bez źródła treści. Zanim powstaną artykuły, potrzebny jest mechanizm. Dwie opcje (trade-off):

| Opcja | Plus | Minus | Kiedy |
|---|---|---|---|
| **MDX w repo** (`content/blog/*.mdx`) | zero kosztu, wersjonowane w git, najszybszy time-to-first-post, SSG | publikacja = deploy; mniej wygodne dla nie-dev | **Rekomendacja na start** — pasuje do „CC = development" |
| **Posty w Supabase** | publikacja bez deployu, panel, spójne z resztą | trzeba zbudować CRUD + RLS + cache | gdy treść skaluje się i piszą inni |

Niezależnie od wyboru — **każdy post musi mieć:**
- `generateMetadata` (title, description, canonical, OG) per slug,
- **Article/BlogPosting JSON-LD** z `author` (osoba z bio), `datePublished`, `dateModified`, `publisher` (Organization),
- widoczną datę publikacji/aktualizacji i podpis autora (E-E-A-T),
- breadcrumb (Blog → Kategoria → Post),
- wpis do sitemapy (P0.4).

```tsx
// wzorzec: src/app/blog/[slug]/page.tsx — BlogPosting JSON-LD
const articleLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.excerpt,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: { "@type": "Person", name: post.author.name, description: post.author.bio, url: `${BASE_URL}/about` },
  publisher: { "@type": "Organization", name: "Cosmogram", logo: { "@type": "ImageObject", url: `${BASE_URL}/icons/icon-512.png` } },
  mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  inLanguage: "pl-PL",
};
```

## P1.3 — Pierwsze briefy treści (kolejność produkcji)

Zaczynamy od pillara „Kosmogram natalny" (rdzeń wartości + najniższe KD na long-tailu). Sugerowana kolejność 4 pierwszych artykułów:

1. **„Czym jest kosmogram? Pełny przewodnik (2026)"** — definicja, snippet bait, łączy do `/cosmogram`.
2. **„Jak czytać kosmogram krok po kroku"** — HowTo, konkurencyjne ale wysokie zainteresowanie; HowTo schema.
3. **„Kosmogram bez godziny urodzenia — co da się odczytać?"** — Wasz realny gotcha produktowy = unikalna, wiarygodna treść; bardzo niskie KD.
4. **„Ascendent — co to i jak go poznać"** — wejście do tematu domów/ASC, łączy do generatora.

Pełny brief (gotowy do przekazania copywriterowi) dla #1 jest w Załączniku A.

## P1.4 — Darmowy generator jako asset transakcyjny i linkowalny

Konkurenci rankują na `darmowy kalkulator kosmogramu` / `oblicz kosmogram online`. Wy macie lepsze narzędzie. **Action points:**
- upewnij się, że `/cosmogram` celuje też we frazy transakcyjne („kosmogram online za darmo", „oblicz kosmogram") w H1/H2/FAQ (propozycje copy → akceptacja Maca),
- generator = naturalny *linkable asset* (fora, grupy FB, blogerzy linkują do darmowych narzędzi chętniej niż do artykułów) — patrz P2 off-page.

---

# P2 — GEO, off-page i dystrybucja

## P2.1 — GEO on-page (cytowalność w AI)

W 2026 AI obsługuje ~12–18% zapytań informacyjnych; treść aktualizowana <30 dni dostaje ~3,2× więcej cytowań AI. Co to znaczy konkretnie dla Was ([źródło](https://www.gen-optima.com/geo/generative-engine-optimization-best-practices-2026/)):

- **Bloki bezpośredniej odpowiedzi (40–60 słów)** zaraz po nagłówku-pytaniu. Wasze FAQ już to robi — przenieś ten wzorzec do każdego artykułu (H2 = pytanie usera, pierwsze zdanie = zwięzła odpowiedź, potem rozwinięcie).
- **FAQPage na każdej stronie** (macie na 5 funkcjach; dodawaj do artykułów).
- **Cytowalne fakty/liczby + źródła** — „obliczenia Swiss Ephemeris, te same efemerydy co u zawodowych astrologów", „dane pozycji planet z silnika astronomicznego". To są zdania, które AI lubi cytować.
- **E-E-A-T:** podpisany autor z bio, widoczne daty, dyskalimery (macie). Astrologia jest YMYL-adjacentna — utrzymuj „symboliczne lustro, nie porada medyczna/psychologiczna".
- **Świeżość:** ustal cykl aktualizacji pillarów (np. `dateModified` + realna aktualizacja co kwartał, rok w tytule tylko gdy faktycznie odświeżasz treść).

## P2.2 — Programmatic SEO (pSEO) — staged, z bramkami jakości

Macie silnik kosmogramu + interpretacje AI = potencjalny **data moat** dla pSEO product-led (strona jednocześnie uczy i jest bramą do narzędzia). Ale po Helpful Content Update cienkie pSEO to najszybsza droga do kary całej witryny. Dlatego: **staged i z bramką indeksacji.**

**Kandydaci na wzorce (head + modifier):**

| Wzorzec | Liczba stron | Intencja | Ryzyko |
|---|---|---|---|
| `Księżyc/Wenus/Mars/Ascendent w [znaku]` | 4 × 12 = 48 | informacyjna → narzędzie | średnie (musi mieć unikalną treść) |
| `kompatybilność [znak] i [znak]` | do 144 | komercyjna → Match | wyższe (cannibalizacja, cienkość) |

**Zasady (bezwzględne):**
1. Każda strona = unikalna interpretacja (Wasz silnik + głos Astrei), **nie** podmiana słowa w szablonie.
2. **Staged rollout:** wypuść 12 stron (np. „Księżyc w [znaku]"), monitoruj indeksację w GSC 2–4 tyg. **Nie skaluj, póki indeksacja < 80%.**
3. Każda strona: własne `generateMetadata`, FAQ, 3–5 unikalnych bloków, linki do pillara, CTA do generatora.
4. AI przetwarza dane w czytelną treść — **nie** generuje „lania" do pustych slotów. Sampling jakości 10–20% przed skalowaniem.
5. Trzymaj proporcję: strony pSEO nie mogą zdominować indeksu nad treścią redakcyjną.

> Werdykt: **pSEO ma sens jako faza 2 P2**, po tym jak ruszy blog i fundament. Najpierw 12 stron pilota, decyzja go/no-go na danych z GSC. To jest decyzja Maca (patrz niżej).

## P2.3 — Off-page i dystrybucja (spójne z Waszą strategią marketingową)

AI i Google ważą **wielo-źródłowe potwierdzenie** marki. Pod to gra Wasza pętla: faceless content + UGC/influencerzy + share-loop (już w strategii).

- **Share-loop jako SEO:** publiczne `/share/reading/[id]` i `/share/match/[id]` — upewnij się, że mają dobry OG (macie OG dla match) i że to akwizycyjny punkt wejścia. To Wasz organiczny silnik #1.
- **Linkable assets:** darmowy generator + 1–2 „power pages" (np. interaktywny „kalendarz retrogradacji 2026") to magnesy na linki z grup FB/forów.
- **PR/cytowania:** komentarze eksperckie do mediów lifestyle (elle.pl, portale kobiece) — wzmiankowanie marki buduje encję i cytowania AI nawet bez linka.
- **Społeczności:** TikTok „jak czytać kosmogram" już żyje — repurpose treści pillarowych na short-form, w bio link do generatora.

## P2.4 — `llms.txt` — opcjonalnie, bez złudzeń

Szczera ocena: Google jawnie mówi, że `llms.txt` **nie wpływa** na ranking ani AI Overviews, a <1% cytowanych stron go ma. Nie sprzedaję tego jako czynnika rankingowego. ([źródło](https://www.digitalapplied.com/blog/google-llms-txt-no-seo-value-lighthouse-audit-2026)) Ma realną wartość tylko w warstwie agentowej (narzędzia dev). **Priorytet: niski.** Jeśli kiedyś — to jako mapa dla agentów do publicznej dokumentacji, nie do rankingu.

---

# Pomiar (jak sprawdzamy, że działa)

| Sygnał | Narzędzie | Co obserwować |
|---|---|---|
| Indeksacja | GSC + Bing WMT | % zindeksowanych stron, błędy crawl, pokrycie sitemapy |
| Ruch organiczny | GSC + PostHog | wejścia organiczne na landing, frazy, CTR, pozycje |
| Konwersja organiczna | PostHog | organic → wygenerowany kosmogram → signup → premium |
| Cytowania AI | ręcznie, co tydzień | przepuść 10–15 zapytań (`kosmogram`, `horoskop natalny`, `synastria`...) przez ChatGPT/Perplexity/Gemini i notuj, kto jest cytowany |
| Zdrowie pSEO | GSC | indeksacja pilota (bramka 80%), kanibalizacja |

**Definicja „done" dla P0:** `robots.txt` wskazuje właściwą sitemapę; Organization+WebSite w teście Rich Results; manifest bez martwych tras; sitemap zawiera 15 stron publicznych (z `/calendar` i `/cosmo-chat`); GSC + Bing WMT zweryfikowane i sitemap wgrana; `site:cosmo-gram.com` zwraca strony publiczne.

---

# Decyzje, które należą do Maca

Zgodnie z regułą Always/Ask/Never — to wymaga Twojej zgody (URL/produkt/copy):

1. **Slugi: PL czy EN?** `/daily-horoscope` vs `/horoskop-dzienny`, `/for-kids` vs `/kosmogram-dziecka`. Polskie slugi lepiej pasują do intencji wyszukiwania na rynku PL, ale migracja = 301 + aktualizacja linków. Opcje: (A) zostają EN, dodajemy 301 z PL-duplikatów (P0.5A), (B) migracja na PL slugi z pełnym 301 (więcej pracy, lepszy long-term), (C) zostawić jak jest (najgorsze — duplikaty). **Rekomendacja: B, jeśli budżet czasu pozwala; inaczej A.**
2. **Meta titles/descriptions i nowe copy** (artykuły, pSEO, H1 generatora) — to copy widoczne dla usera. Proponuję teksty, Ty akceptujesz; głos Astrei i dyskalimery trzymam wg CLAUDE.md.
3. **Nazwa w manifeście** „Cosmo-gram" → „Cosmogram" (spójność marki, widoczne przy instalacji PWA) — drobne, ale to copy.
4. **pSEO go/no-go** — czy wchodzimy w pilota 12 stron po starcie bloga.

---

# Załącznik A — Brief treści (gotowy do przekazania)

## Deployment Code: „Czym jest kosmogram?"

- **Target Keyword:** kosmogram (sekundarne: czym jest kosmogram, kosmogram a horoskop, horoskop urodzeniowy)
- **Search Intent:** Informacyjna (definicyjna). SERP PL: definicje + darmowe kalkulatory → format hybrydowy: przewodnik + CTA narzędzia.
- **Content Format:** Przewodnik (guide) z FAQ
- **Funnel Stage:** TOFU
- **Pillar:** to jest treść wspierająca pillar `/cosmogram` (linkuje do niego z głównego CTA)

### Hierarchia H-tagów (immutable)
- **H1:** Czym jest kosmogram? Przewodnik po horoskopie urodzeniowym
- **H2:** Kosmogram — definicja w jednym zdaniu  *(40–60 słów, snippet bait)*
- **H2:** Kosmogram a horoskop z gazety — czym się różnią
- **H2:** Co pokazuje kosmogram (Słońce, Księżyc, ascendent, planety, domy)
  - H3: Słońce, Księżyc i ascendent — „wielka trójka"
  - H3: Planety w znakach i domach
  - H3: Aspekty — jak planety ze sobą rozmawiają
- **H2:** Czy potrzebujesz godziny urodzenia?
- **H2:** Jak obliczyć swój kosmogram za darmo  *(CTA do generatora)*
- **H2:** Najczęstsze pytania (FAQ)

### E-E-A-T
- **Experience:** przykład realnego odczytu (anonimowy), język „symbolicznego lustra"
- **Expertise:** wytłumacz źródło obliczeń (Swiss Ephemeris / silnik astronomiczny)
- **Authority:** podpis autora + bio, link do `/about`, `/how-ai-works`
- **Trust:** dyskalimer „nie wyrocznia / nie porada medyczna"; widoczna data
- **YMYL:** adjacentne → trzymaj dyskalimery

### Snippet bait
- Typ: definicja, 40–60 słów, zaraz po pierwszym H2
- Format: „Kosmogram (horoskop urodzeniowy, natalny) to mapa położenia Słońca, Księżyca i planet w chwili Twoich narodzin..."

### Semantic keywords
- Primary: kosmogram (2–3×)
- Secondary: horoskop urodzeniowy, horoskop natalny, mapa nieba
- LSI: ascendent, znak Księżyca, domy astrologiczne, aspekty, efemerydy, znak zodiaku, planety, tranzyt, Swiss Ephemeris

### Internal links
- Outbound: `/cosmogram` (główne CTA), `/how-ai-works`, klastry „ascendent", „domy astrologiczne"
- Inbound: pillar `/cosmogram` linkuje tu jako „czym jest kosmogram"
- Pillar connection: spoke → hub `/cosmogram`

### Angle / 10x
Konkurenci dają albo suchą definicję, albo goły kalkulator. Wy: definicja + natychmiastowy, osobisty wynik AI po polsku w jednym miejscu, z uczciwym podejściem (godzina opcjonalna, jasne czego brakuje bez niej).

### CTA
- TOFU, intensywność: miękka–średnia
- „Wygeneruj swój kosmogram za darmo" / „Zobacz, co mówi Twoje niebo"

> **Handoff:** ten Deployment Code wklej do nowej rozmowy z copywriterem/Claude Code. H-tagi, snippet bait i semantic keywords są stałe; głos i proza — wolność twórcza w ramach głosu Astrei.

---

## Źródła (GEO/SEO 2026)

- GEO best practices 2026 — GenOptima: https://www.gen-optima.com/geo/generative-engine-optimization-best-practices-2026/
- GEO complete guide 2026 — Enrich Labs: https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026
- llms.txt — brak wartości rankingowej (stanowisko Google) — DigitalApplied: https://www.digitalapplied.com/blog/google-llms-txt-no-seo-value-lighthouse-audit-2026
- Topical Authority — Koray Tugberk Gubur: https://www.holisticseo.digital/theoretical-seo/topical-authority/
- Topic Clusters (pillar–cluster) — HubSpot: https://blog.hubspot.com/marketing/topic-clusters-seo
- Programmatic SEO + Helpful Content quality bar — Positional: https://www.positional.com/blog/programmatic-seo
