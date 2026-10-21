import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const NOMBRE_COOKIE_SESION = "sesion_admin";
export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;

/** Compara la clave ingresada con la esperada en tiempo constante. */
export function claveCorrecta(ingresada: string, esperada: string): boolean {
  return timingSafeEqual(resumen(ingresada), resumen(esperada));
}

/** Token `<vencimiento>.<firma>`: la firma HMAC impide fabricar o alargar una sesión. */
export function crearTokenSesion(secreto: string, ahora: number): string {
  const vence = String(ahora + DURACION_SESION_SEGUNDOS * 1000);
  return `${vence}.${firmar(vence, secreto)}`;
}

export function tokenSesionValido(token: string | undefined, secreto: string, ahora: number): boolean {
  const [vence, firma, ...resto] = (token ?? "").split(".");
  if (!vence || !firma || resto.length > 0) return false;

  const esperada = Buffer.from(firmar(vence, secreto));
  const recibida = Buffer.from(firma);
  const firmaValida = esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  return firmaValida && Number(vence) > ahora;
}

function firmar(valor: string, secreto: string): string {
  return createHmac("sha256", secreto).update(valor).digest("base64url");
}

function resumen(texto: string): Buffer {
  return createHash("sha256").update(texto).digest();
}
