import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".vercel/**",
    "artifacts/**",
    "data/corpus/**/*.xml",
    "infra/corpus-edge/worker-configuration.d.ts",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
