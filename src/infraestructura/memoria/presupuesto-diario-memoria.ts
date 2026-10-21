import type { PresupuestoDiario } from "@/aplicacion/puertos";

/** Implementación en memoria para pruebas (mismo contrato que la de Postgres). */
export class PresupuestoDiarioMemoria implements PresupuestoDiario {
  private readonly usos = new Map<string, number>();

  constructor(private readonly hoy: () => string = () => new Date().toISOString().slice(0, 10)) {}

  async consumir(motivo: string, maximo: number) {
    const clave = `${this.hoy()}|${motivo}`;
    const usados = this.usos.get(clave) ?? 0;
    if (usados >= maximo) return false;
    this.usos.set(clave, usados + 1);
    return true;
  }
}
