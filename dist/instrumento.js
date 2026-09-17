import { ROLES_OBSERVADOR, } from "./tipos.js";
const EPS = 1e-9;
export class InstrumentoInvalido extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = "InstrumentoInvalido";
    }
}
/**
 * Corrige los pesos de un ítem para que sumen exactamente 1 (decisión 45):
 * la diferencia va al rol de mayor peso; si hay empate, se reparte en partes iguales.
 */
export function corregirPesos(pesos) {
    const suma = ROLES_OBSERVADOR.reduce((s, r) => s + pesos[r], 0);
    const diferencia = 1 - suma;
    const out = { ...pesos };
    if (Math.abs(diferencia) < EPS)
        return out;
    const max = Math.max(...ROLES_OBSERVADOR.map((r) => pesos[r]));
    const empatados = ROLES_OBSERVADOR.filter((r) => Math.abs(pesos[r] - max) < EPS);
    for (const r of empatados)
        out[r] = pesos[r] + diferencia / empatados.length;
    return out;
}
/** Valida el Instrumento que viene de la base y prepara las estructuras de cálculo. */
export function prepararInstrumento(crudo) {
    const gestiones = new Set(crudo.gestiones.map((g) => g.clave));
    const ordenCompetencia = new Map();
    crudo.competencias.forEach((c, i) => {
        if (!gestiones.has(c.gestion)) {
            throw new InstrumentoInvalido(`La competencia ${c.clave} apunta a una gestión desconocida: ${c.gestion}`);
        }
        if (ordenCompetencia.has(c.clave))
            throw new InstrumentoInvalido(`Competencia duplicada: ${c.clave}`);
        ordenCompetencia.set(c.clave, i);
    });
    const itemPorNumero = new Map();
    const claves = new Set();
    for (const it of crudo.items) {
        if (!ordenCompetencia.has(it.competencia)) {
            throw new InstrumentoInvalido(`El ítem ${it.clave} apunta a una competencia desconocida: ${it.competencia}`);
        }
        if (itemPorNumero.has(it.numero))
            throw new InstrumentoInvalido(`Número de pregunta duplicado: ${it.numero}`);
        if (claves.has(it.clave))
            throw new InstrumentoInvalido(`Clave de ítem duplicada: ${it.clave}`);
        itemPorNumero.set(it.numero, it);
        claves.add(it.clave);
    }
    const items = [...crudo.items].sort((a, b) => (ordenCompetencia.get(a.competencia) ?? 0) - (ordenCompetencia.get(b.competencia) ?? 0) ||
        a.clave.localeCompare(b.clave, "en", { numeric: true }));
    const originales = new Map();
    for (const p of crudo.pesos) {
        if (!claves.has(p.item))
            throw new InstrumentoInvalido(`Peso para un ítem desconocido: ${p.item}`);
        if (!ROLES_OBSERVADOR.includes(p.rol))
            throw new InstrumentoInvalido(`Rol de observador desconocido: ${p.rol}`);
        if (!(p.peso >= 0))
            throw new InstrumentoInvalido(`Peso inválido para ${p.item}/${p.rol}: ${p.peso}`);
        const fila = originales.get(p.item) ?? { coor: 0, doce: 0, admi: 0, acud: 0, estu: 0 };
        fila[p.rol] = p.peso;
        originales.set(p.item, fila);
    }
    const pesos = new Map();
    for (const it of items) {
        const fila = originales.get(it.clave);
        if (!fila)
            throw new InstrumentoInvalido(`El ítem ${it.clave} no tiene pesos`);
        const suma = ROLES_OBSERVADOR.reduce((s, r) => s + fila[r], 0);
        if (Math.abs(suma - 1) > 0.01) {
            throw new InstrumentoInvalido(`Los pesos de ${it.clave} suman ${suma}, demasiado lejos de 1`);
        }
        pesos.set(it.clave, corregirPesos(fila));
    }
    return {
        gestiones: crudo.gestiones,
        competencias: crudo.competencias,
        items,
        itemPorNumero,
        pesosOriginales: originales,
        pesos,
    };
}
