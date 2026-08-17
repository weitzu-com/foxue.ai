const EMPTYNESS_ALIASES = [
  "空",
  "空性",
  "空相",
  "五蕴皆空",
  "五蘊皆空",
  "śūnya",
  "śūnyatā",
  "sunyata",
  "suñña",
  "suññatā",
  "sunnata",
];

export type ConceptEntry = {
  slug: "kong";
  title: "空";
  href: "/gainian/kong";
  summary: string;
};

export const emptinessConcept: ConceptEntry = {
  slug: "kong",
  title: "空",
  href: "/gainian/kong",
  summary: "区分巴利经藏与汉译般若的术语语境，并从每项判断回到稳定原典。",
};

export function conceptForQuery(rawQuery: string): ConceptEntry | undefined {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return undefined;

  return EMPTYNESS_ALIASES.some((alias) => query.includes(alias.toLocaleLowerCase()))
    ? emptinessConcept
    : undefined;
}
