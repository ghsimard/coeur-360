/**
 * Pruebas de equivalencia con los datos reales de la Entrada 2026 (anonimizados):
 * 56 directivos, 568 respuestas, exportadas de la base RLT/360 el 17 de septiembre de 2026.
 * Los valores esperados vienen de la implementación de referencia en Python usada para la
 * comparación « emitido vs corregido » (methodologie-exe-360.md, §12).
 */
import { describe, expect, it } from "vitest";
import { calcularInforme, type Informe360, type Modo, type RespuestaEncuesta } from "../src/index.js";
import { inst, leerJson } from "./helpers.js";

interface Caso { id: string; respuestas: RespuestaEncuesta[] }
interface Esperado {
  id: string;
  competencias: Record<string, { auto: number | null; observadores: number | null; internos: number | null; externos: number | null }>;
  gestiones: Record<string, { auto: number | null; internos: number | null; externos: number | null }>;
  promedioAuto: number | null;
  promedioObservadores: number | null;
  fortalezas: string[];
  porMejorar: string[];
}

const casos = leerJson<Caso[]>("entrada-2026-anonimizada.json");

function comparar(inf: Informe360, esp: Esperado) {
  const cerca = (a: number | null | undefined, b: number | null) => {
    if (b === null) expect(a).toBeNull();
    else expect(a).toBeCloseTo(b, 9);
  };
  for (const [c, v] of Object.entries(esp.competencias)) {
    const x = inf.competencias[c]!;
    cerca(x.auto, v.auto); cerca(x.observadores, v.observadores); cerca(x.internos, v.internos); cerca(x.externos, v.externos);
  }
  for (const [g, v] of Object.entries(esp.gestiones)) {
    const x = inf.gestiones[g]!;
    cerca(x.auto, v.auto); cerca(x.internos, v.internos); cerca(x.externos, v.externos);
  }
  cerca(inf.promedioAuto, esp.promedioAuto);
  cerca(inf.promedioObservadores, esp.promedioObservadores);
  expect(inf.fortalezas.map((f) => f.item)).toEqual(esp.fortalezas);
  expect(inf.porMejorar.map((f) => f.item)).toEqual(esp.porMejorar);
}

describe.each<[Modo, string]>([
  ["rlt", "esperado-modo-rlt.json"],
  ["corregido", "esperado-corregido.json"],
])("modo %s", (modo, archivo) => {
  const esperados = new Map(leerJson<Esperado[]>(archivo).map((e) => [e.id, e]));
  it("hay 56 casos y 568 respuestas", () => {
    expect(casos).toHaveLength(56);
    expect(casos.reduce((s, c) => s + c.respuestas.length, 0)).toBe(568);
  });
  it.each(casos.map((c) => [c.id, c] as const))("%s", (_id, caso) => {
    comparar(calcularInforme(inst, caso.respuestas, { modo }), esperados.get(caso.id)!);
  });
});

describe("los datos de prueba no contienen datos personales", () => {
  it("solo hay identificadores D01…D56 y ningún número de cédula", () => {
    const texto = JSON.stringify(casos);
    expect(casos.every((c) => /^D\d{2}$/.test(c.id))).toBe(true);
    expect(texto).not.toMatch(/\d{6,}/);
  });
});
