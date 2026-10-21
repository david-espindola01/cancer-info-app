import type { ContenidoMemoria, NotasFragmento } from "@/aplicacion/lectura/esquemas";
import type { NuevoDocumento } from "@/aplicacion/puertos";

let contador = 0;

/** Un documento nuevo con huella única en cada llamada. */
export function nuevoDocumento(cambios: Partial<NuevoDocumento> = {}): NuevoDocumento {
  contador += 1;
  return {
    titulo: `Artículo ${contador}`,
    huella: `huella-${contador}-${Math.random().toString(36).slice(2)}`,
    fragmentos: ["Primer fragmento.", "Segundo fragmento."],
    ...cambios,
  };
}

/** Notas de un fragmento, vacías salvo los campos indicados. */
export function notasDePrueba(cambios: Partial<NotasFragmento> = {}): NotasFragmento {
  return { hallazgos: [], cifras: [], conceptos: [], limitaciones: [], datosDeCita: "", ...cambios };
}

/** Una memoria completa y válida; `cambios` reemplaza los campos indicados. */
export function memoriaDePrueba(cambios: Partial<ContenidoMemoria> = {}): ContenidoMemoria {
  return {
    tituloSencillo: "Un estudio sobre células",
    ideaCentral: "Las células se renuevan.",
    resumenSencillo: "El estudio observó cómo se renuevan las células.",
    hallazgos: [{ texto: "Las células se dividen.", solidez: "media" }],
    conceptos: [{ termino: "Célula", explicacion: "La parte más pequeña de un ser vivo." }],
    cifras: [{ valor: "1 de cada 3", descripcion: "Personas del estudio" }],
    recomendaciones: ["Consultar al médico."],
    limitaciones: ["Muestra pequeña."],
    temas: ["células"],
    referencia: { autores: "García L", anio: "2024", revista: "Revista de Prueba" },
    ...cambios,
  };
}
