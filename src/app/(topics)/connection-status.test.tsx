import { render, screen } from "@testing-library/react";
import { useOffline } from "next/offline";
import { LoadingMessage, OfflineNotice } from "./connection-status";

vi.mock("next/offline", () => ({ useOffline: vi.fn(() => false) }));

describe("connection status", () => {
  it("with signal shows no notice and the loading message says it is being prepared", () => {
    render(
      <>
        <OfflineNotice />
        <LoadingMessage />
      </>,
    );

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Estamos preparando esta información");
  });

  it("without signal says reading can go on and that new content will arrive later", () => {
    vi.mocked(useOffline).mockReturnValue(true);

    render(
      <>
        <OfflineNotice />
        <LoadingMessage />
      </>,
    );

    const messages = screen.getAllByRole("status").map((m) => m.textContent);
    expect(messages).toEqual([
      expect.stringContaining("Sin señal. Puedes seguir leyendo"),
      expect.stringContaining("se cargará apenas vuelva la señal"),
    ]);
  });
});
