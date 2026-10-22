import { NextResponse, type NextRequest } from "next/server";
import { session, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/infrastructure/container";
import { visitorIp } from "../../visitor-ip";
import { jsonError, readJsonObject } from "../http";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const password = typeof body?.password === "string" ? body.password : "";
  const result = await session.login(password, visitorIp(request.headers));

  if (result.kind === "limit") {
    return jsonError("Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.", 429);
  }
  if (result.kind === "wrong-password") return jsonError("La clave no es correcta.", 401);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
