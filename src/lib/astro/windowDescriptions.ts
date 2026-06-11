/**
 * Statyczne opisy okien tranzytowych — 1 zdanie znaczenia praktycznego.
 * Klucz: `${transitPlanet}-${aspectType}-${natalPoint}`
 * Wartość: 2 warianty (rotacja deterministyczna wg hash(userId+month))
 *
 * Nie używa AI — szybkie, spójne, przewidywalne.
 */

type Variants = [string, string];

const WINDOW_MEANINGS: Record<string, Variants> = {
  // ── Jupiter (ekspansja, szansa, wzrost) ───────────────────────────────────
  "Jowisz-trine-Słońce":    ["Jowisz wspiera Twoje Słońce — to jeden z lepszych momentów roku na duże decyzje i nowe zobowiązania.", "Rzadkie okno ekspansji: to co zaczniesz teraz ma realną szansę urosnąć."],
  "Jowisz-sextile-Słońce":  ["Jowisz otwiera drzwi — wystarczy przez nie wejść zamiast czekać.", "Dobre tło dla inicjatyw i rozmów, które normalnie odkładasz."],
  "Jowisz-conjunction-Słońce": ["Jowisz na Twoim Słońcu — raz na 12 lat. Wyznacz cel, który ma znaczenie.", "Twoja energia i widzialność są teraz wzmocnione — wyjdź przed szereg."],
  "Jowisz-square-Słońce":   ["Jowisz kusi nadmiernym optymizmem — sprawdzaj liczby przed podpisaniem.", "Ryzyko przedobrzenia: dobre okno na ekspansję, ale z rachunkiem kosztów."],
  "Jowisz-opposition-Słońce": ["Ktoś inny może mieć szczęście Jowisza — zamiast rywalizować, wejdź we współpracę.", "Sprawdź, co blokuje Twój rozwój od zewnątrz — to czas na negocjacje."],

  "Jowisz-trine-Księżyc":   ["Jowisz wspiera Twój dobrostan emocjonalny — relacje rodzinne i dom mogą przynieść niespodzianą radość.", "Dobry czas na decyzje dotyczące miejsca zamieszkania lub rozszerzenia rodziny."],
  "Jowisz-sextile-Księżyc": ["Twoje intuicje są trafniejsze niż zwykle — ufaj im przy codziennych wyborach.", "Dobrze wychodzi teraz opieka nad innymi i przyjmowanie wsparcia."],
  "Jowisz-conjunction-Księżyc": ["Jowisz wzmacnia Twoje potrzeby emocjonalne — wyraź je zamiast tłumić.", "Czas na poszerzenie bazy bezpieczeństwa: nowe mieszkanie, nowe relacje."],
  "Jowisz-square-Księżyc":  ["Emocjonalna przesada — dobry czas, żeby nie reagować na chwilowe impulsy.", "Uważaj na wydatki podyktowane nastrojem, a nie potrzebą."],
  "Jowisz-opposition-Księżyc": ["Równowaga między własną przestrzenią a potrzebami bliskich wymaga teraz świadomego zarządzania.", "Publiczna i prywatna twarz mogą być w konflikcie — czas na wyrównanie."],

  "Jowisz-trine-Wenus":     ["Jowisz i Wenus w harmonii — jedno z najlepszych okien na miłość, sztukę i przyjemności.", "Finanse i relacje mają teraz tailwind — nie trać okazji przez nadmierną ostrożność."],
  "Jowisz-sextile-Wenus":   ["Lekkie, ale realne wzmocnienie relacji i finansów — dobry moment na rozmowę o wspólnych planach.", "Twoja atrakcyjność i otwartość są zauważalne przez innych."],
  "Jowisz-conjunction-Wenus": ["Jowisz na Twojej Wenus — wyjątkowe okno na miłość, zarobek lub projekt twórczy.", "Dobry czas na zrobienie kroku w relacji lub inwestycję w coś, co sprawia Ci radość."],
  "Jowisz-square-Wenus":    ["Ryzyko rozrzutności lub idealizowania partnera — weryfikuj realia zanim wydasz lub przywiążesz się.", "Niepohamowana przyjemność może kosztować więcej niż warta."],
  "Jowisz-opposition-Wenus": ["Ktoś w otoczeniu może mieć więcej szczęścia — zamiast zazdrościć, sprawdź czego Ci brakuje.", "Napięcie między własnymi pragnieniami a oczekiwaniami partnera — warto porozmawiać wprost."],

  "Jowisz-trine-Mars":      ["Jowisz i Mars w trygonie — Twoja energia jest skuteczna i ma zasięg. Czas działać.", "Rzadkie połączenie chęci i możliwości — nie odkładaj głównych ruchów."],
  "Jowisz-sextile-Mars":    ["Dobry moment na sport, projekty fizyczne i inicjatywy wymagające odwagi.", "Twoja asertywność jest teraz odbierana jako pewność siebie, nie agresja."],
  "Jowisz-conjunction-Mars": ["Jowisz na Twoim Marsie: ogromny potencjał energetyczny — skieruj go na konkretny cel.", "Ryzyko przesady i wypalenia jeśli nie zaczniesz od priorytetów."],
  "Jowisz-square-Mars":     ["Ryzyko impulsywnych działań z nadmiernym rozmachem — zaplanuj zanim zaczniesz.", "Energia jest, ale bez struktury może być roztrwoniona."],
  "Jowisz-opposition-Mars": ["Konflikt między Twoimi ambicjami a cudzymi planami — negocjuj zamiast forsować.", "Dobry czas na renegocjację roli i zakresu odpowiedzialności."],

  "Jowisz-trine-Merkury":   ["Jowisz w trygonie do Twojego Merkurego — myślisz szybciej i komunikujesz się skuteczniej.", "Dobry moment na prezentacje, pisanie i nawiązywanie kontaktów."],
  "Jowisz-conjunction-Merkury": ["Jowisz na Twoim Merkurym — myśli mają zasięg. Pisz, mów, publikuj.", "Ryzyko gadulstwa — wybierz jedno główne przesłanie i powtarzaj je."],
  "Jowisz-square-Merkury":  ["Dużo słów, mało konkretów — uważaj na obietnice, których nie możesz dotrzymać.", "Sprawdź dane zanim wyślesz ważną wiadomość."],

  "Jowisz-trine-ASC":       ["Jowisz w harmonii z Twoim Ascendentem — inni widzą Cię jako osobę otwartą i wartościową do współpracy.", "Dobry czas na publiczne wystąpienia i pierwsze wrażenia."],
  "Jowisz-conjunction-ASC": ["Jowisz na Twoim Ascendencie — 12-letni cykl. Inni widzą w Tobie potencjał — pokaż go.", "Twoja osobowość i styl działają na Twoją korzyść."],
  "Jowisz-square-ASC":      ["Napięcie między ekspansją a tym, jak Cię postrzegają — bądź świadomy swojego wizerunku.", "Dobry czas na szczery feedback od kogoś zaufanego."],

  "Jowisz-trine-MC":        ["Jowisz wspiera Twój zawodowy wizerunek — decydenci widzą Twój potencjał. Działaj.", "Rzadkie okno kariery — zrób krok, który w normalnym czasie wydawałby Ci się za duży."],
  "Jowisz-conjunction-MC":  ["Jowisz na Twoim MC — jedno z najlepszych okien awansu lub zmiany zawodowej w całym 12-letnim cyklu.", "Czas na podjęcie decyzji o kierunku kariery, której bałeś się podjąć."],
  "Jowisz-square-MC":       ["Szansa zawodowa może wiązać się z cenę, którą musisz sprawdzić zanim się zgodzisz.", "Uważaj na obietnice bez pokrycia od przełożonych lub klientów."],

  // ── Saturn (struktura, lekcja, dojrzewanie) ───────────────────────────────
  "Saturn-conjunction-Słońce": ["Saturn na Twoim Słońcu (raz na 29 lat) — czas wymaga od Ciebie konkretów. Co naprawdę budujesz?", "Wymagający, ale kluczowy moment: decyzje podjęte teraz mają szansę przetrwać dekadę."],
  "Saturn-square-Słońce":   ["Saturn testuje Twoje ego i ambicje — to nie czas na skróty, tylko na fundamenty.", "Opór który czujesz ma źródło — rozpoznaj je zamiast go obchodzić."],
  "Saturn-trine-Słońce":    ["Saturn daje strukturę zamiast blokować — Twoje wysiłki mają teraz realną podstawę.", "Dobry czas na sformalizowanie projektów i zobowiązań, które działają."],
  "Saturn-opposition-Słońce": ["Saturn od zewnątrz pyta: czy idziesz właściwą drogą? Ocena z dystansu może być bolesna, ale trafna.", "Konfrontacja z rzeczywistością zamiast z własnymi wyobrażeniami."],
  "Saturn-sextile-Słońce":  ["Saturn lekko wspiera: czas na małe zobowiązania, które procentują w długim terminie.", "Systematyczność i dyscyplina działają teraz skuteczniej niż entuzjazm."],

  "Saturn-conjunction-Księżyc": ["Saturn na Twoim Księżycu — emocje i bezpieczeństwo wymagają restrukturyzacji. Co możesz puścić?", "Ciężki, ale ważny czas: rzeczy, które nie działają emocjonalnie, stają się widoczne."],
  "Saturn-square-Księżyc":  ["Emocjonalna blokada lub obciążenie domem/rodziną — zamiast tłumić, zbadaj źródło.", "Czas na szczerość wobec siebie co do relacji, które Cię wyczerpują."],
  "Saturn-trine-Księżyc":   ["Saturn stabilizuje Twoje emocje — dobry czas na decyzje dotyczące domu i bliskich.", "To, co budujesz dla rodziny lub bezpieczeństwa, ma teraz solidniejsze podstawy."],

  "Saturn-conjunction-Wenus": ["Saturn na Twojej Wenus — relacje i finanse wymagają poważnych decyzji, nie odkładania.", "Możliwy czas trudny w miłości, ale każda relacja która przetrwa — jest realna."],
  "Saturn-square-Wenus":    ["Napięcie między pragnieniami a rzeczywistością — sprawdź czy dajesz i bierzesz w równym stopniu.", "Finanse mogą wymagać cięcia lub nowego podejścia do wartości."],
  "Saturn-trine-Wenus":     ["Saturn daje relacjom i finansom strukturę — dobry czas na umowy, formalizowanie i długoterminowe zobowiązania.", "Relacje zbudowane teraz mają wytrzymałość."],

  "Saturn-conjunction-Mars": ["Saturn na Twoim Marsie — energia działa, ale wolniej i z większym wysiłkiem. Cierpliwość.", "Czas na działanie z planem, nie z impulsem."],
  "Saturn-square-Mars":     ["Saturn blokuje Twój Mars — frustracja to sygnał, nie wróg. Co musisz zrobić inaczej?", "Wysiłek bez efektów może oznaczać zły kierunek lub zły timing — warto sprawdzić."],
  "Saturn-trine-Mars":      ["Saturn i Mars w harmonii — Twoje działania mają teraz długotrwały efekt. Buduj coś trwałego.", "Dobry czas na systematyczną pracę nad celem, który wymaga miesięcy."],

  "Saturn-conjunction-Merkury": ["Saturn wyostrza Twój umysł, ale też go spowalnia — pisz mniej, mów precyzyjniej.", "Decyzje komunikacyjne podjęte teraz będą miały długoterminowe konsekwencje."],
  "Saturn-square-Merkury":  ["Komunikacja może być zablokowana lub podatna na nieporozumienia — sprawdzaj dwa razy.", "Czas na porządek w dokumentach i zobowiązaniach pisemnych."],

  "Saturn-conjunction-ASC": ["Saturn na Twoim Ascendencie — jesteś poddany ocenie. Jak chcesz być postrzegany na następne lata?", "Czas poważnej samooceny i budowania wizerunku opartego na tym kim naprawdę jesteś."],
  "Saturn-square-ASC":      ["Saturn testuje Twój wizerunek — być może chcesz być odbierany inaczej niż jesteś. Czas to zmienić.", "Wyzwanie tożsamościowe: kim chcesz być na zewnątrz?"],
  "Saturn-trine-ASC":       ["Saturn wspiera Twoje publiczne ja — inni widzą Cię jako wiarygodnego i poważnego partnera.", "Dobry czas na formalne kroki w karierze lub życiu publicznym."],

  "Saturn-conjunction-MC":  ["Saturn na Twoim MC — jeden z najważniejszych momentów kariery. Co chcesz zbudować na następne 7 lat?", "Obowiązki mogą wzrosnąć, ale mają szansę stać się fundamentem."],
  "Saturn-square-MC":       ["Kariera wymaga realistycznej oceny: czy idziesz drogą, której chcesz, czy którą wybrałeś dawno?", "Możliwe trudności zawodowe — traktuj je jako kurs korekcyjny, nie wyrok."],
  "Saturn-trine-MC":        ["Saturn daje zawodowej pozycji stabilność — dobry czas na awans, zakończenie lub formalizację roli.", "Ciężka praca z przeszłości zaczyna być doceniana."],

  // ── Mars (energia, działanie, napięcie) ───────────────────────────────────
  "Mars-conjunction-Słońce": ["Mars na Twoim Słońcu — energia i asertywność są na szczycie. Kieruj je świadomie.", "Możliwe konflikty jeśli wejdziesz w tryb 'moje' — dobry czas na sport i odważne decyzje."],
  "Mars-square-Słońce":     ["Mars i Twoje Słońce w konflikcie — możliwe tarcia z autorytetami lub własnym ego. Oddech przed reakcją.", "Frustracja może być informacją: co blokuje Twoją wolę?"],
  "Mars-trine-Słońce":      ["Mars wspiera Twoje ego konstruktywnie — Twoja inicjatywa jest teraz skuteczna i pozytywnie odbierana.", "Zacznij projekt, który odkładałeś: energia i widzialność działają na Twoją korzyść."],
  "Mars-opposition-Słońce": ["Mars naprzeciwko Twojego Słońca — możliwe konfrontacje, które wymagają dyplomacji zamiast siły.", "Energia innych może Cię przeciążyć — postaw granice zanim to zrobisz agresywnie."],

  "Mars-conjunction-Księżyc": ["Mars na Twoim Księżycu — emocjonalna reaktywność jest wysoka. Świadoma komunikacja.", "Energia do działania w domu i relacjach bliskich — ale uważaj na impulsywne słowa."],
  "Mars-square-Księżyc":    ["Mars i Księżyc w napięciu — emocje mogą eskalować szybciej niż myślisz. Zatrzymaj się.", "Konflikty domowe lub z bliskimi kobietami mogą się ujawnić — adresuj je wprost."],
  "Mars-trine-Księżyc":     ["Mars i Księżyc w harmonii — możesz działać i czuć jednocześnie. Projekty emocjonalne mają pęd.", "Dobry czas na przeprowadzkę, remont lub poważną rozmowę w domu."],

  "Mars-conjunction-Wenus": ["Mars na Twojej Wenus — intensywna energia seksualna i twórcza. Skieruj ją świadomie.", "Atrakcja i konflikty w miłości mogą być silniejsze niż zwykle."],
  "Mars-square-Wenus":      ["Napięcie między pragnieniami a rzeczywistością relacyjną — nie działaj pod wpływem frustracji.", "Pieniądze mogą być powodem tarcia — sprawdź wspólne zobowiązania."],
  "Mars-trine-Wenus":       ["Mars i Wenus w harmonii — energia twórcza i erotyczna działają razem. Dobry czas na zbliżenie.", "Projekty łączące pasję z działaniem mają teraz naturalny impuls."],

  "Mars-conjunction-Merkury": ["Mars na Twoim Merkurym — umysł jest szybki i ostry, ale też podatny na kłótnie. Wybieraj słowa.", "Dobry czas na negocjacje, prezentacje i debaty — jeśli słuchasz, nie tylko mówisz."],
  "Mars-square-Merkury":    ["Ryzyko konfliktów słownych i nieporozumień — sprawdzaj dwa razy zanim wyślesz.", "Dobry czas na cięcie zbędnych zobowiązań komunikacyjnych."],
  "Mars-trine-Merkury":     ["Mars wspiera Twój umysł — myśli stają się działaniami bez zbędnego wahania.", "Pisz, pitchuj, decyduj: energia mentalna i fizyczna są teraz zsynchronizowane."],

  "Mars-conjunction-ASC":   ["Mars na Twoim Ascendencie — jesteś widoczny i asertywny. Inni Cię zauważają.", "Możliwe tarcia przy pierwszym kontakcie — bądź świadomy jak wchodzisz do pokoju."],
  "Mars-square-ASC":        ["Twoje działania mogą być odbierane jako zbyt agresywne lub impulsywne — sprawdź swój styl.", "Konflikty z otoczeniem mogą wskazywać na potrzebę zmiany podejścia."],
  "Mars-trine-ASC":         ["Mars wzmacnia Twój wizerunek pozytywnie — świetny czas na pierwsze kroki i prezentacje.", "Twoja energia i pewność siebie są teraz atutem."],

  "Mars-conjunction-MC":    ["Mars na Twoim MC — ambitne działania zawodowe są teraz możliwe i widoczne.", "Ryzyko konfliktów z szefem lub decydentami — działaj, ale z dyplomacją."],
  "Mars-square-MC":         ["Mars w napięciu do MC — możliwy konflikt ambicji z pozycją zawodową. Co naprawdę chcesz?", "Przemyśl następny krok zanim go ogłosisz."],
  "Mars-trine-MC":          ["Mars wspiera Twoją karierę — decydenci widzą Twoją inicjatywę pozytywnie.", "Dobry czas na aplikowanie, negocjowanie lub ogłoszenie projektu."],

  // ── Uranus (nagła zmiana, przełom, wyzwolenie) ───────────────────────────
  "Uran-conjunction-Słońce": ["Uran na Twoim Słońcu — raz w życiu. Nie możesz kontrolować zmian, ale możesz je wyprzedzić.", "Coś się skończy i zacznie jednocześnie — bądź otwarty zamiast opierać się."],
  "Uran-square-Słońce":     ["Uran w kwadracie do Słońca — nagłe zmiany tożsamości lub życiowej drogi. Nie opieraj się, ale nie działaj impulsywnie.", "Sprawdź co jest gotowe do zmiany, a co opierasz się puścić ze strachu."],
  "Uran-trine-Słońce":      ["Uran wspiera Twoje Słońce — innowacja i autentyczność działają na Twoją korzyść.", "Dobry czas na bycie sobą nawet tam, gdzie do tej pory się dostosowywałeś."],
  "Uran-opposition-Słońce": ["Uran naprzeciwko Słońca — inni mogą przynosić Ci nagłe zmiany. Trzymaj się swoich wartości.", "Czas na sprawdzenie czy jesteś autentyczny czy odgrywasz rolę."],

  "Uran-conjunction-Księżyc": ["Uran na Twoim Księżycu — dom, rutyna lub relacje bliskie mogą się nagłe zrestrukturyzować.", "Emocjonalna nieprzewidywalność: nie tłum, ale też nie działaj pod wpływem impulsu."],
  "Uran-square-Księżyc":    ["Uran w napięciu do Księżyca — zakłócenie bezpieczeństwa emocjonalnego. Co trzyma Cię tam gdzie jesteś?", "Nagłe zmiany w domu lub relacjach bliskich mogą być trudne, ale wskazujące."],
  "Uran-trine-Księżyc":     ["Uran harmonijnie do Księżyca — nowe podejście do domu i emocji, które nie niszczy, tylko odświeża.", "Eksperymentuj z codzienną rutyną."],

  "Uran-conjunction-Wenus": ["Uran na Twojej Wenus — relacje i finanse mogą się nagle zmienić. Bądź otwarty na nowe formy.", "Możliwe nagłe przyciąganie lub odejście w miłości."],
  "Uran-square-Wenus":      ["Uran w napięciu do Wenus — nagłe napięcia w relacjach lub finansach. Sprawdź co jest niestabilne.", "Niekonwencjonalne potrzeby mogą się ujawnić — adresuj je zamiast tłumić."],
  "Uran-trine-Wenus":       ["Uran i Wenus w harmonii — otwartość na nowe formy miłości i przyjemności przynosi niespodzianki.", "Dobry czas na twórcze eksperymenty i nowe relacje."],

  "Uran-conjunction-Merkury": ["Uran na Twoim Merkurym — myślisz szybciej i bardziej niekonwencjonalnie. Zapisuj.", "Nagłe odkrycia i pomysły — nie trać ich, bo znikną równie szybko."],
  "Uran-square-Merkury":    ["Uran i Merkury w napięciu — umysłowe przeciążenie lub nagłe zmiany planów. Nie podejmuj dużych decyzji pod wpływem impulsu.", "Sprawdź czy Twoje przekonania są Twoje, czy przejęte."],

  "Uran-conjunction-ASC":   ["Uran na Twoim Ascendencie — zmieniasz to kim jesteś dla innych. Nowa persona zaczyna się formować.", "Inni mogą być zaskoczeni Twoją zmianą."],
  "Uran-conjunction-MC":    ["Uran na Twoim MC — nagłe zmiany zawodowe lub publicznej tożsamości. Nie opieraj się.", "Możliwa nieoczekiwana zmiana w karierze — otwartość jest Twoją obroną."],
  "Uran-trine-MC":          ["Uran wspiera Twój zawodowy przełom — innowacyjne podejście jest teraz doceniane.", "Dobry czas na ryzykowny krok zawodowy, który normalnie wydawałby Ci się zbyt odważny."],
  "Uran-square-MC":         ["Uran w napięciu do MC — możliwe nagłe zmiany w pracy lub publicznym wizerunku. Nie wiesz co nadchodzi.", "Utrzymaj elastyczność zawodową."],

  // ── Neptune (intuicja, iluzja, duchowość) ─────────────────────────────────
  "Neptun-conjunction-Słońce": ["Neptun na Twoim Słońcu — granice tożsamości są rozmyte. Medytuj, twórz, ale sprawdzaj fakty.", "Ryzyko idealizowania siebie lub bycia idealizowanym przez innych."],
  "Neptun-square-Słońce":   ["Neptun rozmywa Twoje Słońce — trudno o jasność co do celów i tożsamości. Fakty przed decyzjami.", "Uważaj na osoby, które mają Twoją wizję, ale nie mają planu."],
  "Neptun-trine-Słońce":    ["Neptun wspiera Twoje Słońce — intuicja i twórczość są wyostrzone. Dobry czas na pracę artystyczną.", "Otwartość duchowa może przynosić ważne wskazówki."],

  "Neptun-conjunction-Księżyc": ["Neptun na Twoim Księżycu — emocje są delikatne i przenikliwe. Sztuka, muzyka i sen mogą wiele powiedzieć.", "Uważaj na emocjonalne iluzje i łatwe rozwiązania."],
  "Neptun-square-Księżyc":  ["Neptun i Księżyc w napięciu — możliwa emocjonalna dezorientacja. Fakty zamiast intuicji przy ważnych decyzjach.", "Uważaj na manipulację emocjonalną — własną i cudzą."],
  "Neptun-trine-Księżyc":   ["Neptun harmonizuje z Księżycem — empatia i wrażliwość są siłą. Dobry czas na opiekę i twórczość.", "Sny mogą być bardziej informatywne niż zwykle."],

  "Neptun-conjunction-Wenus": ["Neptun na Twojej Wenus — miłość może być piękna i nierealna jednocześnie. Sprawdzaj fakty.", "Finanse mogą być zagrożone przez nadmierny optymizm lub niejasne umowy."],
  "Neptun-square-Wenus":    ["Neptun i Wenus w napięciu — iluzje w miłości lub finansach. Sprawdzaj zanim zaangażujesz się.", "Możliwe rozczarowania jeśli idealizujesz partnera lub sytuację."],
  "Neptun-trine-Wenus":     ["Neptun wspiera Twoją Wenus — czas na piękno, muzykę, miłość i sztukę.", "Dobry moment na twórcze projekty i romantyczne gesty."],

  // ── Pluto (transformacja, władza, głęboka zmiana) ─────────────────────────
  "Pluton-conjunction-Słońce": ["Pluton na Twoim Słońcu — głęboka przemiana tożsamości. Stare ja musi ustąpić miejsca nowemu.", "Jedne drzwi się zamkną — to robi miejsce na coś właściwszego."],
  "Pluton-square-Słońce":   ["Pluton testuje Twoje ego siłą — walka o kontrolę może dotyczyć Ciebie lub kogoś z otoczenia.", "Sprawdź gdzie oddałeś władze lub gdzie próbujesz ją przejąć wbrew wszystkim."],
  "Pluton-trine-Słońce":    ["Pluton harmonijnie wzmacnia Twoje Słońce — masz dostęp do głębokiej siły i jasności celu.", "Dobry czas na duże decyzje wymagające odwagi."],

  "Pluton-conjunction-Księżyc": ["Pluton na Twoim Księżycu — emocjonalne wzorce z przeszłości wychodzą na powierzchnię.", "Czas na psychologiczną pracę: co nosiłeś zbyt długo?"],
  "Pluton-square-Księżyc":  ["Pluton i Księżyc w napięciu — emocje mogą być intensywne i trudne do zarządzania.", "Nie tłum: to co wychodzi, wychodzi bo jest gotowe na transformację."],
  "Pluton-trine-Księżyc":   ["Pluton harmonizuje z Księżycem — możesz transformować swoje życie emocjonalne bez traumy.", "Dobry czas na psychologiczne porządki i głębsze rozmowy."],

  "Pluton-conjunction-Wenus": ["Pluton na Twojej Wenus — relacje mogą przejść głęboką transformację. Silne przyciąganie lub definitywne zakończenie.", "Finanse mogą wymagać fundamentalnej zmiany podejścia."],
  "Pluton-square-Wenus":    ["Pluton i Wenus w napięciu — możliwe konflikty o władzę w relacji lub o pieniądze.", "Sprawdź co w Twoich relacjach jest zdrowe, a co jest uzależnieniem."],
  "Pluton-trine-Wenus":     ["Pluton i Wenus w harmonii — możesz transformować relacje z siłą zamiast bólem.", "Dobry czas na głębsze zaangażowanie lub świadome zakończenie."],

  "Pluton-conjunction-ASC": ["Pluton na Twoim Ascendencie — Twój wizerunek i podejście do życia przechodzą fundamentalną zmianę.", "Inni mogą postrzegać Cię inaczej — i dobrze."],
  "Pluton-conjunction-MC":  ["Pluton na Twoim MC — zawodowa transformacja nieunikniona. Co chcesz zbudować na następne 20 lat?", "Władza i odpowiedzialność mogą wzrosnąć lub się zrestrukturyzować."],
  "Pluton-trine-MC":        ["Pluton wzmacnia Twoje MC — możesz zbudować lub skonsolidować zawodową pozycję z głęboką intencją.", "Dobry czas na strategiczne ruchy wymagające odwagi."],
  "Pluton-square-MC":       ["Pluton i MC w napięciu — możliwe kryzysy zawodowe lub starcia z władzą.", "Transformacja kariery może być wymuszona — traktuj to jako oczyszczenie."],
};

/**
 * Deterministyczna rotacja wariantu bazowana na haśle.
 * Ten sam klucz + seed = zawsze ten sam wariant.
 */
function pickVariant(variants: Variants, seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return variants[h % variants.length];
}

/**
 * Zwraca opis okna tranzytowego.
 * seed = userId + monthKey (np. "abc123_2026-06") → deterministyczna rotacja
 */
export function getWindowDescription(
  transitPlanet: string,
  aspectType:    string,
  natalPoint:    string,
  seed:          string,
): string {
  const key     = `${transitPlanet}-${aspectType}-${natalPoint}`;
  const variants = WINDOW_MEANINGS[key];
  if (variants) return pickVariant(variants, seed);

  // Fallback oparty tylko na planecie tranzytu i charakterze
  const PLANET_FALLBACK: Record<string, [string, string]> = {
    "Jowisz":  ["Jowisz aktywuje ten obszar Twojego życia — szansa na ekspansję i wzrost.", "Rzadkie okno możliwości — warto działać zamiast czekać."],
    "Saturn":  ["Saturn wymaga od Ciebie pracy i cierpliwości w tym obszarze.", "Czas na realistyczne podejście i budowanie na solidnych podstawach."],
    "Mars":    ["Mars wzmacnia energię i działanie w tym obszarze — kieruj ją świadomie.", "Czas na inicjatywę, ale z uwagą na konflikty."],
    "Uran":    ["Uran przynosi nieoczekiwane zmiany — bądź elastyczny.", "Nagła zmiana może okazać się szansą."],
    "Neptun":  ["Neptun wzmacnia wrażliwość i intuicję — sprawdzaj fakty.", "Czas na twórczość i pracę z intuicją."],
    "Pluton":  ["Pluton przynosi głęboką przemianę — pozwól staremu ustąpić.", "Transformacja, która jest gotowa, nie da się powstrzymać."],
  };
  const fallback = PLANET_FALLBACK[transitPlanet] ?? ["Ważny tranzyt aktywuje Twój kosmogram.", "Zwróć uwagę na ten obszar życia w nadchodzącym czasie."];
  return pickVariant(fallback as Variants, seed);
}
