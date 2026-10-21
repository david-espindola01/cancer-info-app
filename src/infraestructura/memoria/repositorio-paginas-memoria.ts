import type { PaginaTema } from "@/dominio/pagina";
import type { NuevaPagina, RepositorioPaginas } from "@/aplicacion/puertos";

const TURNO_ABANDONADO_MS = 2 * 60 * 1000;

/** Implementación en memoria para pruebas (mismo contrato que la de Postgres). */
export class RepositorioPaginasMemoria implements RepositorioPaginas {
  private readonly paginas = new Map<string, PaginaTema>();
  /** Cuándo cambió por última vez el estado de cada página. */
  private readonly cambios = new Map<string, number>();

  constructor(private readonly ahora: () => number = Date.now) {}

  async obtener(slug: string) {
    const pagina = this.paginas.get(slug);
    return pagina ? { ...pagina, fuentes: [...pagina.fuentes], palabrasClave: [...pagina.palabrasClave] } : null;
  }

  async reservar(slug: string, tema: string) {
    const actual = this.paginas.get(slug);
    const desde = this.cambios.get(slug) ?? 0;
    if (actual?.estado === "generando" && this.ahora() - desde < TURNO_ABANDONADO_MS) return false;

    const base = actual ?? { slug, tema, ui: null, fuentes: [], palabrasClave: [], versionCorpus: -1 };
    this.cambiar({ ...base, estado: "generando" });
    return true;
  }

  async guardar(pagina: NuevaPagina) {
    this.cambiar({ ...pagina, estado: "lista" });
  }

  async contarListas() {
    return [...this.paginas.values()].filter((pagina) => pagina.ui !== null).length;
  }

  async liberar(slug: string) {
    const actual = this.paginas.get(slug);
    if (actual) this.cambiar({ ...actual, estado: "error" });
  }

  private cambiar(pagina: PaginaTema) {
    this.paginas.set(pagina.slug, pagina);
    this.cambios.set(pagina.slug, this.ahora());
  }
}
