import { ROL_DE_FORMULARIO, ROLES_OBSERVADOR, } from "./tipos.js";
/** Mínimo de respuestas: 1 por rol de observador y 1 autoevaluación (decisión 11). */
export const MINIMO_POR_ROL = 1;
/**
 * Roles exentos para una institución. Solo cuenta la Excepción registrada por un admin:
 * no hay exención automática para los Centros Educativos (ADR 0004).
 */
export function rolesExentos(excepcion) {
    const s = new Set();
    if (excepcion?.sinEstudiantes)
        s.add("estu");
    if (excepcion?.sinAdministrativos)
        s.add("admi");
    return s;
}
export function evaluarMinimos(respuestas, excepcion) {
    const conteo = {
        autoevaluacion: 0,
        coor: 0,
        doce: 0,
        admi: 0,
        acud: 0,
        estu: 0,
    };
    for (const r of respuestas) {
        if (r.anulada)
            continue;
        if (r.tipo === "autoevaluacion")
            conteo.autoevaluacion++;
        else
            conteo[ROL_DE_FORMULARIO[r.tipo]]++;
    }
    const exentos = rolesExentos(excepcion);
    const faltantes = [];
    if (conteo.autoevaluacion < MINIMO_POR_ROL)
        faltantes.push("autoevaluacion");
    for (const rol of ROLES_OBSERVADOR) {
        if (!exentos.has(rol) && conteo[rol] < MINIMO_POR_ROL)
            faltantes.push(rol);
    }
    return { completo: faltantes.length === 0, faltantes, conteo };
}
