import type { s } from "@hashbrownai/core";
import type { Documento, EstadoDocumento, Fragmento } from "@/dominio/documento";
import type { ContenidoMemoria, NotasFragmento } from "./lectura/esquemas";

export interface PeticionJson<E extends s.HashbrownType> {
  /** Nombre corto del esquema (lo exige la API de salida estructurada). */
  nombre: string;
  sistema: string;
  usuario: string;
  esquema: E;
}

/**
 * Un modelo de lenguaje que responde JSON que cumple un esquema.
 * Lanza `LimiteExcedido` o `RespuestaInvalida` (ver errores-llm.ts).
 */
export interface ProveedorLLM {
  generarJson<E extends s.HashbrownType>(peticion: PeticionJson<E>): Promise<s.Infer<E>>;
}

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

export interface RepositorioMemorias {
  /** Guarda (o reemplaza) la memoria de un documento e incrementa la versión del corpus. Devuelve la nueva versión. */
  guardar(documentoId: string, contenido: ContenidoMemoria): Promise<number>;
  /** Memorias relacionadas con la consulta, de la más a la menos relevante. */
  buscar(consulta: string, limite: number): Promise<MemoriaEncontrada[]>;
  versionCorpus(): Promise<number>;
}
