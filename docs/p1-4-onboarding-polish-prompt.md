# PROMPT 4/4 DLA CLAUDE CODE — P1: Teatr pierwszego wrażenia + spójność aplikacji

> Wymaga wdrożonych promptów 1–3/4. Cel: pierwsze 60 sekund jako najlepszy moment produktu + zero słabych punktów w nawigacji.

---

Pracujesz w repo aplikacji Cosmogram: Next.js 16, TypeScript, Framer Motion 12, PWA z bottom nav. Istnieje komponent koła kosmogramu. Flow: signup → potwierdzenie e-mail → `/auth/callback` → `/app/cosmogram?autostart=true` → generacja natal (claude-sonnet-4-6, 8 modułów równolegle, streaming; free: 3 widoczne + 5 zablokowanych). W nawigacji `/app/*` są m.in. Solar Return (`/app/solar-return`) i Cosmo Map (`/app/map`) — oba niedopracowane.

Pracuj fazami, po każdej: testy zielone, commit.

---

## FAZA 1 — Generowanie kosmogramu jako spektakl

Zastąp obecny stan ładowania (spinner/skeleton) sekwencją (Framer Motion):

1. **Akt 1 — niebo (0–3 s):** ciemne tło dark crystal, pusty pierścień koła rysuje się (stroke animation), pojawiają się osie domów (jeśli jest godzina urodzenia).
2. **Akt 2 — planety (3–10 s):** planety wskakują na pozycje KOLEJNO (Słońce → Księżyc → Merkury…), każda z subtelnym glow; przy każdej jednozdaniowy deterministyczny mini-fakt z obliczonego kosmogramu („Twoje Słońce w Bliźniętach — umysł, który łączy światy") — z lokalnej mapy tekstów (planeta × znak, 120 wpisów; wygeneruj je raz Sonnetem jako stałe assety w repo, NIE w runtime).
3. **Akt 3 — aspekty (10–15 s):** linie aspektów rysują się między planetami.
4. **Akt 4 — interpretacja:** moduły tekstowe pojawiają się progressive reveal — pierwszy gotowy moduł odsłania się, kolejne dochodzą strumieniowo; nigdy ściana tekstu na raz.
5. Synchronizacja z realnym czasem AI: sekwencja ma elastyczny czas (akt 2–3 zapętlają subtelnie, jeśli AI jeszcze pracuje; jeśli AI skończy szybciej, animacja domyka się w naturalnym tempie, min. 8 s — wow wymaga chwili). Skip po tapnięciu (od razu wynik). `prefers-reduced-motion` → prosty, elegancki progress bez animacji planet.
6. Stan błędu: koło i pozycje (deterministyczne) zostają na ekranie, treść pokazuje retry — user nigdy nie wraca do pustego formularza.
7. Ta sama sekwencja przy generacji kosmogramu dziecka i (skrócona, 2 koła) była zrobiona w matchu — zweryfikuj spójność stylu między nimi.

## FAZA 2 — Jedna jasna ścieżka po pierwszym kosmogramie

1. Po obejrzeniu wyniku (scroll do końca lub 30 s na stronie) — pojedyncza karta CTA: **„Zobacz, co gwiazdy mówią o Tobie dzisiaj"** → `/app/horoscope` (horoskop tranzytowy / pogoda dnia z promptu 1/4). Jedna opcja, nie menu.
2. Sekwencja kolejnych wizyt (lekki system „następnego kroku", stan w `user_preferences`): po 1. wizycie → horoskop; po obejrzeniu horoskopu → kalendarz z zapowiedzią najbliższego Dnia Mocy; potem → chat (chipy z promptu 3/4). Każdy krok = jedna podpowiedź, nigdy więcej.
3. PostHog: `onboarding_step_shown` / `onboarding_step_clicked` (z property kroku) — lejek aktywacji mierzalny od dnia 1.

## FAZA 3 — Ukrycie niedopracowanych funkcji

1. **Usuń Solar Return i Cosmo Map z nawigacji** (bottom nav, sidebar, wszystkie menu). Route'y zostają w kodzie za feature flagiem `experimental_features` (dostępne dla admina do dalszych prac) — bezpośrednie wejście usera bez flagi → elegancki redirect do `/app/cosmogram`.
2. Przeszukaj landing page i nawigację publiczną — jeśli Solar Return/Cosmo Map są wzmiankowane, usuń.
3. Sprawdź, czy nie ma innych martwych/niedokończonych linków (Dziennik został już usunięty — zweryfikuj, że nigdzie nie straszy).

## FAZA 4 — Audyt spójności mobile (PWA)

Przejdź KAŻDY widok w strefie `/app/*` na viewport 390×844 (iPhone) i 360×800 (Android) — checklist per widok do raportu `docs/MOBILE-AUDIT.md`:
1. Brak horyzontalnego scrolla; touch targets ≥ 44 px; treść nie wchodzi pod bottom nav ani notch (safe-area).
2. Koło kosmogramu/synastrii czytelne i interaktywne na małym ekranie (tap zamiast hover wszędzie).
3. Stany ładowania i błędów wyglądają celowo (nie rozjechane skeletony).
4. Typografia interpretacji: max szerokość linii, kontrast na dark crystal ≥ WCAG AA.
5. Każdy widok oceń: „poziom natal" / „wymaga poprawek" (wypisz konkretnie) — popraw wszystko, co da się poprawić w CSS/layoutach w ramach tego zadania; większe przebudowy tylko opisz w raporcie.

## FAZA 5 — Domknięcie P1

1. E2E: autostart z animacją (i ze skipem przez `?reveal=instant` w testach), karta następnego kroku pojawia się i znika po kliknięciu, Solar Return/Cosmo Map nieobecne w nav i redirectują, mini-fakty renderują się dla różnych kosmogramów.
2. Lighthouse mobile na `/app/cosmogram` i landing: performance ≥ 85, accessibility ≥ 95 — jeśli niżej, popraw (lazy load, rozmiary obrazów, animacje na transform/opacity).
3. Przegeneruj wszystkie golden testy po komplecie zmian P1 i odpal pełny zestaw evali — wynik do raportu.
4. Zaktualizuj dokument statusu projektu: P1 zamknięte, sekcja „Wdrożone funkcje" odzwierciedla nowy stan, ryzyka zaktualizowane.

## Zasady

- Mini-fakty i wszystko, co możliwe — deterministyczne assety w repo, nie wywołania AI w runtime.
- Animacje wyłącznie transform/opacity (60 fps na średnim telefonie); żadnych blokad interakcji dłuższych niż animacja.
- Nie zmieniaj treści promptów interpretacyjnych (poza zadaniami z promptów 1–3) — tuning treści idzie przez panel admina.
- Niejasności → zatrzymaj się i zapytaj.
