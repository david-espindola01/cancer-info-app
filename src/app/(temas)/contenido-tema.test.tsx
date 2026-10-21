import { act, render, screen } from "@testing-library/react";
import { after } from "next/server";
import { notFound } from "next/navigation";
import type { ResultadoTema } from "@/aplicacion/presentacion/paginas-tema";
import { temas } from "@/infraestructura/contenedor";
import { FUENTES_EJEMPLO, PAGINA_EJEMPLO } from "@/pruebas/pagina-ejemplo";
import { ContenidoTema } from "./contenido-tema";

vi.mock("@/infraestructura/contenedor", () => ({ temas: { obtener: vi.fn(), regenerar: vi.fn() } }));
vi.mock("next/server", () => ({ after: vi.fn(), connection: vi.fn(async () => {}) }));
const refrescar = vi.fn();
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ refresh: refrescar }),
}));

const paginaLista = {
  slug: "tumor",
  tema: "tumor",
  ui: PAGINA_EJEMPLO,
  fuentes: FUENTES_EJEMPLO,
  palabrasClave: [],
  versionCorpus: 1,
  estado: "lista" as const,
};

async function mostrar(resultado: ResultadoTema) {
  vi.mocked(temas.obtener).mockResolvedValueOnce(resultado);
  render(await ContenidoTema({ slug: "tumor" }));
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("ContenidoTema", () => {
  it("muestra la página guardada sin regenerarla si está al día", async () => {
    await mostrar({ tipo: "lista", pagina: paginaLista, desactualizada: false });

    expect(screen.getByRole("heading", { level: 1, name: "¿Qué es el cáncer?" })).toBeInTheDocument();
    expect(after).not.toHaveBeenCalled();
  });

  it("si está desactualizada la muestra igual y la regenera después de responder", async () => {
    await mostrar({ tipo: "lista", pagina: paginaLista, desactualizada: true });
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    const tarea = vi.mocked(after).mock.calls[0]![0] as () => unknown;
    tarea();
    expect(temas.regenerar).toHaveBeenCalledWith("tumor");
  });

  it("mientras se prepara muestra la espera y vuelve a pedir la página", async () => {
    vi.useFakeTimers();
    await mostrar({ tipo: "preparando", reintentarMs: 3_000 });

    expect(screen.getByRole("status")).toHaveTextContent("Estamos preparando esta información");
    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(refrescar).toHaveBeenCalledTimes(1);
  });

  it("informa si no se pudo preparar la página", async () => {
    await mostrar({ tipo: "error" });

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos preparar esta página ahora.");
  });

  it("responde «no encontrado» para un tema no válido", async () => {
    vi.mocked(temas.obtener).mockResolvedValueOnce({ tipo: "no-valido" });

    await expect(ContenidoTema({ slug: "¿?" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
