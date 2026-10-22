import { NextResponse, type NextRequest } from "next/server";
import { MAX_CARACTERES_DOCUMENTO } from "@/aplicacion/lectura/registrar-documento";
import { documentos } from "@/infraestructura/contenedor";
import { aVista, errorJson, leerObjetoJson, NO_AUTORIZADO, sesionValida } from "../http";

export async function GET(request: NextRequest) {
  if (!sesionValida(request)) return NO_AUTORIZADO();
  return NextResponse.json({ documentos: (await documentos.listar()).map(aVista) });
}

export async function POST(request: NextRequest) {
  if (!sesionValida(request)) return NO_AUTORIZADO();

  const cuerpo = await leerObjetoJson(request);
  if (typeof cuerpo?.titulo !== "string" || typeof cuerpo.texto !== "string") {
    return errorJson("Se esperaba un título y el texto del documento.", 400);
  }
  if (cuerpo.texto.length > MAX_CARACTERES_DOCUMENTO) {
    return errorJson("El documento es demasiado largo para ser un artículo.", 413);
  }

  const resultado = await documentos.registrar({ titulo: cuerpo.titulo, texto: cuerpo.texto });
  switch (resultado.tipo) {
    case "creado":
      return NextResponse.json({ documento: aVista(resultado.documento) }, { status: 201 });
    case "existente":
      return NextResponse.json(
        { error: "Este artículo ya se había subido.", documento: aVista(resultado.documento) },
        { status: 409 },
      );
    case "sin-texto":
      return errorJson(
        "El PDF casi no tiene texto. Puede ser una imagen escaneada, que por ahora no se puede leer.",
        422,
      );
  }
}
