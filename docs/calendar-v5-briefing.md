# Koncepcja v5: Briefing od astrologa (zastępuje widok kalendarza)

Status: zastępuje prezentację z calendar-concept-v4.md. Silnik danych (tranzyty, sezony, okna, rytm) z v4 ZOSTAJE — wymieniamy ekran i język.

Geneza (12 cze 2026, feedback Maca): wdrożony kalendarz to przeładowany ekran bez odpowiedzi na pytanie klienta. Klient nie myśli „Mars w Byku w opozycji do Księżyca" — myśli „kiedy zacząć biznes, kiedy uważać, kiedy szukać miłości". Astrolog prowadzi od wniosku; mechanika to przypis.

---

# 1. Zasada nadrzędna: wniosek → domena → mechanika

Każdy element na ekranie ma trzy poziomy, w tej kolejności:

1. **Wniosek** — jedno zdanie w ludzkim języku, rada lub obserwacja („Dobry tydzień na rozmowy o pieniądzach — szczególnie 19–23 cze").
2. **Domena** — etykieta życiowa: Kariera · Relacje · Finanse · Energia · Decyzje. Zawsze widoczna, daje skanowalność.
3. **Mechanika** — fraza astrologiczna („Wenus w trygonie do Twojego Jowisza w 2. domu") — dopiero po rozwinięciu, dla ciekawych. Nigdy jako nagłówek.

Jeśli czegoś nie da się streścić do wniosku w jednym zdaniu — nie pokazujemy tego na briefingu.

# 2. Układ ekranu (route /app/calendar → docelowo /app/prognoza)

Kolejność sekcji, desktop i mobile identycznie (jedna kolumna, mobile-first):

## A. Dziś (hero, zawsze otwarte)
- Data + nagłówek dnia: **jedno zdanie** wniosku („Dziś sprzyja domykaniu, nie zaczynaniu — dobry dzień na porządki w sprawach, które wiszą").
- Pod spodem 1 linia mechaniki zwijana: Księżyc w znaku (+dom premium), aktywne okno jeśli jest.
- Jeśli pełnia/nów/zaćmienie: pytanie refleksyjne (zostaje z v4).
- To jest 10-sekundowy poranny rytuał — codzienny powód powrotu.

## B. Co przed Tobą (7–14 dni)
- **Max 3 pozycje**, chronologicznie. Format:
  `[Domena] 19–23 cze — wniosek w 1 zdaniu · ★ najlepszy dzień: 21 cze`
- Tylko okna szybkie ponad progiem istotności + dni ◆ + stacje retro. Jak nie ma 3 rzeczy wartych pokazania — pokazujemy mniej. Pusty tydzień = „Spokojny tydzień. Następny istotny moment: 28 cze." (rzadkość buduje wiarygodność).
- Rozwinięcie pozycji = pełna karta: zakres, peak, znaczenie (premium), mechanika.

## C. Wielkie tematy (sezony)
- **Max 3 karty**, wybór wg ścisłości orbu i rangi planety (reguła z v4).
- Karta = nazwa domenowa nadana przez AI („Przebudowa w karierze"), zakres dat, faza (początek/środek/domykanie) jako pasek, **jedno zdanie rady** („to czas odważnych ruchów, nie planowania") — premium: pełny akapit.
- To jest moment „astrolog mówi: od września dużo się zmieni". Push przy nowym sezonie i zmianie fazy.

## D. Pokaż miesiąc (zwinięte domyślnie)
- Siatka miesiąca jako widok drugorzędny, na żądanie. Obowiązują reguły v4 §2: pasma okien (2–5/mies), ★ wyłącznie glif na peaku, ◆ dni dokładności, glify pełni/nowiu, ℞ stacje. NIC więcej.
- Klik w dzień → panel dnia (sekcja 5 z v4, bez zmian — max 2 karty astrologiczne).

# 3. Twarde limity — jako kod i testy, nie prose

v4 poległo, bo limity były w dokumencie, a nie w kodzie. Tym razem każdy limit = stała w kodzie + test:

| Limit | Wartość | Test |
|---|---|---|
| Sezony na briefingu | ≤ 3 | unit na selektorze |
| Pozycje „Co przed Tobą" | ≤ 3 | unit na selektorze |
| Nagłówek dnia | 1 zdanie, ≤ 120 znaków | walidacja outputu AI, retry przy przekroczeniu |
| Zapis „★N" w siatce | zakazany | test snapshot siatki |
| Karty astrologiczne w panelu dnia | ≤ 2 | unit |
| Okna w siatce miesiąca | tylko ponad progiem istotności | istniejący próg z silnika |

# 4. Mapowanie domen (wymaga astrolożki — NIE wdrażać bez weryfikacji)

Propozycja heurystyki v1 do zatwierdzenia:

| Domena | Sygnały |
|---|---|
| Relacje | Wenus; 5. i 7. dom; aspekty do natalnej Wenus/Księżyca |
| Kariera | Słońce, Mars, Saturn; 10. dom / MC; aspekty do MC |
| Finanse | Jowisz, Wenus; 2. i 8. dom |
| Decyzje / komunikacja | Merkury; 3. i 9. dom; retro Merkurego |
| Energia / ciało | Mars, Księżyc; 1. i 6. dom |

Konflikt (kilka domen naraz): wybieramy jedną dominującą, reszta w mechanice. Lista pytań do astrolożki: czy heurystyka się broni, jak ważyć planetę vs dom, które aspekty per domena są „zielone" a które „ostrzegawcze".

# 5. Język AI (prompt, nie kod)

- Wniosek najpierw, zawsze. Zakaz zaczynania zdania od nazwy planety.
- Forma bezrodzajowa (obowiązuje wszędzie — golden test z v4 §7.2).
- Ton astrologa-doradcy: konkretna rada lub obserwacja, nie poetycka mgła. Wzorzec: „od września sprzyja Ci czas na X — warto Y".
- Zakaz żargonu w warstwie wniosku (orb, kwadratura, tranzyt — dozwolone tylko w mechanice).
- Nagłówek dnia: deterministyczny szkielet (Księżyc + aktywne okno) → AI tylko redaguje zdanie. Cache 24h per user (anty-wzorzec z CLAUDE.md). `ai_prompt_version` przy zapisie.

# 6. Free vs premium

| Element | Free | Premium |
|---|---|---|
| Nagłówek dnia (wniosek) | ✅ | ✅ |
| Mechanika dnia + Księżyc w Twoich domach | — | ✅ |
| „Co przed Tobą": że COŚ jest + domena + daty | ✅ | ✅ |
| „Co przed Tobą": wniosek + znaczenie | lock (zajawka) | ✅ |
| Wielkie tematy: nazwa + zakres + faza | ✅ | ✅ |
| Wielkie tematy: rada + pełny akapit + odczyt ◆ | lock | ✅ |
| Siatka miesiąca + panel dnia | ✅ struktura | ✅ znaczenie |

Granica jak w v4: free widzi STRUKTURĘ (kiedy coś jest), płaci za ZNACZENIE (co z tym zrobić). Wniosek dnia darmowy — to wabik retencyjny, nie produkt.

# 7. Do usunięcia z obecnego ekranu

- Rząd chipów profili (Maciej×3, Michał, Mateusz) — zarządzanie profilami nie należy do briefingu; przełącznik profilu w headerze obok avatara.
- „Porównaj z innym kosmogramem" — to feature Cosmo Match, nie prognozy.
- Karta „Twoje sezony 18" — patrz limit ≤3.
- Pasmo/gwiazdka na większości dni siatki — patrz progi.
- Ściana tekstu w panelu wybranego dnia — struktura v4 §5, max 2 karty.

# 8. Priorytety

**P0 — bez tego nie ma produktu:**
1. Nowy układ A–D z twardymi limitami (sekcja 3) i testami.
2. Warstwa języka: wniosek → domena → mechanika (sekcja 5) dla okien i sezonów.
3. Naprawa selekcji: ≤3 sezony, 2–5 okien/mies (silnik to ma — egzekwować w UI).

**P1:**
4. Mapowanie domen po weryfikacji astrolożki (do tego czasu: etykiety tylko tam, gdzie heurystyka pewna; reszta bez etykiety).
5. Push: nowy sezon / zmiana fazy / jutro peak okna.
6. Onboarding 3 coachmarki (z v4 §5b, dostosowane do briefingu).

**P2:**
7. Eksplorator „Kiedy najlepiej…?" per domena (timeline okresów dla wybranej domeny) — naturalne rozwinięcie premium, dopiero gdy briefing działa.
8. Tygodniowy digest mailowy (Resend) = ta sama treść briefingu.

# 9. Otwarte pytania

1. **Astrolożka:** mapowanie domen (sekcja 4) + które kombinacje aspektów dają „zielone" vs „ostrzegawcze" rekomendacje.
2. **Mac:** zmiana nazwy zakładki „Kalendarz" → „Prognoza"? (lepiej oddaje wartość; kalendarz to teraz pod-widok).
3. **Mac:** czy nagłówek dnia free na pewno bez locka? (rekomendacja: tak — to silnik nawyku).
