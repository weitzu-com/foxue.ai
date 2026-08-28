function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripXml(value) {
  return decodeXml(value.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function toAsciiDigits(value) {
  return String(value).replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xFEE0));
}

export function satChapterPage(value) {
  const ascii = toAsciiDigits(value);
  const range = ascii.match(/Chapter\s+(\d+)\s+(?:and|[-–])\s*(\d+)/i);
  if (range) return `c${range[1].padStart(2, "0")}-${range[2].padStart(2, "0")}`;
  const numbered = ascii.match(/第\s*(\d+)\s*章/) ?? ascii.match(/^\s*(\d+)\s*$/) ?? ascii.match(/(\d+)/);
  if (!numbered) return "c01";
  return `c${numbered[1].padStart(2, "0")}`;
}

export function locateSatBody(xml) {
  const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) return null;
  return {
    content: bodyMatch[1],
    contentStart: bodyMatch.index + "<body>".length,
  };
}

export function parseSatReadingLines(xml, { canonId } = {}) {
  const body = locateSatBody(xml);
  if (!body) throw new Error(`${canonId ?? "SAT"} 缺少 TEI body`);

  const paragraphs = [...body.content.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)];
  if (paragraphs.length === 0) throw new Error(`${canonId ?? "SAT"} 正文没有段落`);

  const segments = [];
  const seen = new Set();
  let chapter = "01";
  let sawChapter = false;

  for (const paragraph of paragraphs) {
    const inner = paragraph[2];
    const chapterTitle = inner.match(/<title type="chapter">([\s\S]*?)<\/title>/);
    if (chapterTitle) {
      const label = stripXml(chapterTitle[1]);
      chapter = satChapterPage(label).slice(1);
      sawChapter = true;
      continue;
    }

    const sentences = [...inner.matchAll(/<s\b[^>]*xml:id="([^"]+)"[^>]*>([\s\S]*?)<\/s>/g)];
    if (sentences.length === 0) continue;
    if (!sawChapter) chapter = "01";

    for (const sentence of sentences) {
      const sourceId = sentence[1];
      const text = stripXml(sentence[2]);
      if (!text) continue;
      const id = `${canonId}.001.${sourceId}`;
      if (seen.has(id)) throw new Error(`${canonId} 出现重复 SAT 句号 ${sourceId}`);
      seen.add(id);
      segments.push({
        id,
        juan: "001",
        sourceLine: sourceId,
        page: `c${chapter}`,
        text,
      });
    }
  }

  if (segments.length === 0) throw new Error(`${canonId ?? "SAT"} 没有可读句段`);
  return segments;
}

export function extractSatTranslators(xml) {
  const names = [];
  const seen = new Set();
  for (const match of xml.matchAll(/<respStmt>\s*<persName>([^<]+)<\/persName>\s*<resp>([^<]+)<\/resp>/g)) {
    const name = match[1].replace(/\s+/g, " ").trim();
    const role = match[2].trim();
    if (!/translation/i.test(role) || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

export function extractSatTitle(xml) {
  return stripXml(xml.match(/<titleStmt>\s*<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
}
