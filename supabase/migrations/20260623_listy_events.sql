-- Listy od Astrei — listy wyzwalane tranzytem (Faza 6).
-- event_key + source='event' + idempotencja (1 dostawa na instancję eventu).

alter table user_letters add column if not exists event_key text;

-- Rozszerz CHECK na source o 'event' (nazwa constraintu znajdowana dynamicznie).
do $$
declare cname text;
begin
  select conname into cname from pg_constraint
   where conrelid = 'user_letters'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%source%';
  if cname is not null then execute format('alter table user_letters drop constraint %I', cname); end if;
end $$;
alter table user_letters add constraint user_letters_source_check
  check (source in ('drip','event','one_time_purchase'));

create unique index if not exists uq_user_letters_event
  on user_letters(user_id, letter_slug, event_key) where source = 'event';

-- ─── 3 szablony eventowe ───
insert into astrea_letter_templates
  (slug, title, theme, placement_inputs, trigger_type, trigger_value, tier, kind, wellbeing_level, prompt_slug, word_min, word_max, sort_order, subject_phrase)
values
  ('twoj-rok','Twój rok','rok, który się zaczyna',
   '{"planets":["Słońce"],"points":["MC"]}'::jsonb,'event','{"condition":"solar_return"}'::jsonb,
   'premium','letter','standard','twoj-rok',250,450,20,'Oto Twój nowy rok'),
  ('powrot-saturna','Powrót Saturna','przełom, dojrzałość',
   '{"planets":["Saturn"]}'::jsonb,'event','{"condition":"saturn_return"}'::jsonb,
   'premium','letter','delikatny','powrot-saturna',250,450,21,'Oto Twój powrót Saturna'),
  ('sezon-przemiany','Sezon przemiany','aktywny tranzyt, przemiana',
   '{}'::jsonb,'event','{"condition":"major_transit"}'::jsonb,
   'premium','letter','delikatny','sezon-przemiany',250,450,22,'Oto Twój sezon przemiany')
on conflict (slug) do update set
  title=excluded.title, theme=excluded.theme, placement_inputs=excluded.placement_inputs,
  trigger_type=excluded.trigger_type, trigger_value=excluded.trigger_value, tier=excluded.tier,
  kind=excluded.kind, wellbeing_level=excluded.wellbeing_level, prompt_slug=excluded.prompt_slug,
  word_min=excluded.word_min, word_max=excluded.word_max, sort_order=excluded.sort_order,
  subject_phrase=excluded.subject_phrase;

-- ─── 3 prompty (reużycie aktualnego głosu + user_template z 'twoja-misja') ───
with base as (
  select split_part(system_prompt, '## Temat tego listu', 1) as voice,
         user_prompt_template as usr, config
  from prompt_versions where prompt_name = 'twoja-misja' and version = 'v1'
),
delik as (
  select $d$TEN LIST DOTYKA WRAŻLIWEGO TEMATU. Ton wzmacniający i normalizujący. To, co trudne, pokazujesz jako materiał na wzrost — zaproszenie, nie wyrok. Zero determinizmu, zero diagnozy klinicznej, zero straszenia katastrofą. Zawsze pokaż sprawczość: co z tym można zrobić, z czego czerpać. Jeśli nazywasz trudność, od razu pokaż, że jest z niej wyjście.$d$::text as block
)
insert into prompt_versions (prompt_name, version, system_prompt, user_prompt_template, config, status, rollout_pct, notes)
select
  x.prompt_name, 'v1',
  base.voice || '## Temat tego listu' || E'\n' || x.theme
             || case when x.delikatny then E'\n\n' || delik.block else '' end,
  base.usr, base.config, 'active', 100, 'Listy od Astrei — seed event v1'
from base, delik, (values
  ('twoj-rok',
   $th$Temat: rok, który się właśnie zaczyna (Solar Return). Słońce wróciło do miejsca z dnia narodzin — to osobisty początek nowego roku. Pokaż motyw nadchodzącego roku osadzony w jej Słońcu i drodze w świecie (MC). To list wyzwolony konkretnym tranzytem podanym w fundamencie — odwołaj się do niego wprost (że Słońce wraca), ale bez przepowiadania konkretnych zdarzeń ani dat.$th$, false),
  ('powrot-saturna',
   $th$Temat: Powrót Saturna — przełomowy próg dojrzewania (~29-30 albo ~58 r.ż.). Saturn wraca dokładnie tam, gdzie był w dniu narodzin. To czas rozliczenia z tym, co zbudowane, brania odpowiedzialności i stawiania fundamentów na lata. Pokaż go jako próg dojrzałości i sprawczości, nigdy jako karę. List wyzwolony tranzytem podanym w fundamencie — zacytuj go (że Saturn wraca), bez przepowiadania konkretnych zdarzeń.$th$, true),
  ('sezon-przemiany',
   $th$Temat: długi, formujący tranzyt wolnej planety (podany w fundamencie) do osobistej planety. To sezon przemiany — coś głębokiego w niej się przekształca, powoli i trwale. Pokaż, o co ten sezon prosi, jako zaproszenie do wzrostu, nie zagrożenie. Zacytuj konkretny tranzyt z fundamentu, bez przepowiadania konkretnych zdarzeń ani dat.$th$, true)
) as x(prompt_name, theme, delikatny)
on conflict (prompt_name, version) do update set
  system_prompt = excluded.system_prompt,
  user_prompt_template = excluded.user_prompt_template,
  config = excluded.config,
  status = excluded.status,
  rollout_pct = excluded.rollout_pct,
  notes = excluded.notes;
