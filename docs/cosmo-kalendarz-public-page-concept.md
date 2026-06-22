---
title: Strona publiczna „Kalendarz" (/calendar) — koncepcja redesignu + SEO/GEO
type: concept
owner: Mac
created: 2026-06-13
companion: docs/design-system.md, docs/cosmogram-public-page-concept.md, docs/public-pages-audit.md
target-file: src/app/calendar/page.tsx
status: koncepcja + mockup (jak Kosmogram/Match/Chat)
---

# Po co ta strona

Landing pod **„Dni Mocy / kalendarz astrologiczny / pomyślne dni"** — i moduł retencyjny (codzienny powrót). Trzy zadania: konwersja, ranking, GEO. Decyzje przeniesione (szeroki keyword, warstwowo, autorytet techniczny). Plus zasady ([[feedback_copy_no_jargon_time_optional]]): zero żargonu w nagłówkach („tranzyty"), prawda o zależności (kalendarz wymaga kosmogramu), naturalny pełnozdaniowy copy.

# Co jest nie tak dziś

- **Off-brand kolor:** cała strona fioletowa (`#a78bfa`, `#7c3aed`) — łamie DS. Na bursztyn.
- **Cormorant**; **emoji** w kafelkach (⚡🪐🎯📅); tło `#050508`.
- **Żargon w nagłówkach/krokach:** „nanosi tranzyty planet", „Obliczamy tranzyty", „Tranzyty planet" — laik nie wie, co to. Korzyść > termin: „śledzimy, co planety robią teraz i jak to dotyka Twojego kosmogramu". „Tranzyt" wyjaśnić w FAQ.
- **Angielski cytat** „Timing is everything." na polskiej stronie — wymienić na polski.
- **Treść płytka + telegraficzna** (ten sam problem co reszta): brak definicji „czym są Dni Mocy", brak FAQ, brak danych strukturalnych, brak dowodu (jak wygląda Dzień Mocy), brak linkowania.

# Strategia SEO + GEO (z realnego intencu)

Z SERP: „Dni Mocy" to gorące hasło (dziennik.pl rankuje „kalendarz Dni Mocy 2026"), obok „kalendarz astrologiczny", „pomyślne/szczęśliwe dni", „dobre dni na decyzje/umowy", „tranzyty planet 2026", „astrokalendarz dzień po dniu". Konkurencja (dziennik, interia, proastro, astromagia, zwierciadlo) daje **„dobre dni dla wszystkich"** — kalendarz wspólny, nie osobisty.

**Nasz wyróżnik = personalizacja:** Dni Mocy liczone z **Twojego** kosmogramu, nie ogólne dla znaku. Dwie osoby = dwa różne kalendarze. To jest „wow, to liczy coś dla MNIE" (P1.3).

> ⚠️ Uczciwość: copy zakłada, że Dni Mocy są **realnie personalne** (z natalnych pozycji usera). Wg roadmapy to P1.3 (jeszcze do domknięcia — dziś mogą lecieć z samych wolnych planet, czyli wspólne). **Zanim ta strona pójdzie live, personalizacja musi być prawdziwa**, inaczej łamiemy zasadę „nie obiecuj nieprawdy". Flaga do CC/Maca.

**Klastry słów:** *Dni Mocy*, *kalendarz astrologiczny*, *pomyślne/dobre dni*, *najlepszy dzień na (decyzję/umowę/rozmowę)*, *tranzyty planet*. Long-tail: *kiedy podpisać umowę astrologia*, *dobry dzień na ważną rozmowę*, *Dni Mocy 2026*.

**Taktyki GEO:** definicja-first („Czym są Dni Mocy?"), FAQ (FAQPage), tabela „Twoje Dni Mocy vs dobre dni dla wszystkich", encje (Dzień Mocy, tranzyt, okno tematyczne), JSON-LD, linkowanie do Kosmogramu (warunek), Chat, Match.

# Kąt komunikacji

„**Przestań działać na ślepo**" (headline zostaje, mocny). Podpieramy: kalendarz nakłada ruch planet na Twój kosmogram i wskazuje **Twoje** Dni Mocy — kiedy działać, kiedy odpuścić. Killer-feature: **„Kiedy najlepiej…?"** (nowy biznes / miłość / pieniądze / rozmowa / odpoczynek) — okna tematyczne.

# Architektura (warstwy)

1. **Hero** — H1 „Przestań działać na ślepo". Sub po ludzku (kalendarz pokazuje, kiedy niebo Ci sprzyja — Twoje Dni Mocy, nie wróżby dla znaku). CTA „Zobacz swoje Dni Mocy". Reassurance prawdziwie: „Najpierw wygeneruj kosmogram — za darmo — kalendarz liczy się z Twojego układu". Tło: grafika Higgsfield (koło roku).
2. **Definicja (GEO)** — „Czym są Dni Mocy?" 2–3 zdania.
3. **Co dostajesz** — Twoje Dni Mocy / okna tematyczne („Kiedy najlepiej…?") / ruch planet / widok dzień–tydzień–miesiąc–rok — **bez emoji, bez żargonu**, autorskie ikony, pełne zdania.
4. **Dowód/teatr** — **przykładowy Dzień Mocy** (kafel: data + temat + jedno zdanie po ludzku + „na podstawie" dyskretnie). Pokazuje, jak to wygląda i czym różni się od „dobrych dni dla wszystkich".
5. **Jak to działa** — 3 kroki, de-żargon.
6. **Twoje Dni Mocy vs dobre dni dla wszystkich** — tabela.
7. **Polski cytat/akcent** — zamiast „Timing is everything" (np. o wyczuciu momentu, po polsku).
8. **Powiązane** — Kosmogram (wymagany), Cosmo Chat (dopytaj o dzień), Horoskop dzienny.
9. **FAQ** — co to Dni Mocy, czy są moje czy dla wszystkich, co to tranzyt, czy potrzebny kosmogram/godzina, czy to wróżenie, jak często sprawdzać.
10. **CTA** — „Zacznij planować z głową" + utwórz konto za darmo + mikro-trust (bez karty, prywatność).
11. **Footer** — DS.

# Wizual (DS)

Fraunces + General Sans; tokeny; **bursztyn zamiast fioletu**; terakota tylko jako akcent „intensywny/napięty" dzień. Ikony pogody dnia / okien rysuje kod (☀/⚡/☾ jak w prognozie), zero emoji. Mikroruch (koło roku obraca się powoli), reduced-motion respektowane.

# Grafika Higgsfield (krok 2)

- **Hero** — rytowane koło roku z zaznaczonymi „dniami". Job w tym kroku. Reuse: ikony pogody/okien rysuje kod; ewentualnie istniejący `year-wheel` z prognozy.

# Decyzje (przeniesione; nowa flaga)

1. Keyword: „Dni Mocy / kalendarz astrologiczny / pomyślne dni".
2. Treść: warstwowa.
3. Autorytet: techniczny.
4. **Flaga P1.3:** personalizacja Dni Mocy musi być realna przed publikacją (inaczej copy nieuczciwe).
