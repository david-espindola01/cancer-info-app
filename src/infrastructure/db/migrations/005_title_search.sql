-- Trigram similarity: prefers the source whose title resembles the question
-- («qué es el cáncer» → «¿Qué es el cáncer?»), even if others mention the word more often.
create extension if not exists pg_trgm;
