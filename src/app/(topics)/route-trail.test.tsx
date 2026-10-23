import { render, screen, within } from "@testing-library/react";
import { accessibilityViolations } from "@/testing/accessibility";
import { getRead, getTrail, recordVisit } from "./reading-history";
import { RouteTrail } from "./route-trail";

const topic = (slug: string, title = slug) => ({ slug, title });

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function trailLinks() {
  return within(screen.getByRole("navigation", { name: "Tu recorrido" }))
    .queryAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);
}

describe("RouteTrail", () => {
  it("is not shown on the starting topic, and that visit begins a new trail", () => {
    recordVisit(topic("viejo"), { start: false });

    const { container } = render(<RouteTrail topic={topic("que-es-el-cancer", "¿Qué es el cáncer?")} start />);

    expect(container).toBeEmptyDOMElement();
    expect(getTrail()).toEqual([]);
    expect(getRead()[0]).toEqual(topic("que-es-el-cancer", "¿Qué es el cáncer?"));
  });

  it("shows the way from «Inicio» through the topics visited, ending in the current one", () => {
    recordVisit(topic("mutaciones", "Mutaciones"), { start: false });

    render(<RouteTrail topic={topic("metastasis", "¿Qué es la metástasis?")} start={false} />);

    expect(trailLinks()).toEqual([
      ["Inicio", "/"],
      ["Mutaciones", "/topic/mutaciones"],
    ]);
    expect(screen.getByText("¿Qué es la metástasis?")).toHaveAttribute("aria-current", "page");
  });

  it("when going back to a topic in the trail, leaves out the ones after it", () => {
    recordVisit(topic("a", "A"), { start: false });
    recordVisit(topic("b", "B"), { start: false });
    recordVisit(topic("c", "C"), { start: false });

    render(<RouteTrail topic={topic("b", "B")} start={false} />);

    expect(trailLinks()).toEqual([
      ["Inicio", "/"],
      ["A", "/topic/a"],
    ]);
    expect(getTrail().map((step) => step.slug)).toEqual(["a", "b"]);
  });

  it("still works if the phone blocks the storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    render(<RouteTrail topic={topic("b", "B")} start={false} />);

    expect(trailLinks()).toEqual([["Inicio", "/"]]);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("ignores damaged stored data", () => {
    sessionStorage.setItem("recorrido", "{no es json");
    localStorage.setItem("temas-leidos", JSON.stringify([{ slug: 1 }, topic("ok")]));

    expect(getTrail()).toEqual([]);
    expect(getRead()).toEqual([topic("ok")]);
  });

  it("has no accessibility problems", async () => {
    recordVisit(topic("a", "A"), { start: false });
    const { container } = render(<RouteTrail topic={topic("b", "B")} start={false} />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
