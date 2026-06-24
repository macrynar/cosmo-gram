-- Forma gramatyczna (płeć w copy) — Listy dopasowują rodzaj do usera/kosmogramu.
-- Wartości: 'kobieta' | 'mezczyzna' | 'neutralna' (konwencja z moduleSpecs).
-- Istniejący klienci i kosmogramy: default 'mezczyzna' (decyzja Maca).

alter table readings
  add column if not exists grammatical_form text not null default 'mezczyzna'
  check (grammatical_form in ('kobieta','mezczyzna','neutralna'));

alter table user_preferences
  add column if not exists grammatical_form text not null default 'mezczyzna'
  check (grammatical_form in ('kobieta','mezczyzna','neutralna'));
