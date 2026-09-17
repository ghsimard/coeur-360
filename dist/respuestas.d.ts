import type { Escala } from "./tipos.js";
/** Minúsculas, sin tildes, espacios normalizados. */
export declare function normalizarEtiqueta(texto: string): string;
/**
 * Convierte una etiqueta en puntaje sobre 10.
 * Devuelve `null` para « No sé », vacío, o una etiqueta desconocida (se excluye del cálculo).
 * El modo `estricto` lanza un error ante una etiqueta desconocida (para validar envíos).
 */
export declare function puntajeDeEtiqueta(escala: Escala, etiqueta: string | null | undefined, estricto?: boolean): number | null;
/** Etiquetas válidas (con « No sé ») de una escala, en orden. */
export declare function etiquetasDeEscala(escala: Escala): string[];
