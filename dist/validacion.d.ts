import type { Instrumento } from "./tipos.js";
export interface ErrorValidacion {
    pregunta: string;
    mensaje: string;
}
/**
 * Valida un envío antes de guardarlo (ticket 09): tipo conocido, las preguntas del Instrumento
 * todas respondidas (« No sé » es una respuesta válida) y ninguna etiqueta desconocida.
 */
export declare function validarRespuesta(inst: Instrumento, tipo: string, respuestas: Readonly<Record<string, unknown>>): ErrorValidacion[];
