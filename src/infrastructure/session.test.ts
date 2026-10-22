import {
  createSessionToken,
  passwordMatches,
  SESSION_DURATION_SECONDS,
  sessionTokenValid,
  visitorFingerprint,
} from "./session";

const SECRET = "test-secret-that-is-long-enough";
const NOW = 1_800_000_000_000;

describe("visitorFingerprint", () => {
  it("is stable for the same IP, different between IPs and does not contain the IP", () => {
    const fingerprint = visitorFingerprint("190.24.10.5", SECRET);

    expect(visitorFingerprint("190.24.10.5", SECRET)).toBe(fingerprint);
    expect(visitorFingerprint("190.24.10.6", SECRET)).not.toBe(fingerprint);
    expect(visitorFingerprint("190.24.10.5", "another-secret")).not.toBe(fingerprint);
    expect(fingerprint).not.toContain("190");
    expect(fingerprint).toHaveLength(22);
  });
});

describe("passwordMatches", () => {
  it("accepts only the exact password, even with different lengths", () => {
    expect(passwordMatches("abc123", "abc123")).toBe(true);
    expect(passwordMatches("abc12", "abc123")).toBe(false);
    expect(passwordMatches("", "abc123")).toBe(false);
  });
});

describe("session token", () => {
  it("is valid until it expires", () => {
    const token = createSessionToken(SECRET, NOW);
    const duration = SESSION_DURATION_SECONDS * 1000;

    expect(sessionTokenValid(token, SECRET, NOW + duration - 1)).toBe(true);
    expect(sessionTokenValid(token, SECRET, NOW + duration)).toBe(false);
  });

  it("is rejected if it was signed with another secret", () => {
    expect(sessionTokenValid(createSessionToken("another-secret", NOW), SECRET, NOW)).toBe(false);
  });

  it("is rejected if the expiry is extended without signing again", () => {
    const [, signature] = createSessionToken(SECRET, NOW).split(".");

    expect(sessionTokenValid(`${NOW * 2}.${signature}`, SECRET, NOW)).toBe(false);
  });

  it.each([undefined, "", "no-dot", "a.b.c", "123.short-signature"])("rejects the malformed token %j", (token) => {
    expect(sessionTokenValid(token, SECRET, NOW)).toBe(false);
  });
});
