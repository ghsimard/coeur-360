import { puntajeDeEtiqueta } from "./respuestas.js";
const TIPOS = [
    "autoevaluacion",
    "directivo",
    "docente",
    "administrativo",
    "acudiente",
    "estudiante",
];
/**
 * Valida un envío antes de guardarlo (ticket 09): tipo conocido, las preguntas del Instrumento
 * todas respondidas (« No sé » es una respuesta válida) y ninguna etiqueta desconocida.
 */
export function validarRespuesta(inst, tipo, respuestas) {
    const errores = [];
    if (!TIPOS.includes(tipo)) {
        errores.push({ pregunta: "-", mensaje: `Tipo de formulario desconocido: ${tipo}` });
    }
    for (const item of inst.items) {
        const clave = String(item.numero);
        const v = respuestas[clave];
        if (typeof v !== "string" || v.trim() === "") {
            errores.push({ pregunta: clave, mensaje: "Pregunta sin responder" });
            continue;
        }
        try {
            puntajeDeEtiqueta(item.escala, v, true);
        }
        catch (e) {
            errores.push({ pregunta: clave, mensaje: e.message });
        }
    }
    for (const clave of Object.keys(respuestas)) {
        if (!inst.itemPorNumero.has(Number(clave))) {
            errores.push({ pregunta: clave, mensaje: "Pregunta que no existe en el Instrumento" });
        }
    }
    return errores;
}
