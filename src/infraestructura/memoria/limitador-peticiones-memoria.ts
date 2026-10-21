import type { LimitadorPeticiones } from "@/aplicacion/puertos";

/** Implementación en memoria para pruebas (mismo contrato que la de Postgres). */
export class LimitadorPeticionesMemoria implements LimitadorPeticiones {
  private readonly ventanas = new Map<string, { inicio: number; cantidad: number }>();

  constructor(private readonly ahora: () => number = Date.now) {}

  async permitir(clave: string, maximo: number, ventanaSegundos: number) {
    if (maximo <= 0) return false;
    const actual = this.ventanas.get(clave);
    if (!actual || this.ahora() - actual.inicio >= ventanaSegundos * 1000) {
      this.ventanas.set(clave, { inicio: this.ahora(), cantidad: 1 });
      return true;
    }
    if (actual.cantidad >= maximo) return false;
    actual.cantidad += 1;
    return true;
  }
}
