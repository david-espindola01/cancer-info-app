import { migrar } from "@/infraestructura/db/migrador";
import { conexionPruebas, DIRECTORIO_MIGRACIONES } from "./bd";

/** globalSetup de Vitest: deja la base de pruebas vacía y con todas las migraciones aplicadas. */
export default async function prepararBdPruebas(): Promise<void> {
  const sql = conexionPruebas();
  try {
    await sql`drop schema if exists public cascade`;
    await sql`create schema public`;
    await migrar(sql, DIRECTORIO_MIGRACIONES);
  } finally {
    await sql.end();
  }
}
