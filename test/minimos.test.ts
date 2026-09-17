import { describe, expect, it } from "vitest";
import { evaluarMinimos } from "../src/index.js";
import { respuestaUniforme } from "./helpers.js";

const completo = () =>
  (["autoevaluacion", "directivo", "docente", "administrativo", "acudiente", "estudiante"] as const).map((t) =>
    respuestaUniforme(t, 4),
  );

describe("evaluarMinimos", () => {
  it("1 respuesta por rol y 1 autoevaluación bastan (decisión 11)", () => {
    expect(evaluarMinimos(completo())).toMatchObject({ completo: true, faltantes: [] });
  });

  it("lista lo que falta", () => {
    const r = completo().filter((x) => x.tipo !== "estudiante" && x.tipo !== "autoevaluacion");
    expect(evaluarMinimos(r).faltantes).toEqual(["autoevaluacion", "estu"]);
  });

  it("sin Excepción, un Centro Educativo también exige estudiantes y administrativos (ADR 0004)", () => {
    const r = completo().filter((x) => x.tipo !== "estudiante" && x.tipo !== "administrativo");
    expect(evaluarMinimos(r).faltantes).toEqual(["admi", "estu"]);
  });

  it("la Excepción exime por completo el rol", () => {
    const r = completo().filter((x) => x.tipo !== "estudiante" && x.tipo !== "administrativo");
    expect(evaluarMinimos(r, { sinEstudiantes: true, sinAdministrativos: true }).completo).toBe(true);
  });

  it("ignora las respuestas anuladas", () => {
    const r = completo().map((x) => (x.tipo === "docente" ? { ...x, anulada: true } : x));
    expect(evaluarMinimos(r).faltantes).toEqual(["doce"]);
  });
});
