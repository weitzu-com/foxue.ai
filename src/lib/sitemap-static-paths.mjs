export const sitemapChunkSize = 40_000;
export const sitemapLibraryPageSize = 60;
export const sitemapLedgerSchema = "https://foxue.ai/schemas/corpus-sitemap-ledger-v0.1";

// Keep this list identical to the static prefix previously built in sitemap-data.ts.
// Concept href order matches allConcepts: base hubs, then expanded hubs.
export const sitemapStaticPaths = [
  "",
  "/wenjing",
  "/jingzang",
  "/xue/xinjing",
  "/gainian",
  "/gainian/kong",
  "/gainian/wuzhu",
  "/gainian/guanxin",
  "/gainian/wuchang",
  "/gainian/wuwo",
  "/fugai",
  "/fenmu",
  "/shenjiao",
  "/yuanze",
  "/touming",
];

export const catalogSlugSources = [
  "data/corpus/cbeta/catalog-v4.23.0.json",
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
  "data/corpus/derge/manifest-v0.1.0.json",
];
