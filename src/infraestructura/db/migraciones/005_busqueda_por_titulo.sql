-- Similitud por trigramas: permite preferir la fuente cuyo título se parece a lo que se
-- pregunta («qué es el cáncer» → «¿Qué es el cáncer?»), aunque otras mencionen más veces la palabra.
create extension if not exists pg_trgm;
