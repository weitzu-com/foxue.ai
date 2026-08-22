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
    "src/data/corpus-folio-index.generated.json",
    "src/data/corpus-sitemap-ledger.generated.json",
    "src/data/corpus-sitemap-chunks/**",
    "src/lib/sitemap-chunk-loaders.generated.ts",
    "infra/corpus-edge/worker-configuration.d.ts",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
