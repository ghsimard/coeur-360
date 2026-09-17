/**
 * Tipos del Cœur 360. Vocabulario: ver CONTEXT.md del proyecto « 360 ».
 */

/** Rol de observador (claves de la tabla de ponderaciones de ExE). */
export type RolObservador = "coor" | "doce" | "admi" | "acud" | "estu";

export const ROLES_OBSERVADOR: readonly RolObservador[] = ["coor", "doce", "admi", "acud", "estu"];
/** Observadores internos: directivo par, docentes, administrativos. */
export const ROLES_INTERNOS: readonly RolObservador[] = ["coor", "doce", "admi"];
/** Observadores externos: acudientes, estudiantes. */
export const ROLES_EXTERNOS: readonly RolObservador[] = ["acud", "estu"];

/** Tipo de formulario tal como se guarda con cada respuesta. */
export type TipoFormulario =
  | "autoevaluacion"
  | "directivo"
  | "docente"
  | "administrativo"
  | "acudiente"
  | "estudiante";

export const ROL_DE_FORMULARIO: Readonly<Record<Exclude<TipoFormulario, "autoevaluacion">, RolObservador>> = {
  directivo: "coor",
  docente: "doce",
  administrativo: "admi",
  acudiente: "acud",
  estudiante: "estu",
};

export type Escala = "frecuencia" | "acuerdo";

// ------------------------------------------------------------------ Instrumento

export interface GestionDef {
  clave: string;
  nombre: string;
}

export interface CompetenciaDef {
  clave: string;
  nombre: string;
  /** Clave de la gestión a la que pertenece. */
  gestion: string;
}

export interface ItemDef {
  /** Número de la pregunta en el formulario (1..39). */
  numero: number;
  /** Clave del ítem, p. ej. "autoconciencia_2". */
  clave: string;
  /** Clave de la competencia, p. ej. "autoconciencia". */
  competencia: string;
  escala: Escala;
  /** Frase del informe (« Aspectos destacados y por mejorar »). */
  frase?: string;
}

export interface PesoDef {
  item: string;
  rol: RolObservador;
  peso: number;
}

/** Instrumento tal como llega de la base de datos (sin normalizar). */
export interface InstrumentoCrudo {
  gestiones: GestionDef[];
  competencias: CompetenciaDef[];
  items: ItemDef[];
  pesos: PesoDef[];
}

/** Instrumento validado y listo para el cálculo. */
export interface Instrumento {
  gestiones: readonly GestionDef[];
  /** En el orden de presentación. */
  competencias: readonly CompetenciaDef[];
  /** Ordenados según el orden del Instrumento: competencia, luego clave. */
  items: readonly ItemDef[];
  /** Por número de pregunta. */
  itemPorNumero: ReadonlyMap<number, ItemDef>;
  /** Pesos originales (tal como están en la base). */
  pesosOriginales: ReadonlyMap<string, Readonly<Record<RolObservador, number>>>;
  /** Pesos corregidos: suman exactamente 1 por ítem (decisión 45). */
  pesos: ReadonlyMap<string, Readonly<Record<RolObservador, number>>>;
}

// ------------------------------------------------------------------ Respuestas

export interface RespuestaEncuesta {
  tipo: TipoFormulario;
  /** Número de pregunta (como texto) → etiqueta elegida. */
  respuestas: Readonly<Record<string, string | null | undefined>>;
  /** « Ningún día », « 1 a 2 días », « 3 a 4 días », « Todos los días ». */
  diasContacto?: string | null;
  /** Las respuestas anuladas por un admin se ignoran. */
  anulada?: boolean;
}

/** Excepción de mínimos registrada por un admin para la institución. */
export interface ExcepcionMinimos {
  sinEstudiantes?: boolean;
  sinAdministrativos?: boolean;
}

export type Modo = "corregido" | "rlt";

export interface OpcionesCalculo {
  excepcion?: ExcepcionMinimos | null;
  /**
   * "corregido" (por defecto): reglas de 360 Insights.
   * "rlt": reproduce el cálculo actual de RLT/360. Solo para pruebas.
   */
  modo?: Modo;
}

// ------------------------------------------------------------------ Informe

/** `null` = sin datos (se muestra « N/A »). */
export type Puntaje = number | null;

export interface PuntajesCompetencia {
  auto: Puntaje;
  observadores: Puntaje;
  internos: Puntaje;
  externos: Puntaje;
}

export interface PuntajesGestion {
  auto: Puntaje;
  internos: Puntaje;
  externos: Puntaje;
}

export interface ObservadoresRol {
  rol: RolObservador;
  n: number;
  /** Conteo por respuesta de días de contacto. */
  diasContacto: Record<string, number>;
}

export interface ItemDestacado {
  item: string;
  frase: string;
  puntaje: number;
}

export interface Informe360 {
  modo: Modo;
  tieneAutoevaluacion: boolean;
  observadores: ObservadoresRol[];
  /** Por clave de competencia, en el orden del Instrumento. */
  competencias: Record<string, PuntajesCompetencia>;
  /** Por clave de gestión. */
  gestiones: Record<string, PuntajesGestion>;
  promedioAuto: Puntaje;
  promedioObservadores: Puntaje;
  /** Hasta 8, del mayor al menor puntaje. */
  fortalezas: ItemDestacado[];
  /** Hasta 8, del menor al mayor puntaje. */
  porMejorar: ItemDestacado[];
  /** Roles (y "autoevaluacion") bajo el mínimo y no exentos. */
  rolesFaltantes: Array<RolObservador | "autoevaluacion">;
  parcial: boolean;
}

export interface EvolucionValor {
  entrada: Puntaje;
  salida: Puntaje;
  diferencia: Puntaje;
}

export interface EvolucionPerspectivas {
  auto: EvolucionValor;
  observadores: EvolucionValor;
}

export interface InformeEvolucion {
  competencias: Record<string, EvolucionPerspectivas>;
  /** Las gestiones no tienen puntaje de observadores ponderado global: se usa el promedio de sus competencias. */
  gestiones: Record<string, EvolucionPerspectivas>;
  promedios: EvolucionPerspectivas;
  /** true si Entrada o Salida es un informe parcial. */
  advertenciaParcial: boolean;
}
