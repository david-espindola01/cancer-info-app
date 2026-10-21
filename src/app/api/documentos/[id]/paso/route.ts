import { NextResponse, type NextRequest } from "next/server";
import { documentos } from "@/infraestructura/contenedor";
import { errorJson, NO_AUTORIZADO, sesionValida } from "../../../http";

/** Un paso hace a lo sumo una petición al modelo (~1–5 s); el margen cubre redes lentas. */
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, contexto: RouteContext<"/api/documentos/[id]/paso">) {
  if (!sesionValida(request)) return NO_AUTORIZADO();

  const { id } = await contexto.params;
  const resultado = UUID.test(id) ? await documentos.procesarPaso(id) : { tipo: "no-existe" as const };
  if (resultado.tipo === "no-existe") return errorJson("No existe ese documento.", 404);
  return NextResponse.json(resultado);
}
