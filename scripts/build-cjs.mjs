// Genera dist/index.cjs para el backend Express (CommonJS: require('coeur-360')).
import { build } from "esbuild";
await build({ entryPoints: ["src/index.ts"], bundle: true, platform: "node", format: "cjs", outfile: "dist/index.cjs", target: "node18" });
