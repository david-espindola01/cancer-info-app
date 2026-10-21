import type { Sql } from "postgres";
import type { LimitadorPeticiones } from "@/aplicacion/puertos";

export class LimitadorPeticionesPostgres implements LimitadorPeticiones {
  constructor(private readonly sql: Sql) {}

  async permitir(clave: string, maximo: number, ventanaSegundos: number) {
    if (maximo <= 0) return false;
    const vencida = this.sql`limite_peticiones.ventana_inicio < now() - ${ventanaSegundos}::int * interval '1 second'`;
    // Una sola sentencia atómica: si la ventana venció, empieza otra; si no, suma uno
    // mientras no se pase del máximo. Sin fila devuelta, la petición no se permite.
    const filas = await this.sql`
      insert into limite_peticiones (clave, ventana_inicio, cantidad) values (${clave}, now(), 1)
      on conflict (clave) do update set
        cantidad = case when ${vencida} then 1 else limite_peticiones.cantidad + 1 end,
        ventana_inicio = case when ${vencida} then now() else limite_peticiones.ventana_inicio end
      where ${vencida} or limite_peticiones.cantidad < ${maximo}
      returning cantidad`;
    return filas.length > 0;
  }
}
