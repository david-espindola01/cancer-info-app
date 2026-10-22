-- Cuántas veces se usó la IA por día y por motivo (por ejemplo, «precarga»), para no
-- agotar la cuota diaria de la capa gratuita con trabajo que nadie pidió todavía.
create table uso_ia (
  dia date not null default current_date,
  motivo text not null,
  cantidad integer not null default 0,
  primary key (dia, motivo)
);
