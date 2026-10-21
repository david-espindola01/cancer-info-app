import type { Sql } from "postgres";
import { registrarDocumento } from "@/aplicacion/lectura/registrar-documento";
import { crearConexion } from "./db/cliente";
import { RepositorioDocumentosPostgres } from "./db/repositorio-documentos-postgres";
import { variableObligatoria } from "./entorno";
import { claveCorrecta, crearTokenSesion, tokenSesionValido } from "./sesion";

/*
 * Composición de la aplicación: el único lugar donde los casos de uso reciben sus
 * implementaciones concretas, y el único módulo de infraestructura que usa `app/`.
 */

export { DURACION_SESION_SEGUNDOS, NOMBRE_COOKIE_SESION } from "./sesion";

let conexion: Sql | undefined;
const sql = () => (conexion ??= crearConexion(variableObligatoria("DATABASE_URL")));
const repositorioDocumentos = () => new RepositorioDocumentosPostgres(sql());

export const documentos = {
  registrar: (entrada: { titulo: string; texto: string }) =>
    registrarDocumento(entrada, repositorioDocumentos()),
  listar: () => repositorioDocumentos().listar(),
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
