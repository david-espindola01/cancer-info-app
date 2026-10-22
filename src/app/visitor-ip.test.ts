import { visitorIp } from "./visitor-ip";

describe("visitorIp", () => {
  it("uses the first IP of x-forwarded-for, then x-real-ip, and says so when there is none", () => {
    expect(visitorIp(new Headers({ "x-forwarded-for": " 190.1.2.3 , 10.0.0.1" }))).toBe("190.1.2.3");
    expect(visitorIp(new Headers({ "x-real-ip": "181.5.6.7" }))).toBe("181.5.6.7");
    expect(visitorIp(new Headers())).toBe("unknown");
  });
});
