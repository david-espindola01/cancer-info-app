import { render, screen } from "@testing-library/react";
import { accessibilityViolations } from "@/testing/accessibility";
import { Notice } from "./highlights";
import { BulletList, Steps } from "./lists";
import { NoInformation, Sources } from "./navigation";
import { Heading } from "./structure";

describe("catalog components with minimal props", () => {
  it("Heading without subtitle shows only the title", () => {
    const { container } = render(<Heading title="Título" subtitle={null} />);

    expect(screen.getByRole("heading", { level: 1, name: "Título" })).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("shows the plain text of fields that are not links, even if the model marked them", () => {
    render(<Heading title="¿Qué es la [[metástasis|metástasis]]?" subtitle="Sobre el [[tumor]]" />);

    expect(screen.getByRole("heading", { level: 1, name: "¿Qué es la metástasis?" })).toBeInTheDocument();
    expect(screen.getByText("Sobre el tumor")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("BulletList and Steps without a title show only their content", () => {
    render(
      <>
        <BulletList title={null} items={["uno"]} />
        <Steps title={null} steps={[{ title: "Primero", text: "hacer algo" }]} />
      </>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("uno")).toBeInTheDocument();
    expect(screen.getByText("Primero")).toBeInTheDocument();
  });

  it.each([
    ["info", "Dato útil"],
    ["important", "Importante"],
    ["consult", "Consulta a un profesional de salud"],
  ] as const)("Notice «%s» is identified by the text «%s», not only by color", (kind, label) => {
    render(<Notice kind={kind} text="Mensaje" />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("Mensaje")).toBeInTheDocument();
  });

  it("Sources shows nothing if none of the cited sources exists", () => {
    const { container } = render(
      <Sources numbers={[7]} available={[{ number: 1, title: "A", reference: "R" }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("NoInformation offers going back home", async () => {
    const { container } = render(<NoInformation message="No tenemos información sobre eso." />);

    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
