import { describe, expect, it } from "vitest";
import { calcularEvolucion, calcularInforme } from "../src/index.js";
import { crudo, inst, respuestaUniforme } from "./helpers.js";

const gestionDe = Object.fromEntries(crudo.competencias.map((c) => [c.clave, c.gestion]));

describe("calcularEvolucion", () => {
  it("calcula Salida − Entrada por separado para autoevaluación y observadores", () => {
    const entrada = calcularInforme(inst, [respuestaUniforme("autoevaluacion", 2), respuestaUniforme("docente", 3)]);
    const salida = calcularInforme(inst, [respuestaUniforme("autoevaluacion", 4), respuestaUniforme("docente", 2)]);
    const ev = calcularEvolucion(entrada, salida, gestionDe);
    expect(ev.competencias["vision"]!.auto).toEqual({ entrada: 5, salida: 10, diferencia: 5 });
    expect(ev.competencias["vision"]!.observadores).toEqual({ entrada: 7.5, salida: 5, diferencia: -2.5 });
    expect(ev.gestiones["gestion_personal"]!.auto.diferencia).toBe(5);
    expect(ev.gestiones["gestion_personal"]!.observadores.diferencia).toBe(-2.5);
    expect(ev.promedios.auto.diferencia).toBe(5);
    expect(ev.advertenciaParcial).toBe(true);
  });

  it("una diferencia con un lado sin datos es N/A", () => {
    const entrada = calcularInforme(inst, [respuestaUniforme("docente", 3)]);
    const salida = calcularInforme(inst, [respuestaUniforme("docente", 3), respuestaUniforme("autoevaluacion", 4)]);
    const ev = calcularEvolucion(entrada, salida, gestionDe);
    expect(ev.competencias["vision"]!.auto).toEqual({ entrada: null, salida: 10, diferencia: null });
    expect(ev.competencias["vision"]!.observadores.diferencia).toBe(0);
  });

  it("rechaza mezclar modos", () => {
    const a = calcularInforme(inst, [respuestaUniforme("docente", 3)]);
    const b = calcularInforme(inst, [respuestaUniforme("docente", 3)], { modo: "rlt" });
    expect(() => calcularEvolucion(a, b, gestionDe)).toThrow();
  });
});
