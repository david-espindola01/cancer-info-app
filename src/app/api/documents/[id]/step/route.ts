import { NextResponse, type NextRequest } from "next/server";
import { documents } from "@/infrastructure/container";
import { isUuid, jsonError, UNAUTHORIZED, validSession } from "../../../http";

/** A step makes at most one request to the model (~1–5 s); the margin covers slow networks. */
export const maxDuration = 60;

export async function POST(request: NextRequest, context: RouteContext<"/api/documents/[id]/step">) {
  if (!validSession(request)) return UNAUTHORIZED();

  const { id } = await context.params;
  const result = isUuid(id) ? await documents.processStep(id) : { kind: "not-found" as const };
  if (result.kind === "not-found") return jsonError("No existe ese documento.", 404);
  return NextResponse.json(result);
}
