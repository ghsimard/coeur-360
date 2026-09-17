import { type ExcepcionMinimos, type RespuestaEncuesta, type RolObservador } from "./tipos.js";
/** Mínimo de respuestas: 1 por rol de observador y 1 autoevaluación (decisión 11). */
export declare const MINIMO_POR_ROL = 1;
/**
 * Roles exentos para una institución. Solo cuenta la Excepción registrada por un admin:
 * no hay exención automática para los Centros Educativos (ADR 0004).
 */
export declare function rolesExentos(excepcion?: ExcepcionMinimos | null): Set<RolObservador>;
export interface EstadoMinimos {
    completo: boolean;
    faltantes: Array<RolObservador | "autoevaluacion">;
    conteo: Record<RolObservador | "autoevaluacion", number>;
}
export declare function evaluarMinimos(respuestas: readonly RespuestaEncuesta[], excepcion?: ExcepcionMinimos | null): EstadoMinimos;
