import type { ResultadoPaso } from "@/aplicacion/lectura/procesar-siguiente-paso";
import type { DocumentoVista } from "../api/http";

export type ResultadoPasoVista = Exclude<ResultadoPaso, { tipo: "no-existe" }>;

const ENCABEZADOS_JSON = { "Content-Type": "application/json" };

async function mensajeDeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo: { error?: unknown } = await respuesta.json();
    if (typeof cuerpo.error === "string") return cuerpo.error;
  } catch {
    // El cuerpo no era JSON: se usa el mensaje genérico.
  }
  return `El servidor respondió con un error (${respuesta.status}).`;
}

/** La lista de documentos, o null si no hay una sesión iniciada. */
export async function pedirDocumentos(): Promise<DocumentoVista[] | null> {
  const respuesta = await fetch("/api/documentos", { cache: "no-store" });
  if (respuesta.status === 401) return null;
  if (!respuesta.ok) throw new Error(await mensajeDeError(respuesta));
  return (await respuesta.json()).documentos;
}

/** Devuelve null si se inició sesión, o el mensaje de error. */
export async function pedirSesion(clave: string): Promise<string | null> {
  const respuesta = await fetch("/api/sesion", {
    method: "POST",
    headers: ENCABEZADOS_JSON,
    body: JSON.stringify({ clave }),
  });
  return respuesta.ok ? null : mensajeDeError(respuesta);
}

/** Pide al servidor que avance un paso en la lectura de un documento. */
export async function pedirPaso(id: string): Promise<ResultadoPasoVista> {
  const respuesta = await fetch(`/api/documentos/${id}/paso`, { method: "POST" });
  return respuesta.ok ? respuesta.json() : { tipo: "error", mensaje: await mensajeDeError(respuesta) };
}

export async function enviarDocumento(
  titulo: string,
  texto: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const respuesta = await fetch("/api/documentos", {
    method: "POST",
    headers: ENCABEZADOS_JSON,
    body: JSON.stringify({ titulo, texto }),
  });
  return respuesta.ok
    ? { ok: true, mensaje: "Subido. Queda en espera de lectura." }
    : { ok: false, mensaje: await mensajeDeError(respuesta) };
}
