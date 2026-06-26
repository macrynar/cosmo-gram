---
title: IMPLEMENTACJA — Pipeline bloga MDX (P1)
type: implementation-prompt
owner: Mac
last_updated: 2026-06-26
target: Claude Code
---

# Prompt dla Claude Code — Pipeline bloga (MDX, P1)

Wklej całość do Claude Code. To jednorazowy setup „rury" bloga. Po nim publikacja posta = wrzucenie pliku `.mdx` + okładki i commit (treść i grafikę dostarcza warstwa Cowork). Źródło strategii: `docs/SEO-GEO-organic-growth-PLAN.md` (P1).

## Zasady (z CLAUDE.md)

- Next.js 16 App Router, TS, Tailwind 4. Foldery/slug kebab-case.
- **Nie dotykaj copy widocznego dla usera poza tym, co tu podane.** Treść postów przychodzi osobno (pliki `.mdx`).
- Po skończeniu: `npm run typecheck` + `npm run lint` + `npm run test` zielone; `npm run build` przechodzi; zero błędów w konsoli.
- Commity krótkie, po polsku.
- Blog jest statyczny (SSG) — żadnego DB. `/blog/[slug]/page.tsx` jest dziś stubem (`notFound()`) — budujesz od zera.

## Zależności do dodania

```bash
npm i next-mdx-remote gray-matter reading-time remark-gfm rehype-slug rehype-autolink-headings
```

(`next-mdx-remote/rsc` renderuje MDX w React Server Components — bez kosztu po stronie klienta.)

---

## T1 — Kontrakt frontmattera (ŹRÓDŁO PRAWDY)

Pliki postów: `content/blog/<slug>.mdx`. Każdy ma frontmatter dokładnie w tym kształcie. **Nie zmieniaj nazw pól** — warstwa Cowork generuje pod ten kontrakt.

```yaml
---
title: "Czym jest kosmogram? Przewodnik po horoskopie urodzeniowym"
slug: "czym-jest-kosmogram"          # = nazwa pliku, używane w URL /blog/<slug>
excerpt: "Krótki opis 150–160 znaków — meta description + OG + karta na liście."
publishedAt: "2026-06-26"
updatedAt: "2026-06-26"
author:
  name: "Redakcja Cosmogram"
  bio: "Zespół Cosmogram — astrologia osobista oparta na danych i AI."
cover: "/blog/czym-jest-kosmogram/cover.png"
coverAlt: "Opis okładki po polsku, z frazą kluczową."
category: "Podstawy"
tags: ["kosmogram", "horoskop natalny", "podstawy astrologii"]
pillar: "/cosmogram"                  # hub: breadcrumb + sekcja CTA linkuje tutaj
faq:                                  # opcjonalne → FAQPage schema + sekcja na stronie
  - q: "Czym jest kosmogram?"
    a: "Odpowiedź 40–60 słów."
draft: false                          # true = nie publikuj (filtrowane wszędzie)
---
```

`readingTime` liczy lib (pakiet `reading-time`), nie ma go we frontmatterze.

---

## T2 — Warstwa danych: `src/lib/blog.ts`

Zbuduj API czytane z systemu plików w buildzie:

```ts
export type BlogFrontmatter = {
  title: string; slug: string; excerpt: string;
  publishedAt: string; updatedAt: string;
  author: { name: string; bio: string };
  cover: string; coverAlt: string;
  category: string; tags: string[]; pillar: string;
  faq?: { q: string; a: string }[];
  draft?: boolean;
};

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  slug: string;
  content: string;       // surowy MDX (do MDXRemote)
  readingTimeMin: number;
};

export function getAllPosts(): BlogPost[];           // czyta content/blog/*.mdx + gray-matter
export function getPublishedPosts(): BlogPost[];     // draft !== true, sort po publishedAt malejąco
export function getPostBySlug(slug: string): BlogPost | null;
```

Walidacja: jeśli plik nie ma wymaganego pola frontmattera — rzuć czytelny błąd w buildzie (lepiej crash niż cichy zły post). `getPublishedPosts()` jest tym samym, którego używa `sitemap.ts` (P0 T4 zostawił zakomentowany import — odkomentuj go).

---

## T3 — Strona posta: `src/app/blog/[slug]/page.tsx`

- `export async function generateStaticParams()` z `getPublishedPosts()` → SSG.
- `export async function generateMetadata({ params })`: `title` = `${frontmatter.title} · Cosmogram` (lub samo title jeśli już ma markę), `description` = `excerpt`, `alternates.canonical` = `https://www.cosmo-gram.com/blog/${slug}`, OG (`type: "article"`, `images: [cover]`, `publishedTime`, `authors`).
- Render MDX:

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

<MDXRemote
  source={post.content}
  options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings] } }}
  components={mdxComponents}   // h2/h3/a/img/blockquote stylowane DS; <a> wewnętrzne → next/link, zewnętrzne → rel="noopener"
/>
```

- **Widoczne E-E-A-T:** byline (`author.name`), data publikacji i „zaktualizowano" (jeśli `updatedAt > publishedAt`), czas czytania, kategoria.
- **Okładka** przez `next/image` (priority, sensowne `sizes`, `alt = coverAlt`).
- **Breadcrumb UI:** Blog → `category` → tytuł.
- **Sekcja FAQ** (jeśli `faq`): render listy pytań/odpowiedzi.
- **CTA na końcu (template-level, nie w MDX):** komponent linkujący do `frontmatter.pillar` (lub `/cosmogram`), tekst typu „Wygeneruj swój kosmogram za darmo". Trzymaj głos marki; nie wymyślaj nowych obietnic.
- **Dyskalimer w stopce posta:** „Treści mają charakter refleksyjny i rozrywkowy — nie zastępują porady medycznej, psychologicznej, prawnej ani finansowej." (YMYL/E-E-A-T).

### JSON-LD (3 węzły)

```ts
// BlogPosting
{
  "@context": "https://schema.org", "@type": "BlogPosting",
  headline: fm.title, description: fm.excerpt,
  image: `https://www.cosmo-gram.com${fm.cover}`,
  datePublished: fm.publishedAt, dateModified: fm.updatedAt,
  author: { "@type": "Person", name: fm.author.name, description: fm.author.bio },
  publisher: { "@type": "Organization", name: "Cosmogram",
    logo: { "@type": "ImageObject", url: "https://www.cosmo-gram.com/icons/icon-512.png" } },
  mainEntityOfPage: `https://www.cosmo-gram.com/blog/${fm.slug}`,
  inLanguage: "pl-PL",
}
// BreadcrumbList: Cosmogram → Blog → tytuł
// FAQPage: tylko gdy fm.faq istnieje (Question/Answer z fm.faq)
```

Wstrzykuj przez `<script type="application/ld+json">` (jak na stronach funkcji).

---

## T4 — Index bloga: `src/app/blog/page.tsx`

Zastąp placeholder „wkrótce" listą `getPublishedPosts()`:
- karty: okładka (`next/image`), kategoria, tytuł, `excerpt`, data, czas czytania, link do `/blog/<slug>`,
- zachowaj istniejące `metadata` (canonical `/blog`),
- pusty stan tylko gdy realnie 0 opublikowanych postów.

(Opcjonalnie później: strony kategorii `/blog/kategoria/<cat>` — nie teraz.)

---

## T5 — Obrazy i sitemap

- Okładki leżą w `public/blog/<slug>/cover.png` (dostarcza Cowork). Skonfiguruj `next/image` tak, by działały lokalne assety (są w `public/`, więc bez zmian w `images.remotePatterns`).
- **Sitemap:** odkomentuj w `src/app/sitemap.ts` blok `getPublishedPosts()` (przygotowany w P0 T4), tak by posty wpadały automatycznie z `lastModified: updatedAt`.

---

## Weryfikacja (definicja „done")

1. `npm run typecheck` + `npm run lint` + `npm run test` — zielone.
2. `npm run build` — SSG generuje strony postów (sprawdź log: `/blog/<slug>` jako static).
3. Wrzuć testowy `content/blog/czym-jest-kosmogram.mdx` (dostarczy Cowork) → `/blog` listuje go, `/blog/czym-jest-kosmogram` renderuje się z okładką, bylinem, FAQ.
4. `/blog/czym-jest-kosmogram` w [Rich Results Test](https://search.google.com/test/rich-results) → `BlogPosting` + `BreadcrumbList` (+ `FAQPage`) bez błędów.
5. `/sitemap.xml` zawiera URL posta.
6. Lighthouse na stronie posta: SEO 100, brak regresji a11y.

## Sugerowane commity

- `Blog: warstwa MDX (lib + kontrakt frontmattera)`
- `Blog: strona posta [slug] + BlogPosting/Breadcrumb/FAQ schema`
- `Blog: index z listą postów zamiast placeholdera`
- `Blog: posty w sitemap`

## Po wdrożeniu (info zwrotne do Cowork)

Potwierdź ścieżki, jeśli się zmienią: katalog na posty (`content/blog/`), katalog okładek (`public/blog/<slug>/`), nazwa pola autora. Warstwa Cowork generuje dokładnie pod kontrakt z T1 — jakakolwiek zmiana nazw pól wymaga aktualizacji tego pliku.
