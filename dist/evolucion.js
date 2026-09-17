const valor = (entrada, salida) => ({
    entrada,
    salida,
    diferencia: entrada === null || salida === null ? null : salida - entrada,
});
const promedio = (v) => {
    const n = v.filter((x) => x !== null);
    return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
};
/**
 * Informe de Evolución (ADR 0003): Salida − Entrada, por competencia y por gestión,
 * por separado para la autoevaluación y para los observadores. Sin criterio « cumple » (eso es MEL).
 *
 * Nota: el Informe 360 no tiene un puntaje ponderado de observadores por gestión. Para la gestión,
 * « observadores » es el promedio de los puntajes de observadores de sus competencias.
 */
export function calcularEvolucion(entrada, salida, gestionDeCompetencia) {
    if (entrada.modo !== salida.modo)
        throw new Error("Entrada y Salida deben calcularse con el mismo modo");
    const competencias = {};
    for (const clave of Object.keys(entrada.competencias)) {
        const e = entrada.competencias[clave];
        const s = salida.competencias[clave];
        competencias[clave] = {
            auto: valor(e.auto, s?.auto ?? null),
            observadores: valor(e.observadores, s?.observadores ?? null),
        };
    }
    const gestiones = {};
    for (const g of Object.keys(entrada.gestiones)) {
        const comps = Object.keys(entrada.competencias).filter((c) => gestionDeCompetencia[c] === g);
        const obs = (inf) => promedio(comps.map((c) => inf.competencias[c]?.observadores ?? null));
        gestiones[g] = {
            auto: valor(entrada.gestiones[g].auto, salida.gestiones[g]?.auto ?? null),
            observadores: valor(obs(entrada), obs(salida)),
        };
    }
    return {
        competencias,
        gestiones,
        promedios: {
            auto: valor(entrada.promedioAuto, salida.promedioAuto),
            observadores: valor(entrada.promedioObservadores, salida.promedioObservadores),
        },
        advertenciaParcial: entrada.parcial || salida.parcial,
    };
}
