-- Calls to each AI model (reserved before calling, then settled with the tokens actually
-- spent): the per-minute and per-day windows are computed from here.
create table ai_calls (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  tokens integer not null,
  at timestamptz not null default now()
);
create index ai_calls_model_at_idx on ai_calls (model, at);

-- Who is waiting to use each model. A request that stops asking loses its place.
create table ai_queue (
  model text not null,
  subject text not null,
  priority text not null check (priority in ('visitor', 'reader', 'background')),
  tokens integer not null,
  since timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  primary key (model, subject)
);

-- The provider rejected a model's calls until then (it sees limits we cannot, such as
-- other users of the same key).
create table ai_blocks (
  model text primary key,
  until timestamptz not null
);
