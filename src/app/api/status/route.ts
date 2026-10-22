import { NextResponse, type NextRequest } from "next/server";
import { systemStatus } from "@/infrastructure/container";
import { UNAUTHORIZED, validSession } from "../http";

export async function GET(request: NextRequest) {
  if (!validSession(request)) return UNAUTHORIZED();
  return NextResponse.json(await systemStatus());
}
