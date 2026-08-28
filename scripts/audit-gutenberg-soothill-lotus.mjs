import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const verifyMode = process.argv.includes("--verify");
const ebookUrl = "https://www.gutenberg.org/ebooks/79267";
const plainTextUrl = "https://www.gutenberg.org/cache/epub/79267/pg79267.txt";
const localPath = "data/corpus/gutenberg/lotus-sutra-soothill-1930.xml";
const batchPath = `data/corpus/gutenberg/lotus-sutra-soothill-batch-v${version}.json`;
const ledgerPath = `data/gbcr/gutenberg-lotus-soothill-ingest-v${version}.json`;
const fileId = "GUTENBERG-LOTUS-SOOTHILL-1930";
const slug = "gutenberg-en-lotus-soothill";
const workId = "gbcr:work:saddharma-pundarika-t0262";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

const chapterTitles = [
  "The Assembly and the Illumination",
  "Tactful Revelation",
  "Parable of the Burning House",
  "Faith-discernment, the Prodigal Son",
  "Parable of the Rain",
  "Prediction of the Four Disciples",
  "Parable of the Magic City",
  "Prediction of Five Hundred Disciples",
  "Prediction of Ananda, Rahula, and others",
  "The Preacher",
  "The Precious Shrine",
  "Devadatta. The Dragon-King's Daughter",
  "Steadfastness. Prediction of Women and others",
  "The Serene Life. The Four Spheres",
  "Hosts of Disciples issue from the Earth",
  "Eternity of The Buddha. The Physician",
  "The Merit and Reward of Faith",
  "The Merit and Reward of Accordance",
  "The Merit and Reward of the Preacher",
  "The Bodhisattva ‘Never Despise’",
  "Divine Power of a Buddha's Tongue",
  "The Final Commission",
  "The King of Healing. Bodhisattva Beautiful",
  "Wonder-sound",
  "Kuan-yin, Regarder of the Cries of the World",
  "Spells",
  "King Resplendent and Buddha Thunder-Voice",
  "Universal Virtue",
];

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
    .replace(/\n\s*/g, " ")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/♦/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseScripture(plainText) {
  const normalized = plainText.replace(/\r/g, "");
  const startMarker = "*** START OF THE PROJECT GUTENBERG EBOOK";
  const endMarker = "*** END OF THE PROJECT GUTENBERG EBOOK";
  const start = normalized.indexOf(startMarker);
  const end = normalized.indexOf(endMarker);
  if (start < 0 || end <= start) throw new Error("Project Gutenberg 正文边界漂移");
  const ebook = normalized.slice(start, end);
  const scriptureTitle = ebook.indexOf("THE LOTUS SUTRA", 40_000);
  if (scriptureTitle < 0) throw new Error("《法华经》正文题名缺失");
  const glossary = ebook.indexOf("GLOSSARY", scriptureTitle);
  if (glossary < 0) throw new Error("《法华经》正文后的词汇表边界缺失");
  const scripture = ebook.slice(scriptureTitle, glossary);
  const headingPattern = /^\s{20,}([IVXLCDM]+)\s*$/gm;
  const headings = [...scripture.matchAll(headingPattern)].map((match) => ({
    roman: match[1],
    start: match.index,
    bodyStart: match.index + match[0].length,
  }));
  if (headings.length !== 28) throw new Error(`应有 28 个来源品标，实际 ${headings.length}`);

  const expectedRomans = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
    "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII",
  ];
  if (headings.some((heading, index) => heading.roman !== expectedRomans[index])) {
    throw new Error("来源品次不是 I–XXVIII，或品序发生漂移");
  }

  const readingUnits = headings.map((heading, index) => {
    const rawBody = scripture.slice(heading.bodyStart, headings[index + 1]?.start ?? scripture.length);
    const withoutIllustrations = rawBody.replace(/^\s*\[Illustration:[\s\S]*?\]\s*$/gm, "");
    const paragraphs = withoutIllustrations
      .trim()
      .split(/\n\s*\n+/)
      .map(normalizeParagraph)
      .filter((paragraph) => (
        paragraph
        && !/^“[^”]+” replaced with “[^”]+”$/.test(paragraph)
        && !/^\.{4,}$/.test(paragraph)
      ));
    if (!paragraphs.length) throw new Error(`第 ${index + 1} 品正文为空`);
    if (paragraphs.some((paragraph) => /\[Illustration:|♦|replaced with/.test(paragraph))) {
      throw new Error(`第 ${index + 1} 品仍含插图或校改注`);
    }
    return {
      ...heading,
      number: index + 1,
      title: chapterTitles[index],
      paragraphs,
    };
  });

  const paragraphs = readingUnits.flatMap((unit) => unit.paragraphs);
  if (paragraphs.length !== 511) throw new Error(`正文稳定段应为 511，实际 ${paragraphs.length}`);
  if (!paragraphs[0].startsWith("“Once the Buddha (Śakyamuni) was staying")) {
    throw new Error("首段锚点漂移");
  }
  if (!paragraphs.at(-1)?.endsWith("made salutation to him and withdrew.”")) {
    throw new Error("末段锚点漂移");
  }
  if (
    !normalized.includes("I have omitted the repetitions and much unnecessary detail")
    || !normalized.includes("this abbreviated version")
    || !normalized.includes("The Chinese text common to Japan and China is the Kumarajiva")
  ) {
    throw new Error("Soothill 自述的删节或鸠摩罗什底本边界漂移");
  }
  return { readingUnits, paragraphCount: paragraphs.length, chapterCount: headings.length };
}

function buildTei({ work, source }) {
  let serial = 1;
  const body = [];
  for (const unit of work.readingUnits) {
    body.push(`<p><title type="chapter">Chapter ${unit.number}: ${escapeXml(unit.title)}</title></p>`);
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
<title>The Lotus of the Wonderful Law, or The Lotus Gospel</title>
<respStmt><persName>W. E. Soothill</persName><resp>English translation and abridgment from Kumārajīva's Chinese text</resp></respStmt>
<respStmt><persName>Bunno Kato</persName><resp>Translation collaborator identified by Soothill in the preface</resp></respStmt>
</titleStmt>
<publicationStmt>
<publisher>Oxford University Press</publisher>
<publisher>Project Gutenberg</publisher>
<date when="1930">1930</date>
<availability>
<p xml:id="p-rights-source">Project Gutenberg marks eBook 79267 “Public domain in the USA.”</p>
<p xml:id="p-rights-jurisdiction">Users outside the United States must check the law of their jurisdiction. This record does not make a worldwide public-domain claim.</p>
<p xml:id="p-rights-attribution">Retain attribution to W. E. Soothill, Bunno Kato's stated collaboration, the 1930 Oxford edition, Project Gutenberg eBook 79267, and Kumārajīva's Chinese recension.</p>
</availability>
</publicationStmt>
<sourceDesc>
<p xml:id="p-source-ebook">Project Gutenberg ${escapeXml(ebookUrl)}; plain-text source ${escapeXml(plainTextUrl)}; SHA-256 ${source.textSha256}.</p>
<p xml:id="p-source-scope">Only the 28-chapter Lotus Sutra reading body is retained. Preface, historical and doctrinal introductions, glossary, index, illustrations, transcriber notes, and the Project Gutenberg license are outside the reading text.</p>
<p xml:id="p-source-abridgment">Soothill explicitly says he omitted repetitions and detail and calls this an abbreviated version. The complete digital source body for that abridged 1930 edition is retained; it must not be represented as an unabridged or line-complete translation.</p>
<p xml:id="p-source-normalization">Hard-wrapped lines are joined, italic underscores and transcriber correction markers are removed, and corrected readings plus source paragraph order are preserved.</p>
<p xml:id="p-source-quality">All 28 source chapters, extraction boundaries, paragraph count, and first/last anchors are verified. Page-image collation, independent human translation review, and sentence alignment to T0262 remain pending.</p>
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
    || !metadataHtml.includes("Soothill, William Edward")
    || !metadataHtml.includes("Kumārajīva")
    || !metadataHtml.includes("Oxford University Press, 1930")
    || !plainText.includes("Release date: August 4, 2026 [eBook #79267]")
  ) {
    throw new Error("Project Gutenberg 权利、责任、版本或发布日期元数据漂移");
  }
  const work = parseScripture(plainText);
  const source = {
    ebook: 79267,
    ebookUrl,
    plainTextUrl,
    fetchedAt: "2026-08-28",
    releasedAt: "2026-08-04",
    textBytes: Buffer.byteLength(plainText),
    textSha256: sha256(plainText),
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
    workTitle: "Saddharmapuṇḍarīka / 妙法莲华经",
    attachToExistingWork: true,
    sourceRole: "public_domain_abridged_english_translation_from_chinese_expression",
    canonicalStatus: "lotus_sutra_abridged_english_translation_from_kumarajiva_chinese",
    buddhaWordStatus: "translation_and_editorial_abridgment_not_verbatim_authorship_claim",
    bibliographicRelations: [
      {
        type: "same_work_translation_group_verified",
        groupId: "lotus-soothill-english-kumarajiva",
        label: "Soothill English Lotus Sutra / Kumārajīva Chinese Saddharmapuṇḍarīka",
        evidence: "Soothill's preface identifies the common Chinese text as Kumārajīva's version and describes this English book as the result of translation work with Bunno Kato. It attaches to the existing T0262 Saddharmapuṇḍarīka work and creates no new canonical work.",
        externalIds: {
          projectGutenberg: ["79267"],
          cbeta: ["T0262"],
          responsibility: ["W. E. Soothill", "Bunno Kato"],
        },
      },
      {
        type: "abridged_translation_of_expression_verified_not_aligned",
        groupId: "soothill-1930-abridged-from-t0262-recension",
        label: "Soothill 1930 abridgment / Kumārajīva Chinese recension",
        evidence: "Soothill explicitly says he omitted repetitions and detail and calls the publication an abbreviated version. All 28 published chapters are retained, but no sentence-level alignment or unabridged completeness is claimed.",
        externalIds: { cbeta: ["T0262"], projectGutenberg: ["79267"] },
      },
    ],
    authorityIds: {
      projectGutenberg: "79267",
      cbetaRecension: "T0262",
      englishEditorTranslator: "W. E. Soothill",
      collaborator: "Bunno Kato",
      year: "1930",
    },
    localPath,
    upstreamPath: "Project Gutenberg eBook 79267 plain text",
    upstreamUrl: plainTextUrl,
    upstreamBytes: source.textBytes,
    upstreamSha256: source.textSha256,
    localBytes: bytes.length,
    localSha256: sha256(bytes),
    format: "application/tei+xml",
    completeness: "complete_source_file_partial_work_witness",
    parser: "sat_tei",
    presentation: {
      title: "The Lotus of the Wonderful Law (W. E. Soothill, 1930)",
      alternateTitle: "法华经 · Soothill 英译节本",
      tradition: "Mahāyāna Buddhism · Lotus Sutra",
      language: "English",
      canonRef: "Project Gutenberg eBook 79267 · Soothill English abridgment · 1930 · from Kumārajīva Chinese",
      translator: "W. E. Soothill 英译节编；前言记与 Bunno Kato 合作；据鸠摩罗什汉译本",
      summary: "W. E. Soothill's 1930 English abridgment from Kumārajīva's Chinese Lotus Sutra. All 28 chapters of the published abridged source are present. Repetitions and detail were deliberately omitted by the editor-translator, so this is not represented as an unabridged translation.",
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
      sourceParagraphCount: work.paragraphCount,
      isAbridged: true,
      excludedPrefaceAndIntroductions: true,
      excludedGlossaryIndexAndNotes: true,
      humanSampleVerified: false,
      scanCollated: false,
      sentenceAlignedToT0262: false,
    },
  };
  batch = {
    schema: "https://foxue.ai/schemas/gutenberg-lotus-soothill-batch-v1.0",
    version,
    publishedAt: "2026-08-28",
    collection: "Project Gutenberg W. E. Soothill Lotus Sutra 1930",
    rightsCategory: "Project Gutenberg marks the 1930 English edition public domain in the USA; local-law check required elsewhere",
    upstreamSnapshot: source,
    rightsDecision: {
      status: "approved_us_public_domain_with_jurisdiction_notice",
      commercialUse: "allowed_in_usa_public_domain_local_law_check_elsewhere",
      redistribution: "allowed_in_usa_public_domain_local_law_check_elsewhere",
      sourceRightsLabel: source.rightsLabel,
      publicationYear: 1930,
      attribution: "Project Gutenberg eBook 79267 + 1930 Oxford edition + W. E. Soothill + Bunno Kato collaboration stated in preface + Kumārajīva Chinese recension",
      reviewedAt: "2026-08-28",
      note: "Project Gutenberg's metadata makes a United States public-domain statement, not a worldwide claim. The reading asset preserves the complete 28-chapter body of Soothill's explicitly abridged edition and its editorial responsibility.",
    },
    files: [file],
    collectionTotals: {
      newWorks: 0,
      attachedExistingWorks: 1,
      newExpressions: 1,
      completeDigitalSourceFiles: 1,
      unabridgedTranslations: 0,
      newStableSegments: segments.length,
      newFolios: file.verification.folios,
      workCountingDecision: "The abridged English translation attaches to the existing T0262 Saddharmapuṇḍarīka work. It does not increase the canonical-work denominator or create a global coverage claim.",
    },
  };
  await writeFile(resolve(root, batchPath), jsonRaw(batch), "utf8");
  const ledger = {
    schema: "https://foxue.ai/schemas/gbcr/gutenberg-lotus-soothill-ingest-v0.1",
    version,
    generatedAt: "2026-08-28",
    cut: "first_principles_missing_legal_abridged_translation_expression",
    ingest: {
      title: "The Lotus of the Wonderful Law, or The Lotus Gospel",
      englishEditorTranslator: "W. E. Soothill",
      collaboratorStatedInPreface: "Bunno Kato",
      year: 1930,
      expressionSlug: slug,
      workId,
      newWorks: 0,
      newExpressions: 1,
      completeDigitalSourceFiles: 1,
      unabridgedTranslations: 0,
      globalCoverage: null,
      dualHumanReview: 0,
      mapping: "The 1930 abridged English edition attaches to the existing T0262 Saddharmapuṇḍarīka work and records its stated dependence on Kumārajīva's Chinese recension without claiming sentence alignment.",
      rights: batch.rightsDecision,
      qualityBoundary: "All 28 published chapter bodies and 511 normalized source paragraphs are present. Soothill explicitly omitted repetitions and detail; the expression is not labeled an unabridged or line-complete translation. Scan collation and independent human translation review remain false.",
    },
    caveat: "This ledger proves one complete digital source body for a public-domain-in-the-USA, explicitly abridged English Lotus Sutra edition was attached to an existing work. It does not prove worldwide public-domain status, unabridged completeness, sentence-level accuracy, or global Buddhist-canon coverage.",
  };
  await writeFile(resolve(root, ledgerPath), jsonRaw(ledger), "utf8");
}

const segments = parseSatReadingLines(teiXml, { canonId: fileId });
if (segments.length !== 511) throw new Error(`英译稳定段应为 511，实际 ${segments.length}`);
if (new Set(segments.map((segment) => segment.page)).size !== 28) {
  throw new Error("英译节本应生成 28 个来源阅读单元");
}
if (
  !segments[0].text.startsWith("“Once the Buddha (Śakyamuni) was staying")
  || !segments.at(-1).text.endsWith("made salutation to him and withdrew.”")
) {
  throw new Error("英译节本首尾正文锚点不完整");
}
if (batch.files?.[0]?.localSha256 !== sha256(Buffer.from(teiXml, "utf8"))) {
  throw new Error("英译节本受控 XML 哈希与批次不一致");
}
if (
  batch.files[0].verification.chapterCount !== 28
  || batch.files[0].verification.sourceParagraphCount !== 511
  || batch.files[0].verification.isAbridged !== true
  || batch.files[0].verification.humanSampleVerified !== false
  || batch.files[0].verification.scanCollated !== false
  || batch.files[0].verification.sentenceAlignedToT0262 !== false
) {
  throw new Error("英译节本品次、删节或质量边界漂移");
}

console.log(verifyMode
  ? "Project Gutenberg Soothill《法华经》节本可复现：28 品、511 个稳定段；明确删节，扫描对勘与人工复核仍为 false。"
  : "Project Gutenberg Soothill《法华经》节本已摄取：新增 1 个英语表达、0 部新作品；全球覆盖率保持 null。");
