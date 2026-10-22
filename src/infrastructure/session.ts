import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_DURATION_SECONDS = 12 * 60 * 60;

/**
 * Identifies a visitor without storing their IP: an HMAC fingerprint that cannot be
 * reversed (it limits requests per visitor without keeping personal data).
 */
export function visitorFingerprint(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(`visitor:${ip}`).digest("base64url").slice(0, 22);
}

/** Compares the entered password with the expected one in constant time. */
export function passwordMatches(entered: string, expected: string): boolean {
  return timingSafeEqual(digest(entered), digest(expected));
}

/** Token `<expiry>.<signature>`: the HMAC signature prevents forging or extending a session. */
export function createSessionToken(secret: string, now: number): string {
  const expiry = String(now + SESSION_DURATION_SECONDS * 1000);
  return `${expiry}.${sign(expiry, secret)}`;
}

export function sessionTokenValid(token: string | undefined, secret: string, now: number): boolean {
  const [expiry, signature, ...rest] = (token ?? "").split(".");
  if (!expiry || !signature || rest.length > 0) return false;

  const expected = Buffer.from(sign(expiry, secret));
  const received = Buffer.from(signature);
  const validSignature = expected.length === received.length && timingSafeEqual(expected, received);
  return validSignature && Number(expiry) > now;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function digest(text: string): Buffer {
  return createHash("sha256").update(text).digest();
}
