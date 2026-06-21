---
title: Kosmogram dziecka — formularz inline + „chart-first" (zastępuje popup AddChildModal)
type: implementation-prompt
owner: Mac
created: 2026-06-13
companion: docs/kosmogram-dziecka-redesign-prompt.md
reference-flow: src/app/app/cosmogram/page.tsx (handleFormSubmit) + src/components/generate/BirthForm.tsx
target-files: src/app/app/cosmogram/page.tsx, src/components/children/AddChildModal.tsx (do usunięcia/zamiany)
---

# Cel

Ujednolicić dodawanie dziecka z flow dorosłego. Dziś: popup `AddChildModal`, submit odpala obliczenie wykresu + AI + zapis w jednym wywołaniu z **loaderem na przycisku** — user czeka na wszystko naraz, potem dostaje małą kartę. Dorosły działa lepiej: formularz **inline**, po wysłaniu **od razu renderuje się kosmogram** (koło + Wielka Trójka), a interpretacja dolicza się osobno.

Docelowo dziecko = ta sama anatomia i ten sam rytm co dorosły:

1. Formularz **inline**, nie popup.
2. Po wysłaniu: policz kosmogram (`/api/chart`) i pokaż go **natychmiast** — bez czekania na AI.
3. Interpretację (dziecięce moduły) generuj **po** pokazaniu wykresu, nie blokując; loader/skeleton tylko w sekcji Karty, nie na przycisku.

Ten dokument **uzupełnia i nadpisuje** `kosmogram-dziecka-redesign-prompt.md` w punktach „AddChildModal zostaje" oraz „Dodaj dziecko (gated `isPro`)" — teraz: inline + chart-first.

Wzorzec do skopiowania 1:1: `page.tsx` → `handleFormSubmit` (dorosły) i `BirthForm.tsx` (już w DS).

---

# 1. Formularz inline (DS, koniec popupu)

- **Usuń popup** jako mechanizm dodawania. `AddChildModal` znika w obecnej formie — jego logikę (pola, geocoding, walidacja wieku ≤17) przenieś do **inline'owego formularza** renderowanego w treści zakładki dziecka, dokładnie jak adult `showForm` renderuje `BirthForm`.
- **Reużyj `BirthForm`** jako bazę (jest już w DS: bursztynowe ikony, gradient, dropdown w złocie). Potrzebne różnice dla dziecka:
  - pole **„Imię dziecka"** wymagane (u dorosłego imię opcjonalne),
  - walidacja **wieku ≤ 17 lat** + „data nie z przyszłości" (jak w dzisiejszym modalu),
  - zachowaj opcję **„Nie znam godziny"** (spójnie z dorosłym) — ale podkreśl, że dla dziecka godzina jest ważna.
  - Zrób to wariantem `BirthForm` (prop `requireName`/`maxAge`/labels) albo cienkim `ChildBirthForm` reużywającym tych samych inputów/dropdownu — **bez forka stylów**.
- **Wyświetlanie:** „+ Dodaj dziecko" (w pasku dzieci i w empty-state) przełącza `showChildForm = true` i pokazuje formularz inline w karcie — **nie otwiera modala**. Zielony popup i jego styl znikają wraz z nim.
- **Błędy** → terakota DS (`--tense`), nie czerwień.

# 2. Chart-first — rozdziel obliczenia od AI

Dziś `handleAddChild` robi `chart → ai-child → save` w jednym, z `generatingChild` na przycisku. Rozbij na dwa kroki (jak u dorosłego):

- **Krok 1 — `computeChildChart` (szybki, deterministyczny):**
  `POST /api/chart` → `setChildChart(newChart)`, `setChildChartLoading(false)` → `POST /api/save-child` z `interpretation: ""` (puste moduły) → `setSelectedChildId(id)`. **Kosmogram dziecka renderuje się od razu** (`NatalChartAltarView` + `PlanetTable`), formularz znika. Skeleton tylko na czas liczenia wykresu (jak adult `chartLoading`).
- **Krok 2 — `generateChildInterpretation` (drogi AI, po wyświetleniu):**
  po pokazaniu wykresu wywołaj `POST /api/ai-child` (struktura 6 modułów wg `childModule` schema z głównego promptu) → wstaw wynik do `KartaDziecka`. **Loader/skeleton tylko w sekcji Karty** (jak adult `KartaZawodnika` lazy-loaduje moduły), nigdy na przycisku formularza.
- Cache per dziecko + `promptVersion`; **bez ręcznych „Wygeneruj/Odśwież"** w UI (auto + cache). Jeśli generacja AI padnie — kosmogram zostaje widoczny, a w sekcji Karty pokaż stan błędu z cichym retry (nie blokuj całości).

# 3. Stany (mirror adult)

Dodaj analogicznie do dorosłego (`showForm`/`chart`/`chartLoading`/`selectedId`):

- `showChildForm`, `childChart`, `childChartLoading`, `childInterpretationLoading`, `selectedChildId`.
- Po submit: forma → skeleton wykresu → koło + Wielka Trójka + PlanetTable → Karta dolicza się osobno.
- Przełączanie dzieci w pasku ustawia `selectedChildId` i przerysowuje koło/Trójkę/Kartę (dane z `chart_data`; interpretacja z cache albo dogenerowana).

# 4. Reszta bez regresji

- **Paywall:** gating `isPro` **przed** pokazaniem formularza/zapisem (jak dziś `!isPro → setShowPaywall`).
- Geocoding, walidacja daty/wieku, `save-child`, `ai-child`, `delete-child` — logika bez zmian poza rozdzieleniem chart/AI.
- Spójność z głównym promptem: pasek dzieci → `NatalChartAltarView` → `PlanetTable` → `KartaDziecka` (moduły). Siatka `ChildCard` i przyciski „Regeneruj" już usunięte (główny prompt).

# Definition of done

- Brak popupu; formularz dodawania dziecka **inline**, w DS, zero zieleni, błędy w terakocie.
- Po wysłaniu **kosmogram dziecka pokazuje się natychmiast**; interpretacja dolicza się osobno — loader/skeleton w sekcji Karty, **nie** na przycisku.
- Rozdzielone wywołania: `computeChildChart` (chart + save) i `generateChildInterpretation` (ai-child); błąd AI nie chowa wykresu.
- Reużyte `BirthForm`/`NatalChartAltarView`/`PlanetTable`/`KartaDziecka`; chart-engine i `ai-child` bez regresji (poza rozdzieleniem).
- Paywall/geocoding/walidacja wieku działają; mobile 390px; `npx tsc --noEmit` 0; `npm run build` OK.
