import { render } from "@testing-library/react";
import { ServiceWorker } from "./service-worker";

const register = vi.fn(async () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  Reflect.deleteProperty(navigator, "serviceWorker");
  vi.clearAllMocks();
});

function phoneWithServiceWorkers() {
  Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
}

describe("ServiceWorker", () => {
  it("installs the service worker in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    phoneWithServiceWorkers();

    const { container } = render(<ServiceWorker />);

    expect(register).toHaveBeenCalledWith("/sw.js");
    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing in development or on a phone without service workers", () => {
    phoneWithServiceWorkers();
    render(<ServiceWorker />);
    Reflect.deleteProperty(navigator, "serviceWorker");
    vi.stubEnv("NODE_ENV", "production");
    render(<ServiceWorker />);

    expect(register).not.toHaveBeenCalled();
  });

  it("if the installation fails, the site works the same", async () => {
    vi.stubEnv("NODE_ENV", "production");
    register.mockRejectedValueOnce(new Error("no permitido"));
    phoneWithServiceWorkers();

    expect(() => render(<ServiceWorker />)).not.toThrow();
    await Promise.resolve();
  });
});
