---
title: OG image + favicon + ikony PWA — wdrożenie (przekazanie do Claude Code)
type: implementation-prompt
owner: Mac
created: 2026-06-13
assets: public/og-default.png, public/icons/icon-512.png, public/icons/icon-192.png, public/icons/icon-512-maskable.png, public/apple-touch-icon.png, public/favicon-32.png, public/favicon-16.png, public/favicon.ico
---

# Cel

Wdrożyć nowe, spójne z DS assety marki: **OG image, favicon i ikony PWA** (sygnet-półksiężyc, bursztyn, kosmiczny gradient). Pliki **są już w `public/`** — trzeba je ogłosić w metadanych + manifeście i wdrożyć. Stare fioletowe `icon-512/192.png` zostały podmienione w miejscu (te same nazwy).

OG tagline: **„Twój głęboki portret, odczytany z nieba"** (wrysowany w `og-default.png`).

# 1. `src/app/layout.tsx` — metadata

- **Dodaj `metadataBase`** (wymagane, żeby względny URL OG się rozwinął) — ustaw na realną domenę produkcyjną:
```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://cosmogram.pl"), // ← PODMIEŃ na prawdziwą domenę
  // ...
  icons: {
    icon: [
      "/favicon.ico",
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    // ...istniejące pola...
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Cosmogram" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};
```
- Dziś `icons` wskazuje na `/icons/icon-192.png` (był fioletowy) jako favicon — zamień na powyższe (ico + 32/16 + apple-touch).

# 2. `public/manifest.json` — ikony PWA

Upewnij się, że `icons[]` zawiera (dodaj maskable, jeśli go nie ma):
```json
{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
{ "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
{ "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
```
(`theme_color`/`background_color` zostaw — sygnet jest na ciemnym tle, pasuje.)

# 3. App Router — uwaga na auto-ikony

Next App Router automatycznie podstawia `app/favicon.ico`, `app/icon.(png|svg)`, `app/apple-icon.png`, jeśli istnieją — i **nadpisują** `metadata.icons`. Sprawdź `src/app/`: jeśli leży tam stary `favicon.ico`/`icon.png`, usuń go albo podmień na nowy, żeby nie wygrał ze świeżym faviconem.

# 4. Per-page OG (porządek)

- Strona `pricing` ma już w metadanych absolutny `…/og-default.png` — plik teraz istnieje, zostaw.
- Pozostałe strony mogą dziedziczyć domyślny OG z `layout.tsx` (po dodaniu `images` w §1). Nie trzeba duplikować per-page, chyba że chcesz dedykowane grafiki.
- **Ujednolić domenę:** w repo kanoniczne URL-e są niespójne (`www.cosmo-gram.com` na stronie Kosmogram, `cosmogram.pl` w cenniku). Ustal jedną domenę produkcyjną i użyj jej w `metadataBase` oraz wszystkich `alternates.canonical` / absolutnych OG.

# 5. Wdrożenie

```
git add public/og-default.png public/favicon.ico public/favicon-16.png public/favicon-32.png \
        public/apple-touch-icon.png public/icons/icon-192.png public/icons/icon-512.png public/icons/icon-512-maskable.png
git commit -m "Nowe OG, favicon i ikony PWA (DS) + tagline"
git push
```
Po deployu zweryfikuj: favicon w karcie przeglądarki, `…/og-default.png` otwiera się, podgląd linku (np. w komunikatorze / przez debugger OG) pokazuje nową grafikę, instalacja PWA bierze nowe ikony (maskable bez przycięcia sygnetu).

# Uwaga o taglinie

„Twój głęboki portret, odczytany z nieba" żyje **w obrazku OG** (nie w kodzie). Jeśli chcesz, żeby był też **tekstowym hasłem marki** (meta `description`, hero strony głównej), to osobna zmiana copy — `metadata.title`/`description` w `layout.tsx` dziś brzmią „Twoja astrologia z prawdziwym głosem". Daj znać, jeśli ujednolicić.

# Definition of done

- Favicon (ico + 32/16) i apple-touch-icon widoczne; stare auto-ikony nie nadpisują.
- `og-default.png` ustawiony jako domyślny OG (+ twitter summary_large_image), `metadataBase` na prod domenie.
- Manifest z `icon-192/512` + `icon-512-maskable` (purpose maskable); instalacja PWA pokazuje nowy sygnet.
- Jedna spójna domena w `metadataBase`/canonical/OG.
- Assety wdrożone (commit + push), zweryfikowane na produkcji.
