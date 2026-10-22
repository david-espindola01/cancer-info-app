import { createUiJsonSchema, s } from "@hashbrownai/core";
import { esquemaMemoria, esquemaNotasFragmento } from "@/aplicacion/lectura/esquemas";
import { infraccionesModoEstricto } from "./esquema-estricto";

describe("infraccionesModoEstricto", () => {
  it.each([
    ["notas de fragmento", esquemaNotasFragmento],
    ["memoria", esquemaMemoria],
  ])("acepta el esquema de %s del Agente Lector (contrato con Groq)", (_, esquema) => {
    expect(infraccionesModoEstricto(s.toJsonSchema(esquema))).toEqual([]);
  });

  it("acepta el esquema de UI que genera Hashbrown (contrato con Groq)", () => {
    const esquema = createUiJsonSchema({
      components: [
        {
          name: "Seccion",
          description: "Agrupa otros componentes",
          children: "any",
          props: { titulo: s.string("Título") },
        },
        {
          name: "Encabezado",
          description: "Título con subtítulo opcional",
          children: false,
          props: {
            titulo: s.string("Título"),
            subtitulo: s.anyOf([s.string("Subtítulo"), s.nullish()]),
          },
        },
        {
          name: "Aviso",
          description: "Aviso destacado",
          children: false,
          props: {
            tipo: s.enumeration("Tipo", ["informativo", "importante"]),
            puntos: s.array("Puntos", s.string("Punto")),
          },
        },
      ],
    });

    expect(infraccionesModoEstricto(esquema)).toEqual([]);
  });

  it("detecta propiedades que no están en required", () => {
    const esquema = {
      type: "object",
      properties: { a: { type: "string" }, b: { type: "string" } },
      required: ["a"],
      additionalProperties: false,
    };

    expect(infraccionesModoEstricto(esquema)).toEqual([
      '$: propiedades fuera de "required" (b)',
    ]);
  });

  it("detecta objetos anidados sin additionalProperties: false", () => {
    const esquema = {
      type: "object",
      properties: { hijo: { type: "object", properties: {}, required: [] } },
      required: ["hijo"],
      additionalProperties: false,
    };

    expect(infraccionesModoEstricto(esquema)).toEqual([
      '$.properties.hijo: falta "additionalProperties: false"',
    ]);
  });

  it("detecta palabras de JSON Schema no soportadas", () => {
    const esquema = { $defs: { x: { oneOf: [{ type: "string" }, { type: "number" }] } } };

    expect(infraccionesModoEstricto(esquema)).toEqual([
      '$.$defs.x: usa "oneOf", no soportado',
    ]);
  });

  it("no confunde una propiedad llamada como una palabra reservada", () => {
    const esquema = {
      type: "object",
      properties: { if: { type: "string" }, not: { type: "boolean" } },
      required: ["if", "not"],
      additionalProperties: false,
    };

    expect(infraccionesModoEstricto(esquema)).toEqual([]);
  });
});
