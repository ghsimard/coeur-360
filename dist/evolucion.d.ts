import type { Informe360, InformeEvolucion } from "./tipos.js";
/**
 * Informe de Evolución (ADR 0003): Salida − Entrada, por competencia y por gestión,
 * por separado para la autoevaluación y para los observadores. Sin criterio « cumple » (eso es MEL).
 *
 * Nota: el Informe 360 no tiene un puntaje ponderado de observadores por gestión. Para la gestión,
 * « observadores » es el promedio de los puntajes de observadores de sus competencias.
 */
export declare function calcularEvolucion(entrada: Informe360, salida: Informe360, gestionDeCompetencia: Readonly<Record<string, string>>): InformeEvolucion;
