const RANGE_FILE = /^dhp(\d+)-(\d+)_root-pli-ms\.json$/;
const SEGMENT_ID = /^dhp(\d+):(\d+(?:\.\d+)?)$/;
const SINGLE_SUTTA_FILE = /^((?:dn|mn)\d+)_root-pli-ms\.json$/;

export function parseBilaraDhammapadaSources(sources) {
  const segments = [];
  const navigation = [];
  const stableIds = new Set();
  let expectedStart = 1;

  for (const [index, source] of sources.entries()) {
    const filename = source.filename ?? source.localPath?.split("/").at(-1);
    const range = filename?.match(RANGE_FILE);
    if (!range) throw new Error(`无法识别 Bilara 法句经分片：${filename}`);
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (start !== expectedStart || end < start) {
      throw new Error(`${filename} 偈号范围不连续`);
    }

    const value = JSON.parse(source.text);
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new Error(`${filename} 不是 Bilara 键值对象`);
    }
    const entries = Object.entries(value);
    if (entries.length === 0) throw new Error(`${filename} 没有段落`);
    const chapterTitle = value[`dhp${start}:0.3`]?.trim();
    if (!chapterTitle) throw new Error(`${filename} 缺少品名段落`);
    const seenVerses = new Set();
    const juan = String(index + 1).padStart(3, "0");
    const readingRanges = start === 383 && end === 423
      ? [[383, 409], [410, 423]]
      : [[start, end]];

    for (const [id, rawText] of entries) {
      const match = id.match(SEGMENT_ID);
      if (!match) throw new Error(`${filename} 含无效原生段落标识 ${id}`);
      const verse = Number(match[1]);
      if (verse < start || verse > end) throw new Error(`${id} 超出来源分片范围`);
      if (stableIds.has(id)) throw new Error(`Bilara 稳定段落标识重复：${id}`);
      if (typeof rawText !== "string" || rawText.trim().length === 0) {
        throw new Error(`${id} 缺少文本`);
      }
      stableIds.add(id);
      seenVerses.add(verse);
      const readingRange = readingRanges.find(([pageStart, pageEnd]) =>
        verse >= pageStart && verse <= pageEnd);
      if (!readingRange) throw new Error(`${id} 缺少阅读页范围`);
      segments.push({
        id,
        text: rawText.trim(),
        juan,
        page: `dhp${readingRange[0]}-${readingRange[1]}`,
        sourceLine: match[2],
      });
    }

    for (let verse = start; verse <= end; verse += 1) {
      if (!seenVerses.has(verse)) throw new Error(`${filename} 缺少第 ${verse} 偈`);
    }
    for (const [pageStart, pageEnd] of readingRanges) {
      const page = `dhp${pageStart}-${pageEnd}`;
      const first = segments.find((segment) => segment.juan === juan && segment.page === page);
      if (!first) throw new Error(`${filename} 的阅读页 ${page} 没有段落`);
      navigation.push({
        key: `${juan}-${page}`,
        id: first.id,
        label: `${chapterTitle} · DHP ${pageStart}–${pageEnd}`,
        juan,
        sourcePage: page,
      });
    }
    expectedStart = end + 1;
  }

  if (expectedStart !== 424 || sources.length !== 26 || navigation.length !== 27) {
    throw new Error("巴利《法句经》必须完整覆盖 26 品、第 1–423 偈");
  }
  return { segments, navigation };
}

export function parseBilaraSuttaSource(source, options = {}) {
  const filename = source.filename ?? source.localPath?.split("/").at(-1);
  const fileMatch = filename?.match(SINGLE_SUTTA_FILE);
  if (!fileMatch) throw new Error(`无法识别 Bilara 单经文件：${filename}`);
  const suttaId = fileMatch[1];
  const value = JSON.parse(source.text);
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${filename} 不是 Bilara 键值对象`);
  }
  const entries = Object.entries(value);
  if (entries.length === 0) throw new Error(`${filename} 没有段落`);
  const title = value[`${suttaId}:0.2`]?.trim();
  if (!title) throw new Error(`${filename} 缺少经名段落`);
  const maxSegments = options.maxSegments ?? 120;
  if (!Number.isSafeInteger(maxSegments) || maxSegments < 1 || maxSegments > 250) {
    throw new Error("Bilara 阅读单元段落上限无效");
  }

  const stableIds = new Set();
  const parsed = entries.map(([id, rawText], index) => {
    const match = id.match(new RegExp(`^${suttaId}:(\\d+(?:[.-]\\d+)*)$`));
    if (!match) throw new Error(`${filename} 含无效原生段落标识 ${id}`);
    if (stableIds.has(id)) throw new Error(`Bilara 稳定段落标识重复：${id}`);
    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      throw new Error(`${id} 缺少文本`);
    }
    stableIds.add(id);
    return { id, text: rawText.trim(), sourceLine: match[1], ordinal: index + 1 };
  });

  const segments = [];
  const navigation = [];
  const totalUnits = Math.ceil(parsed.length / maxSegments);
  for (let offset = 0; offset < parsed.length; offset += maxSegments) {
    const unit = parsed.slice(offset, offset + maxSegments);
    const position = Math.floor(offset / maxSegments) + 1;
    const juan = String(position).padStart(3, "0");
    const firstOrdinal = String(unit[0].ordinal).padStart(4, "0");
    const lastOrdinal = String(unit.at(-1).ordinal).padStart(4, "0");
    const page = `${suttaId}-${firstOrdinal}-${lastOrdinal}`;
    for (const segment of unit) {
      segments.push({
        id: segment.id,
        text: segment.text,
        juan,
        page,
        sourceLine: segment.sourceLine,
      });
    }
    navigation.push({
      key: `${juan}-${page}`,
      id: unit[0].id,
      label: `${title} · ${position}/${totalUnits}`,
      juan,
      sourcePage: page,
    });
  }

  return { segments, navigation, title };
}
