import { describe, expect, it } from "vitest";
import { calcularInforme, percentilLineal, type RespuestaEncuesta } from "../src/index.js";
import { inst, numeroDe, respuestaUniforme } from "./helpers.js";

const todos = (nivel: 1 | 2 | 3 | 4): RespuestaEncuesta[] =>
  (["autoevaluacion", "directivo", "docente", "administrativo", "acudiente", "estudiante"] as const).map((t) =>
    respuestaUniforme(t, nivel),
  );

describe("percentilLineal", () => {
  it("interpola como numpy", () => {
    expect(percentilLineal([1, 2, 3, 4, 5], 80)).toBeCloseTo(4.2, 12);
    expect(percentilLineal([1, 2, 3, 4, 5], 20)).toBeCloseTo(1.8, 12);
    expect(percentilLineal([7], 80)).toBe(7);
  });
});

describe("calcularInforme (modo corregido)", () => {
  it("todas las respuestas en « Siempre / Totalmente de acuerdo » dan 10 en todo", () => {
    const inf = calcularInforme(inst, todos(4));
    for (const c of Object.values(inf.competencias)) expect(c).toEqual({ auto: 10, observadores: 10, internos: 10, externos: 10 });
    expect(inf.promedioAuto).toBe(10);
    expect(inf.promedioObservadores).toBe(10);
    expect(inf.parcial).toBe(false);
  });

  it("« No sé » se excluye: no baja el puntaje (decisión 48)", () => {
    const r = [respuestaUniforme("docente", 4), respuestaUniforme("docente", "nose")];
    const inf = calcularInforme(inst, r);
    expect(inf.competencias["autoconciencia"]!.internos).toBe(10);
  });

  it("un ítem sin ninguna respuesta queda fuera de la competencia (decisión 37)", () => {
    const n = numeroDe("redes_1");
    const r = [respuestaUniforme("estudiante", 2, { [n]: "No sé" }), respuestaUniforme("docente", 4)];
    const inf = calcularInforme(inst, r);
    // Los otros dos ítems de « redes » tienen estudiantes: 5 sobre 10, no rebajado por el ítem vacío.
    expect(inf.competencias["redes"]!.externos).toBe(5);
  });

  it("una competencia sin ningún dato es N/A (null), nunca 0", () => {
    const r = [respuestaUniforme("docente", 4)];
    const inf = calcularInforme(inst, r);
    expect(inf.competencias["autoconciencia"]!.externos).toBeNull();
    expect(inf.competencias["autoconciencia"]!.auto).toBeNull();
    expect(inf.gestiones["gestion_personal"]!.externos).toBeNull();
    expect(inf.promedioAuto).toBeNull();
  });

  it("internos y externos están ponderados (decisión 41)", () => {
    // autoconciencia_1: coor 0,51 / doce 0,34 / admi 0,05  →  internos = (0,51·10 + 0,34·5 + 0,05·2,5) / 0,90
    const r = [respuestaUniforme("directivo", 4), respuestaUniforme("docente", 2), respuestaUniforme("administrativo", 1)];
    const inf = calcularInforme(inst, r);
    const esperado1 = (0.51 * 10 + 0.34 * 5 + 0.05 * 2.5) / 0.9;
    // autoconciencia_2: 0,3 / 0,3 / 0,2 ; autoconciencia_3: 0,2 / 0,2 / 0,2
    const esperado2 = (0.3 * 10 + 0.3 * 5 + 0.2 * 2.5) / 0.8;
    const esperado3 = (10 + 5 + 2.5) / 3;
    expect(inf.competencias["autoconciencia"]!.internos).toBeCloseTo((esperado1 + esperado2 + esperado3) / 3, 10);
  });

  it("el puntaje de observadores se renormaliza sobre los roles presentes", () => {
    const r = [respuestaUniforme("docente", 2), respuestaUniforme("estudiante", 4)];
    const inf = calcularInforme(inst, r);
    // autoconciencia_1: doce 0,34 ; estu 0,05 → (0,34·5 + 0,05·10)/0,39
    const i1 = (0.34 * 5 + 0.05 * 10) / 0.39;
    const i2 = (0.3 * 5 + 0.1 * 10) / 0.4;
    const i3 = (0.2 * 5 + 0.2 * 10) / 0.4;
    expect(inf.competencias["autoconciencia"]!.observadores).toBeCloseTo((i1 + i2 + i3) / 3, 10);
  });

  it("los promedios de un rol usan a todos sus encuestados", () => {
    const r = [respuestaUniforme("docente", 4), respuestaUniforme("docente", 4), respuestaUniforme("docente", 2)];
    const inf = calcularInforme(inst, r);
    expect(inf.competencias["vision"]!.internos).toBeCloseTo((10 + 10 + 5) / 3, 10);
    expect(inf.observadores).toEqual([{ rol: "doce", n: 3, diasContacto: {} }]);
  });

  it("promedio de autoevaluación = promedio de las 3 gestiones", () => {
    const n = numeroDe("autoconciencia_1");
    const inf = calcularInforme(inst, [respuestaUniforme("autoevaluacion", 4, { [n]: "Totalmente en desacuerdo" })]);
    const g = Object.values(inf.gestiones).map((x) => x.auto!);
    expect(inf.promedioAuto).toBeCloseTo((g[0]! + g[1]! + g[2]!) / 3, 12);
  });

  it("fortalezas y aspectos por mejorar nunca se cruzan y van ordenados (decisiones 44 y 47)", () => {
    const excepto: Record<number, string> = {};
    inst.items.forEach((it, i) => {
      excepto[it.numero] = it.escala === "frecuencia"
        ? ["Nunca", "Pocas veces", "Algunas veces", "Siempre"][i % 4]!
        : ["Totalmente en desacuerdo", "Algo en desacuerdo", "Algo de acuerdo", "Totalmente de acuerdo"][i % 4]!;
    });
    const inf = calcularInforme(inst, [respuestaUniforme("docente", 4, excepto)]);
    const f = inf.fortalezas.map((x) => x.item);
    const m = inf.porMejorar.map((x) => x.item);
    expect(f.length).toBeLessThanOrEqual(8);
    expect(f.filter((x) => m.includes(x))).toEqual([]);
    expect(inf.fortalezas.every((x, i, a) => i === 0 || a[i - 1]!.puntaje >= x.puntaje)).toBe(true);
    expect(inf.porMejorar.every((x, i, a) => i === 0 || a[i - 1]!.puntaje <= x.puntaje)).toBe(true);
    expect(inf.fortalezas.every((x) => x.frase.length > 0)).toBe(true);
  });

  it("con más de 8 ítems sobre el umbral, conserva los 8 mejores (decisión 47)", () => {
    const excepto: Record<number, string> = {};
    // 12 ítems en 10, uno en 9,x imposible con una sola respuesta: usamos dos docentes para crear 7,5 / 8,75 / 10
    const a = respuestaUniforme("docente", 4);
    const b = respuestaUniforme("docente", 4);
    inst.items.forEach((it, i) => {
      const e = it.escala === "frecuencia" ? ["Algunas veces", "Siempre"] : ["Algo de acuerdo", "Totalmente de acuerdo"];
      if (i < 20) { (a.respuestas as Record<string, string>)[it.numero] = e[0]!; (b.respuestas as Record<string, string>)[it.numero] = e[0]!; }
      else if (i < 27) { (b.respuestas as Record<string, string>)[it.numero] = e[0]!; }
    });
    void excepto;
    const inf = calcularInforme(inst, [a, b]);
    // 12 ítems en 10 (≥ p80): se muestran 8, todos en 10, en el orden del Instrumento.
    expect(inf.fortalezas).toHaveLength(8);
    expect(inf.fortalezas.every((x) => x.puntaje === 10)).toBe(true);
    const orden = inst.items.map((i) => i.clave);
    const pos = inf.fortalezas.map((x) => orden.indexOf(x.item));
    expect([...pos].sort((p, q) => p - q)).toEqual(pos);
  });

  it("ignora las respuestas anuladas y usa la última autoevaluación", () => {
    const vieja = respuestaUniforme("autoevaluacion", 1);
    const nueva = respuestaUniforme("autoevaluacion", 4);
    const anulada = { ...respuestaUniforme("docente", 1), anulada: true };
    const inf = calcularInforme(inst, [vieja, nueva, anulada, respuestaUniforme("docente", 4)]);
    expect(inf.promedioAuto).toBe(10);
    expect(inf.competencias["vision"]!.internos).toBe(10);
  });

  it("cuenta los días de contacto por rol", () => {
    const r = [
      { ...respuestaUniforme("acudiente", 4), diasContacto: "Todos los días" },
      { ...respuestaUniforme("acudiente", 4), diasContacto: "Todos los días " },
      { ...respuestaUniforme("acudiente", 4), diasContacto: "Ningún día" },
    ];
    expect(calcularInforme(inst, r).observadores).toEqual([
      { rol: "acud", n: 3, diasContacto: { "Todos los días": 2, "Ningún día": 1 } },
    ]);
  });

  it("marca el informe parcial y respeta la Excepción", () => {
    const r = todos(4).filter((x) => x.tipo !== "estudiante");
    expect(calcularInforme(inst, r).rolesFaltantes).toEqual(["estu"]);
    expect(calcularInforme(inst, r, { excepcion: { sinEstudiantes: true } }).parcial).toBe(false);
  });
});
