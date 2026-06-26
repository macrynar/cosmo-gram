---
title: IMPLEMENTACJA — pSEO pilot „Księżyc w znaku" (P2)
type: implementation-prompt
owner: Mac
last_updated: 2026-06-26
target: Claude Code
---

# Prompt dla Claude Code — pSEO pilot „Księżyc w znaku"

Wklej do Claude Code. Budujemy **pilot programmatic SEO**: 12 stron „Księżyc w [znaku]" + strona-hub. Treść (unikalne interpretacje) dostarcza warstwa Cowork w `src/lib/pseo/moonSigns.ts` — Ty budujesz rurę i szablon. Strategia: `docs/SEO-GEO-organic-growth-PLAN.md` (P2.2).

**Dlaczego to nie jest cienki pSEO:** każda strona ma unikalną, autorską interpretację (nie podmianę słowa w szablonie) + jest product-led (prowadzi do generatora). To warunek przejścia przez Helpful Content Update. Trzymaj bramkę jakości niżej.

## Zasady (z CLAUDE.md)

- Next.js 16 App Router, TS, SSG. Foldery/slug kebab-case, polskie nazwy znaków bez diakrytyków w slugu (`bliznieta`, `koziorozec`).
- Reużywaj, co już macie: `SIGN_LOCATIVE` z `src/lib/i18n/astro.ts` (forma „w Skorpionie"), wzorzec `opengraph-image.tsx`, wzorzec JSON-LD ze stron funkcji.
- Po skończeniu: `typecheck` + `lint` + `test` + `build` zielone. Commity po polsku.

---

## T1 — Dane: `src/lib/pseo/moonSigns.ts` (dostarcza Cowork)

Kontrakt (Cowork wypełnia treścią, Ty go konsumujesz):

```ts
export type MoonSign = {
  slug: string;     // "skorpion" (bez diakrytyków)
  sign: string;     // "Skorpion" (mianownik, do list)
  element: "Ogień" | "Ziemia" | "Powietrze" | "Woda";
  excerpt: string;  // meta description (~150 znaków)
  lead: string;     // snippet-bait, 40–60 słów, zaraz pod H1
  feeling: string;  // jak czuje
  needs: string;    // czego potrzebuje, by czuć się bezpiecznie
  love: string;     // w bliskich relacjach
  shadow: string;   // trudniejsza strona, uczciwie
  faq: { q: string; a: string }[];
};

export const MOON_SIGNS: MoonSign[];
export function getMoonSign(slug: string): MoonSign | null;
export function getAllMoonSigns(): MoonSign[];
```

Tytuł strony budujesz jako `Księżyc w ${SIGN_LOCATIVE[sign]}` (reużycie i18n, nie hardcoduj odmiany). Pilot startuje z 3 znakami (Skorpion, Baran, Bliźnięta), reszta 9 dochodzi po akceptacji baru — route ma działać dla dowolnej liczby wpisów.

## T2 — Spoke: `src/app/ksiezyc-w-znaku/[slug]/page.tsx`

SSG (`generateStaticParams` z `getAllMoonSigns()`). `generateMetadata`: title `Księżyc w ${locative} — co znaczy? · Cosmogram`, description = `excerpt`, canonical `/ksiezyc-w-znaku/${slug}`, OG.

Sekcje (kolejność):
1. eyebrow „KSIĘŻYC W ZNAKU" + H1 `Księżyc w ${Locative}` + element.
2. **lead** (snippet-bait, akapit pod H1).
3. „Jak czujesz" (`feeling`), „Czego potrzebujesz" (`needs`), „W bliskich relacjach" (`love`), „Druga strona" (`shadow`) — każda jako H2 + akapit.
4. **CTA**: „Nie wiesz, w jakim znaku masz Księżyc? [Wygeneruj swój kosmogram](/cosmogram)" — Księżyc liczy się z daty i miejsca, więc godzina nie jest potrzebna (mocny hook: wynik dostępny od ręki).
5. FAQ (`faq`) → sekcja + FAQPage schema.
6. „Inne znaki Księżyca" — linki do 2–3 sąsiednich znaków + do huba.
7. Dyskalimer (refleksyjny, nie wyrocznia/porada).

Schema JSON-LD: `WebPage` + `BreadcrumbList` (Cosmogram → Księżyc w znaku → [znak]) + `FAQPage`.

Okładka: reużyj szablonu `opengraph-image.tsx` (jak blog) — `src/app/ksiezyc-w-znaku/[slug]/opengraph-image.tsx`, tytuł = `Księżyc w ${Locative}`.

## T3 — Hub: `src/app/ksiezyc-w-znaku/page.tsx`

Pillar na head term „księżyc w znaku". Krótki wstęp (czym jest znak Księżyca, link do `/blog/czym-jest-kosmogram`), siatka 12 znaków (linki do spoków), CTA do `/cosmogram`. `metadata` + canonical `/ksiezyc-w-znaku`. To jest hub linkujący do wszystkich spoków (wymóg pSEO: strony osiągalne w 1–2 kliknięcia).

## T4 — Linkowanie i sitemap

- Hub linkuje do 12 spoków; każdy spoke linkuje zwrotnie do huba + 2–3 sąsiadów + `/cosmogram` + `/blog/czym-jest-kosmogram`.
- Dodaj hub `/ksiezyc-w-znaku` do nawigacji/stopki lub podlinkuj z `/cosmogram` (żeby był osiągalny z menu, nie tylko z sitemapy).
- `sitemap.ts`: dorzuć hub + `getAllMoonSigns().map(...)` jako osobne wpisy (`changeFrequency: monthly`, `priority: 0.6`).

## T5 — Bramka jakości (twardo, anty-HCU)

- Start: **tylko tyle znaków, ile jest w `moonSigns.ts`** (na początku 3). Pełne 12 po dopisaniu treści przez Cowork.
- Po wypuszczeniu 12: **monitoruj indeksację w GSC 2–4 tygodnie**. Skalowanie na kolejne planety (Wenus/Mars/ascendent) dopiero gdy **>80%** stron zindeksowanych i mają wyświetlenia.
- Jeśli któraś strona nie indeksuje się lub ma zero ruchu po ~6 tyg. — kandydat do `noindex`. Nie zostawiaj martwych cienkich stron (psują ocenę całej domeny).

---

## Weryfikacja („done")

1. `typecheck`/`lint`/`test`/`build` zielone; spoki jako SSG w logu builda.
2. `/ksiezyc-w-znaku` listuje znaki; `/ksiezyc-w-znaku/skorpion` renderuje wszystkie sekcje + okładkę.
3. Rich Results: `FAQPage` + `BreadcrumbList` bez błędów.
4. `/sitemap.xml` zawiera hub + spoki.
5. Każdy spoke ma realnie unikalną treść (nie szablon z podmianą) i CTA do generatora.

## Commity

- `pSEO: dane Księżyc w znaku (moonSigns.ts) + typy`
- `pSEO: spoke /ksiezyc-w-znaku/[slug] + schema + okładka`
- `pSEO: hub /ksiezyc-w-znaku + linkowanie + sitemap`

## Po wdrożeniu (do Cowork)

Po akceptacji baru na 3 znakach — Cowork dopisuje pozostałe 9 do `moonSigns.ts` (ten sam kontrakt). Potem patrzymy w GSC i decydujemy o skalowaniu na kolejne planety.
