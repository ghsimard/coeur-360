import { describe, expect, it } from "vitest";
import { puntajeDeEtiqueta, validarRespuesta } from "../src/index.js";
import { inst, respuestaUniforme } from "./helpers.js";

describe("puntajeDeEtiqueta", () => {
  it("convierte las dos escalas a 2,5 / 5 / 7,5 / 10", () => {
    expect(["Nunca", "Pocas veces", "Algunas veces", "Siempre"].map((e) => puntajeDeEtiqueta("frecuencia", e))).toEqual([2.5, 5, 7.5, 10]);
    expect(
      ["Totalmente en desacuerdo", "Algo en desacuerdo", "Algo de acuerdo", "Totalmente de acuerdo"].map((e) =>
        puntajeDeEtiqueta("acuerdo", e),
      ),
    ).toEqual([2.5, 5, 7.5, 10]);
  });

  it("excluye « No sé », vacío y desconocido (decisión 48)", () => {
    expect(puntajeDeEtiqueta("frecuencia", "No sé")).toBeNull();
    expect(puntajeDeEtiqueta("frecuencia", "No Se")).toBeNull();
    expect(puntajeDeEtiqueta("frecuencia", "")).toBeNull();
    expect(puntajeDeEtiqueta("frecuencia", undefined)).toBeNull();
    expect(puntajeDeEtiqueta("frecuencia", "Totalmente de acuerdo")).toBeNull();
  });

  it("tolera mayúsculas, tildes y espacios", () => {
    expect(puntajeDeEtiqueta("frecuencia", "  ALGUNAS  veces ")).toBe(7.5);
  });

  it("en modo estricto rechaza una etiqueta desconocida", () => {
    expect(() => puntajeDeEtiqueta("acuerdo", "Siempre", true)).toThrow(/desconocida/);
  });
});

describe("validarRespuesta", () => {
  it("acepta un envío completo, con « No sé »", () => {
    expect(validarRespuesta(inst, "docente", respuestaUniforme("docente", "nose").respuestas)).toEqual([]);
  });
  it("señala preguntas faltantes, etiquetas desconocidas y preguntas de más", () => {
    const r = { ...respuestaUniforme("docente", 4).respuestas } as Record<string, string>;
    delete r["5"];
    r["19"] = "Siempre";
    r["40"] = "Siempre";
    const errores = validarRespuesta(inst, "profesor", r);
    expect(errores.map((e) => e.pregunta).sort()).toEqual(["-", "19", "40", "5"]);
  });
});
