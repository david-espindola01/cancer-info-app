import { sampleNotes } from "@/testing/factories";
import { consolidateNotes } from "./consolidate-notes";

describe("consolidateNotes", () => {
  it("joins the notes of every chunk without repeating items", () => {
    const text = consolidateNotes("Estudio", [
      sampleNotes({
        findings: ["El tabaco aumenta el riesgo."],
        figures: [{ value: "30 %", description: "fumadores" }],
        concepts: [{ term: "Carcinoma", explanation: "Un tipo de cáncer." }],
        citation: "",
      }),
      sampleNotes({
        findings: ["el tabaco aumenta el riesgo. ", "Dejar de fumar ayuda."],
        concepts: [{ term: "carcinoma", explanation: "Otra explicación." }],
        limitations: ["Muestra pequeña."],
        citation: "Pérez, 2023, Revista X",
      }),
    ]);

    expect(text).toBe(
      [
        "File title: Estudio",
        "Citation data: Pérez, 2023, Revista X",
        "Findings:\n- El tabaco aumenta el riesgo.\n- Dejar de fumar ayuda.",
        "Figures:\n- 30 %: fumadores",
        "Terms:\n- Carcinoma: Un tipo de cáncer.",
        "Limitations:\n- Muestra pequeña.",
      ].join("\n\n"),
    );
  });

  it("flags empty sections and a missing citation", () => {
    const text = consolidateNotes("Vacío", [sampleNotes()]);

    expect(text).toContain("Citation data: (not stated)");
    expect(text).toContain("Figures:\n- (none)");
  });

  it("caps the number of items per list to bound the tokens", () => {
    const findings = Array.from({ length: 40 }, (_, i) => `Hallazgo ${i}`);

    const text = consolidateNotes("Largo", [sampleNotes({ findings })]);

    expect(text).toContain("Hallazgo 24");
    expect(text).not.toContain("Hallazgo 25");
  });
});
