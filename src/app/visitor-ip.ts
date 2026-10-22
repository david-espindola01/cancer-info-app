/** The visitor's IP according to Vercel's proxy (the first one in `x-forwarded-for`). */
export function visitorIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
