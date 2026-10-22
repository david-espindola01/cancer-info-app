import postgres, { type Sql } from "postgres";

/**
 * Conexión para funciones serverless contra el pooler de Neon (PgBouncer en modo
 * transacción): sin sentencias preparadas y con pocas conexiones por instancia.
 */
export function crearConexion(url: string): Sql {
  return postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
}
