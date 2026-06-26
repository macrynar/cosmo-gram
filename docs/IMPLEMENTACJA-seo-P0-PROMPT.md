---
title: IMPLEMENTACJA — SEO/GEO Fundament P0
type: implementation-prompt
owner: Mac
last_updated: 2026-06-26
target: Claude Code
---

# Prompt dla Claude Code — SEO/GEO Fundament (P0)

Wklej całość do Claude Code. Wykonaj zadania T1–T6. Źródło i uzasadnienie: `docs/SEO-GEO-organic-growth-PLAN.md` (sekcja P0). To są fixy techniczne przed launchem produktowym.

## Zasady pracy (z CLAUDE.md — przestrzegaj)

- Stack bez re-litygacji: Next.js 16 App Router, TypeScript, Tailwind 4. Trasy/foldery kebab-case.
- **Nie zmieniaj copy/głosu widocznego dla usera ani pricingu/Stripe.** W tym zakresie P0 dotyczy to dwóch rzeczy: nazwy w `manifest.json` ("Cosmo-gram") i ewentualnych 301 na slugach — **oba zostaw jako decyzję Maca** (oznaczone niżej). Resztę wykonaj.
- Po skończeniu: **`npm run typecheck` + `npm run lint` + `npm run test` muszą być zielone.** Zero nowych błędów w konsoli przeglądarki.
- Commity krótkie, po polsku. Sugestie commitów na końcu.
- Nie edytuj wdrożonych migracji. P0 nie rusza DB.

## Zakres P0 (co robimy / czego NIE)

✅ Robimy: `robots.ts` + boty AI, schema Organization/WebSite, fix funkcjonalny `manifest.json`, uzupełnienie `sitemap.ts`, ujednolicenie tras-duplikatów, fix a11y viewport.
❌ Nie w P0: blog/treść (P1), pSEO (P2), zmiany copy/H1, migracja slugów na PL (osobna decyzja).

---

## T1 — `robots.ts` (dynamiczny) + wpuszczenie botów AI

**Cel:** statyczny `public/robots.txt` wskazuje sitemapę na złą domenę (`cosmogram.pl`). Zastępujemy go dynamicznym `robots.ts` z poprawną sitemapą i jawnym wpuszczeniem botów AI.

**Kroki:**
1. **Usuń** `public/robots.txt` (statyczny plik w `public/` kolidowałby z `app/robots.ts`).
2. **Utwórz** `src/app/robots.ts`:

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
        disallow: [
          "/app/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/", "/api/",
          // trasy-duplikaty (patrz T5) — domyślnie zablokowane przed indeksacją
          "/horoskop-dzienny", "/children",
        ],
      },
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User",
          "PerplexityBot", "Perplexity-User",
          "ClaudeBot", "Claude-Web",
          "Google-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```

**Weryfikacja:** `npm run dev`, otwórz `http://localhost:3000/robots.txt` — ma renderować właściwą sitemapę (`www.cosmo-gram.com`) i regułę dla botów AI. Brak konfliktu build.

---

## T2 — Schema Organization + WebSite (globalnie)

**Cel:** brak węzła encji marki. Dodajemy `Organization` + `WebSite` raz, w layoucie.

**Kroki:**
1. **Utwórz** `src/components/seo/OrganizationJsonLd.tsx` (server component — bez `"use client"`):

```tsx
// src/components/seo/OrganizationJsonLd.tsx
const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cosmogram",
  url: "https://www.cosmo-gram.com",
  logo: "https://www.cosmo-gram.com/icons/icon-512.png",
  description:
    "Cosmogram — astrologia osobista oparta na danych astronomicznych i AI. Kosmogram natalny, synastria, kalendarz tranzytów i chat z Astreą, po polsku.",
  // TODO(Mac): uzupełnij realnymi profilami i odkomentuj. NIE wstawiaj zmyślonych URL-i.
  // sameAs: ["https://www.instagram.com/...", "https://www.tiktok.com/@...", "https://www.facebook.com/..."],
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

2. **Wepnij** w `src/app/layout.tsx` — w `<body>`, przed providerami:

```tsx
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
// ...
<body className={`${montserrat.variable} ${cormorant.variable} ${fraunces.variable} antialiased`}>
  <OrganizationJsonLd />
  <PostHogProvider>
    {/* ... bez zmian ... */}
```

**Uwaga:** `sameAs` zostaw zakomentowane (brak realnych profili w repo). Nie wstawiaj placeholderów — nieistniejące URL-e w `sameAs` szkodzą.

**Weryfikacja:** zbuduj, otwórz źródło strony `/`, sprawdź że jest `<script type="application/ld+json">` z `Organization` i `WebSite`. Wklej do [Rich Results Test](https://search.google.com/test/rich-results) — bez błędów.

---

## T3 — `manifest.json` — fix funkcjonalny

**Cel:** `start_url` i skróty wskazują nieistniejące trasy (`/generate`, `/chat`).

**Zmień w `public/manifest.json`:**
- `"start_url": "/generate"` → `"start_url": "/app/cosmogram"`
- skróty: `"/generate"` → `"/app/cosmogram"`, `"/chat"` → `"/app/chat"`

```jsonc
"start_url": "/app/cosmogram",
"shortcuts": [
  { "name": "Kosmogram", "url": "/app/cosmogram", "description": "Twój kosmogram" },
  { "name": "Chat",      "url": "/app/chat",      "description": "Porozmawiaj z Astreą" }
]
```

**⚠️ DECYZJA MACA (nie zmieniaj bez potwierdzenia):** pole `"name"`/`"short_name"` = `"Cosmo-gram"`. Sugerowana zmiana na `"Cosmogram"` (spójność marki), ale to copy widoczne przy instalacji PWA → zostaw jak jest, dopóki Mac nie potwierdzi.

**Weryfikacja:** DevTools → Application → Manifest: `start_url` i skróty prowadzą do realnych tras (`/app/cosmogram`, `/app/chat`), bez ostrzeżeń.

---

## T4 — `sitemap.ts` — dodaj `/calendar` i `/cosmo-chat`, przygotuj pod blog

**Cel:** obie strony mają pełne SEO (canonical, FAQPage), ale nie ma ich w sitemapie. Dodatkowo robimy funkcję `async`, gotową pod posty bloga (P1).

**Zastąp `src/app/sitemap.ts`:**

```ts
import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
// import { getPublishedPosts } from "@/lib/blog"; // P1: odkomentuj, gdy powstanie warstwa bloga

const BASE_URL = "https://www.cosmo-gram.com";

const INDEXED_PUBLIC_ROUTES = [
  ROUTES.public.home,
  ROUTES.public.cosmogram,
  ROUTES.public.calendar,        // DODANE
  ROUTES.public.match,
  ROUTES.public.chatPublic,      // DODANE (/cosmo-chat)
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
    changeFrequency: (route.path === "/" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route.path === "/" ? 1 : 0.7,
  }));

  // P1 (po starcie bloga):
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

**Weryfikacja:** `/sitemap.xml` zawiera 15 URL-i, w tym `/calendar` i `/cosmo-chat`. Brak duplikatów PL-slugów.

---

## T5 — Trasy-duplikaty (domyślnie załatwione w T1)

**Cel:** `/horoskop-dzienny` (dubluje `/daily-horoscope`) i `/children` (dubluje `/for-kids`) to client-pages bez metadata. W T1 zostały dodane do `disallow` — to bezpieczny default, który nie psuje działania stron.

**⚠️ DECYZJA MACA (opcjonalna):** jeśli te trasy są **martwe** (nieużywane, niedostępne z nawigacji), lepszy jest trwały 301 zamiast `disallow`. Wtedy:
1. usuń `/horoskop-dzienny` i `/children` z `disallow` w `robots.ts`,
2. dodaj do `next.config.ts` (obok istniejących `headers`/`rewrites`):

```ts
async redirects() {
  return [
    { source: "/horoskop-dzienny", destination: "/daily-horoscope", permanent: true },
    { source: "/children", destination: "/for-kids", permanent: true },
  ];
}
```

Najpierw sprawdź, czy któryś flow (nawigacja, linki w mailach, deep-linki) nie używa tych tras. Jeśli używa — zostaw `disallow` z T1, nie rób 301.

---

## T6 — Fix a11y w viewport

**Cel:** `userScalable:false` + `maximumScale:1` blokują pinch-zoom (flaga w Lighthouse A11y).

**W `src/app/layout.tsx`, w `export const viewport`:** usuń `maximumScale` i `userScalable`. Zostaw resztę:

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050508",
};
```

**Weryfikacja:** mobile-PWA nadal działa (notch/safe-area bez zmian), pinch-zoom odblokowany.

---

## Weryfikacja końcowa (definicja „done")

1. `npm run typecheck` — zielone.
2. `npm run lint` — zielone.
3. `npm run test` — zielone (te fixy nie ruszają testowanych modułów astro/walidatorów; jeśli coś czerwone — to regresja do naprawy).
4. `npm run build` — przechodzi, brak konfliktu `robots`/`sitemap`.
5. Ręcznie w dev: `/robots.txt` (właściwa sitemapa + boty AI), `/sitemap.xml` (15 URL-i), źródło `/` (JSON-LD Organization+WebSite), DevTools Manifest (realne trasy).
6. Zero nowych błędów w konsoli przeglądarki na `/`.

## Manualne — dla Maca (poza Claude Code)

- **Google Search Console:** zweryfikuj `www.cosmo-gram.com`, wgraj `/sitemap.xml`.
- **Bing Webmaster Tools:** to samo (ChatGPT Search indeksuje przez Bing — bez tego wypadasz z cytowań AI).
- Po launchu: „Request indexing" dla stron publicznych, sprawdź `site:cosmo-gram.com`.
- Decyzje: nazwa w manifeście (T3), 301 vs disallow na slugach (T5), docelowa strategia slugów PL/EN (osobny temat z planu).

## Sugerowane commity (po polsku)

- `Fix robots.txt — dynamiczny robots.ts, właściwa sitemapa, boty AI`
- `Dodaj schema Organization + WebSite (JSON-LD) globalnie`
- `Fix manifest — start_url i skróty na realne trasy`
- `Sitemap: dodaj /calendar i /cosmo-chat, async pod blog`
- `Odblokuj pinch-zoom w viewport (a11y)`
