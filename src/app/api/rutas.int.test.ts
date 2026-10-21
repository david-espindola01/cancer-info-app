import { NextRequest } from "next/server";
import { conexionPruebas, vaciarTablas } from "@/pruebas/bd";
import { DELETE as cerrarSesion, POST as iniciarSesion } from "./sesion/route";
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
