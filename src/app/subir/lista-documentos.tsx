import type { DocumentoVista } from "../api/http";

const ETIQUETA_ESTADO: Record<DocumentoVista["estado"], string> = {
  pendiente: "En espera de lectura",
  procesando: "Leyendo…",
  listo: "Listo",
  error: "Error",
};

export function ListaDocumentos({ documentos }: { documentos: DocumentoVista[] }) {
  if (documentos.length === 0) {
    return <p className="mt-4">Todavía no hay artículos subidos.</p>;
  }
  return (
    <ul aria-label="Artículos subidos" className="mt-4 flex flex-col gap-2">
      {documentos.map((documento) => (
        <li key={documento.id} className="rounded border border-current/30 px-3 py-2">
          <p className="font-semibold">{documento.titulo}</p>
          <p>
            {ETIQUETA_ESTADO[documento.estado]}
            {documento.error && ` — ${documento.error}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
