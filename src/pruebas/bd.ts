import { fileURLToPath } from "node:url";
import type { Sql } from "postgres";
import { crearConexion } from "@/infraestructura/db/cliente";

export const DIRECTORIO_MIGRACIONES = fileURLToPath(
  new URL("../infraestructura/db/migraciones", import.meta.url),
);

/**
 * Base de datos exclusiva para pruebas de integración: se borra en cada corrida.
 * Por eso se lee de DATABASE_URL_PRUEBAS y nunca de DATABASE_URL.
 */
function urlBdPruebas(): string {
  const url = process.env.DATABASE_URL_PRUEBAS;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL_PRUEBAS: las pruebas de integración necesitan una base de datos " +
        "exclusiva para pruebas (por ejemplo, la rama «pruebas» de Neon) en .env.local.",
    );
  }
  return url;
}

export const conexionPruebas = (): Sql => crearConexion(urlBdPruebas());

export async function vaciarTablas(sql: Sql): Promise<void> {
  await sql`truncate documentos, memorias, paginas cascade`;
  await sql`update corpus set version = 0`;
}
