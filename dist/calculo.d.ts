import { type Informe360, type Instrumento, type OpcionesCalculo, type RespuestaEncuesta } from "./tipos.js";
/** Percentil con interpolación lineal (igual que numpy.percentile por defecto). */
export declare function percentilLineal(valores: readonly number[], p: number): number;
/** Calcula el Informe 360 de un Directivo evaluado para una Medición. */
export declare function calcularInforme(inst: Instrumento, respuestas: readonly RespuestaEncuesta[], opciones?: OpcionesCalculo): Informe360;
