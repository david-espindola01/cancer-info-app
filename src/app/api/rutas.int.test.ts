import { NextRequest } from "next/server";
import { esquemaMemoria } from "@/aplicacion/lectura/esquemas";
import { conexionPruebas, vaciarTablas } from "@/pruebas/bd";
import { DELETE as cerrarSesion, POST as iniciarSesion } from "./sesion/route";
import { POST as procesarPaso } from "./documentos/[id]/paso/route";
import { GET as listarDocumentos, POST as subirDocumento } from "./documentos/route";

const CLAVE = "clave-de-prueba";
const sql = conexionPruebas();
const textoArticulo = "Las células se renuevan de forma ordenada en el cuerpo humano. ".repeat(20);

function peticion(ruta: string, opciones: { metodo?: string; cuerpo?: unknown; cookie?: string } = {}) {
  return new NextRequest(`http://localhost${ruta}`, {
    method: opciones.metodo ?? "GET",
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    headers: opciones.cookie ? { cookie: opciones.cookie } : {},
  });
}

async function cookieDeSesion(): Promise<string> {
  const respuesta = await iniciarSesion(peticion("/api/sesion", { metodo: "POST", cuerpo: { clave: CLAVE } }));
  return respuesta.headers.get("set-cookie")!.split(";")[0]!;
}

beforeAll(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRUEBAS;
  process.env.ADMIN_CLAVE = CLAVE;
  process.env.SESION_SECRETO = "secreto-de-prueba-suficientemente-largo";
  process.env.LLM_PROVEEDOR = "falso";
});

beforeEach(() => vaciarTablas(sql));

afterAll(() => sql.end());

describe("/api/sesion", () => {
  it("rechaza una clave incorrecta", async () => {
    const respuesta = await iniciarSesion(peticion("/api/sesion", { metodo: "POST", cuerpo: { clave: "otra" } }));

    expect(respuesta.status).toBe(401);
    expect(respuesta.headers.get("set-cookie")).toBeNull();
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    const respuesta = await iniciarSesion(
      new NextRequest("http://localhost/api/sesion", { method: "POST", body: "no es json" }),
    );

    expect(respuesta.status).toBe(401);
  });

  it("con la clave correcta entrega una cookie httpOnly y estricta", async () => {
    const respuesta = await iniciarSesion(peticion("/api/sesion", { metodo: "POST", cuerpo: { clave: CLAVE } }));

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("set-cookie")).toMatch(/sesion_admin=.+HttpOnly.*SameSite=strict/i);
  });

  it("al cerrar sesión borra la cookie", async () => {
    const respuesta = await cerrarSesion();

    expect(respuesta.headers.get("set-cookie")).toMatch(/sesion_admin=;.*Expires=Thu, 01 Jan 1970/i);
  });
});

describe("/api/documentos", () => {
  it("exige sesión para listar y para subir", async () => {
    expect((await listarDocumentos(peticion("/api/documentos"))).status).toBe(401);
    const subida = await subirDocumento(
      peticion("/api/documentos", { metodo: "POST", cuerpo: { titulo: "a", texto: textoArticulo }, cookie: "sesion_admin=falsa" }),
    );
    expect(subida.status).toBe(401);
  });

  it("sube un artículo, lo lista y rechaza el duplicado", async () => {
    const cookie = await cookieDeSesion();
    const subir = () =>
      subirDocumento(peticion("/api/documentos", { metodo: "POST", cuerpo: { titulo: "Estudio.pdf", texto: textoArticulo }, cookie }));

    const primera = await subir();
    expect(primera.status).toBe(201);
    const { documento } = await primera.json();
    expect(documento).toEqual({
      id: expect.any(String),
      titulo: "Estudio.pdf",
      estado: "pendiente",
      error: null,
      creadoEn: expect.any(String),
    });

    expect((await subir()).status).toBe(409);
    const lista = await (await listarDocumentos(peticion("/api/documentos", { cookie }))).json();
    expect(lista.documentos).toEqual([documento]);
  });

  it("lee un artículo paso a paso hasta dejarlo listo", async () => {
    const cookie = await cookieDeSesion();
    const subida = await subirDocumento(
      peticion("/api/documentos", { metodo: "POST", cuerpo: { titulo: "Estudio", texto: textoArticulo }, cookie }),
    );
    const { documento } = await subida.json();
    const paso = () =>
      procesarPaso(peticion(`/api/documentos/${documento.id}/paso`, { metodo: "POST", cookie }), {
        params: Promise.resolve({ id: documento.id }),
      });

    expect(await (await paso()).json()).toEqual({ tipo: "avance", procesados: 1, total: 1 });
    expect(await (await paso()).json()).toEqual({ tipo: "listo" });

    const lista = await (await listarDocumentos(peticion("/api/documentos", { cookie }))).json();
    expect(lista.documentos[0]).toMatchObject({ id: documento.id, estado: "listo" });
    const [memoria] = await sql`select contenido from memorias where documento_id = ${documento.id}`;
    expect(() => esquemaMemoria.validate(memoria?.contenido)).not.toThrow();
  });

  it.each(["no-es-un-uuid", "00000000-0000-0000-0000-000000000000"])(
    "responde 404 al leer el documento inexistente %s",
    async (id) => {
      const cookie = await cookieDeSesion();

      const respuesta = await procesarPaso(peticion(`/api/documentos/${id}/paso`, { metodo: "POST", cookie }), {
        params: Promise.resolve({ id }),
      });

      expect(respuesta.status).toBe(404);
    },
  );

  it("exige sesión para leer un documento", async () => {
    const respuesta = await procesarPaso(peticion("/api/documentos/x/paso", { metodo: "POST" }), {
      params: Promise.resolve({ id: "x" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it.each([
    ["sin texto", { titulo: "a" }, 400],
    ["con un título que no es texto", { titulo: 1, texto: textoArticulo }, 400],
    ["demasiado largo", { titulo: "a", texto: "x".repeat(400_001) }, 413],
    ["sin texto suficiente (PDF escaneado)", { titulo: "a", texto: "Página 1" }, 422],
  ])("rechaza un documento %s", async (_, cuerpo, estado) => {
    const cookie = await cookieDeSesion();

    const respuesta = await subirDocumento(peticion("/api/documentos", { metodo: "POST", cuerpo, cookie }));

    expect(respuesta.status).toBe(estado);
    expect(await respuesta.json()).toEqual({ error: expect.any(String) });
  });
});
