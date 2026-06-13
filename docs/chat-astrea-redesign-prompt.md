---
title: Cosmo Chat „Astrea" — redesign strony chatu (przekazanie do Claude Code)
type: implementation-prompt
owner: Mac
created: 2026-06-13
companion: docs/design-system.md
visual-source-of-truth: docs/landing-v2/chat-astrea-mockup.html
asset-script: scripts/fetch-astrea-nebula.sh
---

# Zadanie

Przeprojektuj **istniejącą stronę Cosmo Chat** (`/app/chat`) na koncepcję „rozmowa w środku gwiezdnej mgławicy": okno chatu osadzone w centrum, otoczone mistyczną mgławicą i wirującymi pierścieniami; **Astrea = obecność (światło/sygnet), nigdy postać/twarz**.

**Wymieniasz tylko warstwę prezentacji.** Cała logika chatu (wysyłka, streaming, sesje/historia, kontekst kosmogramu + tranzyty, limity, markdown) **zostaje bez zmian** — reskinujesz, nie przepisujesz backendu.

# Źródło prawdy wizualnej

`docs/landing-v2/chat-astrea-mockup.html` — kompletny mockup (HTML + CSS + JS) z finalnym układem, animacjami, oboma stanami i losowaniem podpowiedzi. **Portuj 1:1 do React/Tailwind, na tokenach DS.** Mac zaakceptował ten wygląd.

# Układ

**Stan pusty (wow + konwersja)** — wszystko nad foldem:
- Pole gwiezdne jako **tło absolutne** (nie spycha treści): grafika mgławicy + kodowe pierścienie + orbitujące ciała + gwiazdy + paralaksa za kursorem.
- W centrum (z-top, scrim pod spodem dla kontrastu): eyebrow `ASTREA`, zaproszenie we **Fraunces** („Niebo zna Twoją historię. O co chcesz zapytać?"), **composer** (pill, poświata), pod nim **6 losowych podpowiedzi**.

**Stan rozmowy:**
- Nagłówek: **sygnet Astrei** (oddychająca poświata) + nazwa „Astrea" (Fraunces) + podtytuł wątku („…czyta Twój kosmogram").
- Wiadomości w kolumnie max **680px**: user po prawej (kafelek `--bg-elevated`), Astrea po lewej — **lead zdanie we Fraunces italic (`--voice`)** + akapity `--text-secondary` (markdown przez istniejący react-markdown).
- Stan generowania: „**Astrea czyta niebo…**" (3 pulsujące kropki) — anticipation.
- Composer przypięty na dole.

**Rail „Twoje rozmowy z niebem"** (lewa kolumna, desktop; mobile: drawer/selektor):
- Lista wątków: glif + tytuł + podgląd ostatniej wiadomości + względny czas. Aktywny podświetlony. Przycisk „＋ Nowa rozmowa". Podłącz pod istniejącą listę sesji/rozmów (rozważ reużycie `HistorySelector`).

# Astrea = obecność, nie twarz

Sygnet z logo (półksiężyc + oczko) **rysowany kodem** — ten sam `path`, co piasta koła natalnego:
```
<path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z"/><circle cx="10" cy="0" r="9"/>
```
fill `currentColor` = `--accent-deep`, z subtelną oddychającą poświatą. Głos Astrei żyje w **treści** wiadomości (lead we Fraunces), nie w postaci. Zero twarzy/figur (zgodne z marką „symboliczne lustro, nie wyrocznia").

# Animacje + reduced-motion

Z mockupu: mgławica rotacja ~150s + oddech; dwa pierścienie kontr-rotujące (~70s / -95s), trzeci ~55s; omiatające światło (conic „scan") ~18s; 3 orbitujące ciała (26/40/60s); dryf+migotanie gwiazd; oddychający rdzeń pod composerem; **paralaksa pola za kursorem** (lerp ~0.05).

**W PRODUKCJI uszanuj `prefers-reduced-motion`:** wyłącz rotacje/scan/parallax i zostaw statyczny, ładny kadr (w mockupie wyłączanie jest zdjęte tylko po to, by pokazać ruch). Animuj wyłącznie `transform`/`opacity`.

# Asset — grafika mgławicy (self-host)

Wybrane ujęcie: Higgsfield job `e13f161d` (alternatywa: `0320f65f`). Pobierz do repo (CDN może wygasnąć):
```
bash scripts/fetch-astrea-nebula.sh        # → public/assets/chat/astrea-nebula.jpg
git add public/assets/chat                 # commit razem z kodem chatu
```
Komponent ładuje ją jako **warstwę-tło** pola gwiezdnego (centrowana, okrągła, opacity ~.9), rotowaną przez kod. Środek grafiki jest ciemny/otwarty — tam siada composer. (Ew. konwersja do `.webp`.)

# Pula podpowiedzi — losowe 6 przy każdym wejściu

```ts
const OPENERS = [
  "Jaki jest cel mojego życia?",
  "Kiedy nadejdzie dobry czas na zmianę pracy?",
  "Dlaczego wciąż przyciągam tych samych ludzi?",
  "Czy spotkam kogoś na dłużej — i kiedy?",
  "Co próbuje mi teraz pokazać los?",
  "Czego o sobie jeszcze nie wiem?",
  "W czym tkwi moja prawdziwa siła?",
  "Co blokuje mnie w pieniądzach?",
  "Czy ta relacja ma przyszłość?",
  "Po co spotkałem tę osobę?",
  "Co przyniesie mi najbliższy rok?",
  "Jakiej lekcji uczy mnie teraz życie?",
  "Gdzie jest moje miejsce na świecie?",
  "Czego naprawdę pragnie moje serce?",
];
// przy montażu stanu pustego: shuffle(OPENERS).slice(0,6)
```
Klik w podpowiedź = wstaw treść do composera i wyślij (ta sama ścieżka co wysyłka ręczna).

# Integracja z istniejącą logiką (NIE przepisywać)

- Composer + podpowiedź → istniejąca funkcja wysyłki wiadomości / startu rozmowy.
- Rail → istniejący mechanizm listy rozmów/sesji.
- Stan rozmowy → istniejące renderowanie wiadomości (markdown, streaming) — tylko nowy skin + „Astrea czyta niebo…".
- Zachowaj limity, kontekst kosmogramu i tranzytów, paywall jeśli jest.

# DS / fonty

Tokeny globalne (`landing-tokens.css`), General Sans + Fraunces są już w `layout.tsx`. Wyłącznie paleta DS (grep po hexach poza dozwolonymi), zero emoji, glify kodem.

# Definition of done

Stan pusty + rozmowa + rail spójne z mockupem · animacje działają, a `prefers-reduced-motion` daje statyczny kadr · mgławica self-host w `public/assets/chat/` (w repo) · podpowiedzi losowane (6 z 14) · **istniejący chat działa bez regresji** (wysyłka, historia, kontekst) · mobile 390px bez przycięcia · TSC 0 · `npm run build` OK.
