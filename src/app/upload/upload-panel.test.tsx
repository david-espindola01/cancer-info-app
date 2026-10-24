import { fireEvent, render, screen } from "@testing-library/react";
import type { DocumentView } from "../api/http";
import { extractPdfText } from "./extract-pdf-text";
import { UploadPanel } from "./upload-panel";

vi.mock("./extract-pdf-text", () => ({ extractPdfText: vi.fn() }));
// The usage panel makes its own request; it has its tests in usage-panel.test.tsx.
vi.mock("./usage-panel", () => ({ UsagePanel: () => null }));

const document: DocumentView = {
  id: "1",
  title: "Estudio sobre piel",
  status: "ready",
  error: null,
  active: true,
  createdAt: "2026-10-21T00:00:00.000Z",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let responses: (Response | Promise<Response>)[];
const fakeFetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
  async () => responses.shift() ?? json({ documents: [] }),
);

beforeEach(() => {
  responses = [];
  fakeFetch.mockClear();
  vi.stubGlobal("fetch", fakeFetch);
});

afterEach(() => vi.unstubAllGlobals());

describe("UploadPanel", () => {
  it("asks for the password without a session and, after logging in, shows the articles", async () => {
    responses = [json({ error: "Inicia sesión." }, 401), json({ ok: true }), json({ documents: [document] })];
    render(<UploadPanel />);

    fireEvent.change(await screen.findByLabelText("Clave del equipo"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Estudio sobre piel")).toBeInTheDocument();
    expect(screen.getByText("Listo")).toBeInTheDocument();
    expect(fakeFetch).toHaveBeenNthCalledWith(
      2,
      "/api/session",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ password: "secret" }) }),
    );
  });

  it("shows the error if the password is wrong", async () => {
    responses = [json({}, 401), json({ error: "La clave no es correcta." }, 401)];
    render(<UploadPanel />);

    fireEvent.change(await screen.findByLabelText("Clave del equipo"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La clave no es correcta.");
  });

  it("uploads each chosen PDF and shows the result of each one", async () => {
    vi.mocked(extractPdfText).mockResolvedValueOnce("texto uno").mockRejectedValueOnce(new Error("broken"));
    responses = [json({ documents: [] }), json({ document }, 201), json({ documents: [document] })];
    render(<UploadPanel />);
    expect(await screen.findByText("Todavía no hay artículos subidos.")).toBeInTheDocument();

    const pdf = (name: string) => new File(["%PDF"], name, { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Elegir artículos (PDF)"), {
      target: { files: [pdf("Estudio.pdf"), pdf("Roto.pdf")] },
    });

    expect(await screen.findByText("Subido. Queda en espera de lectura.")).toBeInTheDocument();
    expect(await screen.findByText("No se pudo leer este archivo. ¿Es un PDF válido?")).toBeInTheDocument();
    expect(await screen.findByText("Estudio sobre piel")).toBeInTheDocument();
    expect(fakeFetch).toHaveBeenNthCalledWith(
      2,
      "/api/documents",
      expect.objectContaining({ body: JSON.stringify({ title: "Estudio", text: "texto uno" }) }),
    );
  });

  it("shows the server's message when it rejects a PDF", async () => {
    vi.mocked(extractPdfText).mockResolvedValueOnce("x");
    responses = [json({ documents: [] }), json({ error: "El PDF casi no tiene texto." }, 422)];
    render(<UploadPanel />);
    await screen.findByText("Todavía no hay artículos subidos.");

    fireEvent.change(screen.getByLabelText("Elegir artículos (PDF)"), {
      target: { files: [new File(["%PDF"], "Escaneado.pdf")] },
    });

    expect(await screen.findByText("El PDF casi no tiene texto.")).toBeInTheDocument();
  });

  it("automatically reads the pending articles and shows the progress", async () => {
    let finishReading!: (response: Response) => void;
    responses = [
      json({ documents: [{ ...document, status: "pending" }] }),
      json({ kind: "progress", processed: 1, total: 2 }),
      new Promise<Response>((resolve) => (finishReading = resolve)),
      json({ documents: [document] }),
    ];
    render(<UploadPanel />);

    expect(await screen.findByText("Leyendo parte 2 de 2…")).toBeInTheDocument();
    finishReading(json({ kind: "ready" }));

    expect(await screen.findByText("Listo")).toBeInTheDocument();
    expect(fakeFetch).toHaveBeenCalledWith("/api/documents/1/step", { method: "POST" });
  });

  it("allows retrying the reading of an article with an error", async () => {
    responses = [
      json({ documents: [{ ...document, status: "error", error: "La IA falló." }] }),
      json({ kind: "ready" }),
      json({ documents: [document] }),
    ];
    render(<UploadPanel />);
    expect(await screen.findByText("Error — La IA falló.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Listo")).toBeInTheDocument();
    expect(fakeFetch).toHaveBeenCalledWith("/api/documents/1/step", { method: "POST" });
  });

  it("shows an error if the server fails to list", async () => {
    responses = [new Response("down", { status: 500 })];
    render(<UploadPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent("El servidor respondió con un error (500).");
  });

  it("turns an article off and on with its switch", async () => {
    responses = [
      json({ documents: [document] }),
      json({ document: { ...document, active: false } }),
      json({ documents: [{ ...document, active: false }] }),
    ];
    render(<UploadPanel />);

    fireEvent.click(await screen.findByRole("switch", { name: "Usar «Estudio sobre piel» en la página" }));

    expect(await screen.findByText("Apagado: el agente no lo usa en la página.")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(fakeFetch).toHaveBeenCalledWith(
      "/api/documents/1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ active: false }) }),
    );
  });

  it("asks for confirmation before deleting an article, and lets the person cancel", async () => {
    responses = [json({ documents: [document] }), new Response(null, { status: 204 }), json({ documents: [] })];
    render(<UploadPanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("¿Eliminar «Estudio sobre piel»?");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(await screen.findByText("Todavía no hay artículos subidos.")).toBeInTheDocument();
    expect(fakeFetch).toHaveBeenCalledWith("/api/documents/1", { method: "DELETE" });
  });

  it("shows the server's message when a change fails", async () => {
    responses = [json({ documents: [document] }), json({ error: "No existe ese documento." }, 404), json({ documents: [] })];
    render(<UploadPanel />);

    fireEvent.click(await screen.findByRole("switch"));

    expect(await screen.findByRole("alert")).toHaveTextContent("No existe ese documento.");
  });

  it("uploads the PDFs dropped on the button and ignores other files", async () => {
    vi.mocked(extractPdfText).mockResolvedValueOnce("texto");
    responses = [json({ documents: [] }), json({ document }, 201), json({ documents: [document] })];
    render(<UploadPanel />);
    await screen.findByText("Todavía no hay artículos subidos.");

    const pdf = new File(["%PDF"], "Arrastrado.pdf", { type: "application/pdf" });
    const image = new File(["x"], "foto.png", { type: "image/png" });
    fireEvent.drop(screen.getByText("o arrástralos aquí. Puedes elegir varios a la vez."), {
      dataTransfer: { files: [pdf, image] },
    });

    expect(await screen.findByText("Subido. Queda en espera de lectura.")).toBeInTheDocument();
    const extracted = vi.mocked(extractPdfText).mock.calls.map(([file]) => file.name);
    expect(extracted).toContain(pdf.name);
    expect(extracted).not.toContain(image.name);
    expect(screen.queryByText(/foto\.png/)).not.toBeInTheDocument();
  });
});
