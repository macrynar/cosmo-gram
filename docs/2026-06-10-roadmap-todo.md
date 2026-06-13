---
title: Cosmogram — TODO: kolejność wdrożeń do komercyjnego startu
type: roadmap
owner: Mac
created: 2026-06-10
context: pre-launch, solo, bez terminów — liczy się kolejność, nie kalendarz
---

# Kolejność działań — logika

Kolejność wynika z jednej zasady: **najpierw to, bez czego nie wolno sprzedawać (P0), potem to, co sprzedaje (P1 — wow), potem to, co zatrzymuje (P2 — retencja), na końcu to, co przyprowadza (P3 — wzrost).** Marketing przed dopracowaniem wow to palenie pieniędzy — ruch trafi na produkt, który nie konwertuje, a drugiej szansy na pierwsze wrażenie nie będzie.

Wykonuj po kolei w ramach priorytetu — numeracja to sugerowana kolejność.

---

# P0 — Blockery komercyjnego startu (prawne, bezpieczeństwo, stabilność)

## P0.1 — Dane osobowe a DeepSeek (najpoważniejszy problem prawny projektu)

Imię, data, godzina i miejsce urodzenia to dane osobowe w rozumieniu RODO. Obecnie lecą one w promptach do API DeepSeek — dostawcy spoza EOG, bez decyzji adekwatności UE. To realne ryzyko prawne i wizerunkowe ("polska apka astro wysyła dane urodzenia do Chin" to gotowy nagłówek).

Rozwiązanie tanie i skuteczne — **pseudonimizacja promptów**:

- [ ] Nie wysyłać do modelu imienia ani surowych danych urodzenia. Model dostaje wyłącznie obliczone pozycje planet, domy i aspekty (Swiss Ephemeris liczy je lokalnie — to już masz). Imię wstawiać do treści po stronie aplikacji (template), nie w prompcie.
- [ ] Audyt wszystkich endpointów AI (natal, child, match, chat, horoscope) pod kątem tego, co dokładnie trafia do promptu. Chat jest najtrudniejszy — user sam wpisuje dane osobowe; dodać do polityki prywatności jasną informację i ostrzeżenie w UI chatu.
- [ ] Decyzja długoterminowa: zostawić DeepSeek po pseudonimizacji vs przejść na model hostowany w UE/USA z DPA (to też decyzja jakościowa — patrz P1.1).

## P0.2 — Dokumenty prawne i zgodność konsumencka

- [ ] **Regulamin** (świadczenie usług drogą elektroniczną): zakres usługi, konto, subskrypcja, odpowiedzialność, reklamacje. Wygeneruj draft AI → weryfikacja przez prawnika (jednorazowy koszt, nie pracownik — mieści się w modelu solo).
- [ ] **Polityka prywatności**: pełna lista procesorów (Supabase, Vercel, Stripe, Resend, DeepSeek, PostHog), cele, podstawy prawne, transfery poza EOG, okresy retencji, prawa użytkownika.
- [ ] **Zgody cookies / consent banner**: PostHog nie może startować przed zgodą (tryb opt-in lub cookieless do czasu zgody). Sprawdzić czy PostHog jest na serwerach EU (posthog.eu).
- [ ] **Disclaimer charakteru usługi** widoczny przy rejestracji i w stopce: treści mają charakter refleksyjno-rozrywkowy, nie stanowią porady medycznej, psychologicznej, prawnej ani finansowej. Spójne z pozycjonowaniem „symboliczne lustro" — to nie tylko ochrona prawna, to wzmocnienie marki.
- [ ] **Prawo odstąpienia od treści cyfrowych**: przy checkout checkbox zgody na natychmiastowe rozpoczęcie świadczenia + informacja o utracie prawa odstąpienia (art. 38 ustawy o prawach konsumenta). Bez tego konsument może żądać zwrotu przez 14 dni mimo korzystania.
- [ ] Dane podmiotu (NIP, adres) w stopce i regulaminie; ceny prezentowane brutto.
- [ ] Usuwanie konta przez usera (RODO art. 17) — pełny kasujący flow w `/app/settings/privacy`, łącznie z danymi w Stripe/Resend. Plus eksport danych (art. 20) — może być prosty JSON.

## P0.3 — Podatki i Stripe na produkcji

- [ ] Włączyć **Stripe Tax** (VAT liczony automatycznie; przy sprzedaży konsumentom w innych krajach UE — rejestracja VAT OSS).
- [ ] Faktury/rachunki automatyczne ze Stripe (invoice settings) — konsument może zażądać.
- [ ] Przetestować pełny cykl życia subskrypcji na test mode: zakup → odnowienie → nieudana płatność (dunning) → anulowanie → wygaśnięcie → ponowny zakup. Webhook musi poprawnie obsłużyć każdy stan.

## P0.4 — Bezpieczeństwo

- [ ] **Audyt RLS**: dla każdej tabeli test negatywny — zalogowany jako user A próbuję czytać/pisać dane usera B (saved_readings, children, astro_matches, calendar_notes, user_preferences, subscriptions). Skrypt testowy, nie ręcznie — odpalany po każdej migracji.
- [ ] **Rate limiting na wszystkich endpointach AI** — bez tego jeden skrypt może wygenerować rachunek za API na tysiące złotych. Limit per user + per IP (np. Upstash Ratelimit, działa na Vercel edge).
- [ ] Weryfikacja, że limity free (1 kosmogram, 1 match) są egzekwowane **po stronie serwera**, nie tylko w UI.
- [ ] Share linki: upewnić się, że publiczna strona nie ujawnia danych wrażliwych (dokładna godzina/miejsce urodzenia widoczne tylko za zgodą właściciela); ID nieprzewidywalne (UUID, nie sekwencyjne).
- [ ] Panel admina: dostęp wyłącznie po roli w bazie (nie po emailu w kodzie), sprawdzany server-side na każdym endpoincie `/app/admin/*`.
- [ ] Walidacja inputów na API routes (zod) — szczególnie wszystko, co trafia do promptów (prompt injection przez pole „imię dziecka" to realny wektor).
- [ ] Sprawdzić nagłówki bezpieczeństwa (CSP, HSTS) i czy SUPABASE_SERVICE_ROLE_KEY nigdy nie wycieka do klienta.

## P0.5 — Testy i monitoring (warunek "stabilna i przetestowana")

- [ ] **Playwright e2e** dla 4 krytycznych flow: (1) rejestracja → potwierdzenie → autostart → wygenerowany kosmogram, (2) checkout → premium aktywne, (3) match end-to-end, (4) login → horoskop dzienny. Odpalane na CI przed każdym deployem (GitHub Actions).
- [ ] **Sentry** (frontend + API routes) — bez tego nie wiesz, że produkcja się sypie, dopóki user nie napisze maila.
- [ ] Alert na AI failure rate: jeśli fallback odpala się częściej niż X% — powiadomienie. Fallback ratuje UX, ale maskuje degradację jakości; musisz wiedzieć, kiedy działa.
- [ ] Uptime monitoring (np. BetterStack/UptimeRobot) na landing, `/api/chart` i cron.
- [ ] Backupy Supabase: zweryfikować plan (point-in-time recovery) i raz przećwiczyć restore. Backup, którego nie testowałeś, nie istnieje.
- [ ] Testy scenariuszy brzegowych natal: brak godziny urodzenia, miejscowości o tej samej nazwie, strefy czasowe historyczne, daty graniczne znaków, przestępne. Dodać jako golden tests do istniejącego panelu evali.

---

# P1 — Efekt WOW (jakość, która sprzedaje)

Zasada nadrzędna dla całego P1: **wow = „to jest o MNIE, nikt inny by tego nie dostał".** Natal ma wow, bo jest hiperpersonalny. Pozostałe moduły są dziś personalne tylko powierzchownie — i to jest dokładnie to „czegoś brakuje". Każdy punkt poniżej sprowadza się do podniesienia poziomu personalizacji + teatru podania.

## P1.1 — Fundament jakości AI (zrobić raz, korzysta każdy moduł)

- [ ] **Dwupoziomowa strategia modeli**: tani model (DeepSeek) do treści masowych/free, mocniejszy model (Claude/GPT, EU/US hosting z DPA — rozwiązuje też P0.1) do treści premium: natal, child, match. Różnica jakości językowej jest natychmiast odczuwalna i to za nią user płaci. Masz już panel promptów z wersjonowaniem i golden testy — porównaj modele na tych samych goldenach zanim zdecydujesz.
- [ ] **Reguła konkretu w każdym prompcie**: każdy akapit outputu musi odwoływać się do konkretnej pozycji/aspektu usera („Twój Mars w Skorpionie w 10. domu…"), nigdy do ogólników o znaku. Dodać do golden testów check: czy treść cytuje minimum N konkretnych elementów kosmogramu.
- [ ] **Cache interpretacji natal** (klucz: pozycje+prompt_version) — ten sam kosmogram nie generuje się dwa razy. Tnie koszty i przyspiesza, a przy share linkach eliminuje ponowne generowanie.
- [ ] Rytuał walidacji: po każdej zmianie promptu — eval na goldenach + ręczne przeczytanie 3–5 próbek. Już masz infrastrukturę, brakuje nawyku procesowego.

## P1.2 — Dzienny horoskop: z generycznego na tranzytowy (największa dźwignia wow w aplikacji)

Horoskop „dla znaku Słońca" to to samo, co w każdej gazecie — zero przewagi. Masz Swiss Ephemeris i zapisany kosmogram natalny usera: policz **realne tranzyty do JEGO kosmogramu** i pisz o nich.

- [ ] Silnik tranzytów dziennych: aspekty planet tranzytujących do pozycji natalnych usera (`astronomy-engine` już to potrafi — używasz tego w kalendarzu).
- [ ] Nowa struktura treści: nagłówek dnia (dominujący tranzyt) → co to znaczy konkretnie dla Ciebie → jedno pytanie refleksyjne / mikro-praktyka. Krótko — to ma być rytuał na 60 sekund przy kawie.
- [ ] Wyróżnik wizualny: „pogoda astrologiczna" dnia (np. intensywność 1–5 + dominujący żywioł) — element, który user sprawdza odruchowo jak prognozę pogody. To jest mechanizm codziennego powrotu, na którym później siądzie push (P2.1).
- [ ] Email dzienny przepisać na ten sam silnik — dziś personalizowany horoskop w mailu to rzadkość i mocny powód, by nie wypisywać się z listy.

## P1.3 — Kalendarz: Dni Mocy muszą być TWOJE

Dni Mocy liczone z samych wolnych planet są identyczne dla wszystkich userów — user prędzej czy później to zauważy i magia pryska.

- [ ] Personalne Dni Mocy: tranzyty wolnych planet do **natalnych pozycji konkretnego usera**. Dwóch userów = dwa różne kalendarze. To jest moment „wow, to naprawdę liczy coś dla mnie".
- [ ] Widok dnia po kliknięciu: DLACZEGO ten dzień jest mocny (jaki tranzyt, do czego w Twoim kosmogramie, na co go wykorzystać). Wyjaśnialność buduje zaufanie i edukuje — user, który rozumie, zostaje dłużej.
- [ ] Zapowiedź nadchodzącego Dnia Mocy na dashboardzie/horoskopie („za 3 dni Jowisz aktywuje Twoje MC") — buduje wyczekiwanie, naturalny pretekst do powrotu.

## P1.4 — Cosmo Match: z wyniku tekstowego na przeżycie

- [ ] **Wizualizacja synastrii**: dwa nałożone koła kosmogramów z liniami aspektów między nimi (harmonijne/napięte innym kolorem). To jest obraz, który ludzie pokazują sobie nawzajem — środek wow tego modułu.
- [ ] Reveal z dramaturgią: score nie pojawia się od razu — najpierw budowanie kół, potem rysowanie połączeń, na końcu wynik z animacją (Framer Motion już masz). 10 sekund teatru zmienia odbiór całości.
- [ ] Score breakdown na wymiary (komunikacja · emocje · namiętność · konflikt · długoterminowość) zamiast jednej liczby — daje treść do rozmowy między partnerami.
- [ ] **Grafika do udostępnienia** (generowany OG image: dwa imiona, score, najpiękniejszy aspekt) — match jest z natury wirusowy, każdy wynik to potencjalna inwitacja drugiej osoby do aplikacji. To jednocześnie najtańszy kanał wzrostu (wspiera P3).

## P1.5 — Cosmo Chat: z czatu na osobistego astrologa

- [ ] Pamięć między sesjami: historia rozmów zapisana w bazie, model dostaje podsumowanie wcześniejszych wątków. Astrolog, który pamięta, czym się martwiłeś tydzień temu — to jest relacja, nie narzędzie.
- [ ] Świadomość czasu: do kontekstu systemowego dołączać dzisiejsze tranzyty usera — chat sam może otworzyć rozmowę („Saturn dziś dokładnie na Twoim Słońcu — jak się z tym czujesz?").
- [ ] Sugerowane pytania pod polem tekstowym (3 chipy generowane z kosmogramu i bieżących tranzytów) — pusta strona czatu to najczęstszy moment porzucenia.
- [ ] Granice bezpieczeństwa w prompcie: zdrowie psychiczne/decyzje medyczne → empatyczne przekierowanie do specjalisty (spójne z disclaimerem z P0.2).

## P1.6 — Kosmogram dziecka: domknąć przewagę

- [ ] **Synastria rodzic–dziecko**: „jak Twój kosmogram współgra z kosmogramem dziecka — gdzie się rozumiecie bez słów, gdzie musisz świadomie nadrabiać". Emocjonalnie najsilniejsza funkcja w całej aplikacji i naturalny hook premium — nikt na rynku PL tego dobrze nie robi.
- [ ] Sekcje praktyczne w treści: jak wspierać w trudnych momentach, czego nie robić, mocne strony do pielęgnowania — rodzic wraca do tego dokumentu latami.

## P1.7 — Teatr pierwszego wrażenia (onboarding)

- [ ] Generowanie kosmogramu = spektakl, nie spinner: animowane rysowanie koła (planety wskakują kolejno na pozycje), w trakcie mini-fakty o kosmogramie usera („Twoje Słońce właśnie w Bliźniętach…"). 30–60 s oczekiwania na AI zamienione w najlepszy moment produktu.
- [ ] Progressive reveal wyniku: sekcje interpretacji odsłaniają się kolejno, nie ściana tekstu na raz.
- [ ] Po pierwszym kosmogramie — jedna jasna ścieżka dalej („sprawdź swój dzisiejszy horoskop tranzytowy"), nie menu z 8 opcjami.

## P1.8 — Higiena spójności

- [ ] **Ukryć Solar Return i Cosmo Map z nawigacji** do czasu doprowadzenia ich do poziomu natal (jak słusznie zrobiłeś z Dziennikiem). Jedna słaba funkcja obniża zaufanie do wszystkich pozostałych — wow działa tylko wtedy, gdy nie ma kontrprzykładu w obrębie aplikacji.
- [ ] Przejść każdy moduł na mobile (PWA) checklistą: czy wygląda jak natal, czy gorzej? Wyrównać w górę albo schować.

---

# P2 — Retencja (po starcie, gdy są realni userzy)

- [ ] **Web Push (PWA)**: dzienny horoskop jako powiadomienie — dopiero teraz, bo push do generycznego horoskopu byłby spamem, a push do tranzytowego (P1.2) jest wartością. Treść pusha = nagłówek dnia z silnika tranzytów.
- [ ] **Streak w kalendarzu**: licznik dni z rzędu z otwartym horoskopem/notatką; łagodny (możliwość „zamrożenia" dnia) — streak ma wciągać, nie karać.
- [ ] **Moon Diary**: refleksje przy Dniach Mocy i nowiach/pełniach; po miesiącu AI podsumowuje wpisy na tle tranzytów („w dni z aspektami Księżyca do Twojego Marsa pisałeś o frustracji…"). To zamyka pętlę „symbolicznego lustra" — dziennik czyni z aplikacji praktykę, nie ciekawostkę.
- [ ] Email lifecycle poza dziennym horoskopem: D+3 („sprawdziłeś już swój Match?"), zapowiedź Dnia Mocy, miesięczne podsumowanie. Resend już skonfigurowany — to tylko treści i crony.
- [ ] Podzielić cron dziennego horoskopu na batche zanim baza emaili urośnie (znane ryzyko z dokumentu statusu).
- [ ] Lejek w PostHog od pierwszego dnia po starcie: signup → natal completed → D1 → paywall view → conversion. KPI z dokumentu statusu muszą mieć dashboardy, inaczej pozostaną listą życzeń.

---

# P3 — Wzrost i marketing (gdy produkt konwertuje)

- [ ] **SEO programatyczne**: strony statyczne dla kombinacji „Słońce w X + Ascendent w Y" (144 strony), „znak × znak zgodność" (78 stron) — każda z CTA do darmowego kosmogramu. Polskie frazy astrologiczne mają solidny wolumen i niską konkurencję; to kanał, który rośnie sam.
- [ ] Blog: 2 filary treści — poradnikowe pod frazy („jak czytać kosmogram", „co oznacza ascendent") i sezonowe (retrogradacje, zaćmienia — przewidywalny kalendarz publikacji na rok z góry).
- [ ] Dopracować share pages (`/share/reading`, `/share/match`): ładny OG image, podgląd bez logowania, wyraźne CTA „sprawdź swój kosmogram" — każdy share to darmowy landing.
- [ ] Social: format krótkich wideo (TikTok/IG Reels) — astrologia to jeden z najmocniejszych tematów tych platform; treści generowane z własnych danych („jak wygląda synastria pary, która…") zamiast generycznych. Solo + narzędzia AI do wideo wystarczą na start.
- [ ] A/B testy landing page (CTA, hero) przez PostHog feature flags — dopiero przy realnym ruchu, wcześniej brak mocy statystycznej.
- [ ] Program poleceń: darmowy miesiąc premium za zaproszenie osoby, która zrobi kosmogram — naturalnie wzmacnia Match (potrzebujesz drugiej osoby).

---

# P4 — Później (świadomie odłożone)

- [ ] Solar Return — wrócić do niego jako feature urodzinowy (email „Twój rok słoneczny" w urodziny to piękny trigger), ale dopiero gdy core ma wow.
- [ ] Cosmo Map — duży potencjał wizualny, duży koszt dopracowania; po Solar Return.
- [ ] Natywna aplikacja mobilna — bez zmian: dopiero przy ~1000+ płatnych. PWA + push (P2) pokrywa potrzeby wcześniej.

---

# Definicja „gotowy do publicznego startu"

1. Całe P0 odhaczone (prawne, bezpieczeństwo, testy e2e na CI, monitoring).
2. Z P1 minimum: fundament AI (P1.1), horoskop tranzytowy (P1.2), teatr onboardingu (P1.7), higiena spójności (P1.8).
3. Pełny cykl płatności przetestowany na Stripe test mode.
4. 5–10 osób spoza projektu przeszło flow rejestracja → kosmogram → płatność bez Twojej pomocy i bez błędów.
