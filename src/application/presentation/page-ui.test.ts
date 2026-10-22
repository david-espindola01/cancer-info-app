import { InvalidAnswer } from "../llm-errors";
import { noInformationPage, pageOutput, reviewPage, type PageUi } from "./page-ui";

const sources = [
  { number: 1, title: "A", reference: "R" },
  { number: 2, title: "B", reference: "R" },
];

const heading = { Heading: { props: { title: "Tumor", subtitle: null } } };
const nextTopics = {
  NextTopics: {
    props: {
      topics: [
        { label: "Factores de riesgo", reason: "x" },
        { label: "Prevención", reason: "y" },
      ],
    },
  },
};

describe("reviewPage", () => {
  it("rejects a page that cites a non-existent source", () => {
    const page: PageUi = { ui: [{ Stat: { props: { value: "1", description: "d", source: 9 } } }] };

    expect(() => reviewPage(page, { sources, topics: [] }, "tumor")).toThrow(InvalidAnswer);
  });

  it("also rejects non-existent numbers in the list of sources", () => {
    const page: PageUi = { ui: [{ Sources: { props: { numbers: [1, 3] } } }] };

    expect(() => reviewPage(page, { sources, topics: [] }, "tumor")).toThrow(/source 3/);
  });

  it("adds the consult notice before the closing and the cited sources at the end", () => {
    const page: PageUi = { ui: [heading, { Stat: { props: { value: "1", description: "d", source: 2 } } }, nextTopics] };

    const { page: reviewed } = reviewPage(page, { sources, topics: [] }, "tumor");

    expect(reviewed.ui.map((node) => Object.keys(node)[0])).toEqual(["Heading", "Stat", "Notice", "NextTopics", "Sources"]);
    expect(reviewed.ui[2]).toMatchObject({ Notice: { props: { kind: "consult" } } });
    expect(reviewed.ui[4]).toEqual({ Sources: { props: { numbers: [2] } } });
  });

  it("when nothing cites sources, lists all of them and leaves the notice at the end", () => {
    const { page } = reviewPage({ ui: [heading] }, { sources, topics: [] }, "tumor");

    expect(page.ui.map((node) => Object.keys(node)[0])).toEqual(["Heading", "Notice", "Sources"]);
    expect(page.ui[2]).toEqual({ Sources: { props: { numbers: [1, 2] } } });
  });

  it("does not duplicate the consult notice or the sources when they are already there", () => {
    const page: PageUi = {
      ui: [
        heading,
        { Section: { props: { title: "s" }, children: [{ Notice: { props: { kind: "consult", text: "t" } } }] } },
        { Sources: { props: { numbers: [1] } } },
      ],
    };

    expect(reviewPage(page, { sources, topics: [] }, "tumor").page).toEqual(page);
  });

  it("extracts the target topics: suggested ones first, then underlined, without the current one or repeats", () => {
    const page: PageUi = {
      ui: [
        { Paragraph: { props: { text: "Un [[tumor]] puede ser [[benigno]] o tener [[factores de riesgo]]." } } },
        {
          Section: {
            props: { title: "s" },
            children: [{ BulletList: { props: { title: null, items: ["Ver [[células|célula]]"] } } }],
          },
        },
        nextTopics,
      ],
    };

    expect(reviewPage(page, { sources, topics: [] }, "tumor").keywords).toEqual([
      "factores-de-riesgo",
      "prevencion",
      "benigno",
      "celula",
    ]);
  });

  describe("underlined words", () => {
    const textsOf = (page: PageUi) =>
      page.ui.flatMap((node) => {
        const [name, content] = Object.entries(node)[0]!;
        const props = content.props ?? {};
        return name === "Paragraph" ? [props.text] : name === "BulletList" ? (props.items as string[]) : [];
      });

    it("when the model underlined few topics, underlines the ones the sources cover up to 3", () => {
      const page: PageUi = {
        ui: [
          { Paragraph: { props: { text: "El [[tumor]] y el tumor. Hacer ejercicio ayuda; también la dieta." } } },
          { BulletList: { props: { title: null, items: ["Evitar el tabaco", "Más ejercicio"] } } },
        ],
      };

      const { page: reviewed, keywords } = reviewPage(
        page,
        { sources, topics: ["tumor", "ejercicio", "fútbol", "tabaco", "dieta"] },
        "cancer",
      );

      expect(textsOf(reviewed)).toEqual([
        "El [[tumor|tumor]] y el tumor. Hacer [[ejercicio]] ayuda; también la dieta.",
        "Evitar el [[tabaco]]",
        "Más ejercicio",
      ]);
      expect(keywords).toEqual(["tumor", "ejercicio", "tabaco"]);
      expect(textsOf(page)[1]).toBe("Evitar el tabaco");
    });

    it("does not underline the current page's topic and leaves pages with enough topics alone", () => {
      const page: PageUi = { ui: [{ Paragraph: { props: { text: "[[a]] [[b]] [[c]] y también tabaco" } } }] };

      expect(textsOf(reviewPage(page, { sources, topics: ["tabaco"] }, "x").page)).toEqual([
        "[[a]] [[b]] [[c]] y también tabaco",
      ]);
      expect(
        textsOf(
          reviewPage({ ui: [{ Paragraph: { props: { text: "Sobre el tabaco" } } }] }, { sources, topics: ["tabaco"] }, "tabaco")
            .page,
        ),
      ).toEqual(["Sobre el tabaco"]);
    });
  });

  it("leaves a no-information page as is when there are no covered topics to suggest", () => {
    const page = noInformationPage("algo raro");

    expect(reviewPage(page, { sources, topics: [] }, "algo-raro")).toEqual({ page, keywords: [] });
  });

  it("suggests up to 4 covered topics on a no-information page, without the current one or repeats", () => {
    const topics = ["Tabaco", "tabaco", "algo raro", "dieta", "sol", "alcohol", "sueño"];

    const { page, keywords } = reviewPage(noInformationPage("algo raro"), { sources, topics }, "algo-raro");

    expect(page.ui[2]).toEqual({
      NextTopics: {
        props: {
          topics: ["Tabaco", "dieta", "sol", "alcohol"].map((label) => ({
            label,
            reason: "Sobre esto sí tenemos información.",
          })),
        },
      },
    });
    expect(keywords).toEqual(["tabaco", "dieta", "sol", "alcohol"]);
  });

  it("keeps the suggestions when the model already put them on the no-information page", () => {
    const page: PageUi = { ui: [heading, { NoInformation: { props: { message: "m" } } }, nextTopics] };

    expect(reviewPage(page, { sources, topics: ["tabaco"] }, "x").page).toEqual(page);
  });

  it("starts every page with its title when the model left it out", () => {
    const page: PageUi = { ui: [{ NoInformation: { props: { message: "m" } } }] };

    const { page: reviewed } = reviewPage(page, { sources, topics: [] }, "vacuna-contra-el-vph");

    expect(reviewed.ui[0]).toEqual({ Heading: { props: { title: "Vacuna contra el vph", subtitle: null } } });
    expect(page.ui).toHaveLength(1);
  });
});

describe("noInformationPage", () => {
  it("uses the topic as the title and explains there is no information", () => {
    expect(noInformationPage("dolor de espalda")).toEqual({
      ui: [
        { Heading: { props: { title: "Dolor de espalda", subtitle: null } } },
        { NoInformation: { props: { message: expect.stringContaining("«dolor de espalda»") } } },
      ],
    });
  });
});

describe("pageOutput", () => {
  it("accepts { ui: [...] } and rejects any other shape", () => {
    expect(pageOutput.validate({ ui: [heading] })).toEqual({ ui: [heading] });
    expect(() => pageOutput.validate({ ui: "x" })).toThrow();
    expect(() => pageOutput.validate({ ui: [null] })).toThrow();
    expect(() => pageOutput.validate(null)).toThrow();
  });
});
