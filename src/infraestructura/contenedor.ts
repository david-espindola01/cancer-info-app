import type { Sql } from "postgres";
import { procesarSiguientePaso } from "@/aplicacion/lectura/procesar-siguiente-paso";
import { generarPaginaTema, obtenerPaginaTema } from "@/aplicacion/presentacion/paginas-tema";
import { precargarTemas } from "@/aplicacion/presentacion/precargar-temas";
import { registrarDocumento } from "@/aplicacion/lectura/registrar-documento";
import type { ProveedorLLM } from "@/aplicacion/puerto-llm";
import { crearConexion } from "./db/cliente";
import { LimitadorPeticionesPostgres } from "./db/limitador-peticiones-postgres";
import { PresupuestoDiarioPostgres } from "./db/presupuesto-diario-postgres";
import { RepositorioDocumentosPostgres } from "./db/repositorio-documentos-postgres";
import { RepositorioMemoriasPostgres } from "./db/repositorio-memorias-postgres";
import { RepositorioPaginasPostgres } from "./db/repositorio-paginas-postgres";
import { enteroOpcional, variableObligatoria, variableOpcional } from "./entorno";
import { ProveedorFalso } from "./llm/proveedor-falso";
import { ProveedorGroq, type EsfuerzoRazonamiento } from "./llm/proveedor-groq";
import { respuestaDesdeEsquema } from "./llm/respuesta-generica";
import { claveCorrecta, crearTokenSesion, huellaVisitante, tokenSesionValido } from "./sesion";

/*
 * Composición de la aplicación: el único lugar donde los casos de uso reciben sus
 * implementaciones concretas, y el único módulo de infraestructura que usa `app/`.
 */

export { DURACION_SESION_SEGUNDOS, NOMBRE_COOKIE_SESION } from "./sesion";

let conexion: Sql | undefined;
const sql = () => (conexion ??= crearConexion(variableObligatoria("DATABASE_URL")));
const repositorioDocumentos = () => new RepositorioDocumentosPostgres(sql());
const presupuestoDiario = () => new PresupuestoDiarioPostgres(sql());

/** Groq en uso real; «falso» en CI y e2e: respuestas válidas sin llamar a ningún modelo. */
function proveedorLLM(modelo: string): ProveedorLLM {
  if (variableOpcional("LLM_PROVEEDOR", "groq", ["groq", "falso"]) === "falso") {
    return new ProveedorFalso((peticion) => respuestaDesdeEsquema(peticion.salida.jsonSchema, peticion.usuario));
  }
  return new ProveedorGroq({
    apiKey: variableObligatoria("GROQ_API_KEY"),
    modelo,
    alRegistrarUso: (uso) => presupuestoDiario().sumar(`tokens:${uso.modelo}`, uso.tokens),
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

const dependenciasPresentacion = () => ({
  paginas: new RepositorioPaginasPostgres(sql()),
  memorias: new RepositorioMemoriasPostgres(sql()),
  presentador: proveedorLLM(variableOpcional("GROQ_MODELO_PRESENTADOR", "openai/gpt-oss-20b")),
});

/** Para el panel del equipo: uso de la IA hoy y páginas listas para servir. */
export async function estadoDelSistema() {
  const [usoHoy, paginasListas] = await Promise.all([
    presupuestoDiario().usoDeHoy(),
    new RepositorioPaginasPostgres(sql()).contarListas(),
  ]);
  return { usoHoy, paginasListas };
}

/** Límites por visitante: protegen la cuota de la IA y la clave del equipo. */
const LIMITES = {
  paginasNuevas: { maximo: 10, ventanaSegundos: 10 * 60 },
  intentosDeSesion: { maximo: 5, ventanaSegundos: 15 * 60 },
} as const;

function permitir(motivo: keyof typeof LIMITES, ip: string): Promise<boolean> {
  const { maximo, ventanaSegundos } = LIMITES[motivo];
  const visitante = huellaVisitante(ip, variableObligatoria("SESION_SECRETO"));
  return new LimitadorPeticionesPostgres(sql()).permitir(`${motivo}:${visitante}`, maximo, ventanaSegundos);
}

export const temas = {
  obtener: (entrada: string, ip: string) =>
    obtenerPaginaTema(entrada, {
      ...dependenciasPresentacion(),
      permitirGeneracion: () => permitir("paginasNuevas", ip),
    }),
  regenerar: (slug: string) => generarPaginaTema(slug, dependenciasPresentacion()),
  precargar: (slugs: string[]) =>
    precargarTemas(
      slugs,
      { ...dependenciasPresentacion(), presupuesto: presupuestoDiario() },
      {
        porVisita: enteroOpcional("PRECARGA_POR_VISITA", 2),
        maximoDiario: enteroOpcional("PRECARGA_MAX_DIARIA", 30),
      },
    ),
};

export type InicioSesion = { tipo: "ok"; token: string } | { tipo: "clave-incorrecta" } | { tipo: "limite" };

export const sesion = {
  async iniciar(clave: string, ip: string): Promise<InicioSesion> {
    if (!(await permitir("intentosDeSesion", ip))) return { tipo: "limite" };
    if (!claveCorrecta(clave, variableObligatoria("ADMIN_CLAVE"))) return { tipo: "clave-incorrecta" };
    return { tipo: "ok", token: crearTokenSesion(variableObligatoria("SESION_SECRETO"), Date.now()) };
  },
  valida: (token: string | undefined) =>
    tokenSesionValido(token, variableObligatoria("SESION_SECRETO"), Date.now()),
};
