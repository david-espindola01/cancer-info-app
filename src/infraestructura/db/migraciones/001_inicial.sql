-- Búsqueda en español que ignora tildes: «cancer» encuentra «cáncer».
create extension if not exists unaccent;
create text search configuration es (copy = spanish);
alter text search configuration es
  alter mapping for hword, hword_part, word with unaccent, spanish_stem;

create table documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  huella text not null unique,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'listo', 'error')),
  error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Un fragmento está pendiente mientras sus notas sean null.
create table fragmentos (
  documento_id uuid not null references documentos (id) on delete cascade,
  orden integer not null,
  texto text not null,
  notas jsonb,
  primary key (documento_id, orden)
);

create table memorias (
  documento_id uuid primary key references documentos (id) on delete cascade,
  contenido jsonb not null,
  -- Solo se indexan los valores de texto de la memoria, no los nombres de sus campos.
  busqueda tsvector generated always as (jsonb_to_tsvector('es', contenido, '["string"]')) stored,
  actualizada_en timestamptz not null default now()
);
create index memorias_busqueda_idx on memorias using gin (busqueda);

-- Fila única con la versión del conocimiento: cambia cada vez que se guarda una memoria.
create table corpus (
  id boolean primary key default true check (id),
  version integer not null default 0
);
insert into corpus default values;

create table paginas (
  slug text primary key,
  tema text not null,
  ui jsonb,
  palabras_clave text[] not null default '{}',
  version_corpus integer not null,
  estado text not null check (estado in ('generando', 'lista', 'error')),
  actualizada_en timestamptz not null default now()
);
