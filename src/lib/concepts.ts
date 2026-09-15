import { allConcepts, getConceptEntry, type ConceptEntry } from "@/lib/concept-hubs";

export type { ConceptEntry, ConceptSlug } from "@/lib/concept-hubs";

export const emptinessConcept = getConceptEntry("kong");
export const impermanenceConcept = getConceptEntry("wuchang");
export const nonSelfConcept = getConceptEntry("wuwo");
export const nonAbidingConcept = getConceptEntry("wuzhu");
export const observingMindConcept = getConceptEntry("guanxin");
export const dependentOriginationConcept = getConceptEntry("yuanqi");
export const fourNobleTruthsConcept = getConceptEntry("sidi");
export const eightfoldPathConcept = getConceptEntry("bazhengdao");
export const fiveAggregatesConcept = getConceptEntry("wuyun");
export const sufferingConcept = getConceptEntry("ku");

if (!emptinessConcept || !impermanenceConcept || !nonSelfConcept || !nonAbidingConcept || !observingMindConcept || !dependentOriginationConcept || !fourNobleTruthsConcept || !eightfoldPathConcept || !fiveAggregatesConcept || !sufferingConcept) {
  throw new Error("概念 Hub 配置不完整");
}

function containsWord(query: string, word: string) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${escapedWord}($|[^\\p{L}\\p{N}_])`, "u").test(query);
}

export function queryMatchesConcept(rawQuery: string, concept: ConceptEntry) {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return false;

  return concept.aliases.some((alias) => query.includes(alias.toLocaleLowerCase()))
    || concept.wordAliases?.some((alias) => containsWord(query, alias.toLocaleLowerCase()))
    || false;
}

export function conceptForQuery(rawQuery: string): ConceptEntry | undefined {
  if (!rawQuery.trim()) return undefined;

  return allConcepts.find((concept) => queryMatchesConcept(rawQuery, concept));
}
