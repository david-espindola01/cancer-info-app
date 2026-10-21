import type { PresupuestoDiario } from "@/aplicacion/puertos";

/** Pruebas que toda implementación de PresupuestoDiario debe pasar. */
export function contratoPresupuestoDiario(crear: () => Promise<PresupuestoDiario>) {
  let presupuesto: PresupuestoDiario;

  beforeEach(async () => {
    presupuesto = await crear();
  });

  it("permite usos hasta el máximo del día y luego los niega", async () => {
    const usos = [];
    for (let i = 0; i < 4; i += 1) usos.push(await presupuesto.consumir("precarga", 3));

    expect(usos).toEqual([true, true, true, false]);
  });

  it("lleva la cuenta por separado para cada motivo", async () => {
    await presupuesto.consumir("precarga", 1);

    expect(await presupuesto.consumir("otro", 1)).toBe(true);
    expect(await presupuesto.consumir("precarga", 1)).toBe(false);
  });

  it("con un máximo de 0 no permite ningún uso", async () => {
    expect(await presupuesto.consumir("precarga", 0)).toBe(false);
  });

  it("suma cantidades sin tope y resume el uso de hoy por motivo", async () => {
    await presupuesto.sumar("tokens:modelo-a", 1_200);
    await presupuesto.sumar("tokens:modelo-a", 800);
    await presupuesto.consumir("precarga", 5);

    expect(await presupuesto.usoDeHoy()).toEqual({ precarga: 1, "tokens:modelo-a": 2_000 });
  });

  it("no se pasa del máximo aunque se pida muchas veces a la vez", async () => {
    const usos = await Promise.all(Array.from({ length: 10 }, () => presupuesto.consumir("precarga", 4)));

    expect(usos.filter(Boolean)).toHaveLength(4);
  });
}
