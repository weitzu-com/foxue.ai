const bylinePattern = /(?:譯|译|撰|述|集|注|註|校)$/u;
const chapterHeadingPattern = /(?:卷第[一二三四五六七八九十百千零兩两○◯〇0-9]+|品第?[一二三四五六七八九十百千零兩两○◯〇0-9]+|第[一二三四五六七八九十百千零兩两○◯〇0-9]+品)/u;
const standaloneHeadingPattern = /^(?:序|序品|流通分|正宗分|緣起分|缘起分)$/u;
const bodyPunctuationPattern = /[，。！？；：、]/u;

function isWorkTitle(text, title, alternateTitle) {
  const compact = text.replace(/[\s　]/gu, "");
  const repeatedHalf = repeatedTextHalf(compact);
  const titles = [title, alternateTitle]
    .map((candidate) => candidate?.replace(/[\s　]/gu, ""))
    .filter(Boolean);
  return titles.some((candidate) => (
    compact === candidate ||
    compact === `${candidate}${candidate}` ||
    (repeatedHalf?.includes(candidate) ?? false) ||
    compact.endsWith(`${candidate}序`) ||
    (
      compact.startsWith(candidate) &&
      /^(?:序|卷(?:[上中下]|(?:第)?[一二三四五六七八九十百千零兩两○◯〇0-9]+)?)$/u
        .test(compact.slice(candidate.length))
    )
  ));
}

function repeatedTextHalf(text) {
  const characters = [...text];
  if (characters.length < 4 || characters.length % 2 !== 0) return undefined;
  const midpoint = characters.length / 2;
  const first = characters.slice(0, midpoint).join("");
  return first === characters.slice(midpoint).join("") ? first : undefined;
}

export function inferReadingSegmentRoles({ segments, title, alternateTitle }) {
  const roles = {};

  for (const [index, segment] of segments.entries()) {
    const text = segment.text.trim();
    const sourceLine = segment.sourceLine;
    if (!sourceLine || !text) continue;
    if (text.startsWith("No.")) {
      roles[sourceLine] = "registration";
      continue;
    }

    const characterCount = [...text].length;
    const nearFront = index < 12;
    const nearEnd = index >= Math.max(segments.length - 4, 0);
    const workTitle = isWorkTitle(text, title, alternateTitle);
    const hasBodyPunctuation = bodyPunctuationPattern.test(text);

    if (
      characterCount <= 42 &&
      bylinePattern.test(text) &&
      !hasBodyPunctuation &&
      (nearFront || nearEnd)
    ) {
      roles[sourceLine] = "byline";
      continue;
    }

    if (
      characterCount <= 42 &&
      (
        chapterHeadingPattern.test(text) ||
        standaloneHeadingPattern.test(text) ||
        (nearFront && (workTitle || (!hasBodyPunctuation && Boolean(repeatedTextHalf(text)))))
      )
    ) {
      roles[sourceLine] = "heading";
      continue;
    }

    if (nearEnd && characterCount <= 42 && workTitle) roles[sourceLine] = "colophon";
  }

  for (const [index, segment] of segments.entries()) {
    const sourceLine = segment.sourceLine;
    if (!sourceLine || roles[sourceLine] !== "colophon") continue;
    const followedByByline = segments.slice(index + 1).some((candidate) => (
      candidate.sourceLine && roles[candidate.sourceLine] === "byline"
    ));
    if (followedByByline) roles[sourceLine] = "heading";
  }

  return roles;
}

export function inferBilaraSegmentRoles({ segments }) {
  return Object.fromEntries(segments.flatMap((segment) => {
    const sourceLine = segment.sourceLine;
    const text = segment.text.trim();
    if (!sourceLine || !text) return [];
    const structuralLine = /(?:^0\.[12]$|\.0$)/u.test(sourceLine);
    const numberedHeading = [...text].length <= 80 && /^\d+(?:\.\d+)*\.\s+\S/u.test(text);
    return structuralLine || numberedHeading ? [[sourceLine, "heading"]] : [];
  }));
}

export function buildDefaultReadingEdition({
  title,
  alternateTitle,
  translator,
  language,
  folioLabel,
  segments,
  hasNext,
  readerMode,
}) {
  const bilara = readerMode === "bilara-chapter" || readerMode === "bilara-sutta";
  const chinese = language === "汉文" || language === "漢文" || language?.startsWith("古汉语");
  const derge = readerMode === "derge-folio";
  const sat = readerMode === "sat-folio";
  const kokuyaku = readerMode === "kokuyaku-folio";
  const englishTranslation = readerMode === "english-translation-folio";

  if (chinese && !sat && !derge) {
    const segmentRoles = bilara
      ? inferBilaraSegmentRoles({ segments })
      : inferReadingSegmentRoles({ segments, title, alternateTitle });
    const textOverrides = bilara ? {} : Object.fromEntries(segments.flatMap((segment) => {
      const sourceLine = segment.sourceLine;
      const repeatedHalf = repeatedTextHalf(segment.text.trim());
      return sourceLine && repeatedHalf && segmentRoles[sourceLine] === "heading"
        ? [[sourceLine, repeatedHalf]]
        : [];
    }));
    const containsPreface = segments.some((segment) => (
      /(?:序|序品)/u.test(segment.text) &&
      [...segment.text].length <= 42
    ));

    return {
      annotationMode: "pinyin",
      sourceKind: bilara ? "bilara" : "cbeta",
      contentLanguage: "zh-Hant",
      workLabel: alternateTitle,
      editionLabel: "注音阅读",
      documentKind: containsPreface ? "序文与题记" : bilara ? "古汉译 · 稳定分页" : "经文原文",
      documentTitle: title,
      responsibility: translator,
      description: bilara
        ? `当前为 ${folioLabel} 阅读页。拼音逐字置于古汉译原文上方，并保留 Bilara 稳定段落标识。`
        : `当前为 ${folioLabel} 版页。拼音逐字置于原文上方，并保留稳定行号供引用核对。`,
      closingMark: hasNext ? "下页续读" : "全经读毕",
      segmentRoles,
      ...(Object.keys(textOverrides).length > 0 ? { textOverrides } : {}),
    };
  }

  const sourceKind = derge ? "derge" : sat ? "sat" : kokuyaku || englishTranslation ? "wikisource" : "bilara";
  const contentLanguage = derge
    ? "bo-Tibt"
    : sat || kokuyaku
      ? "ja"
      : englishTranslation
        ? "en"
      : language?.startsWith("梵")
        ? "sa-Latn"
        : language?.includes("俗语")
          ? "pra-Latn"
          : "pi";
  const languageLabel = derge
    ? "藏文原典"
    : sat
      ? "现代日译"
      : kokuyaku
        ? "文语国译"
      : englishTranslation
        ? "公版英译"
      : language?.startsWith("梵")
        ? "梵文原典"
        : language?.includes("俗语")
          ? "俗语原典"
          : "巴利原典";
  const pageKind = derge ? "德格版页" : sat ? "日译章节" : kokuyaku ? "国译品次" : englishTranslation ? "英译品次" : "稳定分页";

  return {
    annotationMode: "plain",
    sourceKind,
    contentLanguage,
    workLabel: title,
    editionLabel: languageLabel,
    documentKind: `${languageLabel} · ${pageKind}`,
    documentTitle: alternateTitle,
    responsibility: translator,
    description: derge
      ? `当前为德格木刻版 ${folioLabel}。藏文 NFD 原样保留，并提供可引用的稳定行号。`
      : sat
        ? `当前为 ${folioLabel} 章节。现代日译原文与 SAT 来源署名保持不变。`
        : kokuyaku
          ? `当前为 ${folioLabel} 品次。1918 年文语国译与 Wikisource 来源署名保持不变。`
        : englishTranslation
          ? `当前为 ${folioLabel} 品次。1881 年公版英译、译者责任与 Wikisource 来源署名保持不变。`
        : `当前为 ${folioLabel} 阅读页。保留原文、原生次序与 Bilara 稳定段落标识，不加入未经审核的机器译文。`,
    closingMark: hasNext ? "下页续读" : "全经读毕",
    segmentRoles: bilara ? inferBilaraSegmentRoles({ segments }) : {},
  };
}
