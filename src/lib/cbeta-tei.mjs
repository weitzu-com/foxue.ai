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

export function parseCbetaReadingLines(xml, { canonId, juan = "001" }) {
  const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) throw new Error(`${canonId} 缺少 TEI body`);

  const body = removeElements(
    bodyMatch[1].replace(/<!--[\s\S]*?-->/g, ""),
    ["note", "rdg"],
  );

  const markerPattern = /<(?:milestone|lb)\b[^>]*\/>/g;
  const segments = [];
  const seen = new Set();
  let currentJuan = String(juan).padStart(3, "0");
  let activeLine = null;
  let contentStart = 0;

  const appendLine = (contentEnd) => {
    if (!activeLine) return;
    const content = decodeXml(body.slice(contentStart, contentEnd))
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
  while ((match = markerPattern.exec(body)) !== null) {
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
  appendLine(body.length);

  if (segments.length === 0) throw new Error(`${canonId} 没有可读行段`);
  return segments;
}

export function buildPageNavigation(segments) {
  const pages = new Map();
  for (const segment of segments) {
    const key = `${segment.juan}:${segment.page}`;
    if (!pages.has(key)) {
      pages.set(key, { id: segment.id, label: segment.page, juan: segment.juan });
    }
  }
  return [...pages.values()];
}
