import { notasDePrueba } from "@/pruebas/fabricas";
import { consolidarNotas } from "./consolidar-notas";

describe("consolidarNotas", () => {
  it("une las notas de todos los fragmentos sin repetir elementos", () => {
    const texto = consolidarNotas("Estudio", [
      notasDePrueba({
        hallazgos: ["El tabaco aumenta el riesgo."],
        cifras: [{ valor: "30 %", descripcion: "fumadores" }],
        conceptos: [{ termino: "Carcinoma", explicacion: "Un tipo de cáncer." }],
        datosDeCita: "",
      }),
      notasDePrueba({
        hallazgos: ["el tabaco aumenta el riesgo. ", "Dejar de fumar ayuda."],
        conceptos: [{ termino: "carcinoma", explicacion: "Otra explicación." }],
        limitaciones: ["Muestra pequeña."],
        datosDeCita: "Pérez, 2023, Revista X",
      }),
    ]);

    expect(texto).toBe(
      [
        "Título del archivo: Estudio",
        "Datos de cita: Pérez, 2023, Revista X",
        "Hallazgos:\n- El tabaco aumenta el riesgo.\n- Dejar de fumar ayuda.",
        "Cifras:\n- 30 %: fumadores",
        "Términos:\n- Carcinoma: Un tipo de cáncer.",
        "Limitaciones:\n- Muestra pequeña.",
      ].join("\n\n"),
    );
  });

  it("indica las secciones vacías y la cita no encontrada", () => {
    const texto = consolidarNotas("Vacío", [notasDePrueba()]);

    expect(texto).toContain("Datos de cita: No indicado");
    expect(texto).toContain("Cifras:\n- (ninguno)");
  });

  it("limita la cantidad de elementos por lista para acotar los tokens", () => {
    const hallazgos = Array.from({ length: 40 }, (_, i) => `Hallazgo ${i}`);

    const texto = consolidarNotas("Largo", [notasDePrueba({ hallazgos })]);

    expect(texto).toContain("Hallazgo 24");
    expect(texto).not.toContain("Hallazgo 25");
  });
});
