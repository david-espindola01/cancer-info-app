import { createUiJsonSchema, s } from "@hashbrownai/core";
import { esquemaMemoria, esquemaNotasFragmento } from "@/aplicacion/lectura/esquemas";
import { respuestaDesdeEsquema } from "./respuesta-generica";

const texto = "<documento>\nPrimera frase. Segunda frase.\n</documento>";

describe("respuestaDesdeEsquema", () => {
  it.each([
    ["notas", esquemaNotasFragmento],
    ["memoria", esquemaMemoria],
  ])("produce una respuesta válida para el esquema de %s", (_, esquema) => {
    const respuesta = respuestaDesdeEsquema(s.toJsonSchema(esquema), texto);

    expect(() => esquema.validate(respuesta)).not.toThrow();
  });

  it("usa frases del texto recibido y elige la primera opción de un enum o anyOf", () => {
    const esquema = s.object("Raíz", {
      a: s.string("a"),
      b: s.string("b"),
      c: s.enumeration("c", ["x", "y"]),
      d: s.anyOf([s.nullish(), s.number("n")]),
      e: s.boolean("e"),
    });

    expect(respuestaDesdeEsquema(s.toJsonSchema(esquema), texto)).toEqual({
      a: "Primera frase.",
      b: "Segunda frase.",
      c: "x",
      d: 1,
      e: true,
    });
  });

  it("usa un texto por defecto si no recibe frases, y respeta null", () => {
    expect(respuestaDesdeEsquema({ type: "string" }, "")).toBe("Texto de prueba.");
    expect(respuestaDesdeEsquema({ type: "null" }, "")).toBeNull();
    expect(respuestaDesdeEsquema({ anyOf: [{ type: "null" }] }, "")).toBeNull();
  });

  it("termina con esquemas recursivos (componentes con hijos)", () => {
    const esquema = createUiJsonSchema({
      components: [{ name: "Seccion", description: "Agrupa", children: "any", props: { titulo: s.string("t") } }],
    });

    const respuesta = respuestaDesdeEsquema(esquema, texto) as { ui: unknown[] };

    expect(respuesta.ui).toHaveLength(1);
    expect(JSON.stringify(respuesta)).toContain('"Seccion"');
  });

  it("tolera una referencia a una definición inexistente", () => {
    expect(respuestaDesdeEsquema({ $ref: "#/$defs/falta" }, texto)).toBe("Primera frase.");
  });
});
