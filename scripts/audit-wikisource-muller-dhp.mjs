import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const verifyMode = process.argv.includes("--verify");
const userAgent = "foxue.ai-corpus-ingest/1.0 (https://github.com/weitzu-com/foxue.ai; corpus-rights-audit)";
const apiBase = "https://en.wikisource.org/w/api.php";
const workPageTitle = "Dhammapada (Muller)";
const workPageUrl = "https://en.wikisource.org/wiki/Dhammapada_(Muller)";
const indexPageTitle = "Index:Sacred Books of the East - Volume 10.djvu";
const indexUrl = "https://en.wikisource.org/wiki/Index:Sacred_Books_of_the_East_-_Volume_10.djvu";
const authorPageTitle = "Author:Friedrich Max Müller";
const authorUrl = "https://en.wikisource.org/wiki/Author:Friedrich_Max_Müller";
const localPath = "data/corpus/wikisource/muller-dhp-1881.xml";
const batchPath = `data/corpus/wikisource/muller-dhp-batch-v${version}.json`;
const ledgerPath = `data/gbcr/wikisource-muller-dhp-ingest-v${version}.json`;
const fileId = "WIKISOURCE-DHP-MULLER-1881";
const slug = "wikisource-en-dhp-muller";
const workId = "gbcr:work:dhammapada-pali";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

const expectedChapterEnds = [
  20, 32, 43, 59, 75, 89, 99, 115, 128, 145, 156, 166, 178,
  196, 208, 220, 234, 255, 272, 289, 305, 319, 333, 359, 382, 423,
];

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fetchJson(url) {
  const raw = execFileSync("curl", [
    "-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "120",
    "-A", userAgent, url,
  ], { encoding: "utf8" });
  return JSON.parse(raw);
}

function apiUrl(params) {
  const search = new URLSearchParams({ format: "json", formatversion: "2", ...params });
  return `${apiBase}?${search}`;
}

function fetchPage(title) {
  const document = fetchJson(apiUrl({
    action: "query",
    titles: title,
    redirects: "1",
    prop: "revisions|categories",
    rvprop: "content|ids|timestamp|sha1",
    rvslots: "main",
    cllimit: "max",
  }));
  const page = document.query.pages[0];
  const revision = page.revisions?.[0];
  if (!revision?.slots?.main?.content) throw new Error(`Wikisource 页面无正文：${title}`);
  return {
    pageid: page.pageid,
    title: page.title,
    categories: (page.categories ?? []).map((item) => item.title),
    revision,
    wikitext: revision.slots.main.content,
  };
}

function romanToNumber(value) {
  const digits = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    const current = digits[value[index]];
    const next = digits[value[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

function cleanWikitext(value) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/[ \t]*\n[ \t]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWork(wikitext) {
  const chapterPattern = /^==Chapter\s+([IVXLCDM]+)\s*[:\-]\s*(.+)==$/gm;
  const headings = [...wikitext.matchAll(chapterPattern)].map((match) => ({
    number: romanToNumber(match[1]),
    roman: match[1],
    name: match[2].trim(),
    start: match.index,
    bodyStart: match.index + match[0].length,
  }));
  if (headings.length !== 26) throw new Error(`英译法句经应有 26 品，实际 ${headings.length}`);
  if (headings.some((heading, index) => heading.number !== index + 1)) {
    throw new Error("英译法句经品次不连续");
  }

  const chapters = [];
  let declaredChapterMismatches = 0;
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    let end = headings[index + 1]?.start ?? wikitext.length;
    const licenseStart = wikitext.indexOf("{{translation license", heading.bodyStart);
    if (licenseStart >= 0 && licenseStart < end) end = licenseStart;
    const body = wikitext.slice(heading.bodyStart, end);
    const markerPattern = /\{\{verse\|chapter=([^|}]+)\|verse=(\d+)\}\}|^(\d+),\s*(\d+)\.\s*/gm;
    const markers = [...body.matchAll(markerPattern)].map((match) => {
      const numbers = match[2]
        ? [Number(match[2])]
        : [Number(match[3]), Number(match[4])];
      if (match[1] && romanToNumber(match[1]) !== heading.number) {
        declaredChapterMismatches += 1;
      }
      return {
        numbers,
        start: match.index,
        textStart: match.index + match[0].length,
      };
    });
    if (!markers.length) throw new Error(`第 ${heading.number} 品没有偈颂标记`);
    const verses = markers.map((marker, markerIndex) => {
      const text = cleanWikitext(body.slice(
        marker.textStart,
        markers[markerIndex + 1]?.start ?? body.length,
      ));
      if (!text) throw new Error(`第 ${marker.numbers.join("–")} 偈正文为空`);
      return { numbers: marker.numbers, text };
    });
    chapters.push({ ...heading, verses });
  }

  const verseNumbers = chapters.flatMap((chapter) => chapter.verses.flatMap((verse) => verse.numbers));
  const unique = [...new Set(verseNumbers)].sort((a, b) => a - b);
  const missing = [...Array(423)].map((_, index) => index + 1).filter((number) => !unique.includes(number));
  if (unique.length !== 423 || unique[0] !== 1 || unique.at(-1) !== 423 || missing.length) {
    throw new Error(`偈颂编号不完整：${unique[0]}–${unique.at(-1)} 共 ${unique.length}；缺 ${missing.join(",")}`);
  }
  if (verseNumbers.length !== 423) throw new Error(`偈颂编号重复：标记 ${verseNumbers.length}，互异 ${unique.length}`);
  if (chapters.reduce((sum, chapter) => sum + chapter.verses.length, 0) !== 414) {
    throw new Error("应有 405 个单偈段与 9 个双偈合段");
  }
  for (let index = 0; index < chapters.length; index += 1) {
    const numbers = chapters[index].verses.flatMap((verse) => verse.numbers);
    const expectedStart = index === 0 ? 1 : expectedChapterEnds[index - 1] + 1;
    if (numbers[0] !== expectedStart || numbers.at(-1) !== expectedChapterEnds[index]) {
      throw new Error(`第 ${index + 1} 品偈号边界漂移：${numbers[0]}–${numbers.at(-1)}`);
    }
  }
  if (declaredChapterMismatches !== 41) {
    throw new Error(`上游第 26 品 chapter 参数已知错标应为 41 处，实际 ${declaredChapterMismatches}`);
  }
  return { chapters, verseCount: unique.length, segmentCount: 414, declaredChapterMismatches };
}

function buildTei({ work, source }) {
  let serial = 1;
  const body = [];
  for (const chapter of work.chapters) {
    body.push(`<p><title type="chapter">Chapter ${chapter.number}: ${escapeXml(chapter.name)}</title></p>`);
    for (const verse of chapter.verses) {
      const label = verse.numbers.length === 1
        ? String(verse.numbers[0])
        : `${verse.numbers[0]}–${verse.numbers.at(-1)}`;
      const text = `${label} ${verse.text}`;
      const id = `s${String(serial * 100).padStart(10, "0")}`;
      serial += 1;
      body.push(`<p><s xml:id="${id}">${escapeXml(text)}</s></p>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
<teiHeader>
<fileDesc>
<titleStmt>
<title>The Dhammapada: A Collection of Verses</title>
<respStmt><persName>Friedrich Max Müller</persName><resp>Translation from Pāli</resp></respStmt>
</titleStmt>
<publicationStmt>
<publisher>The Clarendon Press</publisher>
<publisher>Wikisource</publisher>
<date when="1881">1881</date>
<availability>
<p xml:id="p-rights-work">Wikisource work categories: Category:PD-old; translation license marks both original and translation PD-old.</p>
<p xml:id="p-rights-author">Friedrich Max Müller died in 1900; Wikisource author category: Category:Author-PD-old.</p>
<p xml:id="p-rights-note">The 1881 translation is public domain. Attribute Wikisource, Sacred Books of the East Volume X, Clarendon Press, and translator Friedrich Max Müller.</p>
</availability>
</publicationStmt>
<sourceDesc>
<p xml:id="p-source-work">Wikisource ${escapeXml(workPageUrl)} (revid ${source.work.revid}, sha1 ${source.work.sha1}, ${source.work.timestamp}).</p>
<p xml:id="p-source-index">${escapeXml(indexUrl)} (revid ${source.index.revid}, sha1 ${source.index.sha1}, ${source.index.timestamp}); scan metadata: Oxford, Clarendon Press, 1881.</p>
<p xml:id="p-source-author">${escapeXml(authorUrl)} (revid ${source.author.revid}, sha1 ${source.author.sha1}, ${source.author.timestamp}); author died 1900.</p>
<p xml:id="p-source-quality">The complete 423-verse Wikisource transcription is structurally verified but the work is tagged “Texts to be migrated to scans”; it is not represented as scan-collated or human-sample-verified.</p>
<p xml:id="p-source-defect">The upstream wikitext labels the 41 verse templates in Chapter XXVI as chapter XXV. The physical heading and canonical verse range 383–423 are preserved; this known metadata defect is recorded and normalized only at the chapter boundary.</p>
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
  const workPage = fetchPage(workPageTitle);
  const indexPage = fetchPage(indexPageTitle);
  const authorPage = fetchPage(authorPageTitle);

  if (!workPage.categories.includes("Category:PD-old")) throw new Error("英译正文未列入 PD-old");
  if (!workPage.categories.includes("Category:Texts to be migrated to scans")) {
    throw new Error("英译正文来源质量标签漂移，必须重新审计");
  }
  if (!workPage.wikitext.includes("translator = Friedrich Max Müller") ||
      !workPage.wikitext.includes("{{translation license") ||
      !workPage.wikitext.includes("translation = {{PD-old}}")) {
    throw new Error("英译正文译者或 PD-old 许可标记漂移");
  }
  if (!indexPage.wikitext.includes("|Year=1881") ||
      !indexPage.wikitext.includes("|Publisher=The Clarendon Press") ||
      !indexPage.wikitext.includes("[[Author:Friedrich Max Müller|Max Müller]]")) {
    throw new Error("扫描本年份、出版社或译者元数据漂移");
  }
  if (!authorPage.categories.includes("Category:1900 deaths") ||
      !authorPage.categories.includes("Category:Author-PD-old") ||
      !authorPage.wikitext.includes("{{PD-old}}")) {
    throw new Error("译者卒年或公有领域状态漂移");
  }

  const work = parseWork(workPage.wikitext);
  const source = {
    work: {
      title: workPage.title,
      pageid: workPage.pageid,
      revid: workPage.revision.revid,
      sha1: workPage.revision.sha1,
      timestamp: workPage.revision.timestamp,
    },
    index: {
      title: indexPage.title,
      pageid: indexPage.pageid,
      revid: indexPage.revision.revid,
      sha1: indexPage.revision.sha1,
      timestamp: indexPage.revision.timestamp,
    },
    author: {
      title: authorPage.title,
      pageid: authorPage.pageid,
      revid: authorPage.revision.revid,
      sha1: authorPage.revision.sha1,
      timestamp: authorPage.revision.timestamp,
    },
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
    workTitle: "Dhammapada",
    attachToExistingWork: true,
    sourceRole: "public_domain_english_translation_expression",
    canonicalStatus: "pali_dhammapada_english_translation",
    buddhaWordStatus: "translation_not_verbatim_authorship_claim",
    bibliographicRelations: [
      {
        type: "same_work_translation_group_verified",
        groupId: slug,
        label: "Müller English Dhammapada / Pāli Dhammapada",
        evidence: "The 1881 title page identifies Max Müller’s work as a translation from Pāli of the 423-verse Dhammapada. It attaches to gbcr:work:dhammapada-pali, creates no new work, and is not represented as the Buddha’s verbatim English speech.",
        externalIds: {
          wikisource: [workPageTitle],
          suttacentral: ["dhp"],
          translator: ["Friedrich Max Müller"],
        },
      },
      {
        type: "related_recension_parallel_not_aligned",
        groupId: "dhammapada-family-t0210",
        label: "Dhammapada textual family / T210 parallel",
        evidence: "Chinese T210 and Pāli Dhp remain distinct works in gbcr:text-family:dhammapada. This expression is not aligned verse-by-verse to T210 and does not merge the recensions.",
        externalIds: { cbeta: ["T0210"], suttacentral: ["dhp"] },
      },
    ],
    authorityIds: {
      wikisource: workPageTitle,
      suttacentral: "dhp",
      translator: "Friedrich Max Müller",
      year: "1881",
      parallelWorkId: "gbcr:work:dharmapada-t0210",
    },
    localPath,
    upstreamPath: workPageTitle,
    upstreamUrl: workPageUrl,
    upstreamBytes: Buffer.byteLength(workPage.wikitext),
    upstreamSha256: sha256(workPage.wikitext),
    localBytes: bytes.length,
    localSha256: sha256(bytes),
    format: "application/tei+xml",
    completeness: "complete_source_file",
    parser: "sat_tei",
    presentation: {
      title: "The Dhammapada (Max Müller, 1881)",
      alternateTitle: "法句经 · 英译",
      tradition: "Theravāda Buddhism · Khuddaka Nikāya",
      language: "English",
      canonRef: "Wikisource · Sacred Books of the East, Vol. X · 1881",
      translator: "Friedrich Max Müller",
      summary: "A public-domain 1881 English translation of the 423-verse Pāli Dhammapada. It is attached to the existing Pāli work and does not create a new canonical work. Structure is verified; scan collation remains pending.",
      sourceUrl: workPageUrl,
    },
    verification: {
      segments: segments.length,
      folios: new Set(segments.map((segment) => segment.page)).size,
      juanRange: [1, 1],
      juanSequence: [1],
      anchors: [segments[0].id, segments.at(-1).id],
      verseCount: work.verseCount,
      chapterCount: work.chapters.length,
      groupedVerseSegments: 9,
      upstreamChapterMetadataDefects: work.declaredChapterMismatches,
      humanSampleVerified: false,
      scanCollated: false,
    },
  };
  batch = {
    schema: "https://foxue.ai/schemas/wikisource-muller-dhp-batch-v1.0",
    version,
    publishedAt: "2026-08-27",
    collection: "Wikisource Max Müller Dhammapada 1881",
    rightsCategory: "Public-domain English translation of the Pāli Dhammapada, published 1881; translator died 1900",
    upstreamRevisions: source,
    rightsDecision: {
      status: "approved_public_domain_with_attribution",
      commercialUse: "allowed_public_domain",
      redistribution: "allowed",
      workCategory: "Category:PD-old",
      authorCategory: "Category:Author-PD-old",
      publicationYear: 1881,
      translatorDeathYear: 1900,
      attribution: "Wikisource + Sacred Books of the East Volume X (Clarendon Press, 1881) + translator Friedrich Max Müller",
      reviewedAt: "2026-08-27",
      note: "The complete Wikisource transcription is structurally verified. Its own quality category says it still needs migration to scans, so the platform does not claim scan collation or human sample verification.",
    },
    files: [file],
    collectionTotals: {
      newWorks: 0,
      attachedExistingWorks: 1,
      newExpressions: 1,
      newStableSegments: segments.length,
      newFolios: file.verification.folios,
      workCountingDecision: "The English translation attaches to the existing Pāli Dhammapada work. It does not increase the global Buddhist-work denominator or make a global coverage claim.",
    },
  };
  await writeFile(resolve(root, batchPath), jsonRaw(batch), "utf8");
  const ledger = {
    schema: "https://foxue.ai/schemas/gbcr/wikisource-muller-dhp-ingest-v0.1",
    version,
    generatedAt: "2026-08-27",
    cut: "first_principles_multilingual_translation_gap",
    ingest: {
      title: "The Dhammapada: A Collection of Verses",
      translator: "Friedrich Max Müller",
      year: 1881,
      expressionSlug: slug,
      workId,
      newWorks: 0,
      newExpressions: 1,
      completeTexts: 1,
      globalCoverage: null,
      dualHumanReview: 0,
      mapping: "The 423-verse English translation attaches to the existing Pāli Dhammapada work. Chinese T210 remains a separate recension-level work and is only a family parallel.",
      rights: batch.rightsDecision,
      qualityBoundary: "Complete transcription and verse structure verified; scan collation and human sample verification remain false.",
    },
    caveat: "This ledger proves one public-domain English translation witness was attached to an existing work. It does not prove global Buddhist-canon coverage or the accuracy of every translated sentence.",
  };
  await writeFile(resolve(root, ledgerPath), jsonRaw(ledger), "utf8");
}

const segments = parseSatReadingLines(teiXml, { canonId: fileId });
if (segments.length !== 414) throw new Error(`英译稳定段应为 414，实际 ${segments.length}`);
if (new Set(segments.map((segment) => segment.page)).size !== 26) throw new Error("英译应生成 26 个品次阅读页");
if (!segments[0].text.startsWith("1 ") || !segments.at(-1).text.startsWith("423 ")) {
  throw new Error("英译首尾偈锚点不完整");
}
if (batch.files?.[0]?.localSha256 !== sha256(Buffer.from(teiXml, "utf8"))) {
  throw new Error("英译受控 XML 哈希与批次不一致");
}
if (batch.files[0].verification.verseCount !== 423 || batch.files[0].verification.humanSampleVerified !== false) {
  throw new Error("英译偈数或人工复核边界漂移");
}

console.log(verifyMode
  ? "Wikisource Müller Dhammapada 可复现：423 偈、414 个稳定段、26 品；扫描对勘与人工抽样仍明确为 false。"
  : "Wikisource Müller Dhammapada 已摄取：新增 1 个英语表达、0 部新作品；全球覆盖率保持 null。");
