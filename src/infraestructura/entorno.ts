type VariableObligatoria = "DATABASE_URL" | "ADMIN_CLAVE" | "SESION_SECRETO" | "GROQ_API_KEY";
type VariableOpcional =
  | "LLM_PROVEEDOR"
  | "GROQ_MODELO_LECTOR"
  | "GROQ_MODELO_PRESENTADOR"
  | "GROQ_ESFUERZO_RAZONAMIENTO"
  | "PRECARGA_POR_VISITA"
  | "PRECARGA_MAX_DIARIA";

/**
 * Lee una variable de entorno obligatoria. Si falta, falla con un mensaje claro
 * en lugar de propagar un `undefined` silencioso.
 */
export function variableObligatoria(nombre: VariableObligatoria): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Defínela en .env.local (local) ` +
        "o en Settings → Environment Variables (Vercel). Ver .env.example.",
    );
  }
  return valor;
}

/** Lee una variable opcional que debe ser un número entero mayor o igual a 0. */
export function enteroOpcional(nombre: VariableOpcional, porDefecto: number): number {
  const valor = variableOpcional(nombre, String(porDefecto));
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error(`${nombre}="${valor}" no es válido. Debe ser un número entero mayor o igual a 0.`);
  }
  return numero;
}

/** Lee una variable opcional; si se definió, debe ser uno de los valores permitidos. */
export function variableOpcional<T extends string>(
  nombre: VariableOpcional,
  porDefecto: T,
  permitidos?: readonly T[],
): T {
  const valor = process.env[nombre] || porDefecto;
  if (permitidos && !permitidos.includes(valor as T)) {
    throw new Error(`${nombre}="${valor}" no es válido. Valores posibles: ${permitidos.join(", ")}.`);
  }
  return valor as T;
}
