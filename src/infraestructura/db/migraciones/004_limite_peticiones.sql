-- Límite de peticiones por visitante (ventana fija). La clave nunca guarda la IP tal cual:
-- solo una huella HMAC, para poder limitar sin conservar datos personales.
create table limite_peticiones (
  clave text primary key,
  ventana_inicio timestamptz not null default now(),
  cantidad integer not null default 0
);
