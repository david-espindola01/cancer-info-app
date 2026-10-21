import type { s } from "@hashbrownai/core";
import { exposeComponent } from "@hashbrownai/react";
import {
  contratoAviso,
  contratoCifra,
  contratoComparacion,
  contratoDefinicion,
  contratoEncabezado,
  contratoFuentes,
  contratoListaPuntos,
  contratoParrafo,
  contratoPasos,
  contratoPreguntasRespuestas,
  contratoSeccion,
  contratoSiguientesTemas,
  contratoSinInformacion,
} from "@/ui-contratos/contratos";
import { Aviso, Cifra, Definicion, type TipoAviso } from "./componentes/destacados";
import { Encabezado, Parrafo, Seccion } from "./componentes/estructura";
import { Comparacion, ListaPuntos, Pasos, PreguntasRespuestas } from "./componentes/listas";
import { Fuentes, SiguientesTemas, SinInformacion } from "./componentes/navegacion";

/** Cada contrato del catálogo con el componente que lo dibuja. */
export const componentesExpuestos = [
  exposeComponent(Seccion, contratoSeccion),
  exposeComponent(Encabezado, contratoEncabezado),
  exposeComponent(Parrafo, contratoParrafo),
  exposeComponent(ListaPuntos, contratoListaPuntos),
  exposeComponent(Pasos, contratoPasos),
  exposeComponent(Cifra, contratoCifra),
  exposeComponent(Comparacion, contratoComparacion),
  exposeComponent(Definicion, contratoDefinicion),
  exposeComponent(PreguntasRespuestas, contratoPreguntasRespuestas),
  exposeComponent(Aviso, {
    ...contratoAviso,
    // Skillet convierte la unión de `tipo` en una tupla cuyo orden cambia entre compiladores
    // (tsc y next build); el valor es el mismo, solo se fija su tipo en esta compilación.
    props: { ...contratoAviso.props, tipo: contratoAviso.props.tipo as s.Schema<TipoAviso> },
  }),
  exposeComponent(Fuentes, contratoFuentes),
  exposeComponent(SiguientesTemas, contratoSiguientesTemas),
  exposeComponent(SinInformacion, contratoSinInformacion),
];
