---
title: Cosmogram — wybór modeli AI + polityka cenowa (free / premium / add-ony)
type: decision-doc
owner: Mac
created: 2026-06-10
fx: przyjęto ~4,00 zł/USD (zaktualizuj przy liczeniu finalnym)
---

# 1. Najważniejszy wniosek

**Koszt AI nie jest wąskim gardłem przy cenie 19,99 zł/mies — nawet przy modelach klasy premium wychodzi 5–20% przychodu netto.** Prawdziwe koszty zjada VAT (23%) i Stripe (~3% + opłata stała): z 19,99 zł brutto zostaje ~15,5–16 zł netto. Dlatego: **modelu AI nie wybieraj po cenie, tylko po jakości polszczyzny** — różnice cenowe są pomijalne w skali biznesu, różnice jakości decydują o wow i konwersji.

Druga rzecz, która wymusza decyzję: **alias `deepseek-chat` jest wycofywany 24 lipca 2026.** Migracja i tak Cię czeka — to idealny moment, żeby przy okazji rozwiązać problem compliance (P0.1) i podnieść jakość.

# 2. Ceny modeli (czerwiec 2026, USD za 1M tokenów)

| Model | Input | Output | Compliance (RODO) | Rola u Ciebie |
|---|---|---|---|---|
| DeepSeek V4 Flash (następca deepseek-chat) | $0.14 | $0.28 | ✗ API bezpośrednie = Chiny | tylko przez Azure/self-host |
| DeepSeek V4 Pro | $1.74 | $3.48 | ✗ jw. | — |
| GPT-5 nano | $0.05 | $0.40 | ✓ DPA + SCC | treści masowe |
| Gemini 3.1 Flash-Lite | $0.10 | $0.40 | ✓ DPA + SCC | treści masowe (alternatywa) |
| GPT-5 mini | $0.25 | $2.00 | ✓ DPA + SCC | treści premium |
| Mistral Small 3.1 | $0.20 | $0.60 | ✓✓ przetwarzanie w UE | opcja „100% EU" |
| Claude Haiku 4.5 | $1.00 | $5.00 | ✓ DPA + SCC | treści premium |
| Claude Sonnet 4.6 | $3.00 | $15.00 | ✓ DPA + SCC | flagowy natal |

Wszyscy najwięksi dostawcy oferują batch API (−50%) i prompt caching (−90% na powtarzalnym inpucie) — oba mechanizmy pasują do Twoich workloadów (horoskopy nocą batchem, kontekst kosmogramu w chacie cache'owany).

# 3. Koszt na funkcję (szacunki tokenów × ceny)

Założenia: natal = 8 modułów, ~20k in / 10k out łącznie; match = ~5k in / 3k out; horoskop dzienny personalny = ~1,5k in / 0,4k out; wiadomość chat = ~3k in (kontekst, cache'owalny) / 0,4k out.

| Funkcja | GPT-5 nano | GPT-5 mini | Haiku 4.5 | Sonnet 4.6 |
|---|---|---|---|---|
| Natal (jednorazowo) | $0.005 | $0.025 | $0.07 | $0.21 (~0,85 zł) |
| Kosmogram dziecka (jednorazowo) | $0.005 | $0.025 | $0.07 | $0.21 |
| Match (za sztukę) | $0.001 | $0.007 | $0.02 | $0.06 |
| Horoskop personalny (miesiąc, 30 dni) | $0.007 | $0.035 | $0.10 | $0.31 |
| Chat (100 wiadomości, bez cache) | $0.03 | $0.16 | $0.50 | $1.50 |

Wniosek z tabeli: treści **jednorazowe** (natal, child, match) możesz generować najlepszym modelem, na jaki Cię stać jakościowo — koszt jest groszowy. Jedyny koszt **bieżący**, który skaluje się z użyciem, to chat i dzienny horoskop — i to one wyznaczają limity planów.

# 4. Rekomendowana architektura modeli

**Zasada: dwa poziomy + jeden flagowiec.**

1. **Natal (i tylko natal): Claude Sonnet 4.6.** To produkt-wizytówka i jedyny moduł z potwierdzonym wow — niech będzie bezdyskusyjnie najlepszy językowo. Jednorazowe ~0,85 zł na usera, z cache interpretacji (roadmapa P1.1) płacisz raz na kosmogram, nie raz na wyświetlenie.
2. **Treści premium bieżące (child, match, chat): Claude Haiku 4.5 lub GPT-5 mini.** Oba z DPA i SCC. Rozstrzygnij golden testami na polszczyźnie — masz do tego gotowy panel evali. Nie zgaduj, zmierz.
3. **Treści masowe (horoskop dzienny, Dni Mocy, e-maile): GPT-5 nano lub Gemini 3.1 Flash-Lite, przez Batch API nocą.** Przy generowaniu o 4:00 batchem koszt personalnego horoskopu to <0,02 zł/user/mies.
4. **DeepSeek — jeśli chcesz go zachować** (bo znasz jego output): wyłącznie przez Azure AI Foundry z regionem EU albo self-host (model jest open-weights, MIT). Bezpośrednie API odpada z powodów RODO. Uwaga: utrzymywanie trzeciego dostawcy tylko z sentymentu nie ma sensu — najpierw porównaj V4 Flash z GPT-5 mini/Haiku na goldenach.
5. **Mistral Small 3.1 — opcja strategiczna „dane nie opuszczają UE".** Jako jedyny daje przetwarzanie w UE by default — to może być element marketingu („Twoje dane urodzenia przetwarzane wyłącznie w Europie"). Warunek: jakość polskiego outputu musi przejść goldeny.

Niezależnie od wyboru: pseudonimizacja promptów (P0.1) obowiązuje przy KAŻDYM dostawcy — do modelu idą pozycje planet, nie imię i surowe dane urodzenia.

# 5. Model biznesowy: free / premium / add-ony

## Plan FREE — „spróbuj lustra" (koszt: ~0,90 zł jednorazowo na usera)

- 1 kosmogram urodzeniowy: **pełna jakość (Sonnet), ale odsłonięte 3 z 8 modułów** — pozostałe widoczne jako zablurowane karty z tytułami. User widzi, ŻE treść istnieje i jest o nim. To główna dźwignia konwersji.
  - Wariant oszczędny: generuj tylko 3 odsłonięte moduły, resztę dopiero przy upgrade — taniej i tworzy moment „odblokowania".
- Karta astrologiczna — pełna (shareowalna = marketing).
- Horoskop dzienny **generyczny dla znaku** — 12 generacji dziennie współdzielonych przez wszystkich free userów = koszt stały ~0 zł niezależnie od skali. Pod spodem zajawka: „Twój personalny horoskop tranzytowy czeka w premium".
- Kalendarz: ogólne Dni Mocy (te same dla wszystkich — obecna logika), bez personalizacji.
- Cosmo Match: score + jedna sekcja, reszta za paywallem.
- Cosmo Chat: **3 wiadomości na zawsze** (trial) — wystarczy na efekt „on naprawdę zna mój kosmogram".

## Plan PREMIUM — 19,99 zł/mies (koszt AI: ~1,20–2,40 zł/user/mies)

- Pełny kosmogram (8 modułów) + regeneracje po zmianach promptów.
- **Personalny horoskop tranzytowy codziennie** (strona + email + push) — flagowy benefit, uzasadnia subskrypcję cykliczną.
- Personalne Dni Mocy w kalendarzu.
- Kosmogramy dzieci: do 3 profili.
- Cosmo Match: 10 pełnych analiz/mies.
- Cosmo Chat: **150 wiadomości/mies** (przy Haiku z cache ≈ 1,2–2 zł kosztu — mieści się; limit komunikuj jako „~5 rozmów dziennie", nikt normalny go nie dotknie, a chroni przed abuse razem z rate limitingiem z P0.4).
- Plan roczny: **149 zł/rok** (≈ −38%, „2 miesiące gratis") — wprowadź od dnia 1, poprawia cashflow i retencję.

## Add-ony (dokupowane jednorazowo)

| Add-on | Cena | Koszt AI | Dla kogo |
|---|---|---|---|
| Pakiet +100 wiadomości Cosmo Chat | 9,99 zł | ~0,8–1,6 zł | power userzy premium |
| Pojedynczy pełny raport Match (bez subskrypcji) | 9,99 zł | ~0,1 zł | free userzy, zakup impulsowy — „sprawdź nas dwoje" |
| Dodatkowy profil dziecka (ponad 3) | 4,99 zł | ~0,3 zł | wielodzietni rodzice premium |
| Raport Solar Return „Twój rok" (gdy wróci z P4) | 14,99–19,99 zł | ~0,8 zł | urodzinowy trigger, co roku na nowo |

Zasada add-onów: jednorazowe raporty mogą być sprzedawane też userom free — to drugi lejek monetyzacji obok subskrypcji i naturalny most do premium („za 2 takie raporty masz cały miesiąc").

# 6. Czy to się spina — rachunek na 1 płacącego usera

| Pozycja | zł/mies |
|---|---|
| Cena brutto | 19,99 |
| − VAT 23% | −3,74 |
| − Stripe (~2,9% + 1 zł) | −1,58 |
| **Przychód netto** | **~14,70** |
| − koszt AI premium (worst case: pełne wykorzystanie limitów) | −2,40 |
| − infrastruktura/user (Supabase, Vercel, Resend — przy małej skali) | ~−0,50 |
| **Marża brutto na usera** | **~11,80 (~59% ceny brutto)** |

Typowy user nie wykorzysta limitów — realna marża będzie wyższa. Koszt pozyskania free usera (1 natal częściowy na Sonnet): ~0,40–0,90 zł — przy konwersji free→paid nawet 3% koszt AI „rozdanych" kosmogramów to ~13–30 zł na pozyskanego subskrybenta, akceptowalne bez płatnej reklamy, a z SEO/share (P3) bardzo zdrowe.

Bezpiecznik skali: alert kosztów u dostawcy AI + twardy miesięczny budżet na klucz API od pierwszego dnia.

# 7. Decyzje do podjęcia (kolejność)

1. Odpal golden testy porównawcze: DeepSeek V4 Flash (Azure) vs GPT-5 mini vs Haiku 4.5 vs Mistral Small — na polskich promptach natal + match + chat. Kryterium: jakość polszczyzny, konkret astrologiczny, ton „symbolicznego lustra".
2. Wybierz parę roboczą (premium + masowy) wg wyników; Sonnet dla natal traktuj jako default, chyba że goldeny pokażą, że zwycięzca z pkt 1 jest nieodróżnialny.
3. Wdróż podział free/premium wg sekcji 5 (paywall na blur modułów, limity server-side — patrz P0.4).
4. Wprowadź plan roczny i pierwszy add-on (raport Match dla free) — reszta add-onów po starcie, gdy zobaczysz realne wzorce użycia.
