export type EstadoDocumento = "pendiente" | "procesando" | "listo" | "error";

/** Un artículo subido por el equipo. */
export interface Documento {
  id: string;
  titulo: string;
  /** Huella del texto limpio: identifica el mismo artículo aunque cambie el nombre del archivo. */
  huella: string;
  estado: EstadoDocumento;
  error: string | null;
  creadoEn: Date;
}

/** Una parte del texto de un documento, del tamaño que cabe en una petición al Agente Lector. */
export interface Fragmento {
  documentoId: string;
  orden: number;
  texto: string;
}
