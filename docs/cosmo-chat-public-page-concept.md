---
title: Strona publiczna „Cosmo Chat" (/cosmo-chat) — koncepcja redesignu + SEO/GEO
type: concept
owner: Mac
created: 2026-06-13
companion: docs/design-system.md, docs/cosmogram-public-page-concept.md
target-file: src/app/cosmo-chat/page.tsx
status: koncepcja + mockup (jak Kosmogram i Match)
---

# Po co ta strona

Landing pod **„astrolog AI / osobisty asystent astrologiczny / czat astrologiczny"** — kategoria młoda i szybko rosnąca. Trzy zadania jak na pozostałych stronach: konwersja, ranking w Google, cytowalność w AI (GEO). Decyzje przeniesione (zatwierdzone): szeroki keyword, treść warstwowa, autorytet techniczny bez nazwiska. Plus świeże zasady ([[feedback_copy_no_jargon_time_optional]]): **zero żargonu w nagłówkach/kartach** (na tej stronie głównie „aspekty", „tranzyty") i **prawda o zależności** (chat wymaga wygenerowanego kosmogramu — podać po ludzku, nie jako barierę).

# Co jest nie tak dziś

- **Off-brand kolor:** cała strona zielona (`#4ade80`, `#22c55e`) — łamie DS. Ujednolicamy na bursztyn.
- **Cormorant** zamiast Fraunces; tło `#050508`; ikony/„✓/✕" zielono-czerwone.
- **Żargon w kartach:** „uwzględnia Twoje planety, aspekty i tranzyty" — laik nie wie, co to. Korzyść > termin: „uwzględnia Twój układ planet i to, co dzieje się na niebie teraz".
- **Treść dobra, ale płytka pod SEO/GEO:** brak definicji „czym jest astrolog AI / Cosmo Chat", brak FAQ, brak danych strukturalnych, brak linkowania wewnętrznego. (Sekcje „o co pytać", „cechy", „my vs generyczny chatbot" są mocne — zostają, tylko w DS i bez żargonu.)
- **Brak osobowości:** chat w produkcie ma imię — **Astrea**. Strona mówi bezosobowo „astrolog AI". Wprowadzenie Astrei dodaje ciepła i odróżnia od generyków.

# Strategia SEO + GEO (z realnego intencu)

Konkurencja (astrolog.ai, czat.ai/Astrolog.ai, mayana.pl, AstroCzat, magiczne.ai) to w większości **generyczne GPT-astrologi na samej dacie urodzenia**. Nasz wyróżnik: odpowiedzi **osadzone w policzonym kosmogramie** usera (nie w znaku), **pamięć rozmowy**, polski, wiedza astrologiczna + psychologiczna.

**Klastry słów:** *astrolog AI*, *osobisty doradca/asystent astrologiczny AI*, *czat astrologiczny*, *zapytaj astrologa online*, *astrologia AI po polsku*, *horoskop AI*. Long-tail: *czy AI może być astrologiem*, *chat o relacjach/karierze wg kosmogramu*.

**Taktyki GEO:** definicja-first („Czym jest Cosmo Chat / astrolog AI?"), FAQ (FAQPage), tabela „astrolog AI z kontekstem vs generyczny chatbot" (mamy ją — wzmocnić), jasne encje (Astrea, kosmogram, kontekst), JSON-LD (`WebPage`+`BreadcrumbList`+`FAQPage`+`SoftwareApplication`), linkowanie do Kosmogramu (warunek wstępny), Match, Kalendarza.

# Kąt komunikacji

„**Inni chatboci mówią ogólnie. Astrea mówi o Tobie.**" Headline „Twój prywatny astrolog AI" zostaje (mocny). Podpieramy konkretem: odpowiedzi z Twojego kosmogramu, nie ze znaku; pamięta, o czym rozmawialiście; ton jak przyjaciel z wiedzą. Bezpieczeństwo: przy tematach zdrowia psychicznego empatyczne przekierowanie do specjalisty (spójne z disclaimerem i P1.5).

# Architektura strony (warstwy)

1. **Hero** — H1 „Twój prywatny astrolog AI". Sub po ludzku (rozmawiasz z Astreą, która zna Twój kosmogram; odpowiedzi z Twojego układu, nie ze znaku; pamięta kontekst). CTA „Zacznij rozmowę". Reassurance prawdziwie: „Najpierw wygeneruj kosmogram — za darmo — a Astrea pozna Twój układ". Tło: grafika Higgsfield (mgławica-obecność).
2. **Definicja (GEO)** — „Czym jest Cosmo Chat?" 2–3 zdania: astrolog AI, który czyta z Twojego kosmogramu i pamięta rozmowę.
3. **O co możesz pytać** — przykłady z tagami (Relacje/Kariera/Rozwój/Komunikacja) — zostają, w bursztynie. Pokazują realne intencje (i są keyword-bogate).
4. **Cechy** — Głęboka wiedza / Osadzony w Twoim kosmogramie / Naturalny dialog (pamięć) — **bez żargonu**, ikony autorskie.
5. **Astrolog AI z kontekstem vs generyczny chatbot** — tabela porównawcza (mamy listę — przekształcić w czytelną tabelę, bursztyn/terakota).
6. **Jak to działa** — krótko: wygeneruj kosmogram → zacznij rozmowę → Astrea pamięta i pogłębia. (zdejmuje obiekcję „dlaczego najpierw kosmogram").
7. **Powiązane** — Kosmogram (wymagany najpierw), Cosmo Match, Kalendarz.
8. **FAQ** — realne pytania (czy AI zastępuje astrologa, skąd zna mój kosmogram, czy pamięta rozmowy, czy to wróżenie, czy o zdrowie/decyzje życiowe — granice bezpieczeństwa).
9. **CTA końcowe** — „Zadaj pierwsze pytanie" + utwórz konto za darmo.
10. **Footer** — DS.

# Wizual (DS)

Fraunces + General Sans; tokeny; **bursztyn zamiast zieleni**; terakota tylko jako „✕" w tabeli kontra. Ikony i glify autorskie (zero emoji). Subtelny mikroruch w hero (mgławica), `prefers-reduced-motion` respektowane.

# Grafika Higgsfield (krok 2)

- **Hero** — świetlista rytowana mgławica/orb z otwartym środkiem (obecność Astrei). Job w tym kroku. Reuse: ikony rysuje kod.

# Decyzje (przeniesione — do potwierdzenia tylko jeśli inaczej)

1. Keyword: „astrolog AI / asystent astrologiczny / czat astrologiczny".
2. Treść: warstwowa.
3. Autorytet: techniczny (kosmogram + AI), bez nazwiska ekspertki.
4. **Nowe:** wprowadzić imię asystenta **Astrea** na stronie publicznej (spójność z produktem) — rekomendacja: tak.
