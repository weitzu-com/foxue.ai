export type ConceptSelectionRules = {
  aliases: readonly string[];
  scopedAliases?: ReadonlyArray<{
    sourceHrefPrefix: string;
    aliases: readonly string[];
  }>;
  sourceHrefs?: readonly string[];
};

function normalizeSelectionText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/gu, "");
}

export function selectionMatchesConcept(
  text: string,
  sourceHref: string,
  rules: ConceptSelectionRules,
) {
  const normalizedText = normalizeSelectionText(text);
  const includesAlias = (alias: string) => normalizedText.includes(normalizeSelectionText(alias));

  return rules.aliases.some(includesAlias)
    || rules.scopedAliases?.some((scope) =>
      sourceHref.startsWith(scope.sourceHrefPrefix)
      && scope.aliases.some(includesAlias),
    )
    || rules.sourceHrefs?.includes(sourceHref)
    || false;
}
