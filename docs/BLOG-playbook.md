---
title: Blog — playbook produkcji (Cowork + CC)
type: playbook
owner: Mac
last_updated: 2026-06-26
---

# Blog — playbook produkcji

Powtarzalna pętla publikacji posta. Pipeline techniczny stoi raz (`docs/IMPLEMENTACJA-blog-pipeline-PROMPT.md`); potem każdy post idzie tą ścieżką.

## Pętla (kto co robi)

1. **Cowork (treść + grafika)**
   - research/brief z `docs/SEO-GEO-organic-growth-PLAN.md` (mapa tematyczna P1.1, kolejność P1.3),
   - draft `content/blog/<slug>.mdx` wg kontraktu frontmattera (patrz prompt pipeline, T1),
   - okładka przez Higgsfield (system wizualny niżej).
2. **Mac (QC + publikacja)**
   - kontrola jakości treści (trafność astro, głos, dyskalimer) — to jest poza Claude,
   - zapis okładki do `public/blog/<slug>/cover.png`,
   - merge przez Claude Code (commit).
3. **Claude Code (tylko gdy zmiana techniczna)** — pipeline już działa, więc zwykle bez pracy.

## Głos (zatwierdzony)

Edytorialny, ciepły, Astrea-adjacent: rzeczowy pod intencję wyszukiwania, ale na marce. Forma neutralna, 2. osoba. Bez żargonu w treści głównej (`efemerydy`/`Swiss Ephemeris` tylko w FAQ/stopce). Godzina urodzenia zawsze opcjonalna, nigdy „wymagana". Rama „symboliczne lustro, nie wyrocznia". Dyskalimer YMYL na końcu.

**Anti-AI-tell (twardo):** zero myślników „—" i en-dashy „–" (nadużyte = czytelny sygnał LLM); zamiast nich kropka, przecinek, dwukropek albo przebudowane zdanie. Nie spacjowany dywiz „ - " jako proteza. Zróżnicowany rytm zdań (krótkie + długie), unikaj nadmiaru zbyt symetrycznych konstrukcji „nie X, tylko Y" i tricolonów. Bez korpo-żargonu i frazesów. Ma brzmieć, jakby napisał to uważny człowiek, nie model.

## Okładki: generowany szablon brandowy

Okładki nie są robione ręcznie ani przez AI. Generuje je kod: `src/app/blog/[slug]/opengraph-image.tsx` (next/og), z tokenów design-systemu (aubergine + ember/złoto, motyw pierścieni, tytuł we Fraunces). Spec wdrożeniowy: `docs/IMPLEMENTACJA-blog-cover-PROMPT.md`.

- **Domyślnie:** nie podajesz `cover` we frontmatterze, więc okładka generuje się sama, spójna z marką, zero plików i zero ręcznego zapisu.
- **Override:** jeśli post ma mieć grafikę specjalną (np. hero z Higgsfield), ustaw `cover: "/blog/<slug>/cover.png"` i wgraj plik.
- **Higgsfield (tylko special hero):** ciepła paleta z tokenów (`#0B0912` + `#FFAE3D`/`#F08F2E`/`#E9DCC0`), zero zimnych tonów. AI tylko atmosfera, nigdy faktograficzne koło natalne (ryzyko E-E-A-T). Do tego realny render z appki.

## Checklist weryfikacji (per post)

- [ ] Frontmatter kompletny wg kontraktu (T1 promptu pipeline), `draft: false`.
- [ ] Snippet-bait: zwięzła odpowiedź 40–60 słów zaraz po pierwszym H2.
- [ ] 2–4 linki wewnętrzne: do pillara (`/cosmogram` itd.) + sąsiednich klastrów; pillar linkuje zwrotnie.
- [ ] `coverAlt` po polsku z frazą; okładka domyślnie z szablonu (lub `cover` override, jeśli grafika specjalna).
- [ ] FAQ we frontmatterze (3–5 pytań) → FAQPage schema.
- [ ] Dyskalimer obecny; głos zgodny (forma neutralna, bez żargonu w treści).
- [ ] Po deployu: Rich Results Test (BlogPosting + Breadcrumb + FAQ bez błędów), URL w `/sitemap.xml`.

## Kolejka treści (z planu P1.3)

Pillar „Kosmogram natalny" najpierw:
1. ✅ Czym jest kosmogram? *(pilot — gotowy)*
2. Jak czytać kosmogram krok po kroku *(HowTo)*
3. Kosmogram bez godziny urodzenia — co da się odczytać? *(niskie KD, Wasz realny gotcha)*
4. Ascendent — co to i jak go poznać

Potem pillary: synastria (`/match`), tranzyty/kalendarz (`/calendar`), kosmogram dziecka (`/for-kids`).
