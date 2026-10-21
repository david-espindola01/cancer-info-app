import { createUiJsonSchema } from "@hashbrownai/core";
import { marcarPrimeraAparicion, segmentarMarcas } from "@/dominio/marcas";
import type { FuentePagina } from "@/dominio/pagina";
import { normalizarSlug } from "@/dominio/slug";
import {
  catalogo,
  contratoAviso,
  contratoCifra,
  contratoEncabezado,
  contratoFuentes,
  contratoListaPuntos,
  contratoParrafo,
  contratoSiguientesTemas,
  contratoSinInformacion,
} from "@/ui-contratos/contratos";
import { RespuestaInvalida } from "../errores-llm";
import type { SalidaJson } from "../puerto-llm";

type Props = Record<string, unknown>;
/** Un componente de la respuesta: `{ "Nombre": { "props": {...}, "children": [...] } }`. */
type Nodo = Record<string, { props?: Props; children?: Nodo[] }>;
export interface UiPagina {
  ui: Nodo[];
}

/** Mínimo de temas distintos subrayados para que la persona siempre tenga por dónde seguir. */
const MINIMO_TEMAS_MARCADOS = 3;

const AVISO_CONSULTA =
  "Esta información es para aprender y no reemplaza una consulta. Si tienes dudas o algún síntoma, acude a tu centro de salud.";

/**
 * La página que debe devolver el Presentador: el esquema del catálogo completo (el mismo
 * que valida el navegador). Groq en modo estricto garantiza su forma; aquí solo se
 * comprueba la estructura general antes de revisar su contenido.
 */
export const salidaPagina: SalidaJson<UiPagina> = {
  nombre: "pagina",
  jsonSchema: createUiJsonSchema({ components: catalogo }),
  validar(valor) {
    const ui = (valor as { ui?: unknown } | null)?.ui;
    if (!Array.isArray(ui) || !ui.every((nodo) => typeof nodo === "object" && nodo !== null)) {
      throw new Error('Se esperaba { "ui": [componentes] }');
    }
    return valor as UiPagina;
  },
};

/**
 * Revisa una página generada: rechaza citas a fuentes inexistentes, agrega el aviso de
 * consulta y las fuentes si faltan, asegura palabras subrayadas (con los temas que cubren
 * las fuentes) y extrae a qué temas lleva (primero los sugeridos).
 */
export function revisarPagina(
  pagina: UiPagina,
  material: { fuentes: FuentePagina[]; temas: string[] },
  slugActual: string,
): { pagina: UiPagina; palabrasClave: string[] } {
  const { fuentes } = material;
  const componentes = [...recorrer(pagina.ui)];
  const validos = new Set(fuentes.map((fuente) => fuente.numero));
  const citas = componentes.flatMap(([nombre, props]) => numerosCitados(nombre, props));
  const invalida = citas.find((numero) => !validos.has(numero));
  if (invalida !== undefined) throw new RespuestaInvalida(`cita la fuente ${invalida}, que no existe`);

  if (componentes.some(([nombre]) => nombre === contratoSinInformacion.name)) {
    return { pagina, palabrasClave: [] };
  }

  const ui = structuredClone(pagina.ui);
  asegurarMarcas(ui, material.temas, slugActual);
  const tiene = (nombre: string, condicion: (props: Props) => boolean = () => true) =>
    componentes.some(([n, props]) => n === nombre && condicion(props));

  if (!tiene(contratoAviso.name, (props) => props.tipo === "consulta")) {
    const cierre = ui.findIndex((nodo) => contratoSiguientesTemas.name in nodo || contratoFuentes.name in nodo);
    ui.splice(cierre === -1 ? ui.length : cierre, 0, {
      [contratoAviso.name]: { props: { tipo: "consulta", texto: AVISO_CONSULTA } },
    });
  }
  if (!tiene(contratoFuentes.name)) {
    const numeros = citas.length > 0 ? [...new Set(citas)] : [...validos];
    ui.push({ [contratoFuentes.name]: { props: { numeros } } });
  }

  return { pagina: { ui }, palabrasClave: temasDestino([...recorrer(ui)], slugActual) };
}

/** Si el modelo subrayó pocos temas, marca en párrafos y listas los temas que cubren las fuentes. */
function asegurarMarcas(ui: Nodo[], temas: string[], slugActual: string): void {
  const textos = textosDeLectura(ui);
  const marcados = new Set(
    textos.flatMap((texto) =>
      segmentarMarcas(texto.valor()).flatMap((segmento) => (segmento.tipo === "tema" ? [segmento.slug] : [])),
    ),
  );
  for (const tema of temas) {
    if (marcados.size >= MINIMO_TEMAS_MARCADOS) return;
    const slug = normalizarSlug(tema);
    if (!slug || slug === slugActual || marcados.has(slug)) continue;
    for (const texto of textos) {
      const nuevo = marcarPrimeraAparicion(texto.valor(), tema);
      if (nuevo) {
        texto.cambiar(nuevo);
        marcados.add(slug);
        break;
      }
    }
  }
}

/** Acceso de lectura y escritura a los textos de párrafos y listas, en orden de aparición. */
function textosDeLectura(ui: Nodo[]): { valor: () => string; cambiar: (nuevo: string) => void }[] {
  return [...recorrer(ui)].flatMap(([nombre, props]) => {
    if (nombre === contratoParrafo.name && typeof props.texto === "string") {
      return [{ valor: () => props.texto as string, cambiar: (nuevo: string) => void (props.texto = nuevo) }];
    }
    if (nombre === contratoListaPuntos.name && Array.isArray(props.puntos)) {
      const puntos = props.puntos as string[];
      return puntos.map((_, i) => ({
        valor: () => puntos[i]!,
        cambiar: (nuevo: string) => void (puntos[i] = nuevo),
      }));
    }
    return [];
  });
}

/** La página que se muestra, sin llamar a la IA, cuando ninguna fuente trata el tema. */
export function paginaSinInformacion(tema: string): UiPagina {
  const titulo = tema.charAt(0).toUpperCase() + tema.slice(1);
  return {
    ui: [
      { [contratoEncabezado.name]: { props: { titulo, subtitulo: null } } },
      {
        [contratoSinInformacion.name]: {
          props: {
            mensaje: `Todavía no tenemos información sobre «${tema}» en los artículos de esta página. Prueba con otro tema o vuelve más adelante.`,
          },
        },
      },
    ],
  };
}

function* recorrer(nodos: Nodo[]): Generator<[string, Props]> {
  for (const nodo of nodos) {
    for (const [nombre, { props = {}, children }] of Object.entries(nodo)) {
      yield [nombre, props];
      if (Array.isArray(children)) yield* recorrer(children);
    }
  }
}

function numerosCitados(nombre: string, props: Props): number[] {
  if (nombre === contratoCifra.name) return [Number(props.fuente)];
  if (nombre === contratoFuentes.name && Array.isArray(props.numeros)) return props.numeros.map(Number);
  return [];
}

/** Temas a los que lleva la página: primero los sugeridos (en su orden), luego los subrayados. */
function temasDestino(componentes: [string, Props][], slugActual: string): string[] {
  const sugeridos = componentes
    .filter(([nombre]) => nombre === contratoSiguientesTemas.name)
    .flatMap(([, props]) => (props.temas as { etiqueta: string }[]).map((t) => normalizarSlug(t.etiqueta)));
  const subrayados = componentes
    .flatMap(([, props]) => textos(props))
    .flatMap((texto) => segmentarMarcas(texto))
    .flatMap((segmento) => (segmento.tipo === "tema" ? [segmento.slug] : []));
  return [...new Set([...sugeridos, ...subrayados])].filter((slug) => slug && slug !== slugActual);
}

function textos(valor: unknown): string[] {
  if (typeof valor === "string") return [valor];
  if (Array.isArray(valor)) return valor.flatMap(textos);
  if (valor && typeof valor === "object") return Object.values(valor).flatMap(textos);
  return [];
}
