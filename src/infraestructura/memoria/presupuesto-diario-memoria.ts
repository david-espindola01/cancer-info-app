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

  async sumar(motivo: string, cantidad: number) {
    const clave = `${this.hoy()}|${motivo}`;
    this.usos.set(clave, (this.usos.get(clave) ?? 0) + cantidad);
  }

  async usoDeHoy() {
    const prefijo = `${this.hoy()}|`;
    return Object.fromEntries(
      [...this.usos]
        .filter(([clave]) => clave.startsWith(prefijo))
        .map(([clave, cantidad]) => [clave.slice(prefijo.length), cantidad])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    );
  }
}
