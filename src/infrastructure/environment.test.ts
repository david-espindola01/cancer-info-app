import { optionalInteger, optionalVariable, requiredVariable } from "./environment";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("optionalInteger", () => {
  it("uses the fallback or the defined number", () => {
    vi.stubEnv("PREFETCH_PER_VISIT", "");
    expect(optionalInteger("PREFETCH_PER_VISIT", 2)).toBe(2);

    vi.stubEnv("PREFETCH_PER_VISIT", "0");
    expect(optionalInteger("PREFETCH_PER_VISIT", 2)).toBe(0);
  });

  it.each(["two", "-1", "1.5"])("rejects «%s»", (value) => {
    vi.stubEnv("PREFETCH_PER_VISIT", value);

    expect(() => optionalInteger("PREFETCH_PER_VISIT", 2)).toThrow(/integer greater than or equal to 0/);
  });
});

describe("requiredVariable", () => {
  it("returns the defined value", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");

    expect(requiredVariable("ADMIN_PASSWORD")).toBe("secret");
  });

  it("fails with a message that says what is missing and where to define it", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");

    expect(() => requiredVariable("ADMIN_PASSWORD")).toThrow(/Missing environment variable ADMIN_PASSWORD.*\.env\.local/);
  });
});

describe("optionalVariable", () => {
  it("uses the fallback when it is not defined", () => {
    vi.stubEnv("GROQ_READER_MODEL", "");

    expect(optionalVariable("GROQ_READER_MODEL", "default-model")).toBe("default-model");
  });

  it("accepts an allowed value and rejects one that is not", () => {
    vi.stubEnv("GROQ_REASONING_EFFORT", "medium");
    expect(optionalVariable("GROQ_REASONING_EFFORT", "low", ["low", "medium", "high"])).toBe("medium");

    vi.stubEnv("GROQ_REASONING_EFFORT", "maximum");
    expect(() => optionalVariable("GROQ_REASONING_EFFORT", "low", ["low", "medium", "high"])).toThrow(
      /is not valid. Possible values: low, medium, high/,
    );
  });
});
