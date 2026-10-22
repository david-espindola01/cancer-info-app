/** Una fuente que respalda una página; el Agente Presentador solo la cita por su número. */
export interface FuentePagina {
  numero: number;
  titulo: string;
  referencia: string;
}

export type EstadoPagina = "generando" | "lista" | "error";

/** La página de un tema, guardada en caché para servirla a todos sin volver a generarla. */
export interface PaginaTema {
  slug: string;
  tema: string;
  /** Respuesta JSON del Agente Presentador (`{ "ui": [...] }`); null si aún no se generó nunca. */
  ui: string | null;
  fuentes: FuentePagina[];
  /** Temas a los que lleva la página, del más al menos recomendado (para precargarlos). */
  palabrasClave: string[];
  /** Versión del conocimiento con la que se generó: si cambia, la página se regenera. */
  versionCorpus: number;
  estado: EstadoPagina;
}
