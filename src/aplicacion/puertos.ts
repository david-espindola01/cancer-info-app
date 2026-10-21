import type { Documento, EstadoDocumento, Fragmento } from "@/dominio/documento";
import type { PaginaTema } from "@/dominio/pagina";
import type { ContenidoMemoria, NotasFragmento } from "./lectura/esquemas";

export interface NuevoDocumento {
  titulo: string;
  huella: string;
  fragmentos: string[];
}

export interface RepositorioDocumentos {
  /** Guarda el documento y sus fragmentos. Si la huella ya existe, devuelve el existente. */
  registrar(nuevo: NuevoDocumento): Promise<{ documento: Documento; creado: boolean }>;
  obtener(id: string): Promise<Documento | null>;
  /** Del más reciente al más antiguo. */
  listar(): Promise<Documento[]>;
  cambiarEstado(id: string, estado: EstadoDocumento, error?: string): Promise<void>;
  /** El primer fragmento (por orden) que aún no tiene notas. */
  siguienteFragmentoPendiente(documentoId: string): Promise<Fragmento | null>;
  guardarNotas(documentoId: string, orden: number, notas: NotasFragmento): Promise<void>;
  /** Notas de los fragmentos ya procesados, en orden. */
  listarNotas(documentoId: string): Promise<NotasFragmento[]>;
  progreso(documentoId: string): Promise<{ procesados: number; total: number }>;
}

export interface MemoriaEncontrada {
  documentoId: string;
  titulo: string;
  contenido: ContenidoMemoria;
}

export type NuevaPagina = Omit<PaginaTema, "estado" | "ui"> & { ui: string };

export interface RepositorioPaginas {
  obtener(slug: string): Promise<PaginaTema | null>;
  /**
   * Toma el turno para generar la página si nadie más lo tiene (o si quien lo tenía
   * lleva demasiado tiempo). Devuelve false si otro ya la está generando.
   * Conserva la versión anterior de la página para seguir sirviéndola mientras tanto.
   */
  reservar(slug: string, tema: string): Promise<boolean>;
  /** Guarda la página generada y libera el turno. */
  guardar(pagina: NuevaPagina): Promise<void>;
  /** Libera el turno sin guardar (por ejemplo, si la IA alcanzó su límite). */
  liberar(slug: string): Promise<void>;
}

export interface RepositorioMemorias {
  /** Guarda (o reemplaza) la memoria de un documento e incrementa la versión del corpus. Devuelve la nueva versión. */
  guardar(documentoId: string, contenido: ContenidoMemoria): Promise<number>;
  /** Memorias relacionadas con la consulta, de la más a la menos relevante. */
  buscar(consulta: string, limite: number): Promise<MemoriaEncontrada[]>;
  versionCorpus(): Promise<number>;
}
