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

    const texto = consulta.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    // Basta con que coincida un término («|»). El orden suma la relevancia del texto
    // (normalizada a 0–1) y, con el doble de peso, cuánto se parece el título a la consulta.
    const filas = await this.sql<{ documento_id: string; titulo: string; contenido: ContenidoMemoria }[]>`
      select m.documento_id, d.titulo, m.contenido
      from memorias m
      join documentos d on d.id = m.documento_id,
      to_tsquery('es', ${terminos.join(" | ")}) consulta,
      lateral (
        select greatest(
          similarity(unaccent(lower(d.titulo)), ${texto}),
          similarity(unaccent(lower(m.contenido->>'tituloSencillo')), ${texto})
        ) as parecido
      ) titulo
      where m.busqueda @@ consulta or titulo.parecido > 0.3
      order by titulo.parecido * 2 + ts_rank_cd(m.busqueda, consulta, 32) desc, m.documento_id
      limit ${limite}`;
    return filas.map((fila) => ({
      documentoId: fila.documento_id,
      titulo: fila.titulo,
      contenido: fila.contenido,
    }));
  }

  async temasMasFrecuentes(limite: number) {
    const filas = await this.sql<{ tema: string }[]>`
      select tema from memorias, jsonb_array_elements_text(contenido->'temas') tema
      group by tema order by count(*) desc, tema limit ${limite}`;
    return filas.map((fila) => fila.tema);
  }

  async versionCorpus() {
    const [corpus] = await this.sql<{ version: number }[]>`select version from corpus`;
    return corpus!.version;
  }
}
