import { parseDergeSources } from "./derge-reading.mjs";

const pageMarkerPattern = /^\[(\d+x?[ab])(?:\.(\d+))?\]/;
const dergeMarkerPattern = /\{D\d+(?:[a-z]|-\d+)?\}/g;

function normalizedPage(sourcePage) {
  const match = sourcePage.match(/^(\d+)(x?[ab])$/);
  if (!match) throw new Error(`无法解析德格版页：${sourcePage}`);
  return `${match[1].padStart(4, "0")}${match[2]}`;
}

function volumeFromSource(source) {
  const value = source.volume ?? source.filename?.match(/^(\d{3})/)?.[1];
  if (!value || !/^\d{3}$/.test(value)) {
    throw new Error(`德格来源缺少三位卷号：${source.filename ?? "unknown"}`);
  }
  return value;
}

export function iterateDergeFolioRanges(source) {
  const volume = volumeFromSource(source);
  const text = source.text.replace(/^\uFEFF/, "");
  const bomBytes = source.text.startsWith("\uFEFF") ? Buffer.byteLength("\uFEFF") : 0;
  let currentPage = source.initialPage;
  let currentLine = source.initialLine;
  let cursor = 0;
  let byteAt = bomBytes;
  const ranges = [];
  let active = null;

  const closeActive = (end) => {
    if (!active || end <= active.start) return;
    ranges.push({ ...active, end });
  };

  while (cursor < text.length) {
    const nextBreak = text.indexOf("\n", cursor);
    const lineEnd = nextBreak < 0 ? text.length : nextBreak;
    const rawLine = text.slice(cursor, lineEnd);
    let sourceLine = rawLine;
    const pageMarker = sourceLine.match(pageMarkerPattern);
    if (pageMarker) {
      currentPage = pageMarker[1];
      currentLine = pageMarker[2];
      sourceLine = sourceLine.slice(pageMarker[0].length);
    }
    const content = sourceLine.replace(dergeMarkerPattern, "").trim();
    if (content) {
      if (!currentPage || !currentLine) {
        throw new Error(`德格卷 ${volume} 正文缺少可继承的版页行号`);
      }
      const page = normalizedPage(currentPage);
      const key = `${volume}-${page}`;
      if (!active || active.key !== key) {
        closeActive(byteAt);
        active = {
          key,
          juan: volume,
          page,
          sourcePage: currentPage,
          start: byteAt,
        };
      }
    }
    if (nextBreak < 0) {
      byteAt += Buffer.byteLength(text.slice(cursor));
      cursor = text.length;
    } else {
      byteAt += Buffer.byteLength(text.slice(cursor, nextBreak + 1));
      cursor = nextBreak + 1;
    }
  }
  closeActive(byteAt);
  return ranges;
}

export function parseDergeFolioSlice(source, { canonId, juan, sourcePage }) {
  return parseDergeSources([
    {
      ...source,
      initialPage: sourcePage ?? source.initialPage,
      initialLine: source.initialLine ?? "1",
      text: source.text,
    },
  ], { canonId }).segments.filter((segment) => segment.juan === juan);
}
