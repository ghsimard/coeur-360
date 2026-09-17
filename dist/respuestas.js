const FRECUENCIA = {
    nunca: 2.5,
    "pocas veces": 5,
    "algunas veces": 7.5,
    siempre: 10,
};
const ACUERDO = {
    "totalmente en desacuerdo": 2.5,
    "algo en desacuerdo": 5,
    "algo de acuerdo": 7.5,
    "totalmente de acuerdo": 10,
};
/** Minúsculas, sin tildes, espacios normalizados. */
export function normalizarEtiqueta(texto) {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\.$/, "");
}
/** Etiquetas que significan « sin respuesta » (se excluyen del cálculo). */
const SIN_RESPUESTA = new Set(["no se", ""]);
/**
 * Convierte una etiqueta en puntaje sobre 10.
 * Devuelve `null` para « No sé », vacío, o una etiqueta desconocida (se excluye del cálculo).
 * El modo `estricto` lanza un error ante una etiqueta desconocida (para validar envíos).
 */
export function puntajeDeEtiqueta(escala, etiqueta, estricto = false) {
    if (etiqueta == null)
        return null;
    const e = normalizarEtiqueta(etiqueta);
    if (SIN_RESPUESTA.has(e))
        return null;
    const v = (escala === "frecuencia" ? FRECUENCIA : ACUERDO)[e];
    if (v === undefined) {
        if (estricto)
            throw new Error(`Etiqueta desconocida para la escala ${escala}: « ${etiqueta} »`);
        return null;
    }
    return v;
}
/** Etiquetas válidas (con « No sé ») de una escala, en orden. */
export function etiquetasDeEscala(escala) {
    return escala === "frecuencia"
        ? ["Nunca", "Pocas veces", "Algunas veces", "Siempre", "No sé"]
        : ["Totalmente en desacuerdo", "Algo en desacuerdo", "Algo de acuerdo", "Totalmente de acuerdo", "No sé"];
}
