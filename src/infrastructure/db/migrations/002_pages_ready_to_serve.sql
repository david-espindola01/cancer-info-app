-- The UI is stored as the Presenter Agent returns it (validated JSON text)
-- and sent to the browser without serializing it again.
alter table paginas alter column ui type text using ui::text;

-- The cited sources, with title and reference: the model only cites their numbers.
alter table paginas add column fuentes jsonb not null default '[]';
