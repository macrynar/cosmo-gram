---
title: Cosmogram — Strategia biznesowa v1
type: business-strategy
owner: Mac
created: 2026-06-21
analyst: Business Strategist (tryb Deep)
stage: Bootstrap
---

# Werdykt (przeczytaj to, reszta jest dowodem)

Cosmogram to bootstrap, firma na własnych pieniądzach. W bootstrapie optymalizujesz przepływ gotówki i marżę, nie tempo wzrostu. I tu jest niewygodna prawda: **akwizycja nie jest Twoim głównym ryzykiem. Retencja, marża i brak fosy są.**

Trzy liczby, które to ustawiają:
1. Marża kontrybucyjna to ~16 zł z subskrypcji 19,99 (80%). Zdrowo, ale wszystko zależy od tego, jak długo płatnik zostaje.
2. Próg rentowności samej infrastruktury to ~50 płatnych miesięcznych. Twój cel „100 płatnych" to nie sukces, to moment, w którym infra plus skromny marketing wychodzą na zero.
3. LTV waha się od 64 zł (churn 25%/mc) do 201 zł (churn 8%/mc), zależnie wyłącznie od churnu. W tej kategorii churn bywa wysoki. Powyżej ~15%/mc biznes się nie spina, choćby akwizycja była darmowa.

Cała strategia sprowadza się do trzech ruchów: utrzymać churn poniżej 15%/mc, wypchnąć plan roczny (gotówka z góry plus zabity churn), wyprodukować fosę, bo z definicji rynku jej nie masz.

---

# Kontekst (założenia, popraw jeśli któreś nie pasuje)

- **Etap: Bootstrap.** JDG, własne środki, infra ~200-500$/mc, marketing 500-2000 zł/mc. Cel: gotówka i marża, niska tolerancja ryzyka.
- **Model:** subskrypcja 19,99/mc, 149/rok, add-ony, freemium.
- **Pozycja:** pre-launch, feedback dobry, płatności i legal gotowe.
- **Cel z briefu:** 100 płatnych do XI 2026, 500-1000 do V 2027, potem decyzja skalowanie vs lifestyle.

---

# 1. Diagnoza unit economics — Auditor
*Frameworki: LTV/CAC (Skok), Contribution Margin i Break-even (Standard Economics)*

**Marża kontrybucyjna:**

| Plan | Cena | Marża kontrybucyjna |
|---|---|---|
| Miesięczny | 19,99 zł | ~16 zł / mc (80%) |
| Roczny | 149 zł | ~106 zł z góry, plus niższe ryzyko churnu |

**Próg rentowności (ilu płatnych pokrywa koszt stały):**

| Koszt stały | Płatni do break-even |
|---|---|
| Infra sama (~800 zł/mc) | ~50 |
| Infra + marketing 1500 | ~143 |
| Infra + marketing 2000 | ~174 |

**LTV wg churnu — najważniejsza tabela w całym dokumencie:**

| Churn / mc | Życie płatnika | LTV | Sufit CAC (3x) |
|---|---|---|---|
| 8% | 12,5 mc | 201 zł | 67 zł |
| 10% | 10 mc | 161 zł | 54 zł |
| 15% | 6,7 mc | 107 zł | 36 zł |
| 20% | 5 mc | 80 zł | 27 zł |
| 25% | 4 mc | 64 zł | 21 zł |

Czytaj to tak: spadek churnu z 20% na 10% podwaja LTV bez wydania złotówki na akwizycję. Każdy punkt churnu jest wart więcej niż każdy nowy user. To jest powód, dla którego retencja, a nie pozyskiwanie, jest centrum tej strategii.

**Ukryte ryzyko marży:** koszt AI rośnie z zaangażowaniem. Power user, który dużo rozmawia z Astreą (Sonnet) i generuje matche, potrafi zjeść marżę. Macie już hamulec (free 3 wiadomości lifetime, chat pack jako add-on) i to dobra decyzja. Pilnuj kosztu AI na aktywnego płatnika jako twardej metryki. Powyżej ~4-5 zł/mc marża zaczyna się sypać.

---

# 2. Struktura rynku — Cartographer
*Framework: Five Forces (Porter)*

| Siła | Poziom | Dowód |
|---|---|---|
| Substytuty | **Wysoki** | darmowe horoskopy, Co-Star, Astrolada, astro-twórcy na IG. Klient ma sto darmowych alternatyw. |
| Nowi wchodzący | **Wysoki** | AI jest skomodytyzowane. Apkę „AI horoskop" da się postawić w miesiąc. Bariera wejścia niska. |
| Siła nabywców | **Wysoki** | zerowy koszt przełączenia, subskrypcję anuluje się jednym kliknięciem. |
| Siła dostawców | Średni | zależność od Anthropic/OpenAI, ale modele konkurują o Ciebie. |
| Rywalizacja | Średni | w PL brak dominującego gracza AI-astro (okno), globalni mają kapitał. |

Brutalna konkluzja: trzy z pięciu sił są wysokie. To rynek, który z definicji nie daje fosy. Wygrasz nie strukturą rynku, tylko tym, co sam zbudujesz.

---

# 3. Gdzie jest Power, czyli fosa do zbudowania
*Framework: 7 Powers (Helmer)*

Szczera ocena: domyślnie nie masz żadnej z siedmiu sił. Realne kandydatki do zbudowania:

- **Brand (Astrea).** Jedyna realna na starcie. Ciepły, polski, nazwany głos. Ludzie wracają do osoby, nie do „modelu AI". Inwestuj w to mocno.
- **Cornered resource (partnerka-astrolożka + biblioteka promptów).** Jej głos i wiedza wbudowane w prompty to coś, czego kopista nie odtworzy szybko. Twój najtwardszy aktyw. Zabezpiecz partnerstwo formalnie.
- **Counter-positioning.** Jesteś przeciw generykowi (gazeta) i przeciw tradycyjnej astrologii (Astrolada). Pozycja, której duzi nie skopiują bez kanibalizacji własnego modelu.
- **Switching cost (dziś słaby, do zbudowania).** Historia odczytów, streak, dziennik, zapisane kosmogramy bliskich. Im więcej user zapisze, tym drożej mu odejść. Dziś prawie zero.

Network effects i scale economies: realnie zero na tym etapie. Share-loop to dystrybucja, nie efekt sieciowy (nowy user nie czyni produktu lepszym dla istniejących).

**Wniosek strategiczny:** musisz wyprodukować fosę, bo rynek Ci jej nie da. Energia P0 i P1 idzie w retencję i switching cost, bo to jednocześnie ratuje unit economics i buduje Power.

---

# 4. Pozycjonowanie — ERRC
*Framework: Blue Ocean / Strategy Canvas (Kim, Mauborgne)*

- **Eliminuj:** generyczne horoskopy ze znaku, predykcję, żargon.
- **Zredukuj:** cenę vs apki zachodnie, próg wejścia (godzina opcjonalna).
- **Podnieś:** indywidualność (pełny kosmogram), polską autentyczność, głos eksperta.
- **Stwórz:** Astrea jako rozmowa, share pełnego kosmogramu, indywidualne Dni Mocy.

Spójne z tym, co już macie. Trzymać kurs.

---

# 5. Cennik — Pricer
*Frameworki: JTBD (Christensen), Anchoring (Kahneman, Tversky), Van Westendorp*

Jesteś niedowartościowany. Twoja płacąca persona (Świadoma Sceptyczka 25-40) płaci 25-40 zł za Calm, Headspace, Duolingo. 19,99 zł zostawia marżę na stole, a w bootstrapie marża to tlen.

**Ruch: przetestuj 24,99 zł/mc.** Podnosi marżę kontrybucyjną z 16 do 21 zł (+30%) bez kiwnięcia palcem w akwizycji. Przy elastyczności konsumenckiej subskrypcji 25 zł nie odstrasza tej persony.

**Kotwica: plan roczny to Twój najlepszy przyjaciel** (gotówka z góry, zabity churn). Ustaw go jako oczywisty wybór. Przy 24,99/mc roczny 199 zł to czytelna kotwica „prawie 3 miesiące gratis". Pchaj miks w stronę rocznego, bo to równocześnie gotówka i retencja.

**Uwaga segmentacyjna:** content celuje w Eksploratorkę 18-35 (niższe WTP, zasięg), a płaci rdzeń Sceptyczek 25-40 (wyższe WTP). Cena jest kalibrowana pod płacących, nie pod top-funnel. Nie obniżaj jej pod Eksploratorkę. Konwertuj ją wartością.

---

# 6. Strategia i ruchy — Architect (priorytety, nie daty)
*Frameworki: North Star + Growth Loop (Balfour, Ellis), Four Fits*

**North Star: retencja płatnych 30 dni** (z briefu, słusznie). Kontr-metryka: MRR. Nie MAU, nie liczba rejestracji. To vanity, dopóki ludzie nie zostają i nie płacą.

**Growth loop:** content → rejestracja → odczyt „wow" → share pełnego kosmogramu → nowy content. Pętla dystrybucji, darmowa, prawdziwa.

### P0 — Przeżycie (zanim wydasz złotówkę na skalowanie)
- **Silnik retencji jako priorytet zero:** push (PWA), streak, dziennik przy Dniach Mocy, powód, by wrócić w tygodniu. Dziś to siedzi na liście P1-P3. W bootstrapie z wysokim churnem to musi iść pierwsze.
- **Push planu rocznego od dnia 1.** Gotówka z góry plus hedge na churn.
- **Instrumentacja:** churn płatnych, koszt AI na aktywnego, free→paid, retencja kohort. Bez tego lecisz na ślepo.
- **Pierwszy milestone to ~50 płatnych** (break-even infry), nie 100.

### P1 — Rentowność i fosa
- **Switching cost:** historia, dziennik, zapisane kosmogramy bliskich. Im więcej zapisane, tym drożej odejść.
- **Test ceny 24,99 + agresywny roczny.**
- **Growth loop dokręcony** (share-loop, Astrea jako powód powrotu).
- **Cel ~100-150 płatnych:** infra plus marketing wychodzą na zero, biznes finansuje się sam.

### P2 — Rozwidlenie: skalowanie czy lifestyle
- **Bramka decyzji:** jeśli przy ~150 płatnych churn < 12%/mc, CAC < 30 zł i retencja kohort rośnie, masz fundament do skalowania (z ~150 do ~1000 płatnych). Jeśli churn uparcie > 18% mimo prób, to jest lifestyle business, nie startup. Oba są w porządku, ale wymagają innych decyzji (reinwestycja vs dojenie marży).

---

# 7. Ryzyka i pre-mortem
*Frameworki: Inversion (Munger), Second-Order Thinking (Marks)*

Jak ten biznes umiera (pięć najczęstszych dróg):

1. **Churn zjada wszystko.** User generuje kosmogram, mówi „ciekawe", anuluje po miesiącu. Bez nawyku produkt jest jednorazowy. Mitygacja: retencja w P0, codzienny powód powrotu, push.
2. **Marża AI się sypie.** Power userzy rozmawiają na Sonnecie, koszt na usera rośnie szybciej niż przychód. Mitygacja: limity (macie), monitoring kosztu/usera, tańszy model gdzie się da.
3. **Kopista.** Ktoś z budżetem widzi trakcję i klonuje w dwa miesiące. Bez fosy przegrywasz na samym marketingu. Mitygacja: cornered resource (astrolożka), brand Astrea, switching cost.
4. **Pasmo founder-a.** Jeden operator, 5-7h/tyg, robi produkt, marketing i retencję naraz. Wąskim gardłem jesteś Ty. Mitygacja: partnerstwo, automatyzacja contentu, jedna rzecz naraz.
5. **Zależność od platformy.** TikTok zmienia algorytm, organiczny zasięg pada. Mitygacja: zbieraj email od dnia 1, buduj własny kanał, nie wynajmuj całej dystrybucji.

---

# 8. Decyzje dla Ciebie

1. **Cennik.** Zamknij rozjazd (19,99/149 vs 19,90/199) i zdecyduj o teście 24,99 + roczny jako kotwica. To najwyższa dźwignia marży, jaką masz pod ręką.
2. **Retencja jako P0.** Zgoda, że push, streak i dziennik idą przed nowymi funkcjami? Dziś są na P1-P3.
3. **Partnerstwo.** Sformalizuj rolę astrolożki. To Twoja fosa, nie może wisieć na słowo.
4. **Definicja zwycięstwa na launch.** Celujemy w break-even (~50 płatnych) czy w zasięg? To zmienia, co mierzymy od pierwszego dnia.

---

*Frameworki użyte: LTV/CAC (Skok), Contribution Margin i Break-even, Five Forces (Porter), 7 Powers (Helmer), Blue Ocean ERRC (Kim, Mauborgne), JTBD (Christensen), Anchoring (Kahneman, Tversky), North Star i Growth Loops (Balfour, Ellis), Inversion (Munger), Second-Order Thinking (Marks).*
