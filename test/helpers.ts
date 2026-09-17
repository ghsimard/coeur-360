import { readFileSync } from "node:fs";
import { prepararInstrumento, type InstrumentoCrudo, type RespuestaEncuesta, type TipoFormulario } from "../src/index.js";

export const leerJson = <T>(nombre: string): T =>
  JSON.parse(readFileSync(new URL(`./fixtures/${nombre}`, import.meta.url), "utf8")) as T;

export const crudo = leerJson<InstrumentoCrudo>("instrumento.json");
export const inst = prepararInstrumento(crudo);

/** Respuesta con la misma etiqueta en todas las preguntas (según la escala). */
export function respuestaUniforme(
  tipo: TipoFormulario,
  nivel: 1 | 2 | 3 | 4 | "nose",
  excepto: Record<number, string> = {},
): RespuestaEncuesta {
  const F = ["Nunca", "Pocas veces", "Algunas veces", "Siempre"];
  const A = ["Totalmente en desacuerdo", "Algo en desacuerdo", "Algo de acuerdo", "Totalmente de acuerdo"];
  const respuestas: Record<string, string> = {};
  for (const it of inst.items) {
    respuestas[String(it.numero)] =
      excepto[it.numero] ?? (nivel === "nose" ? "No sé" : (it.escala === "frecuencia" ? F : A)[nivel - 1]!);
  }
  return { tipo, respuestas };
}

export const numeroDe = (clave: string): number => inst.items.find((i) => i.clave === clave)!.numero;
