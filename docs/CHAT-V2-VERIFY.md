# CHAT-V2-VERIFY — Checklist weryfikacyjny P1.5 Cosmo Chat

## Wdrożone funkcje

| Faza | Funkcja | Status |
|------|---------|--------|
| FAZA 1 | Pamięć między sesjami (summary w DB) | ✓ |
| FAZA 1 | Auto-nowa sesja po 24h nieaktywności | ✓ |
| FAZA 1 | Lazy summary generation przy powrocie | ✓ |
| FAZA 1 | Max 5 poprzednich podsumowań w kontekście | ✓ |
| FAZA 1 | Usuwanie sesji — z UI + API `/api/chat/delete` | ✓ |
| FAZA 1 | Cron cleanup sesji >12 miesięcy | ✓ |
| FAZA 2 | Top 3 tranzytów dziś w system prompcie | ✓ |
| FAZA 2 | Pogoda dnia + nadchodzące istotne tranzyty | ✓ |
| FAZA 3 | 3 sugerowane chipy dzienne (AI + cache + fallback) | ✓ |
| FAZA 3 | 2 follow-up chipy po odpowiedzi AI | ✓ |
| FAZA 3 | Stagger animation 80ms na chipach | ✓ |
| FAZA 4 | Safety boundaries w system prompcie | ✓ |
| FAZA 4 | Jednorazowe ostrzeżenie o danych | ✓ |
| FAZA 5 | Billing anniversary reset (nie kalendarzowy miesiąc) | ✓ |
| FAZA 5 | chat_pack_100 add-on w infrastrukturze | ✓ |
| FAZA 5 | UI counter (widoczny poniżej 30 pozostałych) | ✓ |
| FAZA 6 | PostHog events | ✓ |

## PostHog events

| Event | Gdzie |
|-------|-------|
| `chat_session_resumed` | `openConversation()` w chat/page.tsx |
| `chat_chip_clicked` | Klik chipa dziennego |
| `chat_followup_clicked` | Klik follow-up chipa |
| `chat_history_deleted` | `deleteConversation()` i privacy/page.tsx |
| `chat_paywall_hit` | Przekroczenie limitu free |
| `chat_limit_reached` | free lub monthly limit |
| `first_chat` | Pierwsza wiadomość usera |

## Bezpieczeństwo i prywatność

- Treść wiadomości NIGDY w `ai_call_logs` — logowane tylko: `task`, `model`, `input_tokens`, `output_tokens`, `latency_ms`, `status`
- RLS na `conversations`: `auth.uid() = user_id`
- RLS na `messages`: `auth.uid() IN (SELECT user_id FROM conversations WHERE id = conversation_id)`
- **Test negatywny RLS**: User B nie może odczytać `messages` należących do rozmów usera A. Weryfikacja:
  ```sql
  -- Jako user B (token usera B):
  SELECT * FROM messages WHERE conversation_id = '<id rozmowy usera A>';
  -- Oczekiwany wynik: [] (puste — RLS blokuje)
  ```
- `chat_suggested_questions` — RLS: `auth.uid() = user_id`
- Eksport danych — `conversations` + `messages` uwzględnione w `/api/export-data`
- Usunięcie konta — wszystkie tabele czatu kasowane w `/api/delete-account`
- Cron cleanup (miesięcznie, 1. dzień miesiąca) — sesje >12 miesięcy usuwane automatycznie

## Migracja SQL do uruchomienia na Supabase

```
supabase/migrations/20260613_chat_v2.sql
```

Zmiany:
- `conversations`: + `summary`, `summary_updated_at`, `last_message_at`
- `user_preferences`: + `chat_data_warning_dismissed`, `chat_pack_purchased`
- `subscriptions`: + `current_period_start`
- Nowa tabela: `chat_suggested_questions` z RLS

## TODO dla właściciela (decyzja prawna)

- [ ] Zaktualizuj politykę prywatności o sekcję: „Przechowujemy historię rozmów z asystentem AI przez 12 miesięcy. Po tym czasie są automatycznie usuwane."
- [ ] Opisz gdzie i jak przetwarzane są treści rozmów (Anthropic API — dane usera idą do modelu; sprawdź DPA z Anthropic)

## Weryfikacja manualna

- [ ] Puść rozmowę, wyloguj się, wróć — rozmowa odtworzona z historii ✓
- [ ] Wejdź do czatu po >24h — nowa sesja tworzona automatycznie ✓
- [ ] Pusty stan wyświetla 3 chipy (załadowane z API lub fallback STARTERS) ✓
- [ ] Odpowiedź asystenta zawiera 2 follow-up chipy ✓
- [ ] Ostrzeżenie o danych pojawia się raz, znika po zamknięciu ✓
- [ ] Klik „usuń rozmowę" (ikona kosza) — znika z listy ✓
- [ ] Usuń historię czatu w Ustawieniach → Prywatność ✓
- [ ] Free user: po 3 wiadomościach PaywallModal ✓
- [ ] Premium user poniżej 30 wiad. — widoczny licznik ✓
