type NombreVariable = "DATABASE_URL" | "ADMIN_CLAVE" | "SESION_SECRETO";

/**
 * Lee una variable de entorno obligatoria. Si falta, falla con un mensaje claro
 * en lugar de propagar un `undefined` silencioso.
 */
export function variableObligatoria(nombre: NombreVariable): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Defínela en .env.local (local) ` +
        "o en Settings → Environment Variables (Vercel). Ver .env.example.",
    );
  }
  return valor;
}
