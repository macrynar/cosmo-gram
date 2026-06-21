---
title: Strona publiczna „Kosmogram" (/cosmogram) — koncepcja redesignu + SEO/GEO
type: concept
owner: Mac
created: 2026-06-13
companion: docs/design-system.md
target-file: src/app/cosmogram/page.tsx
status: koncepcja (krok 1 z 2 — potem mockup z Higgsfield)
---

# Po co ta strona istnieje

To **landing pozyskaniowy pod hasło „kosmogram"** — najmocniejsze, najszersze słowo w naszej kategorii. Ma robić trzy rzeczy naraz:

1. **Konwertować** ruch płatny/marki na rejestrację (góra strony, szybko do CTA).
2. **Rankować w Google** na klaster „kosmogram / kosmogram natalny / horoskop urodzeniowy" (treść, struktura, dane strukturalne) — to organiczny, darmowy kanał, który rośnie sam (P3 z roadmapy).
3. **Być cytowalna przez silniki AI** (ChatGPT, Perplexity, Google AI Overviews) — to jest **GEO** (Generative Engine Optimization). Coraz więcej osób pyta o astrologię czat-boty, a nie Google. Chcemy być źródłem, które AI cytuje.

> Uwaga o pojęciu: przyjmuję **GEO = Generative Engine Optimization** (cytowalność przez AI), nie geo-lokalny. Rynek PL jest i tak wbudowany (treść po polsku). Jeśli miałeś na myśli geo-targeting lokalny — powiedz, to inny zestaw taktyk.

# Co jest nie tak dziś (diagnoza)

- **Off-brand:** font Cormorant (nie Fraunces), złoto `#D4AF37` (nie tokeny DS), **emoji planet** (☀️🌙♀️) zamiast autorskich glifów, **zielona** sekcja dziecka — sprzeczne z całym redesignem, który właśnie domknęliśmy.
- **Treść płytka pod SEO/GEO:** hero + siatka 6 planet + 2 karty + CTA. Brak definicji, brak „jak to działa", brak porównania z horoskopem gazetowym, brak FAQ, brak danych strukturalnych, brak linkowania wewnętrznego. Google i AI nie mają z czego nas wybrać.
- **Brak teatru/dowodu:** nie widać, jak wygląda produkt (koło, Wielka Trójka, moduły). Konkurencja pokazuje kalkulator od razu.

# Strategia SEO + GEO (oparta na realnym intencie)

Z analizy SERP (duchowykierunek, naturoda, cudnibiru, dobrykalkulator, janachowska, kobieta.pl, eska.pl) intencja jest **informacyjna + narzędziowa**. Ludzie chcą: zrozumieć co to, obliczyć za darmo, poznać ascendent.

**Klastry słów (H1–H3 + treść):**

- Rdzeń: *kosmogram*, *kosmogram natalny*, *kosmogram urodzeniowy*, *horoskop urodzeniowy / natalny*.
- Narzędzie: *darmowy kosmogram online*, *kalkulator kosmogramu*, *oblicz / narysuj swój kosmogram*.
- Ascendent: *ascendent — jak obliczyć*, *kalkulator ascendentu*, *jak sprawdzić ascendent*.
- Long-tail (złoto, niska konkurencja): *kosmogram bez godziny urodzenia*, *jak czytać kosmogram*, *co to jest kosmogram*, *Wielka Trójka w astrologii*, *kosmogram a horoskop gazetowy*, *kosmogram dziecka*.

**Taktyki GEO (żeby AI nas cytowało):**

- **Definicja-first:** tuż pod hero jedno-, dwuzdaniowa, czysta odpowiedź „Czym jest kosmogram?" — AI ekstrahuje całe zdania, więc dajemy gotowy, cytowalny fragment.
- **Bloki Q→A (FAQ):** realne pytania z SERP, krótkie odpowiedzi. To jednocześnie `FAQPage` schema (rich results) i materiał, który silniki AI wciągają wprost.
- **Jasność encji:** zdefiniowane pojęcia (kosmogram = mapa nieba z chwili urodzenia; ascendent; Wielka Trójka; domy; aspekty) — AI lubi jednoznaczne definicje encji.
- **Tabela porównawcza** „kosmogram vs horoskop gazetowy" — formaty tabelaryczne są chętnie cytowane przez AI i wygrywają intencję porównawczą.
- **Autorytet (E-E-A-T):** Swiss Ephemeris jako źródło obliczeń + **ekspertka-astrolog (20+ lat)** jako autorka/recenzentka treści. To wyróżnik vs cienkie kalkulatory i podnosi zaufanie Google i AI. (Zależne od partnerstwa — patrz decyzje.)
- **Dane strukturalne (JSON-LD):** `WebPage` + `BreadcrumbList` + `FAQPage` + `HowTo` („Jak obliczyć kosmogram" w 3 krokach) + `SoftwareApplication`/`Product` (oferta: darmowy + Plus). `aggregateRating` **tylko jeśli realne** — nie zmyślamy ocen.
- **Linkowanie wewnętrzne:** z tej strony do satelitów (znaki zodiaku, ascendent, kosmogram dziecka, Cosmo Match = kompatybilność/synastria, Kalendarz/Dni Mocy, horoskop dzienny, blog). To rozlewa autorytet i buduje topical authority pod P3.

# Pozycjonowanie / kąt

„**Nie horoskop ze znaku — Twoja pełna mapa nieba, czytana po polsku z głębią, jakiej nie da kalkulator.**" Trzymamy „symboliczne lustro, nie wyrocznia" z briefu, ale na landingu SEO przewagą jest **głębia interpretacji AI + ekspert** kontra masa darmowych, płytkich kalkulatorów. Mówimy konkretem: Swiss Ephemeris (dokładność) + AI po polsku (personalizacja) + człowiek-ekspert (autentyczność).

# Architektura strony (kolejność = warstwy: konwersja → dowód → głębia SEO/GEO)

1. **Hero** — H1 „Kosmogram natalny — Twoja mapa nieba z chwili urodzenia". Podtytuł z frazami (mapa wszystkich planet, nie horoskop ze znaku, interpretacja AI po polsku). CTA „Wygeneruj swój kosmogram (za darmo)". Tło: grafika Higgsfield (rytowane koło/mapa nieba). *Konwersja + H1 SEO.*
2. **Definicja (GEO snippet)** — krótki blok „Czym jest kosmogram?" 2–3 zdania, cytowalne. Encje zdefiniowane. *GEO + featured snippet.*
3. **Jak to działa (HowTo)** — 3 kroki: podajesz datę/godzinę/miejsce → liczymy ze Swiss Ephemeris → AI pisze interpretację po polsku. *HowTo schema + zdejmuje obiekcje.*
4. **Co pokazuje Twój kosmogram** — Wielka Trójka (Słońce/Księżyc/Ascendent) + planety, z **autorskimi glifami** (nie emoji), krótkie definicje (Słońce = tożsamość, Księżyc = emocje, Ascendent = maska/pierwsze wrażenie…). *Keyword-rich + edukacja.*
5. **Dowód/teatr** — podgląd produktu (koło + Wielka Trójka + fragment modułu), żeby pokazać poziom interpretacji vs płytkie kalkulatory. *Konwersja.*
6. **Kosmogram vs horoskop gazetowy** — tabela porównawcza (personalizacja, dokładność, godzina urodzenia, głębia). *Intencja porównawcza + cytowalność AI.*
7. **Ascendent / bez godziny** — sekcja pod silny long-tail („jak obliczyć ascendent", „bez godziny urodzenia") + link do kalkulatora/rejestracji. *Long-tail SEO.*
8. **Kosmogram dziecka** — przeniesione z obecnej strony, ale **w DS (bursztyn, nie zieleń)** + link do `/for-kids`. *Cross-sell + keyword.*
9. **Powiązane funkcje** — kafle: Cosmo Match (synastria), Kalendarz/Dni Mocy, Cosmo Chat (Astrea), Horoskop dzienny. *Linkowanie wewnętrzne + odkrywanie produktu.*
10. **FAQ** — 6–8 realnych pytań z SERP (co to, czy darmowy, czy potrzebna godzina, kosmogram a horoskop, jak dokładny, czym różni się od Co-Star/kalkulatorów). *FAQPage schema + GEO.*
11. **CTA końcowe** — „Zacznij za darmo" + reassurance (data/godzina/miejsce, kilkanaście sekund).
12. **Footer** — bez zmian (już DS), z linkami legal/produkt.

# Warstwa wizualna (DS)

- Fonty: **Fraunces** (H1/H2/voice) + **General Sans** (treść) — koniec Cormoranta.
- Paleta: tokeny DS (`--bg-base`, `--accent #FFAE3D`, `--accent-deep`, `--voice`, `--line`); **zero zieleni** (sekcja dziecka na bursztyn), jedyny „spoza": `--tense` dla ewentualnych akcentów napięcia.
- **Glify zamiast emoji:** Słońce/Księżyc/planety i znaki = autorskie SVG (reuse `zodiacGlyphs` + glify planet z koła). To zarazem spójność i lepsze renderowanie.
- Mikroruch jak na landingu v2 (subtelne, `prefers-reduced-motion` respektowane).

# Plan grafik Higgsfield (do kroku 2 — mockup)

Trzymamy styl-anchor (rytowane złoto na indygo, bez twarzy/figur/tekstu). Propozycja minimalna (oszczędność kredytów, reuse gdzie się da):

- **Hero backdrop** — rytowane koło natalne / mapa nieba, środek otwarty pod tekst (jak nebula z chatu).
- **Akcent „mapa nieba"** — delikatna tekstura konstelacji jako tło sekcji definicji/teatru.
- **Reuse:** portrety znaków (`/assets/zodiac/sign-*.png`) do Wielkiej Trójki, `wheel-backdrop.png` do podglądu koła. Nowe generacje tylko tam, gdzie nie mamy assetu.

(Dokładne prompty i joby wygeneruję w kroku 2, po akceptacji koncepcji.)

# Mierniki sukcesu

- Organic: pozycje na klaster „kosmogram*" (śledzić w GSC), ruch organiczny, CTR.
- GEO: pojawianie się w odpowiedziach AI / AI Overviews (jakościowo — okresowy ręczny check promptów).
- Konwersja: CTR hero CTA → signup → pierwszy kosmogram (PostHog funnel).

# Decyzje do potwierdzenia (przed mockupem)

1. **Główny keyword target:** „kosmogram / kosmogram natalny" (szeroki, informacyjny) — rekomendacja. Alternatywa: dociążyć „darmowy kosmogram online" (narzędziowy, niżej w lejku).
2. **Głębia treści:** warstwowa (konwersja u góry, długa treść SEO/GEO niżej) — rekomendacja. Alternatywy: lekka konwersyjna / ciężki long-form.
3. **Ekspertka-astrolog jako autorka treści (E-E-A-T/GEO):** mocny wyróżnik, ale zależny od partnerstwa (z briefu: conditional). Eksponujemy teraz czy zostawiamy „interpretacja oparta na wiedzy astrologicznej" bez nazwiska?
