-- How many times the AI was used per day and per reason (for example, prefetching), so the
-- free tier's daily quota is not spent on work nobody has asked for yet.
create table uso_ia (
  dia date not null default current_date,
  motivo text not null,
  cantidad integer not null default 0,
  primary key (dia, motivo)
);
