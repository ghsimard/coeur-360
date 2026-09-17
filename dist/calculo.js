import { evaluarMinimos } from "./minimos.js";
import { puntajeDeEtiqueta } from "./respuestas.js";
import { ROL_DE_FORMULARIO, ROLES_EXTERNOS, ROLES_INTERNOS, ROLES_OBSERVADOR, } from "./tipos.js";
const EPS = 1e-9;
const N_DESTACADOS = 8;
/**
 * Clave de orden redondeada a 1e-9: dos puntajes que solo difieren por ruido de coma flotante
 * se consideran empatados y el empate se resuelve por el orden del Instrumento (decisión 47).
 */
const claveOrden = (x) => Math.round(x * 1e9) / 1e9;
const promedio = (v) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
/** Percentil con interpolación lineal (igual que numpy.percentile por defecto). */
export function percentilLineal(valores, p) {
    if (!valores.length)
        throw new Error("percentilLineal: lista vacía");
    const s = [...valores].sort((a, b) => a - b);
    const h = (s.length - 1) * (p / 100);
    const lo = Math.floor(h);
    const hi = Math.min(lo + 1, s.length - 1);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
}
function puntajesPorItem(inst, respuestas) {
    const vigentes = respuestas.filter((r) => !r.anulada);
    // Una sola autoevaluación por Medición: si llegan varias, se usa la última de la lista.
    const auto = [...vigentes].reverse().find((r) => r.tipo === "autoevaluacion");
    const observadores = vigentes.filter((r) => r.tipo !== "autoevaluacion");
    const items = inst.items.map((item) => {
        const clave = String(item.numero);
        const porRolValores = {};
        for (const r of observadores) {
            if (r.tipo === "autoevaluacion")
                continue;
            const v = puntajeDeEtiqueta(item.escala, r.respuestas[clave]);
            if (v === null)
                continue;
            const rol = ROL_DE_FORMULARIO[r.tipo];
            (porRolValores[rol] ??= []).push(v);
        }
        const porRol = {};
        for (const rol of ROLES_OBSERVADOR) {
            const m = promedio(porRolValores[rol] ?? []);
            if (m !== null)
                porRol[rol] = m;
        }
        return {
            item,
            auto: auto ? puntajeDeEtiqueta(item.escala, auto.respuestas[clave]) : null,
            porRol,
        };
    });
    return { items, tieneAuto: auto !== undefined };
}
function contarObservadores(respuestas) {
    const out = new Map();
    for (const r of respuestas) {
        if (r.anulada || r.tipo === "autoevaluacion")
            continue;
        const rol = ROL_DE_FORMULARIO[r.tipo];
        const o = out.get(rol) ?? { rol, n: 0, diasContacto: {} };
        o.n++;
        const d = (r.diasContacto ?? "").trim();
        if (d)
            o.diasContacto[d] = (o.diasContacto[d] ?? 0) + 1;
        out.set(rol, o);
    }
    return ROLES_OBSERVADOR.filter((r) => out.has(r)).map((r) => out.get(r));
}
/** Promedio ponderado sobre los roles presentes de un grupo (pesos renormalizados). */
function ponderado(porRol, pesos, grupo) {
    let suma = 0;
    let pesoTotal = 0;
    for (const rol of grupo) {
        const v = porRol[rol];
        if (v === undefined)
            continue;
        suma += pesos[rol] * v;
        pesoTotal += pesos[rol];
    }
    // Redondeo a 1e-12 para quitar el ruido de coma flotante (p. ej. 10.000000000000002).
    return pesoTotal > EPS ? Math.round((suma / pesoTotal) * 1e12) / 1e12 : null;
}
// ---------------------------------------------------------------- modo corregido
function calcularCorregido(inst, respuestas) {
    const { items, tieneAuto } = puntajesPorItem(inst, respuestas);
    const porItem = items.map((p) => {
        const pesos = inst.pesos.get(p.item.clave);
        return {
            item: p.item,
            auto: p.auto,
            observadores: ponderado(p.porRol, pesos, ROLES_OBSERVADOR),
            internos: ponderado(p.porRol, pesos, ROLES_INTERNOS),
            externos: ponderado(p.porRol, pesos, ROLES_EXTERNOS),
        };
    });
    const competencias = {};
    for (const c of inst.competencias) {
        const its = porItem.filter((p) => p.item.competencia === c.clave);
        const prom = (k) => promedio(its.map((p) => p[k]).filter((v) => v !== null));
        competencias[c.clave] = {
            auto: prom("auto"),
            observadores: prom("observadores"),
            internos: prom("internos"),
            externos: prom("externos"),
        };
    }
    const gestiones = {};
    for (const g of inst.gestiones) {
        const cs = inst.competencias.filter((c) => c.gestion === g.clave).map((c) => competencias[c.clave]);
        const prom = (k) => promedio(cs.map((c) => c[k]).filter((v) => v !== null));
        gestiones[g.clave] = { auto: prom("auto"), internos: prom("internos"), externos: prom("externos") };
    }
    const promedioAuto = tieneAuto
        ? promedio(Object.values(gestiones).map((g) => g.auto).filter((v) => v !== null))
        : null;
    const promedioObservadores = promedio(Object.values(competencias).map((c) => c.observadores).filter((v) => v !== null));
    // Fortalezas y aspectos por mejorar (decisiones 44 y 47).
    const conPuntaje = porItem
        .map((p, orden) => ({ p, orden, s: p.observadores }))
        .filter((x) => x.s !== null);
    let fortalezas = [];
    let porMejorar = [];
    if (conPuntaje.length) {
        const valores = conPuntaje.map((x) => x.s);
        const p80 = percentilLineal(valores, 80);
        const p20 = percentilLineal(valores, 20);
        const aDestacado = (x) => ({
            item: x.p.item.clave,
            frase: x.p.item.frase ?? "",
            puntaje: x.s,
        });
        fortalezas = conPuntaje
            .filter((x) => x.s >= p80 - EPS)
            .sort((a, b) => claveOrden(b.s) - claveOrden(a.s) || a.orden - b.orden)
            .slice(0, N_DESTACADOS)
            .map(aDestacado);
        porMejorar = conPuntaje
            .filter((x) => x.s <= p20 + EPS)
            .sort((a, b) => claveOrden(a.s) - claveOrden(b.s) || a.orden - b.orden)
            .slice(0, N_DESTACADOS)
            .map(aDestacado);
    }
    return { tieneAuto, competencias, gestiones, promedioAuto, promedioObservadores, fortalezas, porMejorar };
}
// ---------------------------------------------------------------- modo RLT (pruebas)
/**
 * Reproduce el cálculo actual de RLT/360 (src/utils/reporte360Calculator.ts), incluidas sus particularidades:
 * internos/externos sin ponderar, ítem sin datos = 0, promedios globales sobre competencias > 0,
 * 8 mejores / 8 peores ítems. Solo para pruebas de equivalencia (decisión 55).
 */
function calcularRlt(inst, respuestas) {
    const { items, tieneAuto } = puntajesPorItem(inst, respuestas);
    const acc = new Map();
    const lista = [];
    // RLT recorre los ítems por número de pregunta.
    for (const p of [...items].sort((a, b) => a.item.numero - b.item.numero)) {
        const pesos = inst.pesosOriginales.get(p.item.clave);
        const obs = ponderado(p.porRol, pesos, ROLES_OBSERVADOR) ?? 0;
        const media = (g) => promedio(g.map((r) => p.porRol[r]).filter((v) => v !== undefined)) ?? 0;
        const a = acc.get(p.item.competencia) ?? { auto: [], obs: [], int: [], ext: [] };
        if (p.auto !== null)
            a.auto.push(p.auto);
        a.obs.push(obs);
        a.int.push(media(ROLES_INTERNOS));
        a.ext.push(media(ROLES_EXTERNOS));
        acc.set(p.item.competencia, a);
        lista.push({ item: p.item, obs });
    }
    const competencias = {};
    for (const c of inst.competencias) {
        const a = acc.get(c.clave) ?? { auto: [], obs: [], int: [], ext: [] };
        competencias[c.clave] = {
            auto: promedio(a.auto) ?? 0,
            observadores: promedio(a.obs) ?? 0,
            internos: promedio(a.int) ?? 0,
            externos: promedio(a.ext) ?? 0,
        };
    }
    const gestiones = {};
    for (const g of inst.gestiones) {
        const cs = inst.competencias.filter((c) => c.gestion === g.clave).map((c) => competencias[c.clave]);
        const prom = (k) => promedio(cs.map((c) => c[k])) ?? 0;
        gestiones[g.clave] = { auto: prom("auto"), internos: prom("internos"), externos: prom("externos") };
    }
    const positivos = (k) => promedio(Object.values(competencias).map((c) => c[k]).filter((v) => v > 0)) ?? 0;
    const orden = lista.filter((x) => x.obs > 0 && x.item.frase).sort((a, b) => claveOrden(b.obs) - claveOrden(a.obs)); // estable: empates por número de pregunta
    const aDestacado = (x) => ({
        item: x.item.clave,
        frase: x.item.frase ?? "",
        puntaje: x.obs,
    });
    return {
        tieneAuto,
        competencias,
        gestiones,
        promedioAuto: positivos("auto"),
        promedioObservadores: positivos("observadores"),
        fortalezas: orden.slice(0, N_DESTACADOS).map(aDestacado),
        // RLT muestra slice(-8); aquí se devuelve del peor al mejor, como en el resto del Cœur.
        porMejorar: orden.slice(-N_DESTACADOS).reverse().map(aDestacado),
    };
}
// ---------------------------------------------------------------- API
/** Calcula el Informe 360 de un Directivo evaluado para una Medición. */
export function calcularInforme(inst, respuestas, opciones = {}) {
    const modo = opciones.modo ?? "corregido";
    const r = modo === "rlt" ? calcularRlt(inst, respuestas) : calcularCorregido(inst, respuestas);
    const minimos = evaluarMinimos(respuestas, opciones.excepcion);
    return {
        modo,
        tieneAutoevaluacion: r.tieneAuto,
        observadores: contarObservadores(respuestas),
        competencias: r.competencias,
        gestiones: r.gestiones,
        promedioAuto: r.promedioAuto,
        promedioObservadores: r.promedioObservadores,
        fortalezas: r.fortalezas,
        porMejorar: r.porMejorar,
        rolesFaltantes: minimos.faltantes,
        parcial: !minimos.completo,
    };
}
