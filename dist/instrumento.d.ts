import { type Instrumento, type InstrumentoCrudo, type RolObservador } from "./tipos.js";
export declare class InstrumentoInvalido extends Error {
    constructor(mensaje: string);
}
/**
 * Corrige los pesos de un ítem para que sumen exactamente 1 (decisión 45):
 * la diferencia va al rol de mayor peso; si hay empate, se reparte en partes iguales.
 */
export declare function corregirPesos(pesos: Readonly<Record<RolObservador, number>>): Record<RolObservador, number>;
/** Valida el Instrumento que viene de la base y prepara las estructuras de cálculo. */
export declare function prepararInstrumento(crudo: InstrumentoCrudo): Instrumento;
