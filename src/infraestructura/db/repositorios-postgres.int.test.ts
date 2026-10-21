import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { conexionPruebas, DIRECTORIO_MIGRACIONES, vaciarTablas } from "@/pruebas/bd";
import { contratoRepositorioDocumentos } from "@/pruebas/contratos/repositorio-documentos.contrato";
import { contratoRepositorioMemorias } from "@/pruebas/contratos/repositorio-memorias.contrato";
import { memoriaDePrueba, nuevoDocumento } from "@/pruebas/fabricas";
import { migrar } from "./migrador";
import { RepositorioDocumentosPostgres } from "./repositorio-documentos-postgres";
import { RepositorioMemoriasPostgres } from "./repositorio-memorias-postgres";

const sql = conexionPruebas();

afterAll(async () => {
  await sql.end();
});

describe("RepositorioDocumentosPostgres", () => {
  contratoRepositorioDocumentos(async () => {
    await vaciarTablas(sql);
    return new RepositorioDocumentosPostgres(sql);
  });
});

describe("RepositorioMemoriasPostgres", () => {
  contratoRepositorioMemorias(async () => {
    await vaciarTablas(sql);
    return { documentos: new RepositorioDocumentosPostgres(sql), memorias: new RepositorioMemoriasPostgres(sql) };
  });

  it("encuentra variantes de una palabra (raíces en español)", async () => {
    await vaciarTablas(sql);
    const documentos = new RepositorioDocumentosPostgres(sql);
    const memorias = new RepositorioMemoriasPostgres(sql);
    const { documento } = await documentos.registrar(nuevoDocumento());
    await memorias.guardar(documento.id, memoriaDePrueba({ resumenSencillo: "Los tumores crecen." }));

    expect(await memorias.buscar("tumor", 5)).toHaveLength(1);
  });
});

describe("migrar", () => {
  it("no vuelve a aplicar migraciones ya aplicadas", async () => {
    expect(await migrar(sql, DIRECTORIO_MIGRACIONES)).toEqual([]);
  });

  it("aplica en orden las migraciones nuevas y las registra", async () => {
    const directorio = await mkdtemp(join(tmpdir(), "migraciones-"));
    await writeFile(join(directorio, "b.sql"), "insert into prueba_migrador values (2);");
    await writeFile(join(directorio, "a.sql"), "create table prueba_migrador (n integer);");
    try {
      expect(await migrar(sql, directorio)).toEqual(["a.sql", "b.sql"]);
      expect(await sql`select n from prueba_migrador`).toEqual([{ n: 2 }]);
      expect(await migrar(sql, directorio)).toEqual([]);
    } finally {
      await sql`drop table if exists prueba_migrador`;
      await sql`delete from migraciones where nombre in ('a.sql', 'b.sql')`;
      await rm(directorio, { recursive: true });
    }
  });
});
