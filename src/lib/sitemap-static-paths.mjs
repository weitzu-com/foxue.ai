import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const sitemapChunkSize = 40_000;
export const sitemapLibraryPageSize = 60;
export const sitemapLedgerSchema = "https://foxue.ai/schemas/corpus-sitemap-ledger-v0.1";

// Same order as allConcepts: base hubs, then expanded hubs.
export const conceptHubSources = [
  "src/lib/concept-hubs.ts",
  "src/lib/concept-hubs-expanded.ts",
];

export function readCanonicalConceptPaths(root = process.cwd()) {
  const hrefs = [];
  for (const relativePath of conceptHubSources) {
    const source = readFileSync(resolve(root, relativePath), "utf8");
    for (const match of source.matchAll(/^\s+href: "(\/gainian\/[a-z]+)",$/gm)) {
      hrefs.push(match[1]);
    }
  }
  if (hrefs.length < 1) {
    throw new Error("概念 Hub 登记册没有可供 sitemap 使用的 /gainian 路径");
  }
  return hrefs;
}

export const sitemapStaticPaths = [
  "",
  "/wenjing",
  "/jingzang",
  "/xue/xinjing",
  "/gainian",
  ...readCanonicalConceptPaths(),
  "/fugai",
  "/fenmu",
  "/shenjiao",
  "/yuanze",
  "/touming",
];

export const catalogSlugSources = [
  "data/corpus/cbeta/catalog-v4.23.0.json",
  "data/corpus/cbeta/nanchuan-catalog-v1.0.0.json",
  "data/corpus/cbeta/beyond-taisho-sutra-catalog-v1.0.0.json",
  "data/corpus/sat/modern-japanese-catalog-v1.0.0.json",
  "data/corpus/wikisource/kokuyaku-dhp-catalog-v1.0.0.json",
  "data/corpus/wikisource/muller-dhp-catalog-v1.0.0.json",
  "data/corpus/gutenberg/diamond-sutra-gemmell-catalog-v1.0.0.json",
  "data/corpus/gutenberg/lotus-sutra-soothill-catalog-v1.0.0.json",
  "data/corpus/suttacentral/manifest-v0.7.0.json",
  "data/corpus/suttacentral/dn-manifest-v0.8.0.json",
  "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
  "data/corpus/suttacentral/sn-manifest-v1.0.0.json",
  "data/corpus/suttacentral/an-manifest-v1.1.0.json",
  "data/corpus/suttacentral/kn-manifest-v1.2.0.json",
  "data/corpus/suttacentral/indic-manifest-v1.3.0.json",
  "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json",
  "data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json",
  "data/corpus/suttacentral/lzh-manifest-v1.6.0.json",
  "data/corpus/suttacentral/sujato-en-manifest-v1.0.0.json",
  "data/corpus/suttacentral/sujato-en-kn-manifest-v1.0.0.json",
  "data/corpus/derge/manifest-v0.1.0.json",
];
