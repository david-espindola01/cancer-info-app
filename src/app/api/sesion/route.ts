import { NextResponse, type NextRequest } from "next/server";
import { DURACION_SESION_SEGUNDOS, NOMBRE_COOKIE_SESION, sesion } from "@/infraestructura/contenedor";
import { errorJson, leerObjetoJson } from "../http";

export async function POST(request: NextRequest) {
  const cuerpo = await leerObjetoJson(request);
  const token = sesion.iniciar(typeof cuerpo?.clave === "string" ? cuerpo.clave : "");
  if (!token) return errorJson("La clave no es correcta.", 401);

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(NOMBRE_COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
  return respuesta;
}

export async function DELETE() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
  return respuesta;
}
