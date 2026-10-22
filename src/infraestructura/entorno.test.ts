import { enteroOpcional, variableObligatoria, variableOpcional } from "./entorno";

describe("enteroOpcional", () => {
  it("usa el valor por defecto o el número definido", () => {
    vi.stubEnv("PRECARGA_POR_VISITA", "");
    expect(enteroOpcional("PRECARGA_POR_VISITA", 2)).toBe(2);

    vi.stubEnv("PRECARGA_POR_VISITA", "0");
    expect(enteroOpcional("PRECARGA_POR_VISITA", 2)).toBe(0);
  });

  it.each(["dos", "-1", "1.5"])("rechaza «%s»", (valor) => {
    vi.stubEnv("PRECARGA_POR_VISITA", valor);

    expect(() => enteroOpcional("PRECARGA_POR_VISITA", 2)).toThrow(/número entero mayor o igual a 0/);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("variableObligatoria", () => {
  it("devuelve el valor definido", () => {
    vi.stubEnv("ADMIN_CLAVE", "secreta");

    expect(variableObligatoria("ADMIN_CLAVE")).toBe("secreta");
  });

  it("falla con un mensaje que dice qué falta y dónde definirlo", () => {
    vi.stubEnv("ADMIN_CLAVE", "");

    expect(() => variableObligatoria("ADMIN_CLAVE")).toThrow(/Falta la variable de entorno ADMIN_CLAVE.*\.env\.local/);
  });
});

describe("variableOpcional", () => {
  it("usa el valor por defecto si no está definida", () => {
    vi.stubEnv("GROQ_MODELO_LECTOR", "");

    expect(variableOpcional("GROQ_MODELO_LECTOR", "modelo-por-defecto")).toBe("modelo-por-defecto");
  });

  it("acepta un valor permitido y rechaza uno que no lo es", () => {
    vi.stubEnv("GROQ_ESFUERZO_RAZONAMIENTO", "medium");
    expect(variableOpcional("GROQ_ESFUERZO_RAZONAMIENTO", "low", ["low", "medium", "high"])).toBe("medium");

    vi.stubEnv("GROQ_ESFUERZO_RAZONAMIENTO", "máximo");
    expect(() => variableOpcional("GROQ_ESFUERZO_RAZONAMIENTO", "low", ["low", "medium", "high"])).toThrow(
      /no es válido. Valores posibles: low, medium, high/,
    );
  });
});
