---
title: Copy podstron — optymalizacja (audyt + propozycje)
type: copy-brief
owner: Mac
last_updated: 2026-06-26
status: do akceptacji Maca → potem wdrożenie w Claude Code
---

# Copy podstron — audyt i propozycje

Cała copy tu to **propozycja do Twojej akceptacji** (copy widoczne dla usera). Po akceptacji wdraża Claude Code w TSX. Źródło danych w całym serwisie: **„NASA" jako główna nazwa, Swiss Ephemeris tylko jako rozwinięcie w paru miejscach** (decyzja 2026-06-26).

## Audyt — szczerze

Większość copy jest dobra i zostaje. Hero („Horoskop, który naprawdę jest o Tobie"), sekcje home, match, chat, kalendarz i `/cosmogram` trzymają poziom i głos. Nie przepisuję dobrych tekstów. Realne problemy są trzy, poniżej.

| # | Problem | Gdzie | Waga |
|---|---|---|---|
| A1 | Połamana polszczyzna w **JSON-LD FAQ** (Google i AI to czytają) | `pricing/page.tsx` ~76–95 | 🔴 |
| A2 | Niespójne źródło danych (NASA vs Swiss Ephemeris) | `/cosmogram`, `/how-ai-works` | 🟠 |
| A3 | Nadmiar myślników „—" (tell AI) | cała copy landingu | 🟡 |
| B | `for-kids` to stub (46 linii, stary styl), nie pełny landing | `for-kids/page.tsx` | 🟠 |

---

# Track A — fixy (before → after)

## A1 — Pricing: zsynchronizuj JSON-LD FAQ z widoczną treścią

W `pricing/page.tsx` jest **podwójne FAQ**: widoczne (linie ~432–448, **poprawne**) i schema JSON-LD (~76–95, **bez polskich znaków**). Google/AI czytają schema → w wynikach widać „moge", „bezplatny", „zl". Fix: przepisz stringi schema na poprawne (najlepiej współdziel jedną tablicę FAQ między schema a renderem, żeby nie rozjeżdżały się znowu).

```
PRZED (schema, ~76–95):
  "Czy moge korzystac za darmo?"
  "Tak - plan Free jest bezplatny na zawsze: pelny kosmogram z kolem, pierwszy rozdzial interpretacji, jeden Cosmo Match i kilka pytan do Astrei."
  "24,99 zl miesiecznie lub 199 zl rocznie (oszczedzasz ~33%). Ceny brutto, bez ukrytych kosztow."
  "Czy moge anulowac w kazdej chwili?"
  "Tak - anulujesz jednym kliknieciem i zachowujesz dostep do konca oplaconego okresu."

PO (= zsynchronizuj z widoczną wersją, linie ~432–448):
  "Czy mogę korzystać za darmo?"
  "Tak. Plan Free jest bezpłatny na zawsze: pełny kosmogram z kołem, pierwszy rozdział interpretacji, jeden Cosmo Match i kilka pytań do Astrei. Konto zakładasz bez karty."
  "24,99 zł miesięcznie lub 199 zł rocznie (16,58 zł/mc, oszczędzasz ~33%). Ceny brutto, bez ukrytych kosztów."
  "Czy mogę anulować w każdej chwili?"
  "Tak. Subskrypcję anulujesz jednym kliknięciem w ustawieniach i zachowujesz dostęp do końca opłaconego okresu."
```

Rekomendacja techniczna dla CC: jedna tablica `FAQ_ITEMS` zasilająca i `FAQPage` JSON-LD, i render. Eliminuje rozjazd na stałe.

## A2 — Źródło danych: „NASA" wszędzie, Swiss Ephemeris jako rozwinięcie

Reguła: w treści głównej i FAQ piszemy **„dane astronomiczne NASA"**. Swiss Ephemeris pojawia się tylko jako rozwinięcie „co to znaczy", w `how-ai-works` (i opcjonalnie w FAQ `/cosmogram`). To prawda: Swiss Ephemeris bazuje na efemerydach NASA JPL.

- **Home (HeroSky, SectionHow, SectionFaq):** już mówią „NASA". Zostaw.
- **`/cosmogram` (HowTo + FAQ + JSON-LD):** zmień „Swiss Ephemeris" → „dane astronomiczne NASA". W FAQ „Skąd biorą się obliczenia?":
  > Z danych astronomicznych NASA (efemeryd NASA JPL), na których opiera się Swiss Ephemeris, standard zawodowych astrologów. Interpretację pisze Astrea po polsku, dla Twojego konkretnego układu.
- **`/how-ai-works` (to jest miejsce na rozwinięcie):**
  ```
  PRZED: "Obliczenia astronomiczne opieramy na Swiss Ephemeris — bibliotece uznawanej za standard w profesjonalnej astrologii i astronomii."
  PO:    "Pozycje planet liczymy z danych astronomicznych NASA (efemerydy NASA JPL). Pod spodem korzystamy ze Swiss Ephemeris, biblioteki uznawanej za standard w profesjonalnej astrologii. To te same dane, na których pracują zawodowi astrolodzy."
  ```

## A3 — Przejazd po myślnikach

Reguła z `BLOG-playbook.md`: zero „—" w copy (tell AI). Zamień na kropkę, przecinek, dwukropek albo przebuduj. Przykład na hero (HeroSky, subcopy):

```
PRZED: "Astrea — nasza AI tworzona razem z astrologami — zamienia je w portret..."
PO:    "Astrea, nasza AI tworzona razem z astrologami, zamienia je w portret..."
```

CC: przejazd po `components/landing/*` i stronach funkcji, ten sam wzorzec. Nie zmieniać treści, tylko interpunkcję.

---

# Track B — `for-kids`: z stubu w pełny landing

`for-kids/page.tsx` to dziś 46 linii placeholdera na starym stylu (`bg-[#03010d]`, Tailwind slate), nie na design systemie. Zbuduj go jak `/cosmogram` (tokeny, Fraunces, struktura sekcji + JSON-LD). Poniżej gotowa copy. Głos: ciepły, do rodzica, forma neutralna, bez myślników, rama „zrozumieć, nie zaszufladkować".

### Hero
- eyebrow: `DLA RODZICÓW`
- H1: **Kosmogram dziecka**
- linia gradientowa pod H1: *mapa jego natury, od pierwszego oddechu*
- subcopy:
  > Każde dziecko przychodzi na świat z gotowym temperamentem, którego nie wybierało. Kosmogram pomaga go zobaczyć: jak Twoje dziecko czuje, czego potrzebuje, żeby było mu bezpiecznie, i co je naturalnie ciągnie. Nie po to, żeby je zaszufladkować. Po to, żeby mniej zgadywać, a lepiej rozumieć.
- CTA: `Stwórz kosmogram dziecka, za darmo`
- pod CTA: `Bez karty · wystarczy data i miejsce urodzenia dziecka`

### Definicja (snippet bait, GEO)
> Kosmogram dziecka to ta sama mapa nieba co u dorosłych, czytana pod kątem rodzica: temperamentu, potrzeb emocjonalnych i naturalnych predyspozycji. Powstaje z daty, miejsca i, jeśli ją znasz, godziny urodzenia dziecka. Nie ocenia i nie diagnozuje. Daje język do rozmowy o tym, kim Twoje dziecko już jest.

### Co odczytasz (3 karty)
1. **Temperament i emocje.** Jak Twoje dziecko reaguje, co je uspokaja, a co przebodźcowuje. Czemu jedno potrzebuje ruchu, a inne ciszy.
2. **Potrzeby i poczucie bezpieczeństwa.** Czego potrzebuje, żeby czuć się kochane i pewne. Jak okazywać mu bliskość w sposób, który do niego trafia.
3. **Talenty i ciekawość.** W którą stronę naturalnie ciągnie, jak się uczy, gdzie szukać dla niego przestrzeni do rozwoju.

### Jak to działa (3 kroki)
1. **Podaj dane dziecka.** Data i miejsce wystarczą. Godzinę, jeśli ją znasz, dodasz dla pełniejszego portretu.
2. **Liczymy niebo z tamtej chwili.** Pozycje planet z danych astronomicznych NASA, co do stopnia.
3. **Astrea pisze portret dla rodzica.** Po polsku, ciepło i konkretnie, językiem potrzeb, nie wróżby.

### FAQ (→ FAQPage schema)
- **Po co dziecku kosmogram?** Nie dziecku, a Tobie. To narzędzie dla rodzica: pomaga wcześniej zrozumieć temperament i potrzeby, zamiast uczyć się ich metodą prób i błędów.
- **Czy to nie szufladkowanie dziecka?** Odwrotnie. Kosmogram nie mówi, kim dziecko ma być. Pokazuje, z czym przyszło na świat, żebyś wspierał_a je tam, gdzie jest, a nie tam, gdzie wygodniej.
- **Od jakiego wieku ma sens?** Od urodzenia. Najwięcej daje rodzicom małych dzieci, które jeszcze nie potrafią nazwać swoich potrzeb.
- **Czy potrzebna jest godzina urodzenia?** Nie jest konieczna. Bez niej dostajesz pełny portret z pozycji planet. Godzina dodaje warstwę tego, co wschodziło na horyzoncie, i obszary życia.
- **Czy to wróżenie?** Nie. To symboliczne lustro i punkt wyjścia do rozmowy, nie przepowiednia ani diagnoza. Treści mają charakter refleksyjny i nie zastępują porady psychologicznej ani pedagogicznej.

### Techniczne (dla CC)
- Struktura i tokeny jak `/cosmogram` (DS, Fraunces, `--grad-ember` na CTA). Wyrzuć stary `bg-[#03010d]`/slate.
- JSON-LD: `WebPage` + `BreadcrumbList` + `FAQPage` + `SoftwareApplication` (jak inne landingi).
- `metadata`: zostaw canonical `/for-kids`; tytuł i description OK, ewentualnie dociągnij OG image.
- Dyskalimer w stopce sekcji (YMYL: dziecko + psychologia → ważne).

---

# Decyzje / uwagi dla Maca

- Cała powyższa copy = do Twojej akceptacji przed wdrożeniem (reguła „copy = zgoda Maca").
- A1 (pricing schema) i A3 (myślniki) to czyste fixy, niskie ryzyko.
- A2: potwierdź, że „dane astronomiczne NASA" to claim, pod którym chcesz się podpisać (jest obronialny: Swiss Ephemeris → NASA JPL).
- B: to jedyny realny rewrite. Reszta podstron = zostaje.
