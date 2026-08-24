const RANGE_FILE = /^dhp(\d+)-(\d+)_root-pli-ms\.json$/;
const SEGMENT_ID = /^dhp(\d+):(\d+(?:\.\d+)?)$/;
const SINGLE_SUTTA_FILE = /^((?:dn|mn)\d+)_root-pli-ms\.json$/;
const GROUPED_NIKAYA_FILE = /^(sn|an)(\d+)\.(\d+)(?:-(\d+))?_root-pli-ms\.json$/;
const GROUPED_NIKAYA_TITLES = {
  sn: "Saṁyutta Nikāya",
  an: "Aṅguttara Nikāya",
};
const SERIES_FILE = /^([a-z][a-z0-9.-]*)_root-(?:pli-ms|san|pra-pts|lzh-sct)\.json$/;
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function renderEditorialMarkup(text, filename) {
  if (filename.endsWith("_root-pli-ms.json")) return text.trim();
  const rendered = text
    .replace(/<reference>.*?<\/reference>\s*<root>(.*?)<\/root>/gs, "$1")
    .replace(/<supplied>(.*?)<\/supplied>/gs, "[$1]")
    .replace(/<unclear>(.*?)<\/unclear>/gs, "⟨$1?⟩")
    .replace(/<i\b[^>]*>(.*?)<\/i>/gs, "$1")
    .trim();
  if (/<\/?[a-z][^>]*>/i.test(rendered)) {
    throw new Error(`${filename} 含未处理的编辑标记`);
  }
  return rendered;
}

export function parseBilaraDhammapadaSources(sources, options = {}) {
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
    if ((start !== expectedStart && !options.allowPartial) || end < start) {
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

  if (!options.allowPartial && (expectedStart !== 424 || sources.length !== 26 || navigation.length !== 27)) {
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

export function parseBilaraCollectionSources(sources, options = {}) {
  const maxSegments = options.maxSegments ?? 120;
  if (!Number.isSafeInteger(maxSegments) || maxSegments < 1 || maxSegments > 250) {
    throw new Error("Bilara 阅读单元段落上限无效");
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("Bilara 经集来源文件不能为空");
  }

  const segments = [];
  const navigation = [];
  const stableIds = new Set();
  const omittedEmptySegmentIds = [];
  let groupNumber;
  let collectionPrefix;
  let expectedStart = 1;
  let representedSuttas = 0;
  let readingPosition = 0;

  for (const source of sources) {
    const filename = source.filename ?? source.localPath?.split("/").at(-1);
    const fileMatch = filename?.match(GROUPED_NIKAYA_FILE);
    if (!fileMatch) throw new Error(`无法识别 Bilara 经集来源文件：${filename}`);
    const currentPrefix = fileMatch[1];
    const currentGroup = Number(fileMatch[2]);
    const start = Number(fileMatch[3]);
    const end = Number(fileMatch[4] ?? fileMatch[3]);
    if (collectionPrefix === undefined) collectionPrefix = currentPrefix;
    if (groupNumber === undefined) groupNumber = currentGroup;
    if (
      currentPrefix !== collectionPrefix || currentGroup !== groupNumber ||
      (start !== expectedStart && !options.allowPartial) || end < start
    ) {
      throw new Error(`${filename} 的经集、分组或经号范围不连续`);
    }
    expectedStart = end + 1;
    representedSuttas += end - start + 1;

    const value = JSON.parse(source.text);
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new Error(`${filename} 不是 Bilara 键值对象`);
    }
    const entries = Object.entries(value);
    if (entries.length === 0) throw new Error(`${filename} 没有段落`);
    const division = entries.find(([id]) => id.endsWith(":0.2"))?.[1]?.trim();
    const titleCandidate = entries.find(([id]) => id.endsWith(":0.3"))?.[1]?.trim();
    const title = titleCandidate && titleCandidate !== "~" ? titleCandidate : division;
    if (!title || !division) throw new Error(`${filename} 缺少经名或品名段落`);

    const parsed = [];
    for (const [id, rawText] of entries) {
      const match = id.match(/^(sn|an)(\d+)\.(\d+(?:-\d+)?):(\d+(?:[.-]\d+)*)$/);
      if (!match || match[1] !== collectionPrefix || Number(match[2]) !== groupNumber) {
        throw new Error(`${filename} 含无效原生段落标识 ${id}`);
      }
      const [representedStart, representedEnd = representedStart] = match[3]
        .split("-")
        .map(Number);
      if (
        !Number.isSafeInteger(representedStart) ||
        !Number.isSafeInteger(representedEnd) ||
        representedStart < start || representedEnd > end || representedEnd < representedStart
      ) {
        throw new Error(`${id} 超出 ${filename} 的经号范围`);
      }
      if (stableIds.has(id)) throw new Error(`Bilara 稳定段落标识重复：${id}`);
      if (typeof rawText !== "string") throw new Error(`${id} 文本类型无效`);
      stableIds.add(id);
      if (!rawText.trim()) {
        omittedEmptySegmentIds.push(id);
        continue;
      }
      parsed.push({
        id,
        text: rawText.trim(),
        sourceLine: match[4],
        ordinal: parsed.length + 1,
      });
    }
    if (parsed.length === 0) throw new Error(`${filename} 没有可读段落`);

    const recordId = `${collectionPrefix}${groupNumber}.${start}${end === start ? "" : `-${end}`}`;
    const pageStem = recordId.replaceAll(".", "-");
    const recordUnits = Math.ceil(parsed.length / maxSegments);
    for (let offset = 0; offset < parsed.length; offset += maxSegments) {
      const unit = parsed.slice(offset, offset + maxSegments);
      readingPosition += 1;
      const juan = String(readingPosition).padStart(3, "0");
      const firstOrdinal = String(unit[0].ordinal).padStart(4, "0");
      const lastOrdinal = String(unit.at(-1).ordinal).padStart(4, "0");
      const page = `${pageStem}-${firstOrdinal}-${lastOrdinal}`;
      for (const segment of unit) {
        segments.push({
          id: segment.id,
          text: segment.text,
          juan,
          page,
          sourceLine: segment.sourceLine,
        });
      }
      const unitPosition = Math.floor(offset / maxSegments) + 1;
      navigation.push({
        key: `${juan}-${page}`,
        id: unit[0].id,
        label: `${recordId.toUpperCase()} · ${title}${recordUnits > 1 ? ` · ${unitPosition}/${recordUnits}` : ""}`,
        juan,
        sourcePage: page,
      });
    }
  }

  return {
    segments,
    navigation,
    title: `${GROUPED_NIKAYA_TITLES[collectionPrefix]} ${groupNumber}`,
    collectionPrefix,
    representedSuttas,
    omittedEmptySegmentIds,
  };
}

export function parseBilaraSamyuttaSources(sources, options = {}) {
  const reading = parseBilaraCollectionSources(sources, options);
  if (reading.collectionPrefix !== "sn") throw new Error("来源不是巴利《相应部》");
  return reading;
}

export function parseBilaraAnguttaraSources(sources, options = {}) {
  const reading = parseBilaraCollectionSources(sources, options);
  if (reading.collectionPrefix !== "an") throw new Error("来源不是巴利《增支部》");
  return reading;
}

export function parseBilaraSeriesSources(sources, options = {}) {
  const maxSegments = options.maxSegments ?? 120;
  if (!Number.isSafeInteger(maxSegments) || maxSegments < 1 || maxSegments > 250) {
    throw new Error("Bilara 阅读单元段落上限无效");
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("Bilara 多文件文本来源不能为空");
  }
  const configuredPrefix = options.collectionPrefix;
  if (configuredPrefix !== undefined && !/^[a-z]+(?:-[a-z]+)*$/.test(configuredPrefix)) {
    throw new Error("Bilara 多文件文本集合前缀无效");
  }
  const configuredTitleSuffixes = options.titleSuffixes;
  if (
    configuredTitleSuffixes !== undefined &&
    (!Array.isArray(configuredTitleSuffixes) || configuredTitleSuffixes.length === 0 ||
      new Set(configuredTitleSuffixes).size !== configuredTitleSuffixes.length ||
      !configuredTitleSuffixes.every((suffix) => /^0\.\d+$/.test(suffix)))
  ) {
    throw new Error("Bilara 多文件文本标题层级无效");
  }
  const omitEmptySegments = options.omitEmptySegments === true;

  const segments = [];
  const navigation = [];
  const stableIds = new Set();
  const sourceIds = new Set();
  const omittedEmptySegmentIds = [];
  let collectionPrefix = configuredPrefix;
  let readingPosition = 0;

  for (const source of sources) {
    const filename = source.filename ?? source.localPath?.split("/").at(-1);
    const fileMatch = filename?.match(SERIES_FILE);
    if (!fileMatch) throw new Error(`无法识别 Bilara 多文件文本来源：${filename}`);
    const sourceId = fileMatch[1];
    const prefix = configuredPrefix ?? sourceId.match(/^[a-z]+(?:-[a-z]+)?/)?.[0];
    if (!prefix) throw new Error(`${filename} 缺少文本集合前缀`);
    if (collectionPrefix === undefined) collectionPrefix = prefix;
    if (prefix !== collectionPrefix || !sourceId.startsWith(collectionPrefix)) {
      throw new Error(`${filename} 混入其他文本集合`);
    }
    if (sourceIds.has(sourceId)) throw new Error(`Bilara 来源记录重复：${sourceId}`);
    sourceIds.add(sourceId);

    const value = JSON.parse(source.text);
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new Error(`${filename} 不是 Bilara 键值对象`);
    }
    const entries = Object.entries(value);
    if (entries.length === 0) throw new Error(`${filename} 没有段落`);
    const range = sourceId.match(/^([a-z][a-z0-9.-]*?)(\d+)-(\d+)$/);
    const rangePrefix = range?.[1];
    const rangeStart = range ? Number(range[2]) : null;
    const rangeEnd = range ? Number(range[3]) : null;
    const segmentPattern = /^([a-z][a-z0-9.-]*):(\d+(?:[.-]\d+)*)$/;
    const titleSourceIds = range ? [sourceId, `${rangePrefix}${rangeStart}`] : [sourceId];
    const titleSuffixes = configuredTitleSuffixes ?? (range
      ? ["0.1", "0.2", "0.3", "0.4", "0.0"]
      : ["0.4", "0.3", "0.2", "0.1", "0.0"]);
    const rawTitle = titleSourceIds.flatMap((titleSourceId) => titleSuffixes
      .map((suffix) => value[`${titleSourceId}:${suffix}`]?.trim()))
      .find((candidate) => candidate && candidate !== "~");
    if (!rawTitle) throw new Error(`${filename} 缺少可读标题段落`);
    const title = renderEditorialMarkup(rawTitle, filename);
    if (!title) throw new Error(`${filename} 的标题段落渲染后为空`);

    const parsed = entries.flatMap(([id, rawText], index) => {
      const match = id.match(segmentPattern);
      if (!match) throw new Error(`${filename} 含无效原生段落标识 ${id}`);
      if (range) {
        const represented = match[1].match(new RegExp(`^${escapeRegExp(rangePrefix)}(\\d+)$`));
        if (
          match[1] !== sourceId &&
          (!represented || Number(represented[1]) < rangeStart || Number(represented[1]) > rangeEnd)
        ) {
          throw new Error(`${id} 超出 ${filename} 的文本范围`);
        }
      } else if (match[1] !== sourceId) {
        throw new Error(`${id} 不属于 ${filename}`);
      }
      if (stableIds.has(id)) throw new Error(`Bilara 稳定段落标识重复：${id}`);
      if (typeof rawText !== "string") throw new Error(`${id} 文本类型无效`);
      stableIds.add(id);
      if (!rawText.trim()) {
        if (!omitEmptySegments) throw new Error(`${id} 缺少文本`);
        omittedEmptySegmentIds.push(id);
        return [];
      }
      const text = renderEditorialMarkup(rawText, filename);
      if (!text) {
        omittedEmptySegmentIds.push(id);
        return [];
      }
      return [{
        id,
        text,
        sourceLine: match[2],
        ordinal: index + 1,
      }];
    });

    const recordUnits = Math.ceil(parsed.length / maxSegments);
    const pageStem = sourceId.replaceAll(".", "-");
    for (let offset = 0; offset < parsed.length; offset += maxSegments) {
      const unit = parsed.slice(offset, offset + maxSegments);
      readingPosition += 1;
      const juan = String(readingPosition).padStart(3, "0");
      const firstOrdinal = String(unit[0].ordinal).padStart(4, "0");
      const lastOrdinal = String(unit.at(-1).ordinal).padStart(4, "0");
      const page = `${pageStem}-${firstOrdinal}-${lastOrdinal}`;
      for (const segment of unit) {
        segments.push({
          id: segment.id,
          text: segment.text,
          juan,
          page,
          sourceLine: segment.sourceLine,
        });
      }
      const unitPosition = Math.floor(offset / maxSegments) + 1;
      navigation.push({
        key: `${juan}-${page}`,
        id: unit[0].id,
        label: `${sourceId.toUpperCase()} · ${title}${recordUnits > 1 ? ` · ${unitPosition}/${recordUnits}` : ""}`,
        juan,
        sourcePage: page,
      });
    }
  }

  return {
    segments,
    navigation,
    title: options.collectionTitle ?? collectionPrefix.toUpperCase(),
    collectionPrefix,
    sourceRecords: sourceIds.size,
    omittedEmptySegmentIds,
  };
}
