import { NextResponse, type NextRequest } from "next/server";
import { estadoDelSistema } from "@/infraestructura/contenedor";
import { NO_AUTORIZADO, sesionValida } from "../http";

export async function GET(request: NextRequest) {
  if (!sesionValida(request)) return NO_AUTORIZADO();
  return NextResponse.json(await estadoDelSistema());
}
