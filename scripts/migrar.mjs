// Aplica las migraciones pendientes sobre DATABASE_URL.
// Corre antes de cada build: en Vercel, cada entorno migra su propia rama de Neon.
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { migrar } from "../src/infraestructura/db/migrador.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL no está definida: se omiten las migraciones.");
  process.exit(0);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const directorio = fileURLToPath(new URL("../src/infraestructura/db/migraciones", import.meta.url));
  const aplicadas = await migrar(sql, directorio);
  console.log(
    aplicadas.length > 0
      ? `Migraciones aplicadas: ${aplicadas.join(", ")}`
      : "La base de datos ya está al día.",
  );
} finally {
  await sql.end();
}
