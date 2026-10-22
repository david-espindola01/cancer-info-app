# infrastructure

Implementations of the ports: LLM providers (Groq and fake), Postgres and in-memory repositories, and migrations.

- May import: `domain/`, `application/` (to implement its ports) and external libraries.
- May not import: `app/` or `ui/`.
- `container.ts` is the only place where implementations are wired to the use cases, and the only file of this layer that `app/` may import.
