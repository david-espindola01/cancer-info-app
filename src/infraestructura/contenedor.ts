import { s } from "@hashbrownai/core";
import type { Sql } from "postgres";
import { procesarSiguientePaso } from "@/aplicacion/lectura/procesar-siguiente-paso";
import { registrarDocumento } from "@/aplicacion/lectura/registrar-documento";
import type { ProveedorLLM } from "@/aplicacion/puertos";
import { crearConexion } from "./db/cliente";
import { RepositorioDocumentosPostgres } from "./db/repositorio-documentos-postgres";
import { RepositorioMemoriasPostgres } from "./db/repositorio-memorias-postgres";
import { variableObligatoria, variableOpcional } from "./entorno";
import { ProveedorFalso } from "./llm/proveedor-falso";
import { ProveedorGroq, type EsfuerzoRazonamiento } from "./llm/proveedor-groq";
import { respuestaDesdeEsquema } from "./llm/respuesta-generica";
import { claveCorrecta, crearTokenSesion, tokenSesionValido } from "./sesion";

/*
 * Composición de la aplicación: el único lugar donde los casos de uso reciben sus
 * implementaciones concretas, y el único módulo de infraestructura que usa `app/`.
 */

export { DURACION_SESION_SEGUNDOS, NOMBRE_COOKIE_SESION } from "./sesion";

let conexion: Sql | undefined;
const sql = () => (conexion ??= crearConexion(variableObligatoria("DATABASE_URL")));
const repositorioDocumentos = () => new RepositorioDocumentosPostgres(sql());

/** Groq en uso real; «falso» en CI y e2e: respuestas válidas sin llamar a ningún modelo. */
function proveedorLLM(modelo: string): ProveedorLLM {
  if (variableOpcional("LLM_PROVEEDOR", "groq", ["groq", "falso"]) === "falso") {
    return new ProveedorFalso((peticion) => respuestaDesdeEsquema(s.toJsonSchema(peticion.esquema), peticion.usuario));
  }
  return new ProveedorGroq({
    apiKey: variableObligatoria("GROQ_API_KEY"),
    modelo,
    esfuerzo: variableOpcional<EsfuerzoRazonamiento>("GROQ_ESFUERZO_RAZONAMIENTO", "low", ["low", "medium", "high"]),
  });
}

export const documentos = {
  registrar: (entrada: { titulo: string; texto: string }) =>
    registrarDocumento(entrada, repositorioDocumentos()),
  listar: () => repositorioDocumentos().listar(),
  procesarPaso: (id: string) =>
    procesarSiguientePaso(id, {
      documentos: repositorioDocumentos(),
      memorias: new RepositorioMemoriasPostgres(sql()),
      lector: proveedorLLM(variableOpcional("GROQ_MODELO_LECTOR", "openai/gpt-oss-120b")),
    }),
};

export const sesion = {
  /** Devuelve un token de sesión si la clave es correcta; si no, null. */
  iniciar(clave: string): string | null {
    if (!claveCorrecta(clave, variableObligatoria("ADMIN_CLAVE"))) return null;
    return crearTokenSesion(variableObligatoria("SESION_SECRETO"), Date.now());
  },
  valida: (token: string | undefined) =>
    tokenSesionValido(token, variableObligatoria("SESION_SECRETO"), Date.now()),
};
