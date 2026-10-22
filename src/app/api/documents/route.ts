import { NextResponse, type NextRequest } from "next/server";
import { MAX_DOCUMENT_CHARACTERS } from "@/application/reading/register-document";
import { documents } from "@/infrastructure/container";
import { jsonError, readJsonObject, toView, UNAUTHORIZED, validSession } from "../http";

export async function GET(request: NextRequest) {
  if (!validSession(request)) return UNAUTHORIZED();
  return NextResponse.json({ documents: (await documents.list()).map(toView) });
}

export async function POST(request: NextRequest) {
  if (!validSession(request)) return UNAUTHORIZED();

  const body = await readJsonObject(request);
  if (typeof body?.title !== "string" || typeof body.text !== "string") {
    return jsonError("Se esperaba un título y el texto del documento.", 400);
  }
  if (body.text.length > MAX_DOCUMENT_CHARACTERS) {
    return jsonError("El documento es demasiado largo para ser un artículo.", 413);
  }

  const result = await documents.register({ title: body.title, text: body.text });
  switch (result.kind) {
    case "created":
      return NextResponse.json({ document: toView(result.document) }, { status: 201 });
    case "existing":
      return NextResponse.json(
        { error: "Este artículo ya se había subido.", document: toView(result.document) },
        { status: 409 },
      );
    case "no-text":
      return jsonError(
        "El PDF casi no tiene texto. Puede ser una imagen escaneada, que por ahora no se puede leer.",
        422,
      );
  }
}
