import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Sql } from "postgres";

// Este módulo también lo ejecuta Node directamente (scripts/migrar.mjs, con «type stripping»):
// solo usa sintaxis de TypeScript que se puede borrar y no importa rutas con alias.

/** Identificador del bloqueo que evita dos migraciones simultáneas (por ejemplo, dos despliegues). */
const BLOQUEO_MIGRACIONES = 7_340_001;

/**
 * Aplica, en orden alfabético y dentro de una transacción, los archivos `.sql` de
 * `directorio` que aún no se hayan aplicado. Devuelve los nombres de los aplicados.
 */
export async function migrar(sql: Sql, directorio: string): Promise<string[]> {
  const archivos = (await readdir(directorio)).filter((archivo) => archivo.endsWith(".sql")).sort();

  return sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${BLOQUEO_MIGRACIONES})`;
    await tx`
      create table if not exists migraciones (
        nombre text primary key,
        aplicada_en timestamptz not null default now()
      )`;
    const filas = await tx<{ nombre: string }[]>`select nombre from migraciones`;
    const yaAplicadas = new Set(filas.map((fila) => fila.nombre));

    const aplicadas: string[] = [];
    for (const archivo of archivos.filter((nombre) => !yaAplicadas.has(nombre))) {
      await tx.unsafe(await readFile(join(directorio, archivo), "utf8"));
      await tx`insert into migraciones (nombre) values (${archivo})`;
      aplicadas.push(archivo);
    }
    return aplicadas;
  });
}
