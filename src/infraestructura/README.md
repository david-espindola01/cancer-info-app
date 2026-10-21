# infraestructura

Implementaciones de los puertos: proveedores LLM (Groq y falso), repositorios Postgres y migraciones.

- Puede importar: `dominio/`, `aplicacion/` (para implementar sus puertos) y librerías externas.
- No puede importar: `app/` ni `ui/`.
- `contenedor.ts` es el único punto donde se conectan las implementaciones con los casos de uso, y el único archivo de esta capa que `app/` puede importar.
