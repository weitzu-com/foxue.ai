export const FOLIO_CITATION_FORMAT = "foxue.ai/folio-citation/v1" as const;

export type FolioCitationInput = {
  workTitle: string;
  responsibility: string;
  canonRef: string;
  passageLabel: string;
  quote: string;
  quoteLang: string;
  locator: string;
  permalink: string;
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  accessedOn: string;
};

export type FolioCitationRecord = {
  format: typeof FOLIO_CITATION_FORMAT;
  work: {
    title: string;
    responsibility: string;
    canonRef: string;
  };
  passage: {
    label: string;
    quote: string;
    language: string;
    stableLocator: string;
  };
  source: {
    name: string;
    url: string;
    license: string;
  };
  permalink: string;
  accessedOn: string;
};

export function buildFolioCitationRecord(input: FolioCitationInput): FolioCitationRecord {
  return {
    format: FOLIO_CITATION_FORMAT,
    work: {
      title: input.workTitle,
      responsibility: input.responsibility,
      canonRef: input.canonRef,
    },
    passage: {
      label: input.passageLabel,
      quote: input.quote,
      language: input.quoteLang,
      stableLocator: input.locator,
    },
    source: {
      name: input.sourceName,
      url: input.sourceUrl,
      license: input.sourceLicense,
    },
    permalink: input.permalink,
    accessedOn: input.accessedOn,
  };
}

export function formatFolioBibliographicCitation(record: FolioCitationRecord) {
  return [
    record.passage.quote,
    "",
    [
      record.work.title,
      record.work.responsibility,
      `〈${record.passage.label}〉`,
      record.work.canonRef,
      `稳定坐标 ${record.passage.stableLocator}`,
      record.source.name,
      `${record.accessedOn} 访问`,
      record.permalink,
    ].filter(Boolean).join("，") + "。",
  ].join("\n");
}

export function formatFolioCitationMarkdown(record: FolioCitationRecord) {
  const quote = record.passage.quote
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

  return [
    quote,
    "",
    `— ${record.work.title}，${record.work.responsibility}，〈${record.passage.label}〉`,
    "",
    `- 目录/经号：${record.work.canonRef}`,
    `- 稳定坐标：\`${record.passage.stableLocator}\``,
    `- 永久链接：[在 foxue.ai 核对原典](${record.permalink})`,
    `- 母版：[${record.source.name}](${record.source.url})`,
    `- 权利说明：${record.source.license}`,
    `- 访问日期：${record.accessedOn}`,
  ].join("\n");
}

export function serializeFolioCitationJson(record: FolioCitationRecord) {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function folioCitationFilename({
  slug,
  folioKey,
  locator,
  accessedOn,
}: {
  slug: string;
  folioKey: string;
  locator: string;
  accessedOn: string;
}) {
  const safeLocator = locator.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `foxue-ai-citation-${slug}-${folioKey}-${safeLocator || "passage"}-${accessedOn}.json`;
}
