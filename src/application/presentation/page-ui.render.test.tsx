import { render, screen } from "@testing-library/react";
import { GeneratedPage } from "@/ui/generated-page";
import { noInformationPage } from "./page-ui";

/** What the server builds without the AI must render with the catalog's components. */
describe("noInformationPage rendered", () => {
  it("renders with its title and the link back home", () => {
    render(<GeneratedPage ui={JSON.stringify(noInformationPage("dolor de espalda"))} sources={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Dolor de espalda" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toBeInTheDocument();
  });
});
