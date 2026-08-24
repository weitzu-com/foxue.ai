import { parseCbetaReadingLines } from "./cbeta-tei.mjs";

export function parseCbetaFolioSlice(xmlSlice, { canonId, juan }) {
  if (!juan || !/^\d{3}$/.test(juan)) throw new Error(`${canonId} 版页切片缺少卷号`);
  try {
    return parseCbetaReadingLines(`<body>${xmlSlice}</body>`, { canonId, juan });
  } catch (error) {
    if (error instanceof Error && error.message.includes("没有可读行段")) return [];
    throw error;
  }
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
