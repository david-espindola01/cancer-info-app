import type { JSONValue, Sql } from "postgres";
import type { EstadoPagina, FuentePagina, PaginaTema } from "@/dominio/pagina";
import type { NuevaPagina, RepositorioPaginas } from "@/aplicacion/puertos";

interface FilaPagina {
  slug: string;
  tema: string;
  ui: string | null;
  fuentes: FuentePagina[];
  palabras_clave: string[];
  version_corpus: number;
  estado: EstadoPagina;
}

/** Una página que nunca se generó todavía no tiene versión del corpus. */
const SIN_VERSION = -1;

export class RepositorioPaginasPostgres implements RepositorioPaginas {
  constructor(private readonly sql: Sql) {}

  async obtener(slug: string): Promise<PaginaTema | null> {
    const [fila] = await this.sql<FilaPagina[]>`select * from paginas where slug = ${slug}`;
    if (!fila) return null;
    return {
      slug: fila.slug,
      tema: fila.tema,
      ui: fila.ui,
      fuentes: fila.fuentes,
      palabrasClave: fila.palabras_clave,
      versionCorpus: fila.version_corpus,
      estado: fila.estado,
    };
  }

  async reservar(slug: string, tema: string) {
    // Un turno de más de 2 minutos se considera abandonado (la función que lo tomó murió).
    const filas = await this.sql`
      insert into paginas (slug, tema, version_corpus, estado)
      values (${slug}, ${tema}, ${SIN_VERSION}, 'generando')
      on conflict (slug) do update set estado = 'generando', actualizada_en = now()
      where paginas.estado <> 'generando' or paginas.actualizada_en < now() - interval '2 minutes'
      returning slug`;
    return filas.length > 0;
  }

  async guardar(pagina: NuevaPagina) {
    await this.sql`
      update paginas set
        tema = ${pagina.tema},
        ui = ${pagina.ui},
        fuentes = ${this.sql.json(pagina.fuentes as unknown as JSONValue)},
        palabras_clave = ${pagina.palabrasClave},
        version_corpus = ${pagina.versionCorpus},
        estado = 'lista',
        actualizada_en = now()
      where slug = ${pagina.slug}`;
  }

  async liberar(slug: string) {
    await this.sql`update paginas set estado = 'error', actualizada_en = now() where slug = ${slug}`;
  }
}
