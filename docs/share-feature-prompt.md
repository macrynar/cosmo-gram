---
title: Share Feature — MVP prompt dla Claude Code
created: 2026-05-21
project: cosmogram
type: claude-code-prompt
status: ready-to-paste
---

# Share Feature MVP — prompt do wklejenia

> Wklej całość poniżej (od linii `Przeczytaj...` do końca) do Claude Code. Nie modyfikuj — jest celowo minimalny, anti-overengineering.

---

Przeczytaj `docs/spec.md` sekcja 4 (user flows F1, F4) i `docs/goal-instruction.md` sekcja 4 (Shareability). To są jedyne dwa dokumenty potrzebne.

## Co budujemy

MVP funkcji share: przycisk "Udostępnij" pojawia się po wygenerowaniu natalu i po wyniku Astro-Match. Klik → modal → karta PNG generowana w przeglądarce Canvas API → Web Share API albo download.

**Jeden format karty: 1080×1920 (Story).** Działa wszędzie: IG Story, TikTok, Snap, X, FB Story, DM. Multipurpose, koniec dyskusji.

## Co NIE robimy w MVP

- Bez `cosmogram.pl/p/[slug]` public mini-profile (osobny feature, P1)
- Bez wielu formatów karty (tylko Story 1080×1920)
- Bez A/B test wariantów
- Bez streak share, daily share — tylko natal i match
- Bez platform-specific captions / hashtagów
- Bez UTM attribution complex

Jeśli kusi rozszerzenie scope'u — odpowiedz "to backlog P1" i wracaj do MVP.

## Pliki do utworzenia

```
apps/web/src/lib/shareCard.ts         # Canvas generator (oba typy)
apps/web/src/hooks/useShare.ts        # Web Share API + fallback
apps/web/src/components/ShareModal.tsx # UI modal z preview + akcjami
```

## Pliki do modyfikacji

- `supabase/functions/ai-natal/index.ts` — zwracać dodatkowo `shareable_quotes: string[]` (5 najlepszych one-linerów z interpretacji)
- `apps/web/src/pages/Natal.tsx` — przycisk "Udostępnij" na dole interpretacji
- `apps/web/src/pages/Match.tsx` — przycisk "Udostępnij" pod wynikiem score

## Spec karty natal (1080×1920)

```
Background: solid #1a1d3a (deep indigo, brand)
Padding: 80px sides

y=80, top-left:
  Logo Cosmogram (crescent + dot mark, 60px wysokości, biały)
  obok napis "cosmogram" sans-serif 32px

y=480 do y=1200 (centered vertically in this range):
  ONE-LINER wybrany przez usera
  font-family: var(--font-serif), italic
  font-size: 56px, line-height 1.4
  color: #ffffff
  text-anchor: center
  max-width: 920px, auto-wrap

y=1400 do y=1640:
  Big Three section, 3 kolumny po 320px szerokości
  każda kolumna:
    y=1400: glyph 64px biały (☉ dla Sun, ☾ dla Moon, ↑ dla Rising)
    y=1500: znak (np. "BARAN") sans-serif 28px medium, biały
    y=1560: dom (np. "dom 4") sans-serif 18px, biały 60% opacity

y=1820, centered:
  "cosmogram.pl" 26px sans-serif, biały 50% opacity
```

## Spec karty match (1080×1920)

```
Background: solid #1a1d3a
Padding: 80px sides

y=80, top-left:
  Logo Cosmogram (jak wyżej)

y=320, centered:
  "Imie1 × Imie2" sans-serif 52px medium, biały

y=620, centered:
  Big score number: "78"
  serif 240px bold, biały
y=820, centered:
  "/100" serif 64px, biały 60% opacity

y=1000, centered:
  Label score'u: "Dobra kompatybilność" (lub "Wysoka", "Wymagająca")
  sans-serif 36px medium, kolor accent gold #c89968

y=1280 do y=1700, grid 2×2 (każdy cell 460×210):
  Cell 1: 💬 Komunikacja 71
  Cell 2: 🔥 Namiętność 68
  Cell 3: 🌿 Wartości 58
  Cell 4: ⚡ Wyzwania 44
  
  format każdego cella:
    emoji 36px po lewej
    label 24px sans, biały
    score 40px medium, kolor zależny od wartości:
      >70 zielony #4ade80
      50-70 żółty #facc15
      <50 czerwony #f87171
    
y=1820, centered:
  "cosmogram.pl" 26px, biały 50% opacity
```

## ShareModal.tsx — UX flow

```
1. User klika "Udostępnij" na stronie natal lub match
2. Modal się otwiera (overlay, dimmed background)

Dla natal:
  - Header "Wybierz fragment do udostępnienia"
  - 3 kafelki z one-linerami (z shareable_quotes[0..2])
  - User klika jeden → karta renderuje się w preview
  - Można cofnąć i wybrać inny

Dla match:
  - Brak wyboru — karta od razu renderuje z wynikiem
  - Header "Twój Astro-Match"

W obu:
  - Preview karty (skalowana do max 300px szerokości w modalu)
  - 3 przyciski pod preview:
    [Udostępnij]  → navigator.share() z PNG + caption
    [Pobierz]     → download blob jako "cosmogram-natal-{date}.png"
    [Kopiuj link] → copy "https://cosmogram.pl" do clipboardu + toast "Skopiowano"
  - Przycisk "Zamknij" w prawym górnym rogu
```

## useShare.ts hook — sygnatura

```typescript
type ShareInput = {
  pngBlob: Blob;
  filename: string;
  caption: string;
};

type ShareResult = {
  method: 'web_share' | 'download' | 'copy_link';
  success: boolean;
};

function useShare() {
  return {
    share: (input: ShareInput) => Promise<ShareResult>,
    download: (input: ShareInput) => void,
    copyLink: (url: string) => Promise<boolean>,
  };
}
```

Web Share API logic:
- Jeśli `navigator.canShare && navigator.canShare({files: [file]})` → użyj `navigator.share({files, title, text})`
- Jeśli nie wspierane → fallback do download + clipboard
- Caption dla natal: "Mój kosmogram — cosmogram.pl"
- Caption dla match: "Nasz Astro-Match: {score}/100 — cosmogram.pl"

## shareCard.ts — sygnatura generatora

```typescript
type NatalCardData = {
  oneLinerText: string;
  bigThree: {
    sun: { sign: string; house: number };
    moon: { sign: string; house: number };
    rising: { sign: string };
  };
};

type MatchCardData = {
  nameA: string;
  nameB: string;
  scoreOverall: number;
  scoreLabel: string; // "Wysoka kompatybilność" etc.
  scores: {
    communication: number;
    passion: number;
    values: number;
    challenges: number;
  };
};

function generateNatalCard(data: NatalCardData): Promise<Blob>;
function generateMatchCard(data: MatchCardData): Promise<Blob>;
```

Implementacja:
- Vanilla Canvas 2D API, bez bibliotek (no html2canvas, no satori)
- Tworzysz `<canvas width=1080 height=1920>` offscreen
- `ctx.fillRect`, `ctx.fillText`, `ctx.drawImage` (dla logo z SVG → ImageBitmap)
- Załaduj font-serif via `document.fonts.ready` przed renderem (inaczej fallback do system font)
- `canvas.toBlob(blob => resolve(blob), 'image/png')` na koniec

## ai-natal edge function — co zmienić

Aktualny prompt zwraca tylko markdown interpretation. Zmień tak żeby zwracał JSON:

```typescript
// w prompcie dodaj na końcu:
"Odpowiedz w formacie JSON: { interpretation_markdown: string, shareable_quotes: string[5] }"

// shareable_quotes = 5 najlepszych one-linerów (≤15 słów każdy, paradoks/kontrast/odwrócenie oczekiwań)
// z całej interpretacji, gotowych do screenshot

// w response handling: parse JSON, zapisz oba pola w readings table
```

Dodaj kolumnę do tabeli readings:
```sql
ALTER TABLE readings ADD COLUMN shareable_quotes JSONB;
```

## Tracking PostHog

3 eventy:

```typescript
posthog.capture('share_modal_opened', {
  source: 'natal' | 'match',
  reading_id: string
});

posthog.capture('share_card_generated', {
  type: 'natal' | 'match',
  reading_id: string
});

posthog.capture('share_completed', {
  type: 'natal' | 'match',
  method: 'web_share' | 'download' | 'copy_link',
  reading_id: string
});
```

## Test akceptacyjny

Po implementacji uruchom:

1. Wygeneruj natal → przewiń na dół → klik "Udostępnij" → modal → wybierz one-liner → preview karty wygląda jak spec → "Pobierz" → PNG zapisuje się na dysk → otwórz w viewer → sprawdź że tekst nie jest pocięty, że logo widoczne, że watermark widoczny.
2. Powtórz na mobile (PWA installed) → klik "Udostępnij" → system share sheet się otwiera → wyślij do siebie na Telegramie → odbierz PNG poprawny.
3. Wygeneruj Astro-Match → klik "Udostępnij" → karta match wygląda jak spec → score wyświetla się w kolorze zgodnym z thresholdami → 4 sub-scores w grid 2×2.
4. PostHog dashboard → sprawdź że eventy `share_modal_opened`, `share_card_generated`, `share_completed` lecą z poprawnymi properties.
5. W ai-natal → wywołaj endpoint → response zawiera `shareable_quotes` array długości 5 → DB readings ma zapisane shareable_quotes JSONB.

Jeśli któreś z 5 nie przechodzi — nie commituj, wróć do mnie z błędem.

## Po skończeniu

Dopisz do `docs/PROGRESS.md` co zaimplementowane + jaki feedback masz do specu (np. "watermark za blady na ciemnym tle Telegram — sugeruję 70% zamiast 50%").
