---
title: Cosmo Match (P1.4) — plan dopracowania modułu po redesignie
type: plan
owner: Mac
created: 2026-06-14
parent: 2026-06-10-roadmap-todo.md → P1.4
context: redesign warstwy wizualnej gotowy; domknąć funkcjonalność pod kątem jakości, zaangażowania i UX
---

# Stan wyjściowy — co redesign faktycznie domknął

Audyt kodu (`src/app/app/match/page.tsx`, `src/components/astro-match/CompatibilityResult.tsx`,
`src/components/match/SynastryWheel.tsx`, `src/app/api/astro-match/route.ts`,
`src/lib/astro/synastry.ts`, `src/app/share/match/[id]/opengraph-image.tsx`) zestawiony z 4 zadaniami P1.4.

| Zadanie P1.4 | Stan | Komentarz |
|---|---|---|
| Wizualizacja synastrii | **zbudowane, ale odłączone** | `SynastryWheel.tsx` jest gotowy i dobry; API zwraca `aspects` + `planetPositions`, ale widok wyniku ich nie używa |
| Reveal z dramaturgią | **częściowo** | jest count-up score + staggered fade kart; brak sekwencji koło → linie → wynik |
| Score breakdown na wymiary | **zrobione i przekroczone** | 8 wymiarów zamiast sugerowanych 5; najlepsza część redesignu |
| Grafika do udostępnienia | **częściowo** | OG istnieje, ale w innej palecie niż redesign; brak in-app „pobierz grafikę" |

**Diagnoza nadrzędna:** redesign jest piękny, ale w hero wyniku „wow" jest dziś *dekoracją, nie danymi*.
Hero pokazuje jeden z 5 obrazków `bond-*.png` na tier — czyli **dwie różne pary ze score 70 widzą identyczny obraz**.
To wprost łamie zasadę P1 z roadmapy: „wow = to jest o MNIE, nikt inny by tego nie dostał". Realne koło synastrii
(unikalne dla każdej pary) jest już zbudowane i czeka na podpięcie. To największy efekt za najmniejszy koszt.

---

# Kolejność prac

Numeracja = sugerowana kolejność. Najpierw to, co domyka „wow" całego modułu (1–2), potem UX i wzrost.

## 1. [wow] Podłączyć realne koło synastrii jako hero — *domyka P1.4 / wizualizacja*

Dziś hero w `CompatibilityResult.tsx` (sekcja „Bond visual", ~linie 274–347) to dekoracyjny `tier.img`
z orbitującymi kropkami. Komponent z prawdziwymi danymi już istnieje i jest gotowy do użycia.

- [ ] Zaimportować `SynastryWheel` z `@/components/match/SynastryWheel` do `CompatibilityResult.tsx`.
- [ ] Przekazać dane, które API już dostarcza: `result.planetPositions.a/b` i `result.aspects`
      (route.ts:201–205, 293). Props są zgodne: `planetsA`, `planetsB`, `aspects`, `nameA`, `nameB`.
- [ ] Zastąpić dekoracyjny obrazek kołem; score (`{score}` z `useCountUp`) nałożyć na środek koła
      jako overlay, zachowując obecny tier label i summary pod spodem.
- [ ] Zachować obrazki `bond-*.png` jako delikatne tło/poświatę za kołem (nie jako główny element),
      żeby nie tracić klimatu redesignu.
- [ ] Fallback: stare zapisy bez `aspects`/`planetPositions` (sprzed redesignu) → pokaż dekorację
      jak dziś. Warunek: `result.aspects?.length ? <SynastryWheel/> : <dekoracja/>`.

Kryterium gotowe: dwie różne pary o tym samym score widzą **różne** koła.

## 2. [wow] Dokończyć dramaturgię reveal — *domyka P1.4 / reveal*

`SynastryWheel` ma już animowane wchodzenie planet (delay `i*0.07`) i rysowanie linii
(delay `1.6 + i*0.10`). Trzeba zsynchronizować całość w jeden spektakl.

- [ ] Sekwencja po wygenerowaniu: (a) buduje się koło i planety → (b) rysują się linie aspektów →
      (c) count-up score do wyniku → (d) staggered odsłona 8 kart (już jest).
- [ ] Loading state „Odczytujemy połączenia…" (`page.tsx` ~284–303) wzbogacić o mikro-fakt
      w trakcie czekania na AI (spójnie z teatrem onboardingu P1.7), np. nazwa najsilniejszego aspektu.
- [ ] Uszanować `?reveal=instant` (już obsłużone przez `animate`) i `prefers-reduced-motion`
      (już w stylach hero — rozszerzyć na count-up).

## 3. [UX] Naprawić mobile — *P1.8 „każdy moduł na mobile"*

- [ ] Siatka kart w `CompatibilityResult.tsx` ma na sztywno `gridTemplateColumns: "1fr 1fr"`
      (~363–366) — na telefonie 8 kart w 2 kolumnach jest ciasne. Zwinąć do 1 kolumny < ~640px
      (media query lub `repeat(auto-fit, minmax(280px, 1fr))`).
- [ ] Sprawdzić koło synastrii na wąskim ekranie (SynastryWheel ma `maxWidth: 390` + listę mobilną —
      zweryfikować po podpięciu jako hero).
- [ ] Checklist porównawczy: czy moduł wygląda jak natal, czy gorzej (P1.8).

## 4. [wzrost] Grafika do pobrania + ujednolicenie OG — *domyka P1.4 / share, zasila P3*

- [ ] Ujednolicić paletę OG (`opengraph-image.tsx`) z redesignem: dziś używa fioletu `#a78bfa`
      i `Georgia`; redesign to złoto (`#E0B566`/`#FFAE3D`) i `Fraunces`. Doprowadzić do spójności.
- [ ] Dodać in-app „Pobierz grafikę" — karta **9:16** do IG/Stories: imiona, score, tier label,
      najpiękniejszy aspekt. (Dziś jest tylko link + OG do podglądu, brak ścieżki „zrzut na stories".)
- [ ] Powiązać z programem poleceń (P3): grafika jako naturalne zaproszenie drugiej osoby.

## 5. [engagement] Mocniejszy tease paywalla — *konwersja*

Dziś darmowy user widzi zawsze moduł #1 (Komunikacja); reszta to pełny blur (`CompatibilityResult.tsx`,
logika `locked = !isFirst && !isPremiumUser`, ~367–381; strip server-side w route.ts:296–304).

- [ ] Zamiast zawsze pierwszego — pokazać za darmo **najmocniejszy** wymiar (np. Przyciąganie 90),
      jako mocniejszy hook FOMO.
- [ ] Przy zablokowanych kartach pokazać **samą liczbę** zamiast pełnego blura
      („90/100 — odblokuj, dlaczego"). Liczby sprzedają lepiej niż rozmazany tekst.
      Uwaga: dziś API strippuje całe kategorie poza pierwszą dla free — trzeba zwracać
      *score'y* wszystkich wymiarów (bez treści) zamiast je wycinać.

## 6. [wow] Wyciągnąć „najpiękniejszy aspekt" do hero — *personalizacja*

- [ ] Top aspekt jest już liczony i używany w OG (`opengraph-image.tsx`), ale nie w UI wyniku.
      Dodać jedno zdanie w hero, np. „Wasz najsilniejszy aspekt: Słońce ↔ Wenus". Personalizuje
      i zasila grafikę z pkt. 4.

## 7. [engagement] Jeden jasny krok dalej po wyniku — *retencja, spójne z P1.7*

Dziś po wyniku jest tylko „Udostępnij" + paywall. Brakuje mostu do reszty aplikacji.

- [ ] Dodać jedną wyraźną ścieżkę dalej: „Jak ten tydzień wpływa na Waszą relację"
      (most do horoskopu tranzytowego P1.2) lub „Porównaj z kolejną osobą".

## 8. [jakość] Sprzątanie kodu

- [ ] `src/lib/synastry-score.ts` (stary, 5-wymiarowy: overall/communication/passion/values/challenge)
      jest **nieużywany** — aktywny jest `src/lib/astro/synastry.ts` (8-wymiarowy). Usunąć legacy.
- [ ] Skonsolidować typ `SynastryAspect` — istnieją dwie różne definicje (różny kształt pól).
- [ ] Drobne: chip zapisanego matcha bez daty; brak akcji „regeneruj".
      Score clamp 30–92/95 to świadoma decyzja (brak brutalnych wyników) — zostawić, ale udokumentować.

---

# Definicja „P1.4 gotowe"

1. Hero wyniku pokazuje **realne koło synastrii** danej pary (różne pary = różne koła).
2. Reveal to sekwencja koło → linie → score, nie sam spinner.
3. Pełne 8 wymiarów na mobile w 1 kolumnie, czytelne jak natal.
4. Działa „Pobierz grafikę" (9:16) w palecie redesignu; OG spójny wizualnie.
5. Free-tier tease pokazuje najmocniejszy wymiar + liczby zablokowanych; martwy kod usunięty.

# Minimum, żeby ruszyć dalej z roadmapą

Pkt **1 + 2** (koło + reveal) — to realnie domyka „wow" całego modułu i odblokowuje sens pkt. 4 (share).
Reszta (3, 5–8) to szlif jakości i konwersji do zrobienia równolegle lub zaraz po.
