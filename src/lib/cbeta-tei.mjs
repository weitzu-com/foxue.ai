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
  ).replace(/<lb\b[^>]*\/>/g, (tag) => {
    const line = tag.match(/\bn="([^"]+)"/)?.[1];
    if (!line) throw new Error(`${canonId} 存在没有 n 属性的 lb`);
    return `\nFOXUE_LINE_${line}\n`;
  });

  const chunks = body.split(/\nFOXUE_LINE_([^\n]+)\n/);
  const segments = [];
  const seen = new Set();
  for (let index = 1; index < chunks.length; index += 2) {
    const sourceLine = chunks[index];
    const content = decodeXml(chunks[index + 1] ?? "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "")
      .trim();
    if (!content) continue;

    const id = `${canonId}.${juan}.${sourceLine}`;
    if (seen.has(id)) throw new Error(`${canonId} 出现重复行号 ${sourceLine}`);
    seen.add(id);
    segments.push({
      id,
      sourceLine,
      page: sourceLine.slice(0, 5),
      text: content,
    });
  }

  if (segments.length === 0) throw new Error(`${canonId} 没有可读行段`);
  return segments;
}

export function buildPageNavigation(segments) {
  const pages = new Map();
  for (const segment of segments) {
    if (!pages.has(segment.page)) {
      pages.set(segment.page, { id: segment.id, label: segment.page });
    }
  }
  return [...pages.values()];
}
