import type { Sql } from "postgres";
import type { ContenidoMemoria } from "@/aplicacion/lectura/esquemas";
import type { MemoriaEncontrada, RepositorioMemorias } from "@/aplicacion/puertos";
import { terminosDeBusqueda } from "./terminos-busqueda";

export class RepositorioMemoriasPostgres implements RepositorioMemorias {
  constructor(private readonly sql: Sql) {}

  guardar(documentoId: string, contenido: ContenidoMemoria) {
    return this.sql.begin(async (tx) => {
      await tx`
        insert into memorias (documento_id, contenido) values (${documentoId}, ${tx.json(contenido)})
        on conflict (documento_id)
        do update set contenido = excluded.contenido, actualizada_en = now()`;
      const [corpus] = await tx<{ version: number }[]>`
        update corpus set version = version + 1 returning version`;
      return corpus!.version;
    });
  }

  async buscar(consulta: string, limite: number): Promise<MemoriaEncontrada[]> {
    const terminos = terminosDeBusqueda(consulta);
    if (terminos.length === 0) return [];

    // Basta con que coincida un término («|»); ts_rank_cd ordena por cuántos y qué tan cerca.
    const filas = await this.sql<{ documento_id: string; titulo: string; contenido: ContenidoMemoria }[]>`
      select m.documento_id, d.titulo, m.contenido
      from memorias m
      join documentos d on d.id = m.documento_id,
      to_tsquery('es', ${terminos.join(" | ")}) consulta
      where m.busqueda @@ consulta
      order by ts_rank_cd(m.busqueda, consulta) desc, m.documento_id
      limit ${limite}`;
    return filas.map((fila) => ({
      documentoId: fila.documento_id,
      titulo: fila.titulo,
      contenido: fila.contenido,
    }));
  }

  async versionCorpus() {
    const [corpus] = await this.sql<{ version: number }[]>`select version from corpus`;
    return corpus!.version;
  }
}
