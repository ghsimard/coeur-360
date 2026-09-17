import { describe, expect, it } from "vitest";
import { corregirPesos, prepararInstrumento, InstrumentoInvalido, ROLES_OBSERVADOR } from "../src/index.js";
import { crudo, inst } from "./helpers.js";

describe("prepararInstrumento", () => {
  it("carga 3 gestiones, 13 competencias y 39 ítems", () => {
    expect(inst.gestiones).toHaveLength(3);
    expect(inst.competencias).toHaveLength(13);
    expect(inst.items).toHaveLength(39);
    expect(inst.items.every((i) => i.frase && i.frase.length > 10)).toBe(true);
  });

  it("ordena los ítems por competencia y luego por clave", () => {
    expect(inst.items.slice(0, 4).map((i) => i.clave)).toEqual([
      "autoconciencia_1", "autoconciencia_2", "autoconciencia_3", "emociones_1",
    ]);
  });

  it("usa la correspondencia pregunta → ítem de la base (decisión 46)", () => {
    expect(inst.itemPorNumero.get(1)!.clave).toBe("autoconciencia_2");
    expect(inst.itemPorNumero.get(3)!.clave).toBe("vision_2");
    expect(inst.itemPorNumero.get(20)!.clave).toBe("autoconciencia_1");
  });

  it("todos los pesos corregidos suman exactamente 1", () => {
    for (const it of inst.items) {
      const p = inst.pesos.get(it.clave)!;
      expect(ROLES_OBSERVADOR.reduce((s, r) => s + p[r], 0)).toBeCloseTo(1, 12);
    }
  });

  it("corrige los 14 ítems a 0,998 según la decisión 45", () => {
    const cambiados = inst.items.filter((it) => {
      const o = inst.pesosOriginales.get(it.clave)!;
      const c = inst.pesos.get(it.clave)!;
      return ROLES_OBSERVADOR.some((r) => Math.abs(o[r] - c[r]) > 1e-12);
    });
    expect(cambiados).toHaveLength(14);
    const e = inst.pesos.get("emociones_1")!;
    expect(e.coor).toBeCloseTo(0.302, 12);
    expect(e.doce).toBeCloseTo(0.2, 12);
    const ev = inst.pesos.get("evaluacion_3")!;
    expect(ev.doce).toBeCloseTo(0.302, 12);
    const col = inst.pesos.get("colaborativo_1")!;
    expect(col.coor).toBeCloseTo(0.338, 12);
    expect(col.doce).toBeCloseTo(0.338, 12);
    expect(col.admi).toBeCloseTo(0.224, 12);
  });

  it("no toca los pesos que ya suman 1", () => {
    expect(corregirPesos({ coor: 0.51, doce: 0.34, admi: 0.05, acud: 0.05, estu: 0.05 })).toEqual({
      coor: 0.51, doce: 0.34, admi: 0.05, acud: 0.05, estu: 0.05,
    });
  });

  it("rechaza un instrumento incoherente", () => {
    expect(() =>
      prepararInstrumento({ ...crudo, items: [...crudo.items, { ...crudo.items[0]!, clave: "x_1" }] }),
    ).toThrow(InstrumentoInvalido);
    expect(() =>
      prepararInstrumento({ ...crudo, pesos: crudo.pesos.map((p) => (p.item === "vision_1" ? { ...p, peso: 0.5 } : p)) }),
    ).toThrow(/suman/);
  });
});
