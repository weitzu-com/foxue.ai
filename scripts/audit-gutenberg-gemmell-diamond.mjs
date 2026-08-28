import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const verifyMode = process.argv.includes("--verify");
const ebookUrl = "https://www.gutenberg.org/ebooks/64623";
const plainTextUrl = "https://www.gutenberg.org/cache/epub/64623/pg64623.txt";
const localPath = "data/corpus/gutenberg/diamond-sutra-gemmell-1912.xml";
const batchPath = `data/corpus/gutenberg/diamond-sutra-gemmell-batch-v${version}.json`;
const ledgerPath = `data/gbcr/gutenberg-diamond-gemmell-ingest-v${version}.json`;
const fileId = "GUTENBERG-DIAMOND-GEMMELL-1912";
const slug = "gutenberg-en-diamond-gemmell";
const workId = "gbcr:work:vajracchedika-prajnaparamita";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

function fetchText(url) {
  return execFileSync("curl", [
    "-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "120", url,
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function normalizeParagraph(value) {
  return value
    .replace(/\[(\d+)\]/g, "")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseScripture(plainText) {
  const startMarker = "*** START OF THE PROJECT GUTENBERG EBOOK";
  const endMarker = "*** END OF THE PROJECT GUTENBERG EBOOK";
  const start = plainText.indexOf(startMarker);
  const end = plainText.indexOf(endMarker);
  if (start < 0 || end <= start) throw new Error("Project Gutenberg 正文边界漂移");
  const ebook = plainText.slice(start, end);
  const scriptureStart = ebook.indexOf("THE DIAMOND SUTRA", startMarker.length);
  if (scriptureStart < 0) throw new Error("《金刚经》正文题名缺失");
  const scripture = ebook.slice(scriptureStart);
  const headingPattern = /^\[Chapter (\d+)(?: and (\d+))?\]$/gm;
  const headings = [...scripture.matchAll(headingPattern)].map((match) => ({
    first: Number(match[1]),
    last: Number(match[2] ?? match[1]),
    label: match[2] ? `Chapter ${match[1]} and ${match[2]}` : `Chapter ${match[1]}`,
    start: match.index,
    bodyStart: match.index + match[0].length,
  }));
  if (headings.length !== 31) throw new Error(`应有 31 个来源章标，实际 ${headings.length}`);

  const coveredChapters = headings.flatMap((heading) => (
    [...Array(heading.last - heading.first + 1)].map((_, index) => heading.first + index)
  ));
  if (
    coveredChapters.length !== 32
    || coveredChapters.some((chapter, index) => chapter !== index + 1)
    || headings.filter((heading) => heading.first !== heading.last).length !== 1
    || headings.find((heading) => heading.first !== heading.last)?.label !== "Chapter 3 and 4"
  ) {
    throw new Error("来源章次不是 1–32，或 Chapter 3 and 4 合并边界漂移");
  }

  const readingUnits = headings.map((heading, index) => {
    let body = scripture.slice(heading.bodyStart, headings[index + 1]?.start ?? scripture.length);
    const firstFootnote = body.search(/^\s{2,}\[\d+\]/m);
    if (firstFootnote < 0) throw new Error(`${heading.label} 未找到正文后的首条注释边界`);
    body = body.slice(0, firstFootnote);
    const paragraphs = body
      .trim()
      .split(/\n\s*\n+/)
      .map(normalizeParagraph)
      .filter(Boolean);
    if (!paragraphs.length) throw new Error(`${heading.label} 正文为空`);
    if (paragraphs.some((paragraph) => /\[\d+\]/.test(paragraph))) {
      throw new Error(`${heading.label} 仍含脚注调用标记`);
    }
    return { ...heading, paragraphs };
  });

  const paragraphs = readingUnits.flatMap((unit) => unit.paragraphs);
  if (paragraphs.length !== 95) throw new Error(`正文稳定段应为 95，实际 ${paragraphs.length}`);
  if (!paragraphs[0].startsWith("Thus have I heard concerning our Lord Buddha")) {
    throw new Error("首段锚点漂移");
  }
  if (!paragraphs.at(-1)?.endsWith("they received it and departed.")) {
    throw new Error("末段锚点漂移");
  }
  return { readingUnits, paragraphCount: paragraphs.length, chapterCount: coveredChapters.length };
}

function buildTei({ work, source }) {
  let serial = 1;
  const body = [];
  for (const unit of work.readingUnits) {
    body.push(`<p><title type="chapter">${escapeXml(unit.label)}</title></p>`);
    for (const paragraph of unit.paragraphs) {
      const id = `s${String(serial * 100).padStart(10, "0")}`;
      serial += 1;
      body.push(`<p><s xml:id="${id}">${escapeXml(paragraph)}</s></p>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
<teiHeader>
<fileDesc>
<titleStmt>
<title>The Diamond Sutra (Chin-Kang-Ching) or Prajna-Paramita</title>
<respStmt><persName>William Gemmell</persName><resp>English translation from Kumārajīva's Chinese text</resp></respStmt>
</titleStmt>
<publicationStmt>
<publisher>Kegan Paul, Trench, Trübner &amp; Co., Ltd.</publisher>
<publisher>Project Gutenberg</publisher>
<date when="1912">1912</date>
<availability>
<p xml:id="p-rights-source">Project Gutenberg marks eBook 64623 “Public domain in the USA.”</p>
<p xml:id="p-rights-jurisdiction">Users outside the United States must check the law of their jurisdiction. This record does not make a worldwide public-domain claim.</p>
<p xml:id="p-rights-attribution">Retain attribution to William Gemmell, the 1912 London edition, Project Gutenberg eBook 64623, and Kumārajīva's Chinese recension.</p>
</availability>
</publicationStmt>
<sourceDesc>
<p xml:id="p-source-ebook">Project Gutenberg ${escapeXml(ebookUrl)}; plain-text source ${escapeXml(plainTextUrl)}; SHA-256 ${source.textSha256}.</p>
<p xml:id="p-source-scope">Only the translated scripture body is retained. Gemmell's introduction, commentary, footnotes, index, and the Project Gutenberg license are outside the reading text.</p>
<p xml:id="p-source-normalization">Hard-wrapped lines are joined, Project Gutenberg italic underscores and numeric footnote calls are removed, and source paragraph order is preserved.</p>
<p xml:id="p-source-boundary">The source has 31 chapter headings covering Chapters 1–32 because it combines “Chapter 3 and 4”; the combined boundary is preserved rather than invented.</p>
<p xml:id="p-source-quality">Structure, chapter coverage, extraction boundaries, and first/last anchors are verified. Page-image collation and independent human translation review remain pending.</p>
</sourceDesc>
</fileDesc>
</teiHeader>
<text><body>
${body.join("\n")}
</body></text>
</TEI>
`;
  return xml.endsWith("\n") ? xml : `${xml}\n`;
}

let teiXml;
let batch;
if (verifyMode) {
  teiXml = await readFile(resolve(root, localPath), "utf8");
  batch = JSON.parse(await readFile(resolve(root, batchPath), "utf8"));
} else {
  const plainText = fetchText(plainTextUrl);
  const metadataHtml = fetchText(ebookUrl);
  if (
    !metadataHtml.includes('property="dcterms:rights">Public domain in the USA.</td>')
    || !metadataHtml.includes("Gemmell, William")
    || !plainText.includes("Translator: William Gemmell")
    || !plainText.includes("Kumārajīva")
    || !plainText.includes("LONDON")
    || !plainText.includes("1912")
  ) {
    throw new Error("Project Gutenberg 权利、译者、底本或年份元数据漂移");
  }
  const work = parseScripture(plainText);
  const source = {
    ebook: 64623,
    ebookUrl,
    plainTextUrl,
    fetchedAt: "2026-08-28",
    textBytes: Buffer.byteLength(plainText),
    textSha256: sha256(plainText),
    updatedAt: "2024-10-18",
    rightsLabel: "Public domain in the USA.",
  };
  teiXml = buildTei({ work, source });
  await mkdir(dirname(resolve(root, localPath)), { recursive: true });
  await writeFile(resolve(root, localPath), teiXml, "utf8");

  const bytes = Buffer.from(teiXml, "utf8");
  const segments = parseSatReadingLines(teiXml, { canonId: fileId });
  const file = {
    id: fileId,
    slug,
    workId,
    workTitle: "Vajracchedikā Prajñāpāramitā",
    attachToExistingWork: true,
    sourceRole: "public_domain_english_translation_from_chinese_expression",
    canonicalStatus: "vajracchedika_english_translation_from_kumarajiva_chinese",
    buddhaWordStatus: "translation_not_verbatim_authorship_claim",
    bibliographicRelations: [
      {
        type: "same_work_translation_group_verified",
        groupId: "vajracchedika-gemmell-english",
        label: "Gemmell English Diamond Sutra / Kumārajīva Chinese Vajracchedikā",
        evidence: "The 1912 title page and preface identify William Gemmell's work as an English translation from Kumārajīva's Chinese text. It attaches to the existing Vajracchedikā work, creates no new canonical work, and is not represented as the Buddha's verbatim English speech.",
        externalIds: {
          projectGutenberg: ["64623"],
          cbeta: ["T0235"],
          translator: ["William Gemmell"],
        },
      },
      {
        type: "translation_of_expression_verified_not_aligned",
        groupId: "gemmell-1912-from-t0235-recension",
        label: "Gemmell 1912 / Kumārajīva Chinese recension",
        evidence: "Gemmell explicitly states that the English version was translated from Kumarajiva's Chinese text. The expression is linked to the T0235 recension but is not asserted to be line-by-line aligned to the CBETA file.",
        externalIds: { cbeta: ["T0235"], projectGutenberg: ["64623"] },
      },
    ],
    authorityIds: {
      projectGutenberg: "64623",
      cbetaRecension: "T0235",
      translator: "William Gemmell",
      year: "1912",
    },
    localPath,
    upstreamPath: "Project Gutenberg eBook 64623 plain text",
    upstreamUrl: plainTextUrl,
    upstreamBytes: source.textBytes,
    upstreamSha256: source.textSha256,
    localBytes: bytes.length,
    localSha256: sha256(bytes),
    format: "application/tei+xml",
    completeness: "complete_source_file",
    parser: "sat_tei",
    presentation: {
      title: "The Diamond Sutra (William Gemmell, 1912)",
      alternateTitle: "金刚经 · Gemmell 英译",
      tradition: "Mahāyāna Buddhism · Prajñāpāramitā",
      language: "English",
      canonRef: "Project Gutenberg eBook 64623 · Gemmell English translation · 1912",
      translator: "William Gemmell，英译自鸠摩罗什汉译本",
      summary: "William Gemmell's 1912 English translation from Kumārajīva's Chinese Vajracchedikā. It is attached to the existing Diamond Sutra work, not counted as a new scripture. The complete translated scripture body is present; image collation remains pending.",
      sourceUrl: ebookUrl,
    },
    verification: {
      segments: segments.length,
      folios: new Set(segments.map((segment) => segment.page)).size,
      juanRange: [1, 1],
      juanSequence: [1],
      anchors: [segments[0].id, segments.at(-1).id],
      chapterCount: work.chapterCount,
      sourceHeadingCount: work.readingUnits.length,
      combinedChapterLabels: ["Chapter 3 and 4"],
      excludedIntroduction: true,
      excludedCommentaryAndFootnotes: true,
      humanSampleVerified: false,
      scanCollated: false,
    },
  };
  batch = {
    schema: "https://foxue.ai/schemas/gutenberg-diamond-gemmell-batch-v1.0",
    version,
    publishedAt: "2026-08-28",
    collection: "Project Gutenberg William Gemmell Diamond Sutra 1912",
    rightsCategory: "Project Gutenberg marks the 1912 English translation public domain in the USA; local-law check required elsewhere",
    upstreamSnapshot: source,
    rightsDecision: {
      status: "approved_us_public_domain_with_jurisdiction_notice",
      commercialUse: "allowed_in_usa_public_domain_local_law_check_elsewhere",
      redistribution: "allowed_in_usa_public_domain_local_law_check_elsewhere",
      sourceRightsLabel: source.rightsLabel,
      publicationYear: 1912,
      attribution: "Project Gutenberg eBook 64623 + 1912 London edition + translator William Gemmell + Kumārajīva Chinese recension",
      reviewedAt: "2026-08-28",
      note: "Project Gutenberg's metadata makes a United States public-domain statement, not a worldwide claim. The reading asset contains only the normalized scripture body and preserves source attribution.",
    },
    files: [file],
    collectionTotals: {
      newWorks: 0,
      attachedExistingWorks: 1,
      newExpressions: 1,
      newStableSegments: segments.length,
      newFolios: file.verification.folios,
      workCountingDecision: "The English translation attaches to the existing Vajracchedikā work and T0235 recension relation. It does not increase the canonical-work denominator or create a global coverage claim.",
    },
  };
  await writeFile(resolve(root, batchPath), jsonRaw(batch), "utf8");
  const ledger = {
    schema: "https://foxue.ai/schemas/gbcr/gutenberg-diamond-gemmell-ingest-v0.1",
    version,
    generatedAt: "2026-08-28",
    cut: "first_principles_missing_legal_translation_expression",
    ingest: {
      title: "The Diamond Sutra (Chin-Kang-Ching) or Prajna-Paramita",
      translator: "William Gemmell",
      year: 1912,
      expressionSlug: slug,
      workId,
      newWorks: 0,
      newExpressions: 1,
      completeTexts: 1,
      globalCoverage: null,
      dualHumanReview: 0,
      mapping: "The 1912 English translation attaches to the existing Vajracchedikā work and records its stated dependence on Kumārajīva's Chinese recension without claiming line alignment.",
      rights: batch.rightsDecision,
      qualityBoundary: "All 32 source chapter labels are covered in 31 reading units; Chapter 3 and 4 remains combined as printed. Introduction, notes and index are excluded. Scan collation and independent human translation review remain false.",
    },
    caveat: "This ledger proves one complete public-domain-in-the-USA English translation witness was attached to an existing work. It does not prove worldwide public-domain status, sentence-level translation accuracy, or global Buddhist-canon coverage.",
  };
  await writeFile(resolve(root, ledgerPath), jsonRaw(ledger), "utf8");
}

const segments = parseSatReadingLines(teiXml, { canonId: fileId });
if (segments.length !== 95) throw new Error(`英译稳定段应为 95，实际 ${segments.length}`);
if (new Set(segments.map((segment) => segment.page)).size !== 31) {
  throw new Error("英译应生成 31 个来源阅读单元");
}
if (!segments[0].text.startsWith("Thus have I heard") || !segments.at(-1).text.endsWith("received it and departed.")) {
  throw new Error("英译首尾正文锚点不完整");
}
if (batch.files?.[0]?.localSha256 !== sha256(Buffer.from(teiXml, "utf8"))) {
  throw new Error("英译受控 XML 哈希与批次不一致");
}
if (
  batch.files[0].verification.chapterCount !== 32
  || batch.files[0].verification.sourceHeadingCount !== 31
  || batch.files[0].verification.humanSampleVerified !== false
  || batch.files[0].verification.scanCollated !== false
) {
  throw new Error("英译章次或质量边界漂移");
}

console.log(verifyMode
  ? "Project Gutenberg Gemmell《金刚经》可复现：32 章标签、31 个来源阅读单元、95 个稳定段；扫描对勘与人工复核仍为 false。"
  : "Project Gutenberg Gemmell《金刚经》已摄取：新增 1 个英语表达、0 部新作品；全球覆盖率保持 null。");
