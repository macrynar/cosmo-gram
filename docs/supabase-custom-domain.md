# Profesjonalny link w mailu aktywacyjnym (custom domain Supabase)

## Problem

Domyślnie w mailu aktywacyjnym pojawia się brzydki link na domenie projektu, np.:

```
https://<projekt>.supabase.co/auth/v1/verify?token=...&redirect_to=...
```

> **KOREKTA (2026-06-26):** Wcześniejsza teza „tego linku nie da się zmienić kodem"
> była błędna **dla maili**. Link w mailu **DA SIĘ** przenieść na własną domenę za
> darmo — wzorcem `token_hash` + `verifyOtp` po stronie klienta (patrz niżej).
> Custom Domain (~$10/mc) jest potrzebny **już tylko** dla ekranu zgody Google OAuth
> (consent screen pokazuje `*.supabase.co` jako nazwę aplikacji) — tego nie da się
> obejść kodem, bo to redirect po stronie Google, nie nasz mail.

Redirect po stronie kodu jest już poprawny (`emailRedirectTo: https://www.cosmo-gram.com/auth/callback`).

---

## Rozwiązanie dla maili BEZ Custom Domain (wdrożone, darmowe)

Zamiast domyślnego linku `*.supabase.co/auth/v1/verify` używamy szablonu maila
kierującego na **naszą** domenę z tokenem w query, a sesję wymieniamy w przeglądarce
przez `verifyOtp` — pasuje do `@supabase/supabase-js` z sesją w localStorage.

**1. Szablon maila** (Authentication → Emails → Templates → Confirm signup) — link:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

Plus **Site URL** = `https://www.cosmo-gram.com` (Authentication → URL Configuration).

**2. Kod** — `src/app/auth/callback/page.tsx` czyta `token_hash` + `type` z query i woła
`supabase.auth.verifyOtp({ token_hash, type })` **przed** fallbackiem `getSession`.
Po sukcesie leci cała istniejąca logika (welcome-mail dla `signup`, bramka RODO,
pending-chart cross-device). Obsługiwane typy: `signup`, `magiclink`, `recovery`,
`invite`, `email_change` (`EMAIL_OTP_TYPES`).

> **Uwaga:** `recovery` i `magiclink` działają tym samym mechanizmem, ale `recovery`
> wymaga osobnej strony „ustaw nowe hasło", której jeszcze nie ma — szablony tych
> maili NIE są jeszcze przepięte na `token_hash`. Osobny, przyszły task.

**3. Custom SMTP (Resend)** już wpięty — sufit maili to plan Resend (free = 100/dobę),
nie Supabase. Rate limit Supabase z custom SMTP to domyślnie 30/h (Authentication →
Rate Limits) — podnosić tylko przed launchem ze spike'iem.

---

## (Opcjonalnie / tylko dla Google OAuth consent) Custom Domain — kroki poniżej

Poniższe kroki są potrzebne **wyłącznie** jeśli chcesz, żeby ekran zgody Google OAuth
pokazywał `auth.cosmo-gram.com` zamiast `*.supabase.co`. Dla samych maili **nie są
potrzebne** — wystarczy wzorzec `token_hash` wyżej.

---

## Krok po kroku

### 1. Wybierz subdomenę dla Auth
Sugerowana: `auth.cosmo-gram.com` (link w mailu będzie `https://auth.cosmo-gram.com/auth/v1/verify?...`).

### 2. Włącz Custom Domain w Supabase
Dashboard → **Project Settings → Custom Domains** → *Add custom domain* → wpisz `auth.cosmo-gram.com`.
(Alternatywnie CLI: `supabase domains create --project-ref <ref> --custom-hostname auth.cosmo-gram.com`.)

Supabase pokaże rekordy DNS do dodania.

### 3. Dodaj rekordy DNS (u rejestratora domeny cosmo-gram.com)
Supabase poda dokładne wartości — zwykle:

| Typ   | Nazwa                          | Wartość                                  |
|-------|--------------------------------|------------------------------------------|
| CNAME | `auth`                         | `<projekt>.supabase.co` (target z panelu)|
| TXT   | `_acme-challenge.auth`         | wartość z panelu (certyfikat SSL)        |
| TXT   | (weryfikacja własności)        | wartość z panelu                         |

Poczekaj na propagację (kilka min – kilka h), potem w panelu kliknij **Verify / Activate**.

### 4. Zaktualizuj URL Configuration w Auth
Dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://www.cosmo-gram.com`
- **Redirect URLs** (dodaj jeśli brak):
  - `https://www.cosmo-gram.com/auth/callback`
  - `https://www.cosmo-gram.com/**`

### 5. Zaktualizuj zmienną środowiskową aplikacji
Po aktywacji custom domain zmień w Vercel (Production) **i** w `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://auth.cosmo-gram.com
```

(klient w `src/lib/supabase.ts` czyta tę zmienną — anon key zostaje bez zmian).
Redeploy na Vercel.

### 6. Sprawdź
Zarejestruj testowe konto → w mailu aktywacyjnym najedź na przycisk/link i potwierdź, że adres to `https://auth.cosmo-gram.com/...`. Kliknij → powinno przerzucić na `https://www.cosmo-gram.com/auth/callback` i zalogować.

---

## Opcjonalnie: profesjonalniejsza treść maila
Niezależnie od domeny warto dopieścić szablon:
Dashboard → **Authentication → Emails → Templates → Confirm signup** — branding, polski tekst, logo.
Można też podpiąć własny SMTP (Resend) w **Authentication → SMTP Settings**, żeby nadawcą był np. `no-reply@cosmo-gram.com` (to zmienia nadawcę, nie domenę linku — link nadal wymaga custom domain z kroków powyżej).

## Koszt
Custom Domains to płatny add-on Supabase (~$10/mc per projekt). **Dla maili nie jest
potrzebny** (mamy wzorzec `token_hash`). Zostaje przydatny już tylko dla ekranu zgody
Google OAuth, gdzie chcemy widzieć własną domenę zamiast `*.supabase.co`.
