import { NextResponse, type NextRequest } from "next/server";
import type { Documento } from "@/dominio/documento";
import { NOMBRE_COOKIE_SESION, sesion } from "@/infraestructura/contenedor";

/** Lo que el navegador ve de un documento (sin datos internos como la huella). */
export interface DocumentoVista {
  id: string;
  titulo: string;
  estado: Documento["estado"];
  error: string | null;
  creadoEn: string;
}

export const aVista = ({ id, titulo, estado, error, creadoEn }: Documento): DocumentoVista => ({
  id,
  titulo,
  estado,
  error,
  creadoEn: creadoEn.toISOString(),
});

export const errorJson = (mensaje: string, estado: number) =>
  NextResponse.json({ error: mensaje }, { status: estado });

export const sesionValida = (request: NextRequest) =>
  sesion.valida(request.cookies.get(NOMBRE_COOKIE_SESION)?.value);

export const NO_AUTORIZADO = () => errorJson("Inicia sesión para continuar.", 401);

/** El cuerpo JSON como objeto, o null si no es un objeto JSON válido. */
export async function leerObjetoJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const cuerpo: unknown = await request.json();
    return cuerpo && typeof cuerpo === "object" && !Array.isArray(cuerpo)
      ? (cuerpo as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
