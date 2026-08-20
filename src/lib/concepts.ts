import { allConcepts, getConceptEntry, type ConceptEntry, type ConceptSlug } from "@/lib/concept-hubs";

export type { ConceptEntry, ConceptSlug } from "@/lib/concept-hubs";

export const emptinessConcept = getConceptEntry("kong");
export const impermanenceConcept = getConceptEntry("wuchang");
export const nonSelfConcept = getConceptEntry("wuwo");
export const nonAbidingConcept = getConceptEntry("wuzhu");
export const observingMindConcept = getConceptEntry("guanxin");

if (!emptinessConcept || !impermanenceConcept || !nonSelfConcept || !nonAbidingConcept || !observingMindConcept) {
  throw new Error("概念 Hub 配置不完整");
}

export function conceptForQuery(rawQuery: string): ConceptEntry | undefined {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return undefined;

  return allConcepts.find((concept) =>
    concept.aliases.some((alias) => query.includes(alias.toLocaleLowerCase())),
  );
}
