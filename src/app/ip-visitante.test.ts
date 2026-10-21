import { ipVisitante } from "./ip-visitante";

describe("ipVisitante", () => {
  it("usa la primera IP de x-forwarded-for, luego x-real-ip y si no hay ninguna lo indica", () => {
    expect(ipVisitante(new Headers({ "x-forwarded-for": " 190.1.2.3 , 10.0.0.1" }))).toBe("190.1.2.3");
    expect(ipVisitante(new Headers({ "x-real-ip": "181.5.6.7" }))).toBe("181.5.6.7");
    expect(ipVisitante(new Headers())).toBe("desconocida");
  });
});
