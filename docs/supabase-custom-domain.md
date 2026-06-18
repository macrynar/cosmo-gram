# Profesjonalny link w mailu aktywacyjnym (custom domain Supabase)

## Problem

Przy rejestracji w mailu aktywacyjnym pojawia się brzydki link, np.:

```
https://<projekt>.supabase.co/auth/v1/verify?token=...&redirect_to=...
```

Tego linku **nie da się zmienić kodem** — generuje go Supabase i jego domena to domena projektu (`*.supabase.co`). Żeby user widział link na `cosmo-gram.com`, trzeba w Supabase włączyć **Custom Domain** (płatny dodatek, ~$10/mc).

Redirect po stronie kodu jest już poprawny (`emailRedirectTo: https://www.cosmo-gram.com/auth/callback`) — chodzi wyłącznie o domenę samego linku weryfikacyjnego.

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
Custom Domains to płatny add-on Supabase (~$10/mc per projekt). Bez niego link będzie zawsze na `*.supabase.co`.
