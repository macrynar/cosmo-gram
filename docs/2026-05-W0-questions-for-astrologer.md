---
title: W0 - Pytania dla astrolożki (weekend 23-24 maj 2026)
created: 2026-05-18
project: cosmogram
type: meeting-prep
---

# Pytania na rozmowę W0 - Astrolożka

> [!info] Cel rozmowy
> Decyzja o partnerstwie + jeśli TAK, zebranie inputu produktowego (voice, prompty, content). Nie wciskaj kontraktu - to pierwsza rozmowa, zostaw przestrzeń.

> [!warning] PRZED rozmową (przygotuj sam)
> - Decyzja: jaką rolę proponujesz? (advisor / co-founder / contractor) - zobacz `decisions/2026-05-18-week-0-partnership-decision.md`
> - Lista: co Ty wnosisz, co ona wnosi (już w tamtym pliku)
> - Wydruk speca v1 i prompts-v1 (lub na laptopie) - nie do "przeglądnięcia", tylko jako artefakt że "myślałem nad tym konkretnie"
> - Decyzja czy pokazujesz lokalną apkę. Sugestia: TAK, na koniec, "patrz, już coś działa, ale potrzebuję Twojego głosu żeby to nie brzmiało jak Wikipedia"

---

## Część 1: Czy w to wchodzi? (otwierające, 15-20 min)

Najpierw odbij piłeczkę, słuchaj, nie wciskaj.

1. **"Jak Ty widzisz AI w astrologii? Threat czy amplifier?"**
   - Słuchasz: czy ona pełna obaw, czy ciekawości, czy mieszanki
   - Sygnał: jeśli wybitnie defensywna - może nie być fitem
   
2. **"Co Cię w mojej pracy z klientami najbardziej kręci - i czego najbardziej Ci szkoda że za mało czasu?"**
   - Słuchasz: pasja vs zmęczenie, gdzie widzi swoją unikalność
   - Sygnał: jeśli mówi "rozmowy z ludźmi" - ona kocha live readings, AI ją nie pociągnie
   - Sygnał: jeśli mówi "interpretacje, wgląd, znajdowanie wzorów" - to GOLD dla naszego promptu

3. **"Mam pomysł na produkt na styku AI i astrologii. Pozwól że Ci pokażę gdzie jestem - i potem powiedz co o tym myślisz, ALE NIE jako klientka. Jako potencjalny partner."**
   - Pokazujesz spec v1 lub apkę
   - Twoje 2-3 minutowe wprowadzenie - krótko, big picture, bez sales pitch'a

---

## Część 2: Domain expertise inputs (jeśli rozmowa idzie, 30-40 min)

Tutaj zbierasz produktowy input. Notuj wszystko, te szczegóły są krytyczne dla promptów.

4. **"Jaki masz styl interpretacji? Modern psychological, traditional, evolutionary, hellenistic?"**
   - Cel: ustalić baseline voice
   - Follow-up: kogo czyta? (Jung, Hand, Greene, Brennan, polscy autorzy?)

5. **"Jakiego systemu domów używasz?"**
   - Placidus / Koch / Whole Sign / Equal / inny
   - DECYZJA TECHNICZNA - to wpływa na Swiss Ephemeris config
   - Follow-up: dlaczego? (sygnał głębokości jej praktyki)

6. **"Jeśli musiałabyś wybrać 3 elementy charta które są dla Ciebie najważniejsze przy pierwszym czytaniu - co to jest?"**
   - Cel: priorytet w prompcie natal interpretation
   - Pewnie powie: Sun-Moon-Rising + dominant aspects, ale może mieć własną hierarchię
   - To zostaje w `prompts-v1.md` jako system instruction

7. **"Co Cię najbardziej irytuje w popularnych horoskopach (Co-Star, Astrolada itp.)? Czego NIGDY byś nie napisała?"**
   - Cel: BANNED PHRASES list dla promptu
   - To bardzo wartościowe - filtruje nasz output od taniej ezoteryki
   - Konkretne przykłady: "kosmiczna energia", "uważaj na", "Mars w Skorpionie spowoduje..."

8. **"Jak rozmawiasz z klientką która słyszy 'twój Saturn opozycja Słońce'? Czy używasz technicznego języka, czy tłumaczysz?"**
   - Cel: voice/register dla daily reading
   - Sygnał kompetencji translacji "astro → human"

9. **"Co byś NIGDY nie powiedziała klientce, nawet jeśli to widzisz w chart'cie?"**
   - Cel: SAFETY GUARDRAILS lista
   - Przykłady które mogą wyjść: "rozstaniecie się", "umrze", "to się nie uda"
   - To krytyczne dla prompt v1

10. **"Czy mogłabyś dać mi 10 sample interpretacji - na podstawie 10 anonimowych chartów - dla 'golden set'? To byłby ground truth dla mojej AI. Możemy ustalić kiedy, możemy zapłacić za to czas."**
    - Cel: PROPOZYCJA KONKRETNEGO PIERWSZEGO KROKU PRACY
    - Sygnał: jak reaguje? (entuzjazm = partner, "to dużo czasu" = transactional, "to nie tak działa" = problem)
    - Jeśli TAK - to jest IDEALNY moment żeby ustalić zasady tej współpracy (forma, czas, kompensata)

---

## Część 3: Propozycja roli i ramy (jeśli rozmowa pozytywna, 20-30 min)

11. **"Jak Ty widzisz w tym swoją rolę - gdybyś miała wymyślić swoje stanowisko?"**
    - NIE proponujesz roli pierwszy - słuchasz co ona widzi
    - To często odpowiada bardziej szczerze niż "advisor czy co-founder?"
    - Jeśli mówi "doradzanie" → advisor model
    - Jeśli mówi "razem to budujemy" → co-founder model
    - Jeśli mówi "robić content" → contractor model

12. **"Ile czasu realnie możesz dać na coś takiego? Tygodniowo - z grubsza."**
    - Cel: weryfikacja capacity
    - Jeśli <2h/tydz → tylko advisor sense
    - Jeśli 5-10h/tydz → co-founder lub serious contractor możliwe
    - Sygnał: konkretne vs mgliste odpowiedzi

13. **"Co dla Ciebie byłoby fair share? Pieniądze, equity, mix? Nie musisz odpowiadać teraz - chcę żebyś o tym pomyślała."**
    - Otwórz rozmowę o $ delikatnie
    - Nie wyceń sam pierwszy - słuchaj jak ona myśli o wartości
    - Daj jej tydzień na decyzję

14. **"Co Cię niepokoi w takim projekcie? Co mogłoby pójść źle z Twojej perspektywy?"**
    - WAŻNE - jej obawy są twoim risk register
    - Słuchasz: o autentyczność, o reputację, o czas, o pieniądze, o klientów
    - Jeśli ma mocne obawy o reputację ("co powiedzą koleżanki astrolożki gdy zobaczą AI") - to materialny risk

---

## Część 4: Zamknięcie (5-10 min)

15. **"Co dalej, twoim zdaniem?"**
    - Niech ona zaproponuje następny krok
    - Twoja oferta: tydzień na przemyślenie, kolejne spotkanie za 7-10 dni
    - Jeśli już chce iść dalej: ustalcie konkretną pierwszą deliverkę (np. 3 interpretacje na próbę)

---

## Po rozmowie - zapisz w `analyses/2026-05-W0-partnership-outcome.md`

Notatki do uzupełnienia (najlepiej od razu po, dopóki świeże):

- **Decyzja partnerstwa:** TAK / TAK z hesytacjami / Advisor only / "Pomyślę" / NIE
- **Jeśli TAK - rola:** _____
- **Capacity (h/tydz):** _____
- **Compensation discussion:** _____
- **Voice/tone preferences:** _____
- **System domów:** _____
- **Banned phrases (co nigdy nie pisać):** _____
- **Whitelisted phrases (jej ulubione):** _____
- **Top 3 priorytety w natal interpretacji:** _____
- **10 sample interpretations - kiedy:** _____
- **Jej obawy:** _____
- **Next step + data:** _____

---

## Twoje notatki własne (przed rozmową)

> Wypełnij sam zanim pójdziesz, żebyś nie kombinował w trakcie:

- **Maksymalna rola którą jesteś gotów zaoferować:** _____
- **Maksymalna equity którą jesteś gotów oddać:** _____
- **Minimalna capacity której potrzebujesz od niej:** _____
- **Red flag która spowoduje że NIE:** _____
- **Co Ci zależy żeby ona wiedziała o Tobie:** _____

---

## Linki

- [[brief]] - kontekst projektu
- `decisions/2026-05-18-week-0-partnership-decision.md` - decyzja partnership framework
- `2026-05-18-spec-v1.md` - spec produktu
- `prompts-v1.md` - prompty AI do których jej feedback wchodzi
