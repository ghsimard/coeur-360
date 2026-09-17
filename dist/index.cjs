"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  InstrumentoInvalido: () => InstrumentoInvalido,
  MINIMO_POR_ROL: () => MINIMO_POR_ROL,
  ROLES_EXTERNOS: () => ROLES_EXTERNOS,
  ROLES_INTERNOS: () => ROLES_INTERNOS,
  ROLES_OBSERVADOR: () => ROLES_OBSERVADOR,
  ROL_DE_FORMULARIO: () => ROL_DE_FORMULARIO,
  calcularEvolucion: () => calcularEvolucion,
  calcularInforme: () => calcularInforme,
  corregirPesos: () => corregirPesos,
  etiquetasDeEscala: () => etiquetasDeEscala,
  evaluarMinimos: () => evaluarMinimos,
  normalizarEtiqueta: () => normalizarEtiqueta,
  percentilLineal: () => percentilLineal,
  prepararInstrumento: () => prepararInstrumento,
  puntajeDeEtiqueta: () => puntajeDeEtiqueta,
  rolesExentos: () => rolesExentos,
  validarRespuesta: () => validarRespuesta
});
module.exports = __toCommonJS(index_exports);

// src/tipos.ts
var ROLES_OBSERVADOR = ["coor", "doce", "admi", "acud", "estu"];
var ROLES_INTERNOS = ["coor", "doce", "admi"];
var ROLES_EXTERNOS = ["acud", "estu"];
var ROL_DE_FORMULARIO = {
  directivo: "coor",
  docente: "doce",
  administrativo: "admi",
  acudiente: "acud",
  estudiante: "estu"
};

// src/instrumento.ts
var EPS = 1e-9;
var InstrumentoInvalido = class extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "InstrumentoInvalido";
  }
};
function corregirPesos(pesos) {
  const suma = ROLES_OBSERVADOR.reduce((s, r) => s + pesos[r], 0);
  const diferencia = 1 - suma;
  const out = { ...pesos };
  if (Math.abs(diferencia) < EPS) return out;
  const max = Math.max(...ROLES_OBSERVADOR.map((r) => pesos[r]));
  const empatados = ROLES_OBSERVADOR.filter((r) => Math.abs(pesos[r] - max) < EPS);
  for (const r of empatados) out[r] = pesos[r] + diferencia / empatados.length;
  return out;
}
function prepararInstrumento(crudo) {
  const gestiones = new Set(crudo.gestiones.map((g) => g.clave));
  const ordenCompetencia = /* @__PURE__ */ new Map();
  crudo.competencias.forEach((c, i) => {
    if (!gestiones.has(c.gestion)) {
      throw new InstrumentoInvalido(`La competencia ${c.clave} apunta a una gesti\xF3n desconocida: ${c.gestion}`);
    }
    if (ordenCompetencia.has(c.clave)) throw new InstrumentoInvalido(`Competencia duplicada: ${c.clave}`);
    ordenCompetencia.set(c.clave, i);
  });
  const itemPorNumero = /* @__PURE__ */ new Map();
  const claves = /* @__PURE__ */ new Set();
  for (const it of crudo.items) {
    if (!ordenCompetencia.has(it.competencia)) {
      throw new InstrumentoInvalido(`El \xEDtem ${it.clave} apunta a una competencia desconocida: ${it.competencia}`);
    }
    if (itemPorNumero.has(it.numero)) throw new InstrumentoInvalido(`N\xFAmero de pregunta duplicado: ${it.numero}`);
    if (claves.has(it.clave)) throw new InstrumentoInvalido(`Clave de \xEDtem duplicada: ${it.clave}`);
    itemPorNumero.set(it.numero, it);
    claves.add(it.clave);
  }
  const items = [...crudo.items].sort(
    (a, b) => (ordenCompetencia.get(a.competencia) ?? 0) - (ordenCompetencia.get(b.competencia) ?? 0) || a.clave.localeCompare(b.clave, "en", { numeric: true })
  );
  const originales = /* @__PURE__ */ new Map();
  for (const p of crudo.pesos) {
    if (!claves.has(p.item)) throw new InstrumentoInvalido(`Peso para un \xEDtem desconocido: ${p.item}`);
    if (!ROLES_OBSERVADOR.includes(p.rol)) throw new InstrumentoInvalido(`Rol de observador desconocido: ${p.rol}`);
    if (!(p.peso >= 0)) throw new InstrumentoInvalido(`Peso inv\xE1lido para ${p.item}/${p.rol}: ${p.peso}`);
    const fila = originales.get(p.item) ?? { coor: 0, doce: 0, admi: 0, acud: 0, estu: 0 };
    fila[p.rol] = p.peso;
    originales.set(p.item, fila);
  }
  const pesos = /* @__PURE__ */ new Map();
  for (const it of items) {
    const fila = originales.get(it.clave);
    if (!fila) throw new InstrumentoInvalido(`El \xEDtem ${it.clave} no tiene pesos`);
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
    pesos
  };
}

// src/respuestas.ts
var FRECUENCIA = {
  nunca: 2.5,
  "pocas veces": 5,
  "algunas veces": 7.5,
  siempre: 10
};
var ACUERDO = {
  "totalmente en desacuerdo": 2.5,
  "algo en desacuerdo": 5,
  "algo de acuerdo": 7.5,
  "totalmente de acuerdo": 10
};
function normalizarEtiqueta(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim().replace(/\.$/, "");
}
var SIN_RESPUESTA = /* @__PURE__ */ new Set(["no se", ""]);
function puntajeDeEtiqueta(escala, etiqueta, estricto = false) {
  if (etiqueta == null) return null;
  const e = normalizarEtiqueta(etiqueta);
  if (SIN_RESPUESTA.has(e)) return null;
  const v = (escala === "frecuencia" ? FRECUENCIA : ACUERDO)[e];
  if (v === void 0) {
    if (estricto) throw new Error(`Etiqueta desconocida para la escala ${escala}: \xAB ${etiqueta} \xBB`);
    return null;
  }
  return v;
}
function etiquetasDeEscala(escala) {
  return escala === "frecuencia" ? ["Nunca", "Pocas veces", "Algunas veces", "Siempre", "No s\xE9"] : ["Totalmente en desacuerdo", "Algo en desacuerdo", "Algo de acuerdo", "Totalmente de acuerdo", "No s\xE9"];
}

// src/minimos.ts
var MINIMO_POR_ROL = 1;
function rolesExentos(excepcion) {
  const s = /* @__PURE__ */ new Set();
  if (excepcion?.sinEstudiantes) s.add("estu");
  if (excepcion?.sinAdministrativos) s.add("admi");
  return s;
}
function evaluarMinimos(respuestas, excepcion) {
  const conteo = {
    autoevaluacion: 0,
    coor: 0,
    doce: 0,
    admi: 0,
    acud: 0,
    estu: 0
  };
  for (const r of respuestas) {
    if (r.anulada) continue;
    if (r.tipo === "autoevaluacion") conteo.autoevaluacion++;
    else conteo[ROL_DE_FORMULARIO[r.tipo]]++;
  }
  const exentos = rolesExentos(excepcion);
  const faltantes = [];
  if (conteo.autoevaluacion < MINIMO_POR_ROL) faltantes.push("autoevaluacion");
  for (const rol of ROLES_OBSERVADOR) {
    if (!exentos.has(rol) && conteo[rol] < MINIMO_POR_ROL) faltantes.push(rol);
  }
  return { completo: faltantes.length === 0, faltantes, conteo };
}

// src/calculo.ts
var EPS2 = 1e-9;
var N_DESTACADOS = 8;
var claveOrden = (x) => Math.round(x * 1e9) / 1e9;
var promedio = (v) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
function percentilLineal(valores, p) {
  if (!valores.length) throw new Error("percentilLineal: lista vac\xEDa");
  const s = [...valores].sort((a, b) => a - b);
  const h = (s.length - 1) * (p / 100);
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, s.length - 1);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
}
function puntajesPorItem(inst, respuestas) {
  const vigentes = respuestas.filter((r) => !r.anulada);
  const auto = [...vigentes].reverse().find((r) => r.tipo === "autoevaluacion");
  const observadores = vigentes.filter((r) => r.tipo !== "autoevaluacion");
  const items = inst.items.map((item) => {
    const clave = String(item.numero);
    const porRolValores = {};
    for (const r of observadores) {
      if (r.tipo === "autoevaluacion") continue;
      const v = puntajeDeEtiqueta(item.escala, r.respuestas[clave]);
      if (v === null) continue;
      const rol = ROL_DE_FORMULARIO[r.tipo];
      (porRolValores[rol] ??= []).push(v);
    }
    const porRol = {};
    for (const rol of ROLES_OBSERVADOR) {
      const m = promedio(porRolValores[rol] ?? []);
      if (m !== null) porRol[rol] = m;
    }
    return {
      item,
      auto: auto ? puntajeDeEtiqueta(item.escala, auto.respuestas[clave]) : null,
      porRol
    };
  });
  return { items, tieneAuto: auto !== void 0 };
}
function contarObservadores(respuestas) {
  const out = /* @__PURE__ */ new Map();
  for (const r of respuestas) {
    if (r.anulada || r.tipo === "autoevaluacion") continue;
    const rol = ROL_DE_FORMULARIO[r.tipo];
    const o = out.get(rol) ?? { rol, n: 0, diasContacto: {} };
    o.n++;
    const d = (r.diasContacto ?? "").trim();
    if (d) o.diasContacto[d] = (o.diasContacto[d] ?? 0) + 1;
    out.set(rol, o);
  }
  return ROLES_OBSERVADOR.filter((r) => out.has(r)).map((r) => out.get(r));
}
function ponderado(porRol, pesos, grupo) {
  let suma = 0;
  let pesoTotal = 0;
  for (const rol of grupo) {
    const v = porRol[rol];
    if (v === void 0) continue;
    suma += pesos[rol] * v;
    pesoTotal += pesos[rol];
  }
  return pesoTotal > EPS2 ? Math.round(suma / pesoTotal * 1e12) / 1e12 : null;
}
function calcularCorregido(inst, respuestas) {
  const { items, tieneAuto } = puntajesPorItem(inst, respuestas);
  const porItem = items.map((p) => {
    const pesos = inst.pesos.get(p.item.clave);
    return {
      item: p.item,
      auto: p.auto,
      observadores: ponderado(p.porRol, pesos, ROLES_OBSERVADOR),
      internos: ponderado(p.porRol, pesos, ROLES_INTERNOS),
      externos: ponderado(p.porRol, pesos, ROLES_EXTERNOS)
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
      externos: prom("externos")
    };
  }
  const gestiones = {};
  for (const g of inst.gestiones) {
    const cs = inst.competencias.filter((c) => c.gestion === g.clave).map((c) => competencias[c.clave]);
    const prom = (k) => promedio(cs.map((c) => c[k]).filter((v) => v !== null));
    gestiones[g.clave] = { auto: prom("auto"), internos: prom("internos"), externos: prom("externos") };
  }
  const promedioAuto = tieneAuto ? promedio(Object.values(gestiones).map((g) => g.auto).filter((v) => v !== null)) : null;
  const promedioObservadores = promedio(
    Object.values(competencias).map((c) => c.observadores).filter((v) => v !== null)
  );
  const conPuntaje = porItem.map((p, orden) => ({ p, orden, s: p.observadores })).filter((x) => x.s !== null);
  let fortalezas = [];
  let porMejorar = [];
  if (conPuntaje.length) {
    const valores = conPuntaje.map((x) => x.s);
    const p80 = percentilLineal(valores, 80);
    const p20 = percentilLineal(valores, 20);
    const aDestacado = (x) => ({
      item: x.p.item.clave,
      frase: x.p.item.frase ?? "",
      puntaje: x.s
    });
    fortalezas = conPuntaje.filter((x) => x.s >= p80 - EPS2).sort((a, b) => claveOrden(b.s) - claveOrden(a.s) || a.orden - b.orden).slice(0, N_DESTACADOS).map(aDestacado);
    porMejorar = conPuntaje.filter((x) => x.s <= p20 + EPS2).sort((a, b) => claveOrden(a.s) - claveOrden(b.s) || a.orden - b.orden).slice(0, N_DESTACADOS).map(aDestacado);
  }
  return { tieneAuto, competencias, gestiones, promedioAuto, promedioObservadores, fortalezas, porMejorar };
}
function calcularRlt(inst, respuestas) {
  const { items, tieneAuto } = puntajesPorItem(inst, respuestas);
  const acc = /* @__PURE__ */ new Map();
  const lista = [];
  for (const p of [...items].sort((a, b) => a.item.numero - b.item.numero)) {
    const pesos = inst.pesosOriginales.get(p.item.clave);
    const obs = ponderado(p.porRol, pesos, ROLES_OBSERVADOR) ?? 0;
    const media = (g) => promedio(g.map((r) => p.porRol[r]).filter((v) => v !== void 0)) ?? 0;
    const a = acc.get(p.item.competencia) ?? { auto: [], obs: [], int: [], ext: [] };
    if (p.auto !== null) a.auto.push(p.auto);
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
      externos: promedio(a.ext) ?? 0
    };
  }
  const gestiones = {};
  for (const g of inst.gestiones) {
    const cs = inst.competencias.filter((c) => c.gestion === g.clave).map((c) => competencias[c.clave]);
    const prom = (k) => promedio(cs.map((c) => c[k])) ?? 0;
    gestiones[g.clave] = { auto: prom("auto"), internos: prom("internos"), externos: prom("externos") };
  }
  const positivos = (k) => promedio(Object.values(competencias).map((c) => c[k]).filter((v) => v > 0)) ?? 0;
  const orden = lista.filter((x) => x.obs > 0 && x.item.frase).sort((a, b) => claveOrden(b.obs) - claveOrden(a.obs));
  const aDestacado = (x) => ({
    item: x.item.clave,
    frase: x.item.frase ?? "",
    puntaje: x.obs
  });
  return {
    tieneAuto,
    competencias,
    gestiones,
    promedioAuto: positivos("auto"),
    promedioObservadores: positivos("observadores"),
    fortalezas: orden.slice(0, N_DESTACADOS).map(aDestacado),
    // RLT muestra slice(-8); aquí se devuelve del peor al mejor, como en el resto del Cœur.
    porMejorar: orden.slice(-N_DESTACADOS).reverse().map(aDestacado)
  };
}
function calcularInforme(inst, respuestas, opciones = {}) {
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
    parcial: !minimos.completo
  };
}

// src/evolucion.ts
var valor = (entrada, salida) => ({
  entrada,
  salida,
  diferencia: entrada === null || salida === null ? null : salida - entrada
});
var promedio2 = (v) => {
  const n = v.filter((x) => x !== null);
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
};
function calcularEvolucion(entrada, salida, gestionDeCompetencia) {
  if (entrada.modo !== salida.modo) throw new Error("Entrada y Salida deben calcularse con el mismo modo");
  const competencias = {};
  for (const clave of Object.keys(entrada.competencias)) {
    const e = entrada.competencias[clave];
    const s = salida.competencias[clave];
    competencias[clave] = {
      auto: valor(e.auto, s?.auto ?? null),
      observadores: valor(e.observadores, s?.observadores ?? null)
    };
  }
  const gestiones = {};
  for (const g of Object.keys(entrada.gestiones)) {
    const comps = Object.keys(entrada.competencias).filter((c) => gestionDeCompetencia[c] === g);
    const obs = (inf) => promedio2(comps.map((c) => inf.competencias[c]?.observadores ?? null));
    gestiones[g] = {
      auto: valor(entrada.gestiones[g].auto, salida.gestiones[g]?.auto ?? null),
      observadores: valor(obs(entrada), obs(salida))
    };
  }
  return {
    competencias,
    gestiones,
    promedios: {
      auto: valor(entrada.promedioAuto, salida.promedioAuto),
      observadores: valor(entrada.promedioObservadores, salida.promedioObservadores)
    },
    advertenciaParcial: entrada.parcial || salida.parcial
  };
}

// src/validacion.ts
var TIPOS = [
  "autoevaluacion",
  "directivo",
  "docente",
  "administrativo",
  "acudiente",
  "estudiante"
];
function validarRespuesta(inst, tipo, respuestas) {
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
    } catch (e) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InstrumentoInvalido,
  MINIMO_POR_ROL,
  ROLES_EXTERNOS,
  ROLES_INTERNOS,
  ROLES_OBSERVADOR,
  ROL_DE_FORMULARIO,
  calcularEvolucion,
  calcularInforme,
  corregirPesos,
  etiquetasDeEscala,
  evaluarMinimos,
  normalizarEtiqueta,
  percentilLineal,
  prepararInstrumento,
  puntajeDeEtiqueta,
  rolesExentos,
  validarRespuesta
});
