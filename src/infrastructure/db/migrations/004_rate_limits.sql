-- Request limit per visitor (fixed window). The key never stores the IP as is:
-- only an HMAC fingerprint, to limit without keeping personal data.
create table limite_peticiones (
  clave text primary key,
  ventana_inicio timestamptz not null default now(),
  cantidad integer not null default 0
);
