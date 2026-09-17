# coeur-360

Moteur de calcul du **Informe 360°** et du **Informe de Evolución**, commun à RLT/360 et à 360 Insights (ADR 0007).

Le paquet contient uniquement des calculs. Il n'accède ni à la base de données, ni au réseau, ni à l'interface. Chaque produit charge l'Instrumento et les réponses, appelle `coeur-360`, puis affiche ou enregistre le résultat.

## Installation

Le dossier `dist/` est versionné. L'installation depuis GitHub ne demande donc aucune compilation :

```bash
npm install github:ghsimard/coeur-360#v0.1.0
```

Si le dépôt est privé, le serveur Render a besoin d'un jeton GitHub en lecture, par exemple avec l'URL `git+https://<jeton>@github.com/ghsimard/coeur-360.git#v0.1.0`.

Le paquet fonctionne en ESM (`import`) pour le frontend TanStack et en CommonJS (`require`) pour le backend Express.

## Utilisation

```js
const { prepararInstrumento, calcularInforme, calcularEvolucion, validarRespuesta } = require("coeur-360");

// 1. Instrumento : gestiones, competencias, items (número → clave, escala, frase) et ponderaciones.
const inst = prepararInstrumento({ gestiones, competencias, items, pesos });

// 2. Informe 360 d'un Directivo evaluado pour une Medición.
const informe = calcularInforme(inst, respuestas, {
  excepcion: { sinEstudiantes: false, sinAdministrativos: true }, // Excepción de mínimos, facultative
});

// 3. Informe de Evolución (Salida − Entrada).
const gestionDe = Object.fromEntries(inst.competencias.map((c) => [c.clave, c.gestion]));
const evolucion = calcularEvolucion(informeEntrada, informeSalida, gestionDe);

// 4. Validation d'un envoi avant l'enregistrement (ticket 09).
const erreurs = validarRespuesta(inst, "docente", { "1": "Siempre", /* … */ });
```

Chaque élément de `respuestas` a la forme `{ tipo, respuestas: { "1": "Siempre", … }, diasContacto?, anulada? }`. Les valeurs possibles de `tipo` sont `autoevaluacion`, `directivo`, `docente`, `administrativo`, `acudiente` et `estudiante`.

### API

| Fonction | Rôle |
|---|---|
| `prepararInstrumento(crudo)` | Valide l'Instrumento et trie les items (ordre des compétences, puis clé). Corrige les poids pour que chaque item totalise exactement 1 (décision 45). Lève `InstrumentoInvalido` en cas d'erreur. |
| `corregirPesos(pesos)` | Attribue l'écart au rôle qui a le plus grand poids. En cas d'égalité, l'écart est partagé à parts égales. |
| `calcularInforme(inst, respuestas, opciones)` | Calcule le Informe 360 : compétences, gestiones, moyennes, fortalezas et aspectos por mejorar, observateurs par rôle, rôles manquants et indicateur `parcial`. |
| `calcularEvolucion(entrada, salida, gestionDe)` | Calcule la différence Salida − Entrada par compétence et par gestión, pour l'autoevaluación et pour les observateurs. N'applique aucun critère « cumple », qui relève du MEL (ADR 0003). |
| `evaluarMinimos(respuestas, excepcion)` | Vérifie le minimum de 1 autoevaluación et de 1 réponse par rôle, en tenant compte des exemptions enregistrées par un admin (ADR 0004). |
| `puntajeDeEtiqueta(escala, etiqueta)` | Convertit une réponse en points : 2,5 / 5 / 7,5 / 10. « No sé » ou une réponse vide donne `null`. |
| `validarRespuesta(inst, tipo, respuestas)` | Liste les erreurs d'un envoi : type inconnu, question sans réponse, étiquette inconnue ou question hors Instrumento. |
| `percentilLineal(valores, p)` | Calcule un percentile par interpolation linéaire, comme `numpy.percentile`. |

## Les deux modes de calcul

### `modo: "corregido"` (par défaut)

C'est la méthode ExE avec les corrections décidées (spec §6, décisions 37, 41 et 44 à 48) :

- « No sé » est exclu du calcul ; il ne compte pas comme 0.
- Un item sans aucune donnée vaut N/A (`null`) et non 0.
- Les internos (coor, doce, admi) et les externos (acud, estu) sont **pondérés** et renormalisés sur les rôles présents.
- Les poids de chaque item totalisent exactement 1 (décision 45).
- La moyenne de l'autoevaluación est la moyenne des 3 gestiones.
- La moyenne des observateurs est la moyenne des 13 compétences.
- Fortalezas : items dont le score est ≥ p80, triés par score décroissant, maximum 8.
- Por mejorar : items dont le score est ≤ p20, triés par score croissant, maximum 8.
- Pour les fortalezas comme pour por mejorar, les égalités suivent l'ordre de l'Instrumento.

### `modo: "rlt"` (tests seulement)

Ce mode reproduit le calcul actuel de RLT/360 (`reporte360Calculator.ts`) :

- Les internos et externos ne sont pas pondérés.
- Un item vide compte pour 0.
- Les moyennes sont calculées sur les compétences supérieures à 0.
- Les fortalezas sont les 8 meilleurs items et por mejorar les 8 moins bons.

Ce mode ne sert qu'à prouver, par les tests, que le moteur reproduit exactement ce que RLT affiche aujourd'hui (décision 55). **RLT/360 n'est pas modifié** : les cohortes 2026 gardent leur méthode actuelle.

### Égalités et arrondis

Les scores sont arrondis à 1e-12 pour effacer le bruit des nombres à virgule flottante (par exemple `10.000000000000002`).

Pour trier les phrases, deux scores dont l'écart est inférieur à 1e-9 sont considérés comme égaux. L'ordre est alors celui de l'Instrumento en mode corrigé, et celui du numéro de question en mode RLT.

## Tests

```bash
npm ci
npm run verificar   # typecheck + 150 tests + build
```

Les tests de `test/equivalencia.test.ts` utilisent les **données réelles de la Entrada 2026, anonymisées** : 56 directivos (D01 à D56) et 568 réponses. Les fichiers ne contiennent ni nom, ni cédula, ni institution ; un test le vérifie.

Chaque cas doit reproduire, à 1e-9 près et avec le même ordre de phrases, les résultats de l'implémentation de référence en Python. Cette implémentation a été vérifiée sur les 99 PDF de Entrada 2025 et les 96 de Salida 2025 (`methodologie-exe-360.md`). Les résultats attendus sont vérifiés dans les deux modes.

| Fichier | Contenu |
|---|---|
| `test/fixtures/instrumento.json` | 13 compétences, 39 items avec leurs phrases, ponderaciones de la base |
| `test/fixtures/entrada-2026-anonimizada.json` | Réponses de la Entrada 2026 (anonymisées) |
| `test/fixtures/esperado-modo-rlt.json` | Résultats attendus avec la méthode RLT actuelle |
| `test/fixtures/esperado-corregido.json` | Résultats attendus avec la méthode corrigée |

La référence Python et les exports bruts contiennent des données personnelles. Ils restent donc **hors du dépôt**.

## Publier une version

1. `npm run verificar`
2. Changez la version dans `package.json`, faites le commit (y compris `dist/`), puis `git tag v0.x.y && git push --tags`.
3. Dans chaque produit, pointez la dépendance vers le nouveau tag.

La CI GitHub (`.github/workflows/ci.yml`) échoue si `dist/` n'est pas à jour.

## Références

- Spec : `spec-360-insights.md` §6
- Décisions : `decisions-coeur-360.md`
- ADR 0001 à 0003 et 0007
- Ticket 07
