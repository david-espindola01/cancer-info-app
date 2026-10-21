import { fireEvent, render, screen } from "@testing-library/react";
import type { DocumentoVista } from "../api/http";
import { extraerTextoPdf } from "./extraer-texto-pdf";
import { PanelSubida } from "./panel-subida";

vi.mock("./extraer-texto-pdf", () => ({ extraerTextoPdf: vi.fn() }));
// El panel de uso hace su propia consulta; tiene sus pruebas en panel-uso.test.tsx.
vi.mock("./panel-uso", () => ({ PanelUso: () => null }));

const documento: DocumentoVista = {
  id: "1",
  titulo: "Estudio sobre piel",
  estado: "listo",
  error: null,
  creadoEn: "2026-10-21T00:00:00.000Z",
};

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

let respuestas: (Response | Promise<Response>)[];
const fetchFalso = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
  async () => respuestas.shift() ?? json({ documentos: [] }),
);

beforeEach(() => {
  respuestas = [];
  fetchFalso.mockClear();
  vi.stubGlobal("fetch", fetchFalso);
});

afterEach(() => vi.unstubAllGlobals());

describe("PanelSubida", () => {
  it("pide la clave si no hay sesión y, al entrar, muestra los artículos", async () => {
    respuestas = [json({ error: "Inicia sesión." }, 401), json({ ok: true }), json({ documentos: [documento] })];
    render(<PanelSubida />);

    fireEvent.change(await screen.findByLabelText("Clave del equipo"), { target: { value: "secreta" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Estudio sobre piel")).toBeInTheDocument();
    expect(screen.getByText("Listo")).toBeInTheDocument();
    expect(fetchFalso).toHaveBeenNthCalledWith(2, "/api/sesion", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ clave: "secreta" }),
    }));
  });

  it("muestra el error si la clave es incorrecta", async () => {
    respuestas = [json({}, 401), json({ error: "La clave no es correcta." }, 401)];
    render(<PanelSubida />);

    fireEvent.change(await screen.findByLabelText("Clave del equipo"), { target: { value: "mala" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La clave no es correcta.");
  });

  it("sube cada PDF elegido y muestra el resultado de cada uno", async () => {
    vi.mocked(extraerTextoPdf).mockResolvedValueOnce("texto uno").mockRejectedValueOnce(new Error("roto"));
    respuestas = [
      json({ documentos: [] }),
      json({ documento }, 201),
      json({ documentos: [documento] }),
    ];
    render(<PanelSubida />);
    expect(await screen.findByText("Todavía no hay artículos subidos.")).toBeInTheDocument();

    const pdf = (nombre: string) => new File(["%PDF"], nombre, { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Elegir artículos (PDF)"), {
      target: { files: [pdf("Estudio.pdf"), pdf("Roto.pdf")] },
    });

    expect(await screen.findByText("Subido. Queda en espera de lectura.")).toBeInTheDocument();
    expect(await screen.findByText("No se pudo leer este archivo. ¿Es un PDF válido?")).toBeInTheDocument();
    expect(await screen.findByText("Estudio sobre piel")).toBeInTheDocument();
    expect(fetchFalso).toHaveBeenNthCalledWith(2, "/api/documentos", expect.objectContaining({
      body: JSON.stringify({ titulo: "Estudio", texto: "texto uno" }),
    }));
  });

  it("muestra el mensaje del servidor cuando rechaza un PDF", async () => {
    vi.mocked(extraerTextoPdf).mockResolvedValueOnce("x");
    respuestas = [json({ documentos: [] }), json({ error: "El PDF casi no tiene texto." }, 422)];
    render(<PanelSubida />);
    await screen.findByText("Todavía no hay artículos subidos.");

    fireEvent.change(screen.getByLabelText("Elegir artículos (PDF)"), {
      target: { files: [new File(["%PDF"], "Escaneado.pdf")] },
    });

    expect(await screen.findByText("El PDF casi no tiene texto.")).toBeInTheDocument();
  });

  it("lee automáticamente los artículos pendientes y muestra el progreso", async () => {
    let terminarLectura!: (respuesta: Response) => void;
    respuestas = [
      json({ documentos: [{ ...documento, estado: "pendiente" }] }),
      json({ tipo: "avance", procesados: 1, total: 2 }),
      new Promise<Response>((resolver) => (terminarLectura = resolver)),
      json({ documentos: [documento] }),
    ];
    render(<PanelSubida />);

    expect(await screen.findByText("Leyendo parte 2 de 2…")).toBeInTheDocument();
    terminarLectura(json({ tipo: "listo" }));

    expect(await screen.findByText("Listo")).toBeInTheDocument();
    expect(fetchFalso).toHaveBeenCalledWith("/api/documentos/1/paso", { method: "POST" });
  });

  it("permite reintentar la lectura de un artículo con error", async () => {
    respuestas = [
      json({ documentos: [{ ...documento, estado: "error", error: "La IA falló." }] }),
      json({ tipo: "listo" }),
      json({ documentos: [documento] }),
    ];
    render(<PanelSubida />);
    expect(await screen.findByText("Error — La IA falló.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Listo")).toBeInTheDocument();
    expect(fetchFalso).toHaveBeenCalledWith("/api/documentos/1/paso", { method: "POST" });
  });

  it("muestra un error si el servidor falla al listar", async () => {
    respuestas = [new Response("caído", { status: 500 })];
    render(<PanelSubida />);

    expect(await screen.findByRole("alert")).toHaveTextContent("El servidor respondió con un error (500).");
  });
});
