import { recoverJson } from "./recover-json";

describe("recoverJson", () => {
  it.each([
    ["a stray bracket and the object left open", '[\n{"ui":[{"A":{"props":{"t":"x"}}},{"B":{"props":{}}}\n]'],
    ["the object wrapped in an array", '[{"ui":[{"A":{"props":{"t":"x"}}},{"B":{"props":{}}}]}]'],
    ["a stray bracket and nothing to close", '[ {"ui":[{"A":{"props":{"t":"x"}}},{"B":{"props":{}}}]} '],
  ])("recovers %s", (_, text) => {
    expect(recoverJson(text)).toEqual({ ui: [{ A: { props: { t: "x" } } }, { B: { props: {} } }] });
  });

  it("respects brackets and escaped quotes inside texts", () => {
    expect(recoverJson('[{"t":"a [[b]] \\" } c"')).toEqual({ t: 'a [[b]] " } c' });
  });

  it.each([
    ["JSON without the stray bracket", '{"ui":[}'],
    ["an answer cut off inside a text", '[{"ui":[{"A":{"props":{"t":"cut'],
    ["mismatched brackets", '[{"ui":[}]'],
    ["text after the stray bracket's closer", '[{"ui":[]}] and more'],
    ["something that is not JSON once closed", '[{"ui": tru'],
  ])("gives up on %s", (_, text) => {
    expect(recoverJson(text)).toBeNull();
  });
});
