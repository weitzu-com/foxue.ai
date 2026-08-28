import { locateSatBody, parseSatReadingLines, satChapterPage } from "./sat-tei.mjs";

export function parseSatFolioSlice(xmlSlice, { canonId, page }) {
  if (!page || !/^c\d{2}(?:-\d{2})?$/.test(page)) throw new Error(`${canonId} SAT 版页切片缺少章节号`);
  try {
    return parseSatReadingLines(`<body>${xmlSlice}</body>`, { canonId })
      .filter((segment) => segment.page === page);
  } catch (error) {
    if (error instanceof Error && error.message.includes("没有可读句段")) return [];
    throw error;
  }
}

export { locateSatBody };

export function iterateSatChapterRanges(body) {
  const paragraphs = [...body.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)];
  const ranges = [];
  let current = null;

  const closeCurrent = (end) => {
    if (!current) return;
    current.end = end;
    ranges.push(current);
    current = null;
  };

  for (const paragraph of paragraphs) {
    const start = paragraph.index;
    const end = start + paragraph[0].length;
    const chapterTitle = paragraph[2].match(/<title type="chapter">([\s\S]*?)<\/title>/);
    if (chapterTitle) {
      const page = satChapterPage(chapterTitle[1].replace(/<[^>]+>/g, ""));
      if (current) current.end = start;
      if (current) ranges.push(current);
      current = { page, start, end };
      continue;
    }
    if (!current) {
      current = { page: "c01", start, end };
    } else {
      current.end = end;
    }
  }
  closeCurrent(body.length);
  const merged = [];
  for (const range of ranges.filter((item) => item.end > item.start)) {
    const previous = merged.at(-1);
    if (previous && previous.page === range.page) previous.end = range.end;
    else merged.push({ ...range });
  }
  return merged;
}
