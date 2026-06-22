-- Primary ("główny") kosmogram per user — the default chart used for email
-- horoscopes and as the default selection across the app. A pointer on
-- user_preferences; when the chart is deleted the pointer clears and the app
-- falls back to the oldest (first-created) reading.
alter table user_preferences
  add column if not exists primary_reading_id uuid references readings(id) on delete set null;
