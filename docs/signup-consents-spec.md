# Rejestracja — zgody, disclaimery i dokładne treści (P0.2)

Zasada projektowa: **prawo wymaga mniej, niż się wydaje** — wystarczy 1 checkbox obowiązkowy + 1 opcjonalny. Wszystko ponadto obniża konwersję bez korzyści prawnej. Zgody zbieramy w momencie, w którym mają sens dla usera, nie wszystkie na raz przy rejestracji.

---

## Krok 1 wizarda (dane urodzenia) — ZERO checkboxów

Tu user jest najbardziej niepewny („po co im moja data urodzenia?"). Żadnych zgód — tylko jedna linia budująca zaufanie, mały szary tekst pod formularzem:

> Twoje dane urodzenia służą wyłącznie do obliczenia kosmogramu i nie są nigdzie publikowane. Szczegóły w [Polityce Prywatności].

## Krok 2 wizarda (zakładanie konta) — tu jest cała warstwa prawna

**Checkbox 1 — obowiązkowy (niezaznaczony):**

> Akceptuję [Regulamin] i potwierdzam zapoznanie się z [Polityką Prywatności].

**Checkbox 2 — opcjonalny (niezaznaczony!):**

> Chcę otrzymywać e-maile o nowościach i ofertach Cosmogram. Wypiszesz się jednym kliknięciem.

**Mikrotekst pod przyciskiem „Załóż konto"** (drobny, szary — disclaimer charakteru usługi bez checkboxa):

> Cosmogram to przestrzeń refleksji i samopoznania — treści nie są poradą medyczną, psychologiczną, prawną ani finansową.

**Skrócona klauzula informacyjna RODO** (najdrobniejszy tekst na dole kroku lub pod „ⓘ"):

> Administratorem danych jest UXIS Maciej Rynarzewski. Dane przetwarzamy, aby świadczyć usługę Cosmogram (szczegóły i Twoje prawa: [Polityka Prywatności]).

## Czego NIE robić przy rejestracji

- **Nie łączyć zgody marketingowej z akceptacją regulaminu** w jednym checkboxie — klauzula niedozwolona, ryzyko UOKiK.
- **Nie zaznaczać niczego domyślnie** — zgoda domyślna jest nieważna (RODO + PKE).
- **Nie pytać o horoskop e-mailowy przy rejestracji** — patrz niżej.
- **Nie dodawać checkboxa „rozumiem, że to nie porada"** — disclaimer jako informacja wystarcza, checkbox sugeruje ryzyko i płoszy.

## Dzienny horoskop e-mail — zgoda w aplikacji, nie przy rejestracji

To benefit, nie marketing — sprzedawaj go w momencie zachwytu. Po wygenerowaniu pierwszego kosmogramu (ekran wyniku), karta/toast:

> **Chcesz dostawać swój horoskop codziennie rano na e-mail?**
> [Włącz codzienny horoskop]   [Może później]

Kliknięcie = zapis `email_horoscope=true` w `user_preferences` (już istnieje). To zgoda przez wyraźne działanie — czysta prawnie i konwertuje wielokrotnie lepiej niż checkbox przy rejestracji. Każdy mail ma unsubscribe jednym kliknięciem (już jest).

## Google OAuth — ta sama warstwa, inny moment

User z OAuth omija krok 2, więc: po pierwszym powrocie z `/auth/callback` bez zapisanej akceptacji → jednorazowy ekran „Ostatni krok" z checkboxem 1 (+ opcjonalnie 2) przed wejściem do `/app`. Bez tego nie ma dowodu akceptacji regulaminu.

## Rejestr zgód (wymóg rozliczalności RODO)

Tabela `user_consents`: user_id, consent_type (`terms` | `marketing` | `email_horoscope` | `digital_content_delivery`), granted (bool), wording_version, created_at. Zapis przy każdym nadaniu/cofnięciu. Cofnięcie marketingu: ustawienia + link w stopce maila.

## Checkout premium (przypomnienie z prompta Claude Code)

Checkbox przy płatności (obowiązkowy):

> Chcę natychmiastowego dostępu do treści cyfrowych i przyjmuję do wiadomości, że tracę przez to prawo odstąpienia od umowy w ciągu 14 dni.

## Podsumowanie liczbowe

| Moment | Checkboxy obowiązkowe | Opcjonalne |
|---|---|---|
| Krok 1 (dane urodzenia) | 0 | 0 |
| Krok 2 (konto) | 1 (regulamin) | 1 (marketing) |
| Po pierwszym kosmogramie | 0 | horoskop e-mail (przycisk) |
| Checkout | 1 (treści cyfrowe) | 0 |

Cookie banner to osobny mechanizm (wejście na stronę, przed startem PostHog) — poza flow rejestracji.
