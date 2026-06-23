-- Listy od Astrei — konwencja tematu maila.
-- subject_phrase = część „Oto ..."; pełny temat = „Wiadomość od Astrei: {subject_phrase}".

alter table astrea_letter_templates add column if not exists subject_phrase text;

update astrea_letter_templates set subject_phrase = case slug
  when 'twoja-misja'            then 'Oto Twoja misja'
  when 'twoj-wewnetrzny-swiat'  then 'Oto Twój wewnętrzny świat'
  when 'jak-kochasz'            then 'Oto jak kochasz'
  when 'twoje-dary'             then 'Oto Twoje talenty'
  when 'twoj-cien'              then 'Oto Twój cień'
  when 'twoja-sciezka'          then 'Oto Twoja ścieżka'
  when 'twoj-wzorzec-karmiczny' then 'Oto Twój wzorzec karmiczny'
  when 'jak-mowisz-i-myslisz'   then 'Oto jak mówisz i myślisz'
  else subject_phrase end
where slug in ('twoja-misja','twoj-wewnetrzny-swiat','jak-kochasz','twoje-dary',
               'twoj-cien','twoja-sciezka','twoj-wzorzec-karmiczny','jak-mowisz-i-myslisz');
