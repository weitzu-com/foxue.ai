function removeElements(value, targetNames) {
  const targets = new Set(targetNames);
  const tagPattern = /<(\/)?([\w:.-]+)\b[^>]*>/g;
  let output = "";
  let cursor = 0;
  let suppressedDepth = 0;
  let match;

  while ((match = tagPattern.exec(value)) !== null) {
    const [tag, closing, name] = match;
    const targeted = targets.has(name);
    if (suppressedDepth === 0) output += value.slice(cursor, match.index);

    if (targeted) {
      if (closing) {
        suppressedDepth -= 1;
        if (suppressedDepth < 0) throw new Error(`TEI ${name} 结束标签不匹配`);
      } else if (!tag.endsWith("/>")) {
        suppressedDepth += 1;
      }
    } else if (suppressedDepth === 0) {
      output += tag;
    }
    cursor = tagPattern.lastIndex;
  }

  if (suppressedDepth !== 0) throw new Error("TEI 被剔除元素的开始/结束标签不匹配");
  output += value.slice(cursor);
  return output;
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseCbetaMarkers(markup, { canonId, juan = "001", allowEmpty = false }) {
  const markerPattern = /<(?:milestone|lb)\b[^>]*\/>/g;
  const segments = [];
  const seen = new Set();
  let currentJuan = String(juan).padStart(3, "0");
  let activeLine = null;
  let contentStart = 0;

  const appendLine = (contentEnd) => {
    if (!activeLine) return;
    const content = decodeXml(markup.slice(contentStart, contentEnd))
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "")
      .trim();
    if (!content) return;

    const id = `${canonId}.${activeLine.juan}.${activeLine.sourceLine}`;
    if (seen.has(id)) throw new Error(`${canonId} 出现重复行号 ${activeLine.sourceLine}`);
    seen.add(id);
    segments.push({
      id,
      juan: activeLine.juan,
      sourceLine: activeLine.sourceLine,
      page: activeLine.sourceLine.slice(0, 5),
      text: content,
    });
  };

  let match;
  while ((match = markerPattern.exec(markup)) !== null) {
    appendLine(match.index);
    activeLine = null;

    const tag = match[0];
    if (tag.startsWith("<milestone")) {
      if (tag.match(/\bunit="([^"]+)"/)?.[1] === "juan") {
        const milestoneJuan = tag.match(/\bn="([^"]+)"/)?.[1];
        if (!milestoneJuan) throw new Error(`${canonId} 存在没有 n 属性的卷标记`);
        currentJuan = milestoneJuan.padStart(3, "0");
      }
    } else {
      const sourceLine = tag.match(/\bn="([^"]+)"/)?.[1];
      if (!sourceLine) throw new Error(`${canonId} 存在没有 n 属性的 lb`);
      activeLine = { juan: currentJuan, sourceLine };
    }
    contentStart = markerPattern.lastIndex;
  }
  appendLine(markup.length);

  if (segments.length === 0 && !allowEmpty) throw new Error(`${canonId} 没有可读行段`);
  return segments;
}

function cleanCbetaMarkup(value) {
  return removeElements(value.replace(/<!--[\s\S]*?-->/g, ""), ["note", "rdg"]);
}

export function parseCbetaReadingLines(xml, { canonId, juan = "001" }) {
  const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) throw new Error(`${canonId} 缺少 TEI body`);
  return parseCbetaMarkers(cleanCbetaMarkup(bodyMatch[1]), { canonId, juan });
}

export function parseCbetaFolioSlice(xmlSlice, { canonId, juan }) {
  if (!juan || !/^\d{3}$/.test(juan)) throw new Error(`${canonId} 版页切片缺少卷号`);
  return parseCbetaMarkers(cleanCbetaMarkup(xmlSlice), { canonId, juan, allowEmpty: true });
}

export function locateCbetaBody(xml) {
  const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) return null;
  return {
    content: bodyMatch[1],
    contentStart: bodyMatch.index + "<body>".length,
  };
}

const skippedCbetaElements = new Set(["note", "rdg"]);

export function iterateVisibleCbetaLineMarkers(body, { juan = "001" } = {}) {
  const tagPattern = /<(\/)?([\w:.-]+)\b[^>]*>/g;
  const markers = [];
  let currentJuan = String(juan).padStart(3, "0");
  let suppressedDepth = 0;
  let match;

  while ((match = tagPattern.exec(body)) !== null) {
    const [tag, closing, name] = match;
    if (skippedCbetaElements.has(name)) {
      if (closing) {
        suppressedDepth -= 1;
        if (suppressedDepth < 0) throw new Error(`TEI ${name} 结束标签不匹配`);
      } else if (!tag.endsWith("/>")) {
        suppressedDepth += 1;
      }
      continue;
    }
    if (suppressedDepth > 0 || !tag.endsWith("/>")) continue;

    if (name === "milestone") {
      if (tag.match(/\bunit="([^"]+)"/)?.[1] === "juan") {
        const milestoneJuan = tag.match(/\bn="([^"]+)"/)?.[1];
        if (!milestoneJuan) throw new Error("存在没有 n 属性的卷标记");
        currentJuan = milestoneJuan.padStart(3, "0");
      }
      continue;
    }
    if (name !== "lb") continue;
    const sourceLine = tag.match(/\bn="([^"]+)"/)?.[1];
    if (!sourceLine) throw new Error("存在没有 n 属性的 lb");
    markers.push({
      juan: currentJuan,
      sourceLine,
      page: sourceLine.slice(0, 5),
      index: match.index,
    });
  }

  if (suppressedDepth !== 0) throw new Error("TEI 被剔除元素的开始/结束标签不匹配");
  return markers;
}

export function stringOffsetsToByteOffsets(text, offsets) {
  const unique = [...new Set(offsets)].sort((left, right) => left - right);
  const mapped = new Map();
  let charAt = 0;
  let byteAt = 0;
  for (const target of unique) {
    if (target < charAt) throw new Error("字符串偏移必须单调递增");
    byteAt += Buffer.byteLength(text.slice(charAt, target));
    charAt = target;
    mapped.set(target, byteAt);
  }
  return mapped;
}

export function buildPageNavigation(segments) {
  const pages = new Map();
  for (const segment of segments) {
    const key = `${segment.juan}:${segment.page}`;
    if (!pages.has(key)) {
      pages.set(key, {
        key: `${segment.juan}-${segment.page}`,
        id: segment.id,
        label: segment.page,
        juan: segment.juan,
      });
    }
  }
  return [...pages.values()];
}
