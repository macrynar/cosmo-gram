-- horoscope_send_logs to tabela WYŁĄCZNIE serwerowa (cron pisze przez service_role,
-- który omija RLS). Bez RLS była wystawiona na anon/authenticated (każdy z anon key
-- mógł czytać/pisać). Włączamy RLS bez polityk publicznych → klient traci dostęp,
-- cron (service_role) działa dalej.

alter table horoscope_send_logs enable row level security;
