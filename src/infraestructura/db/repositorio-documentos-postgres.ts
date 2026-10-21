import type { Sql } from "postgres";
import type { Documento, EstadoDocumento, Fragmento } from "@/dominio/documento";
import type { NotasFragmento } from "@/aplicacion/lectura/esquemas";
import type { NuevoDocumento, RepositorioDocumentos } from "@/aplicacion/puertos";

interface FilaDocumento {
  id: string;
  titulo: string;
  huella: string;
  estado: EstadoDocumento;
  error: string | null;
  creado_en: Date;
}

const aDocumento = (fila: FilaDocumento): Documento => ({
  id: fila.id,
  titulo: fila.titulo,
  huella: fila.huella,
  estado: fila.estado,
  error: fila.error,
  creadoEn: fila.creado_en,
});

export class RepositorioDocumentosPostgres implements RepositorioDocumentos {
  constructor(private readonly sql: Sql) {}

  registrar({ titulo, huella, fragmentos }: NuevoDocumento) {
    return this.sql.begin(async (tx) => {
      const [nuevo] = await tx<FilaDocumento[]>`
        insert into documentos (titulo, huella) values (${titulo}, ${huella})
        on conflict (huella) do nothing
        returning *`;
      if (!nuevo) {
        const [existente] = await tx<FilaDocumento[]>`select * from documentos where huella = ${huella}`;
        return { documento: aDocumento(existente!), creado: false };
      }
      if (fragmentos.length > 0) {
        const filas = fragmentos.map((texto, orden) => ({ documento_id: nuevo.id, orden, texto }));
        await tx`insert into fragmentos ${tx(filas)}`;
      }
      return { documento: aDocumento(nuevo), creado: true };
    });
  }

  async obtener(id: string) {
    const [fila] = await this.sql<FilaDocumento[]>`select * from documentos where id = ${id}`;
    return fila ? aDocumento(fila) : null;
  }

  async listar() {
    const filas = await this.sql<FilaDocumento[]>`select * from documentos order by creado_en desc, id`;
    return filas.map(aDocumento);
  }

  async cambiarEstado(id: string, estado: EstadoDocumento, error?: string) {
    await this.sql`
      update documentos
      set estado = ${estado}, error = ${error ?? null}, actualizado_en = now()
      where id = ${id}`;
  }

  async siguienteFragmentoPendiente(documentoId: string): Promise<Fragmento | null> {
    const [fila] = await this.sql<{ orden: number; texto: string }[]>`
      select orden, texto from fragmentos
      where documento_id = ${documentoId} and notas is null
      order by orden limit 1`;
    return fila ? { documentoId, orden: fila.orden, texto: fila.texto } : null;
  }

  async guardarNotas(documentoId: string, orden: number, notas: NotasFragmento) {
    await this.sql`
      update fragmentos set notas = ${this.sql.json(notas)}
      where documento_id = ${documentoId} and orden = ${orden}`;
  }

  async listarNotas(documentoId: string) {
    const filas = await this.sql<{ notas: NotasFragmento }[]>`
      select notas from fragmentos
      where documento_id = ${documentoId} and notas is not null
      order by orden`;
    return filas.map((fila) => fila.notas);
  }

  async progreso(documentoId: string) {
    const [fila] = await this.sql<{ procesados: number; total: number }[]>`
      select count(notas)::int as procesados, count(*)::int as total
      from fragmentos where documento_id = ${documentoId}`;
    return { procesados: fila!.procesados, total: fila!.total };
  }
}
