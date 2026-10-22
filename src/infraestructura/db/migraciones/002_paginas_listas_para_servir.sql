-- La UI se guarda tal como la devuelve el Agente Presentador (texto JSON validado)
-- y se envía al navegador sin volver a serializarla.
alter table paginas alter column ui type text using ui::text;

-- Las fuentes citadas, con título y referencia: el modelo solo cita sus números.
alter table paginas add column fuentes jsonb not null default '[]';
