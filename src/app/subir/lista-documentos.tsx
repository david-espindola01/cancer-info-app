import type { DocumentoVista } from "../api/http";

const ETIQUETA_ESTADO: Record<DocumentoVista["estado"], string> = {
  pendiente: "En espera de lectura",
  procesando: "Leyendo…",
  listo: "Listo",
  error: "Error",
};

/** Lo que se está haciendo ahora con un documento (por ejemplo, «Leyendo parte 2 de 5…»). */
export interface Actividad {
  id: string;
  mensaje: string;
}

interface Props {
  documentos: DocumentoVista[];
  actividad: Actividad | null;
  alReintentar: (id: string) => void;
}

export function ListaDocumentos({ documentos, actividad, alReintentar }: Props) {
  if (documentos.length === 0) {
    return <p className="mt-4">Todavía no hay artículos subidos.</p>;
  }
  return (
    <ul aria-label="Artículos subidos" className="mt-4 flex flex-col gap-2">
      {documentos.map((documento) => (
        <li key={documento.id} className="rounded border border-current/30 px-3 py-2">
          <p className="font-semibold">{documento.titulo}</p>
          <p aria-live="polite">
            {actividad?.id === documento.id ? actividad.mensaje : ETIQUETA_ESTADO[documento.estado]}
            {documento.error && ` — ${documento.error}`}
          </p>
          {documento.estado === "error" && (
            <button
              type="button"
              disabled={actividad !== null}
              onClick={() => alReintentar(documento.id)}
              className="mt-2 rounded border border-current px-3 py-1 font-semibold disabled:opacity-60"
            >
              Reintentar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
