---
title: Strona publiczna „Cosmo Match" (/match) — koncepcja redesignu + SEO/GEO
type: concept
owner: Mac
created: 2026-06-13
companion: docs/design-system.md, docs/cosmogram-public-page-concept.md
target-file: src/app/match/page.tsx
status: koncepcja + mockup (analogicznie do strony Kosmogram)
---

# Po co ta strona

Landing pozyskaniowy pod klaster **„synastria / horoskop partnerski / kompatybilność znaków"** — i, jak Match w produkcie, **najbardziej wiralny** moduł (każdy wynik to potencjalne zaproszenie drugiej osoby). Te same trzy zadania co strona Kosmogram: konwersja u góry, ranking w Google, cytowalność w AI (GEO). Decyzje przeniesione z Kosmogramu (zatwierdzone): **szeroki keyword, treść warstwowa, autorytet techniczny bez nazwiska**.

# Co jest nie tak dziś

- **Off-brand kolor:** cała strona różowo-czerwona (`#fb7185`, `#e11d48`) — łamie DS („jedno światło" = bursztyn). Ujednolicamy na bursztyn; napięcia w relacji oddaje akcentowo terakota (`--tense`), nie cała paleta.
- **Cormorant** zamiast Fraunces; **emoji** w „Co dostajesz" (🔗✨⚡💬❤️🎯) zamiast autorskich ikon/glifów; tło `#050508` zamiast tokenów.
- **Treść płytka pod SEO/GEO:** brak definicji „czym jest synastria", brak „jak to działa", brak porównania z „horoskopem pod znak", brak FAQ, brak danych strukturalnych, brak linkowania wewnętrznego.
- **Brak dowodu wizualnego:** nie widać tego, co jest sednem Matcha — **dwóch nałożonych kół z liniami aspektów** (to obraz, który ludzie sobie pokazują; środek wow).

# Strategia SEO + GEO (z realnego intencu)

Z SERP (miastokobiet, janachowska, ehoroskop/synastry, astrologia.com.pl, astromix) intencja: informacyjna + narzędziowa, mocno wokół „synastrii" i „dopasowania znaków". Konkurencja głównie **płytka** (kompatybilność tylko wg znaku Słońca, „Waga + Wodnik") albo numerologia. Nasz wyróżnik: **prawdziwa synastria** (aspekty planeta-planeta między dwoma pełnymi kosmogramami) + interpretacja AI po polsku + rozbicie na wymiary relacji.

**Klastry słów:**
- Rdzeń: *synastria*, *synastria co to*, *horoskop partnerski*, *horoskop partnerski z datą urodzenia*.
- Kompatybilność: *kompatybilność znaków zodiaku*, *dopasowanie znaków zodiaku*, *kto do mnie pasuje*.
- Narzędzie: *kalkulator kompatybilności / dopasowania*, *sprawdź kompatybilność z partnerem*.
- Long-tail: *synastria a kompozyt*, *Wenus i Mars w synastrze*, *kompatybilność wg daty urodzenia*, *czy znaki zodiaku do siebie pasują*.

**Taktyki GEO:** definicja-first („Czym jest synastria?"), bloki Q→A (FAQPage), tabela „synastria vs horoskop pod znak", jasne encje (synastria, kompozyt, aspekt, Wenus/Mars), JSON-LD (`WebPage`+`BreadcrumbList`+`HowTo`+`FAQPage`+`SoftwareApplication`), linkowanie wewnętrzne do Kosmogramu (warunek wstępny), znaków, Kalendarza, Chatu.

# Kąt komunikacji

„**Nie »czy pasujecie« — jak się nawzajem rozumiecie.**" Trzymamy obecny, dobry headline „Jak naprawdę działacie razem", ale podpieramy go konkretem: porównujemy **całe kosmogramy** (nie znaki), pokazujemy synergie i napięcia jako mapę, dajemy wskazówki. Działa dla par, przyjaźni i relacji zawodowych (obecne „Dla kogo" zostaje — jest dobre).

# Architektura strony (warstwy: konwersja → dowód → głębia)

1. **Hero** — H1 „Jak naprawdę działacie razem" (zostaje, mocny). Sub z frazami (synastria, porównanie dwóch kosmogramów, nie znaki). CTA „Sprawdź kompatybilność". Tło: grafika Higgsfield — **dwa nałożone koła z liniami aspektów**.
2. **Definicja (GEO)** — „Czym jest synastria?" 2–3 zdania, cytowalne; encje (synastria = porównanie dwóch kosmogramów; aspekt; kompozyt wzmianka).
3. **Jak to działa (HowTo)** — 3 kroki: podajesz dane urodzenia obu osób → liczymy oba kosmogramy i aspekty między nimi (Swiss Ephemeris) → AI tworzy mapę relacji po polsku.
4. **Dla kogo** — pary / przyjaźnie i rodzina / partnerzy biznesowi (zostaje, ikony zamiast tła różowego → bursztyn).
5. **Co dostajesz** — wynik kompatybilności, synergie, napięcia, komunikacja, styl miłości (Wenus/Księżyc), wskazówki — **autorskie ikony zamiast emoji**; rozbicie na wymiary (P1.4).
6. **Dowód/teatr** — wizualizacja synastrii (dwa koła + linie aspektów harmonijne/napięte) + przykładowy „wynik na wymiary". Sednowy obraz — pokazuje, czego nie da kalkulator znaków.
7. **Synastria vs horoskop pod znak** — tabela porównawcza (na czym oparte, personalizacja, głębia, wymiary).
8. **Powiązane** — Kosmogram (potrzebny najpierw), Kalendarz, Cosmo Chat. Linkowanie wewnętrzne.
9. **FAQ** — realne pytania (co to synastria, czy potrzebna godzina obu osób, czy działa dla przyjaźni/pracy, czym różni się od dopasowania znaków, czy to wróżenie).
10. **CTA końcowe** — „Zbadaj swoją relację" + utwórz konto za darmo.
11. **Footer** — DS (już jest).

# Wizual (DS)

- Fraunces + General Sans; tokeny DS; **bursztyn zamiast różu**; **terakota (`--tense`) tylko jako akcent „napięcia"** w wizualizacji/etykietach. Glify i ikony autorskie (zero emoji). Mikroruch jak na landingu v2.

# Grafika Higgsfield (krok 2)

- **Hero** — dwa nałożone rytowane koła z liniami aspektów (styl-anchor, środek otwarty). Job generowany w tym kroku.
- Reuse: glify/ikony rysuje kod; ewentualnie istniejące tła. Nowe generacje minimalnie.

# Mierniki

- Organic: pozycje „synastria/horoskop partnerski/dopasowanie znaków", ruch, CTR.
- Wiralność: share rate wyników (powiązane z P1.4 OG image).
- Konwersja: hero CTA → signup → pierwszy match (PostHog).

# Decyzje (przeniesione z Kosmogramu — do potwierdzenia tylko jeśli chcesz inaczej)

1. Keyword: szeroki „synastria / horoskop partnerski / kompatybilność znaków".
2. Treść: warstwowa.
3. Autorytet: techniczny (Swiss Ephemeris + AI), bez nazwiska ekspertki na razie.
