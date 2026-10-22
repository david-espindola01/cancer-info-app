import { RespuestaInvalida } from "../errores-llm";
import { paginaSinInformacion, revisarPagina, salidaPagina, type UiPagina } from "./pagina-ui";

const fuentes = [
  { numero: 1, titulo: "A", referencia: "R" },
  { numero: 2, titulo: "B", referencia: "R" },
];

const encabezado = { Encabezado: { props: { titulo: "Tumor", subtitulo: null } } };
const siguientes = {
  SiguientesTemas: {
    props: {
      temas: [
        { etiqueta: "Factores de riesgo", porQue: "x" },
        { etiqueta: "Prevención", porQue: "y" },
      ],
    },
  },
};

describe("revisarPagina", () => {
  it("rechaza una página que cita una fuente inexistente", () => {
    const pagina: UiPagina = { ui: [{ Cifra: { props: { valor: "1", descripcion: "d", fuente: 9 } } }] };

    expect(() => revisarPagina(pagina, { fuentes, temas: [] }, "tumor")).toThrow(RespuestaInvalida);
  });

  it("también rechaza números inexistentes en la lista de fuentes", () => {
    const pagina: UiPagina = { ui: [{ Fuentes: { props: { numeros: [1, 3] } } }] };

    expect(() => revisarPagina(pagina, { fuentes, temas: [] }, "tumor")).toThrow(/la fuente 3/);
  });

  it("agrega el aviso de consulta antes del cierre y las fuentes citadas al final", () => {
    const pagina: UiPagina = {
      ui: [encabezado, { Cifra: { props: { valor: "1", descripcion: "d", fuente: 2 } } }, siguientes],
    };

    const { pagina: revisada } = revisarPagina(pagina, { fuentes, temas: [] }, "tumor");

    expect(revisada.ui.map((nodo) => Object.keys(nodo)[0])).toEqual([
      "Encabezado",
      "Cifra",
      "Aviso",
      "SiguientesTemas",
      "Fuentes",
    ]);
    expect(revisada.ui[2]).toMatchObject({ Aviso: { props: { tipo: "consulta" } } });
    expect(revisada.ui[4]).toEqual({ Fuentes: { props: { numeros: [2] } } });
  });

  it("si nada cita fuentes, lista todas y deja el aviso al final", () => {
    const { pagina } = revisarPagina({ ui: [encabezado] }, { fuentes, temas: [] }, "tumor");

    expect(pagina.ui.map((nodo) => Object.keys(nodo)[0])).toEqual(["Encabezado", "Aviso", "Fuentes"]);
    expect(pagina.ui[2]).toEqual({ Fuentes: { props: { numeros: [1, 2] } } });
  });

  it("no duplica el aviso de consulta ni las fuentes si ya están", () => {
    const pagina: UiPagina = {
      ui: [
        { Seccion: { props: { titulo: "s" }, children: [{ Aviso: { props: { tipo: "consulta", texto: "t" } } }] } },
        { Fuentes: { props: { numeros: [1] } } },
      ],
    };

    expect(revisarPagina(pagina, { fuentes, temas: [] }, "tumor").pagina).toEqual(pagina);
  });

  it("extrae los temas destino: primero los sugeridos, luego los subrayados, sin el actual ni repetidos", () => {
    const pagina: UiPagina = {
      ui: [
        { Parrafo: { props: { texto: "Un [[tumor]] puede ser [[benigno]] o tener [[factores de riesgo]]." } } },
        {
          Seccion: {
            props: { titulo: "s" },
            children: [{ ListaPuntos: { props: { titulo: null, puntos: ["Ver [[células|célula]]"] } } }],
          },
        },
        siguientes,
      ],
    };

    expect(revisarPagina(pagina, { fuentes, temas: [] }, "tumor").palabrasClave).toEqual([
      "factores-de-riesgo",
      "prevencion",
      "benigno",
      "celula",
    ]);
  });

  describe("palabras subrayadas", () => {
    const textosDe = (pagina: UiPagina) =>
      pagina.ui.flatMap((nodo) => {
        const [nombre, contenido] = Object.entries(nodo)[0]!;
        const props = contenido.props ?? {};
        return nombre === "Parrafo" ? [props.texto] : nombre === "ListaPuntos" ? (props.puntos as string[]) : [];
      });

    it("si el modelo subrayó pocos temas, subraya los que cubren las fuentes hasta llegar a 3", () => {
      const pagina: UiPagina = {
        ui: [
          { Parrafo: { props: { texto: "El [[tumor]] y el tumor. Hacer ejercicio ayuda; también la dieta." } } },
          { ListaPuntos: { props: { titulo: null, puntos: ["Evitar el tabaco", "Más ejercicio"] } } },
        ],
      };

      const { pagina: revisada, palabrasClave } = revisarPagina(
        pagina,
        { fuentes, temas: ["tumor", "ejercicio", "fútbol", "tabaco", "dieta"] },
        "cancer",
      );

      expect(textosDe(revisada)).toEqual([
        "El [[tumor|tumor]] y el tumor. Hacer [[ejercicio]] ayuda; también la dieta.",
        "Evitar el [[tabaco]]",
        "Más ejercicio",
      ]);
      expect(palabrasClave).toEqual(["tumor", "ejercicio", "tabaco"]);
      expect(textosDe(pagina)[1]).toBe("Evitar el tabaco");
    });

    it("no subraya el tema de la página actual ni toca una página con suficientes temas", () => {
      const pagina: UiPagina = {
        ui: [{ Parrafo: { props: { texto: "[[a]] [[b]] [[c]] y también tabaco" } } }],
      };

      expect(textosDe(revisarPagina(pagina, { fuentes, temas: ["tabaco"] }, "x").pagina)).toEqual([
        "[[a]] [[b]] [[c]] y también tabaco",
      ]);
      expect(
        textosDe(revisarPagina({ ui: [{ Parrafo: { props: { texto: "Sobre el tabaco" } } }] }, { fuentes, temas: ["tabaco"] }, "tabaco").pagina),
      ).toEqual(["Sobre el tabaco"]);
    });
  });

  it("deja tal cual una página sin información si no hay temas cubiertos que sugerir", () => {
    const pagina = paginaSinInformacion("algo raro");

    expect(revisarPagina(pagina, { fuentes, temas: [] }, "algo-raro")).toEqual({ pagina, palabrasClave: [] });
  });

  it("a una página sin información le sugiere hasta 4 temas cubiertos, sin el actual ni repetidos", () => {
    const temas = ["Tabaco", "tabaco", "algo raro", "dieta", "sol", "alcohol", "sueño"];

    const { pagina, palabrasClave } = revisarPagina(paginaSinInformacion("algo raro"), { fuentes, temas }, "algo-raro");

    expect(pagina.ui[2]).toEqual({
      SiguientesTemas: {
        props: {
          temas: ["Tabaco", "dieta", "sol", "alcohol"].map((etiqueta) => ({
            etiqueta,
            porQue: "Sobre esto sí tenemos información.",
          })),
        },
      },
    });
    expect(palabrasClave).toEqual(["tabaco", "dieta", "sol", "alcohol"]);
  });

  it("respeta las sugerencias si el modelo ya las puso en la página sin información", () => {
    const pagina: UiPagina = { ui: [{ SinInformacion: { props: { mensaje: "m" } } }, siguientes] };

    expect(revisarPagina(pagina, { fuentes, temas: ["tabaco"] }, "x").pagina).toEqual(pagina);
  });
});

describe("paginaSinInformacion", () => {
  it("usa el tema como título y explica que no hay información", () => {
    expect(paginaSinInformacion("dolor de espalda")).toEqual({
      ui: [
        { Encabezado: { props: { titulo: "Dolor de espalda", subtitulo: null } } },
        { SinInformacion: { props: { mensaje: expect.stringContaining("«dolor de espalda»") } } },
      ],
    });
  });
});

describe("salidaPagina", () => {
  it("acepta { ui: [...] } y rechaza otra forma", () => {
    expect(salidaPagina.validar({ ui: [encabezado] })).toEqual({ ui: [encabezado] });
    expect(() => salidaPagina.validar({ ui: "x" })).toThrow();
    expect(() => salidaPagina.validar({ ui: [null] })).toThrow();
    expect(() => salidaPagina.validar(null)).toThrow();
  });
});
