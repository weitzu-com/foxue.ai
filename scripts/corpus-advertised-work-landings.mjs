// Advertised Chinese 佛说 work URLs that should ship query-matching 原文.
// Derived from the #67 folio prerender set (16 paths, cap 32), plus 法句经
// which is a head-query landing named in the live GSC gap but not prerendered.
// Pali / Derge advertised folios are out of this cut.

import { corpusAdvertisedFolioPaths } from "./corpus-advertised-folios.mjs";

const paliOrDerge = /^(?:dhammapada-pali|derge-kangyur-)/;

export const workLandingSchema = "https://foxue.ai/schemas/work-landing-text-v0.1";

const advertisedChineseFoshuoSlugs = [...new Set(
  corpusAdvertisedFolioPaths
    .map((path) => path.split("/")[2])
    .filter((slug) => slug && !paliOrDerge.test(slug)),
)];

// Short complete 佛说: full reading text. Long multi-juan: first juan only.
export const workLandingPolicies = {
  xinjing: "full",
  jingangjing: "full",
  fajujing: "full",
  weimojiejing: "full",
  "daboruo-jing": "opening",
  changahanjing: "opening",
  zaahanjing: "opening",
  zengyiahanjing: "opening",
  "dasheng-ru-lengqiejing": "opening",
};

for (const slug of advertisedChineseFoshuoSlugs) {
  if (!workLandingPolicies[slug]) {
    throw new Error(`#67 汉文佛说 ${slug} 缺少经目原文策略`);
  }
}

if (workLandingPolicies.fajujing !== "full") {
  throw new Error("法句经是 head-query 着陆页，必须收录全文");
}

export const workLandingSlugs = Object.keys(workLandingPolicies).sort();

export const workLandingRequiredPhrases = {
  xinjing: ["觀自在菩薩", "色不異空"],
  jingangjing: ["如是我聞"],
  fajujing: ["諸惡莫作", "心為法本"],
  weimojiejing: ["如是我聞"],
  "daboruo-jing": ["如是我聞"],
  changahanjing: ["如是我聞"],
  zaahanjing: ["如是我聞"],
  zengyiahanjing: ["聞如是"],
  "dasheng-ru-lengqiejing": ["如是我聞"],
};

export function workLandingScopeLabel(mode) {
  return mode === "full" ? "全文" : "开卷第一卷";
}
