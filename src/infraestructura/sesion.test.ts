import { claveCorrecta, crearTokenSesion, DURACION_SESION_SEGUNDOS, tokenSesionValido } from "./sesion";

const SECRETO = "secreto-de-prueba-suficientemente-largo";
const AHORA = 1_800_000_000_000;

describe("claveCorrecta", () => {
  it("acepta solo la clave exacta, aunque tengan distinto largo", () => {
    expect(claveCorrecta("abc123", "abc123")).toBe(true);
    expect(claveCorrecta("abc12", "abc123")).toBe(false);
    expect(claveCorrecta("", "abc123")).toBe(false);
  });
});

describe("token de sesión", () => {
  it("es válido hasta que vence", () => {
    const token = crearTokenSesion(SECRETO, AHORA);
    const duracion = DURACION_SESION_SEGUNDOS * 1000;

    expect(tokenSesionValido(token, SECRETO, AHORA + duracion - 1)).toBe(true);
    expect(tokenSesionValido(token, SECRETO, AHORA + duracion)).toBe(false);
  });

  it("se rechaza si se firmó con otro secreto", () => {
    expect(tokenSesionValido(crearTokenSesion("otro-secreto", AHORA), SECRETO, AHORA)).toBe(false);
  });

  it("se rechaza si se alarga el vencimiento sin volver a firmar", () => {
    const [, firma] = crearTokenSesion(SECRETO, AHORA).split(".");

    expect(tokenSesionValido(`${AHORA * 2}.${firma}`, SECRETO, AHORA)).toBe(false);
  });

  it.each([undefined, "", "sin-punto", "a.b.c", "123.firma-corta"])("rechaza el token mal formado %j", (token) => {
    expect(tokenSesionValido(token, SECRETO, AHORA)).toBe(false);
  });
});
