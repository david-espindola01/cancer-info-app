import type { LimitadorPeticiones } from "@/aplicacion/puertos";

/** Pruebas que toda implementación de LimitadorPeticiones debe pasar. */
export function contratoLimitadorPeticiones(crear: () => Promise<LimitadorPeticiones>) {
  let limitador: LimitadorPeticiones;

  beforeEach(async () => {
    limitador = await crear();
  });

  it("permite hasta el máximo dentro de la ventana y luego niega", async () => {
    const respuestas = [];
    for (let i = 0; i < 4; i += 1) respuestas.push(await limitador.permitir("visitante-a", 3, 600));

    expect(respuestas).toEqual([true, true, true, false]);
  });

  it("lleva la cuenta por separado para cada clave", async () => {
    await limitador.permitir("visitante-a", 1, 600);

    expect(await limitador.permitir("visitante-b", 1, 600)).toBe(true);
    expect(await limitador.permitir("visitante-a", 1, 600)).toBe(false);
  });

  it("con un máximo de 0 no permite nada", async () => {
    expect(await limitador.permitir("visitante-a", 0, 600)).toBe(false);
  });

  it("no se pasa del máximo con muchas peticiones simultáneas", async () => {
    const respuestas = await Promise.all(Array.from({ length: 8 }, () => limitador.permitir("visitante-a", 3, 600)));

    expect(respuestas.filter(Boolean)).toHaveLength(3);
  });
}
