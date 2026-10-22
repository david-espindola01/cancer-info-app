import { NextResponse, type NextRequest } from "next/server";
import { DURACION_SESION_SEGUNDOS, NOMBRE_COOKIE_SESION, sesion } from "@/infraestructura/contenedor";
import { ipVisitante } from "../../ip-visitante";
import { errorJson, leerObjetoJson } from "../http";

export async function POST(request: NextRequest) {
  const cuerpo = await leerObjetoJson(request);
  const clave = typeof cuerpo?.clave === "string" ? cuerpo.clave : "";
  const resultado = await sesion.iniciar(clave, ipVisitante(request.headers));

  if (resultado.tipo === "limite") {
    return errorJson("Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.", 429);
  }
  if (resultado.tipo === "clave-incorrecta") return errorJson("La clave no es correcta.", 401);

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(NOMBRE_COOKIE_SESION, resultado.token, {
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
