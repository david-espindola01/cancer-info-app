import { NextResponse, type NextRequest } from "next/server";
import type { SourceDocument } from "@/domain/document";
import { session, SESSION_COOKIE_NAME } from "@/infrastructure/container";

/** What the browser sees of a document (without internal data such as the fingerprint). */
export interface DocumentView {
  id: string;
  title: string;
  status: SourceDocument["status"];
  active: boolean;
  error: string | null;
  createdAt: string;
}

export const toView = ({ id, title, status, error, active, createdAt }: SourceDocument): DocumentView => ({
  id,
  title,
  status,
  error,
  active,
  createdAt: createdAt.toISOString(),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids come from the address: anything that is not a UUID cannot be a document. */
export const isUuid = (id: string) => UUID.test(id);

export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export const validSession = (request: NextRequest) => session.valid(request.cookies.get(SESSION_COOKIE_NAME)?.value);

export const UNAUTHORIZED = () => jsonError("Inicia sesión para continuar.", 401);

/** The JSON body as an object, or null if it is not a valid JSON object. */
export async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
