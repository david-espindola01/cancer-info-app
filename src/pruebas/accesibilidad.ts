import axe from "axe-core";

/**
 * Violaciones de accesibilidad (axe-core) dentro de un elemento. En jsdom no se puede
 * medir el contraste de colores: eso lo cubre Lighthouse sobre la página real.
 */
export async function violacionesAccesibilidad(elemento: Element): Promise<string[]> {
  const resultado = await axe.run(elemento, { rules: { region: { enabled: false } } });
  return resultado.violations.map((violacion) => `${violacion.id}: ${violacion.help}`);
}
