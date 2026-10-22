import type { Sql } from "postgres";
import type { PresupuestoDiario } from "@/aplicacion/puertos";

export class PresupuestoDiarioPostgres implements PresupuestoDiario {
  constructor(private readonly sql: Sql) {}

  async consumir(motivo: string, maximo: number) {
    if (maximo <= 0) return false;
    // Una sola sentencia: dos funciones a la vez no pueden pasarse del máximo.
    const filas = await this.sql`
      insert into uso_ia (motivo, cantidad) values (${motivo}, 1)
      on conflict (dia, motivo) do update set cantidad = uso_ia.cantidad + 1
      where uso_ia.cantidad < ${maximo}
      returning cantidad`;
    return filas.length > 0;
  }

  async sumar(motivo: string, cantidad: number) {
    await this.sql`
      insert into uso_ia (motivo, cantidad) values (${motivo}, ${cantidad})
      on conflict (dia, motivo) do update set cantidad = uso_ia.cantidad + excluded.cantidad`;
  }

  async usoDeHoy() {
    const filas = await this.sql<{ motivo: string; cantidad: number }[]>`
      select motivo, cantidad from uso_ia where dia = current_date order by motivo`;
    return Object.fromEntries(filas.map((fila) => [fila.motivo, fila.cantidad]));
  }
}
