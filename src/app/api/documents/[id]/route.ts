import { NextResponse, type NextRequest } from "next/server";
import { documents } from "@/infrastructure/container";
import { isUuid, jsonError, readJsonObject, toView, UNAUTHORIZED, validSession } from "../../http";

const NOT_FOUND = () => jsonError("No existe ese documento.", 404);

/** Turns an article on or off for the agents: `{ "active": true | false }`. */
export async function PATCH(request: NextRequest, context: RouteContext<"/api/documents/[id]">) {
  if (!validSession(request)) return UNAUTHORIZED();

  const body = await readJsonObject(request);
  if (typeof body?.active !== "boolean") return jsonError("Se esperaba si el artículo queda activo o no.", 400);
  const { id } = await context.params;
  const document = isUuid(id) ? await documents.setActive(id, body.active) : null;
  return document ? NextResponse.json({ document: toView(document) }) : NOT_FOUND();
}

/** Deletes an article with everything read from it. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/documents/[id]">) {
  if (!validSession(request)) return UNAUTHORIZED();

  const { id } = await context.params;
  const removed = isUuid(id) && (await documents.remove(id));
  return removed ? new NextResponse(null, { status: 204 }) : NOT_FOUND();
}
