import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const verifyMode = process.argv.includes("--verify");
const userAgent = "foxue.ai-corpus-ingest/1.0 (https://github.com/weitzu-com/foxue.ai; corpus-rights-audit)";
const workPageTitle = "國譯法句經";
const workPageUrl = "https://ja.wikisource.org/wiki/國譯法句經";
const indexUrl = "https://ja.wikisource.org/wiki/Index:Kokuyakudaizokyo-kyobu-12.pdf";
const apiBase = "https://ja.wikisource.org/w/api.php";
const localPath = "data/corpus/wikisource/kokuyaku-dhp-tachibana-1918.xml";
const batchPath = `data/corpus/wikisource/kokuyaku-dhp-batch-v${version}.json`;
const ledgerPath = `data/gbcr/wikisource-kokuyaku-dhp-ingest-v${version}.json`;
const fileId = "KOKUYAKU-DHP-1918";
const slug = "wikisource-ja-dhp";
const workId = "gbcr:work:dhammapada-pali";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

const kanjiDigits = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

function kanjiToNumber(value) {
  if (value === "十") return 10;
  if (value.startsWith("二十")) return 20 + (value.length === 2 ? 0 : kanjiDigits[value.slice(2)]);
  if (value.startsWith("十")) return 10 + (kanjiDigits[value.slice(1)] ?? 0);
  return kanjiDigits[value] ?? Number.parseInt(value, 10);
}

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

function convertRuby(html) {
  return html.replace(
    /<ruby[^>]*>\s*<rb>([\s\S]*?)<\/rb>\s*(?:<rp>[\s\S]*?<\/rp>)?\s*<rt>([\s\S]*?)<\/rt>\s*(?:<rp>[\s\S]*?<\/rp>)?\s*<\/ruby>/g,
    (_, rb, rt) => `${rb.replace(/<[^>]+>/g, "")}（${rt.replace(/<[^>]+>/g, "")}）`,
  );
}

function stripTags(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/<\/?[a-zA-Z][^>]*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPlainBody(parseHtml) {
  const start = parseHtml.indexOf("<ruby><rb>國</rb>");
  const end = parseHtml.indexOf("licenseContainer");
  if (start < 0 || end < 0) throw new Error("Wikisource 解析 HTML 找不到正文或許可橫幅");
  let body = parseHtml.slice(start, end);
  body = body.replace(
    /<span[^>]*id="\d+:(\d+)"[^>]*>\s*<sup>(\d+)<\/sup>\s*<\/span>/g,
    " [[V:$1]] ",
  );
  body = body
    .replace(/<span class="pagenum"[\s\S]*?<\/span>/g, "")
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, "")
    .replace(/<link[^>]*>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "");
  body = convertRuby(body);
  body = body.replace(/<\/p>/g, "\n");
  body = body.replace(/<br\s*\/?>/g, "\n");
  body = body.replace(/<div[^>]*>/g, "\n");
  body = body.replace(/<\/div>/g, "\n");
  return stripTags(body)
    .replace(/\.mw-parser-output[^\n]*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractLicenseBanner(parseHtml) {
  const match = parseHtml.match(/licFrame-centertext[\s\S]*?<p>([\s\S]*?)<\/p>\s*<hr\s*\/?>\s*<p>([\s\S]*?)<\/p>/);
  if (!match) throw new Error("Wikisource 頁面缺少 PD 橫幅");
  return {
    first: stripTags(match[1]).replace(/\s+/g, ""),
    second: stripTags(match[2]).replace(/\s+/g, " ").trim(),
    japan: stripTags(match[1]).replace(/\s+/g, " ").trim(),
    us: stripTags(match[2]).replace(/\s+/g, " ").trim(),
  };
}

function parseWork(plain) {
  const markerCount = (plain.match(/\[\[V:\d+\]\]/g) || []).length;
  if (markerCount < 400) {
    throw new Error(`正文偈標過少：${markerCount}\n${plain.slice(0, 800)}`);
  }
  const lines = plain.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const chapters = [];
  let current = null;
  let homage = "";
  let sawTitle = false;
  let pendingVerseNumbers = [];

  const startChapter = (name, number) => {
    current = { number, name: name.replace(/（[^）]+）/g, ""), nameWithKana: name, verses: [], notes: "" };
    chapters.push(current);
  };

  const pushVerse = (numbers, text) => {
    if (!current) throw new Error(`偈頌落在品外：${numbers.join("-")} ${text.slice(0, 40)}`);
    const cleaned = text.replace(/\s+/g, "").replace(/^[[V:\d+\]]+/g, "").replace(/<divclass=".*$/, "");
    if (!cleaned) return;
    current.verses.push({ numbers, text: cleaned });
  };

  for (const line of lines) {
    if (!sawTitle && /國（こく）譯/.test(line) && /經（きやう）/.test(line)) {
      sawTitle = true;
      continue;
    }
    const chapter = line.match(/^(.+品（[^）]+）)第（だい）([一二三四五六七八九十]+)$/);
    if (chapter) {
      startChapter(chapter[1], kanjiToNumber(chapter[2]));
      continue;
    }
    if (!current && /歸命（きみやう）す$/.test(line)) {
      homage = line.replace(/\s+/g, "");
      continue;
    }
    if (/^國譯法句經終$/.test(line)) {
      if (current) current.closing = line;
      continue;
    }
    const verseIds = [...line.matchAll(/\[\[V:(\d+)\]\]/g)].map((match) => Number(match[1]));
    if (verseIds.length) {
      const text = line.replace(/\[\[V:\d+\]\]/g, "").trim();
      if (!text) {
        pendingVerseNumbers = verseIds;
        continue;
      }
      pushVerse(verseIds, text);
      pendingVerseNumbers = [];
      continue;
    }
    if (pendingVerseNumbers.length) {
      pushVerse(pendingVerseNumbers, line);
      pendingVerseNumbers = [];
      continue;
    }
    if (/^\(\d+\)/.test(line)) {
      if (!current) throw new Error("註釋落在品外");
      current.notes = `${current.notes}${current.notes ? " " : ""}${line.replace(/\s+/g, " ").trim()}`;
      continue;
    }
    if (current && current.number === 21 && current.verses.length === 0 && /小樂（せうらく）/.test(line)) {
      pushVerse([290], line);
      continue;
    }
    if (current && current.verses.length && !/^\(\d+\)/.test(line) && !/品（/.test(line)) {
      const last = current.verses.at(-1);
      last.text += line.replace(/\s+/g, "");
    }
  }

  if (homage) {
    if (!chapters[0]) throw new Error("缺少雙雙品");
    chapters[0].homage = homage;
  }
  if (chapters.length !== 26) throw new Error(`應有 26 品，實際 ${chapters.length}`);
  if (chapters[0].name !== "雙雙品") throw new Error(`第一品應為雙雙品，實際 ${chapters[0].name}`);
  const verseNumbers = chapters.flatMap((chapter) => chapter.verses.flatMap((verse) => verse.numbers));
  const unique = [...new Set(verseNumbers)].sort((a, b) => a - b);
  if (unique[0] !== 1 || unique.at(-1) !== 423 || unique.length !== 423) {
    throw new Error(`偈頌編號不完整：${unique[0]}–${unique.at(-1)} 共 ${unique.length}；缺 ${[...Array(423)].map((_, i) => i + 1).filter((n) => !unique.includes(n)).join(",")}`);
  }
  return { chapters, verseCount: unique.length, verseMarkers: verseNumbers.length };
}

function buildTei({ chapters, license, revision }) {
  const sentences = [];
  let serial = 1;
  const addSentence = (text) => {
    const id = `s${String(serial * 100).padStart(10, "0")}`;
    serial += 1;
    sentences.push({ id, text });
    return id;
  };
  const body = [];
  for (const chapter of chapters) {
    body.push(`<p><title type="chapter">第${chapter.number}章 ${escapeXml(chapter.name)}</title></p>`);
    if (chapter.homage) {
      const id = addSentence(chapter.homage);
      body.push(`<p><s xml:id="${id}">${escapeXml(chapter.homage)}</s></p>`);
    }
    for (const verse of chapter.verses) {
      const label = verse.numbers.length === 1 ? String(verse.numbers[0]) : `${verse.numbers[0]}–${verse.numbers.at(-1)}`;
      const text = `${label} ${verse.text}`;
      const id = addSentence(text);
      body.push(`<p><s xml:id="${id}">${escapeXml(text)}</s></p>`);
    }
    if (chapter.notes) {
      const text = `註 ${chapter.notes}`;
      const id = addSentence(text);
      body.push(`<p><s xml:id="${id}">${escapeXml(text)}</s></p>`);
    }
    if (chapter.closing) {
      const id = addSentence(chapter.closing);
      body.push(`<p><s xml:id="${id}">${escapeXml(chapter.closing)}</s></p>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
<teiHeader>
<fileDesc>
<titleStmt>
<title>國譯法句經</title>
<respStmt>
<persName>立花俊道</persName>
<resp>Translation</resp>
</respStmt>
</titleStmt>
<publicationStmt>
<publisher>國民文庫刊行會</publisher>
<publisher>Wikisource</publisher>
<date when="1918">大正七年（1918）</date>
<availability>
<p xml:id="p-rights-wikitext">Wikisource wikitext: {{PD-Japan-auto-expired|deathyear=1955}} → Category:PD-old-70-expired.</p>
<p xml:id="p-rights-japan">${escapeXml(license.japan)}</p>
<p xml:id="p-rights-us">${escapeXml(license.us)}</p>
<p xml:id="p-rights-japan-template">テンプレート PD-Japan-expired：「この著作物は、環太平洋パートナーシップに関する包括的及び先進的な協定の発効日（2018年12月30日）の時点で著作者の没後50年以上経過しているため、日本においてパブリックドメインの状態にあります。」</p>
<p xml:id="p-rights-note">Published 1918; translator 立花俊道 died 1955. Attribute Wikisource + the 1918 國譯大藏經 edition + translator. Redistribution is allowed (PD).</p>
</availability>
</publicationStmt>
<sourceDesc>
<p xml:id="p-source-work">Wikisource ${escapeXml(workPageUrl)}（revid ${revision.revid}, sha1 ${revision.sha1}, ${revision.timestamp}）</p>
<p xml:id="p-source-index">${escapeXml(indexUrl)}；正文 ProofreadPage quality 3，transcluded from Page:Kokuyakudaizokyo-kyobu-12.pdf/16 through /62.</p>
<p xml:id="p-source-edition">國譯大藏經 經部 第十二卷，國民文庫刊行會，大正七年（1918）。譯者 立花俊道（1877–1955）。巴利《法句》423 偈文語國譯／訓讀體，不是漢譯 T210 的訓讀。</p>
</sourceDesc>
</fileDesc>
</teiHeader>
<text>
<body>
${body.join("\n")}
</body>
</text>
</TEI>
`;
  return { xml: xml.endsWith("\n") ? xml : `${xml}\n`, sentences };
}

const licenseQuotes = {
  wikitext: "{{PD-Japan-auto-expired|deathyear=1955}}",
  category: "PD-old-70-expired",
  japanPage: null,
  usPage: null,
  japanTemplate: "この著作物は、環太平洋パートナーシップに関する包括的及び先進的な協定の発効日（2018年12月30日）の時点で著作者の没後50年以上経過しているため、日本においてパブリックドメインの状態にあります。",
};

let teiXml;
let parseSha256;
let revision;
let work;
let license;

if (verifyMode) {
  teiXml = await readFile(resolve(root, localPath), "utf8");
} else {
  const revisionQuery = fetchJson(apiUrl({
    action: "query",
    titles: workPageTitle,
    prop: "revisions|categories",
    rvprop: "content|ids|timestamp|sha1",
    rvslots: "main",
    cllimit: "20",
  }));
  const page = revisionQuery.query.pages[0];
  revision = page.revisions[0];
  const wikitext = revision.slots.main.content;
  if (!wikitext.includes("{{PD-Japan-auto-expired|deathyear=1955}}")) {
    throw new Error("主頁 wikitext 缺少 PD-Japan-auto-expired|deathyear=1955");
  }
  if (!wikitext.includes('<pages index="Kokuyakudaizokyo-kyobu-12.pdf" from="16" to="62"/>')) {
    throw new Error("主頁未從 Page 16–62 轉入正文");
  }
  const categories = (page.categories ?? []).map((item) => item.title);
  if (!categories.includes("カテゴリ:PD-old-70-expired")) {
    throw new Error(`主頁未列入 PD-old-70-expired：${categories.join(", ")}`);
  }
  const parsed = fetchJson(apiUrl({
    action: "parse",
    page: workPageTitle,
    prop: "text|wikitext|categories",
  }));
  const parseHtml = parsed.parse.text;
  parseSha256 = sha256(parseHtml);
  license = extractLicenseBanner(parseHtml);
  licenseQuotes.japanPage = license.japan;
  licenseQuotes.usPage = license.us;
  if (!license.us.includes("1931年1月1日") || !license.us.includes("パブリックドメイン")) {
    throw new Error("頁面美國公有領域聲明與預期不符");
  }
  if (!license.japan.includes("1955") || !license.japan.includes("パブリックドメイン")) {
    throw new Error("頁面日本／70 年公有領域聲明與預期不符");
  }
  const page16 = fetchJson(apiUrl({
    action: "query",
    titles: "Page:Kokuyakudaizokyo-kyobu-12.pdf/16",
    prop: "pageprops",
  }));
  const quality = page16.query.pages[0]?.pageprops?.proofread_page_quality_level;
  if (quality !== "3") throw new Error(`Page 16 校對品質不是 3：${quality}`);
  work = parseWork(extractPlainBody(parseHtml));
  const built = buildTei({ chapters: work.chapters, license, revision });
  teiXml = built.xml;
  await mkdir(dirname(resolve(root, localPath)), { recursive: true });
  await writeFile(resolve(root, localPath), teiXml, "utf8");
}

const teiBytes = Buffer.from(teiXml, "utf8");
const segments = parseSatReadingLines(teiXml, { canonId: fileId });
const folios = new Set(segments.map((segment) => segment.page)).size;
if (folios !== 26) throw new Error(`應有 26 個 SAT 相容章次，實際 ${folios}`);
if (segments.length < 423) throw new Error(`穩定句段少於 423：${segments.length}`);
const first = segments[0];
const last = segments.at(-1);
if (!/歸命/.test(first.text) && !/^1 /.test(first.text)) {
  throw new Error(`首段不是歸命或第 1 偈：${first.text.slice(0, 40)}`);
}
if (!/423 /.test(segments.map((segment) => segment.text).join("\n")) || !/國譯法句經終/.test(last.text)) {
  throw new Error("未見第 423 偈或終記");
}

const bibliographicRelations = [
  {
    type: "same_work_translation_group_verified",
    groupId: slug,
    label: "國譯法句經／巴利法句",
    evidence: "立花俊道 1918 年《國譯法句經》是巴利《法句》423 偈（雙雙品＝Yamakavagga）的文語國譯／訓讀體日文，不是漢譯 T210 的訓讀。掛接既有作品 gbcr:work:dhammapada-pali，不另建作品，也不把國譯等同佛陀逐字親說。",
    externalIds: {
      wikisource: [workPageTitle],
      suttacentral: ["dhp"],
      translator: ["立花俊道"],
    },
  },
  {
    type: "related_recension_parallel_not_aligned",
    groupId: "dhammapada-family-t0210",
    label: "法句文本家族／T210 平行",
    evidence: "漢譯 T210（gbcr:work:dharmapada-t0210，39 品）與巴利 Dhp 同屬 gbcr:text-family:dhammapada。本表達記錄該家族平行，不與 T210 逐偈對齊，也不合併或新建作品。",
    externalIds: {
      cbeta: ["T0210"],
      suttacentral: ["dhp"],
    },
  },
];

const file = {
  id: fileId,
  slug,
  workId,
  workTitle: "Dhammapada",
  attachToExistingWork: true,
  sourceRole: "kokuyaku_japanese_translation_expression",
  canonicalStatus: "pali_dhammapada_kokuyaku_japanese_translation",
  buddhaWordStatus: "translation_not_verbatim_authorship_claim",
  bibliographicRelations,
  authorityIds: {
    wikisource: workPageTitle,
    suttacentral: "dhp",
    translator: "立花俊道",
    year: "1918",
    parallelWorkId: "gbcr:work:dharmapada-t0210",
  },
  localPath,
  upstreamPath: workPageTitle,
  upstreamUrl: workPageUrl,
  upstreamBytes: verifyMode ? (await readFile(resolve(root, batchPath), "utf8") && JSON.parse(await readFile(resolve(root, batchPath), "utf8"))).files[0].upstreamBytes : Buffer.byteLength(`${revision.slots.main.content}\n`),
  upstreamSha256: verifyMode ? JSON.parse(await readFile(resolve(root, batchPath), "utf8")).files[0].upstreamSha256 : sha256(revision.slots.main.content),
  localBytes: teiBytes.length,
  localSha256: sha256(teiBytes),
  format: "application/tei+xml",
  completeness: "complete_source_file",
  parser: "sat_tei",
  presentation: {
    title: "國譯法句經（立花俊道譯）",
    alternateTitle: "Dhammapada",
    tradition: "上座部佛教 · 小部",
    language: "日文",
    canonRef: "Wikisource 國譯法句經 · 1918",
    translator: "立花俊道",
    summary: "1918 年公有領域文語國譯。對應已持有巴利《法句》，作為既有作品的日文表達，不另建作品。漢譯 T210 只記家族平行，不逐偈對齊。",
    sourceUrl: workPageUrl,
  },
  verification: {
    segments: segments.length,
    folios,
    juanRange: [1, 1],
    juanSequence: [1],
    anchors: [first.id, last.id],
    verseCount: 423,
    chapterCount: 26,
    humanSampleVerified: false,
  },
};

if (verifyMode) {
  const existingBatch = JSON.parse(await readFile(resolve(root, batchPath), "utf8"));
  file.upstreamBytes = existingBatch.files[0].upstreamBytes;
  file.upstreamSha256 = existingBatch.files[0].upstreamSha256;
  revision = existingBatch.upstreamRevision;
  parseSha256 = existingBatch.parseHtmlSha256;
  licenseQuotes.japanPage = existingBatch.rightsDecision.quotedFromPage.japan;
  licenseQuotes.usPage = existingBatch.rightsDecision.quotedFromPage.us;
} else {
  file.upstreamBytes = Buffer.byteLength(revision.slots.main.content);
  file.upstreamSha256 = sha256(revision.slots.main.content);
}

const batch = {
  schema: "https://foxue.ai/schemas/wikisource-kokuyaku-dhp-batch-v1.0",
  version,
  publishedAt: "2026-08-24",
  collection: "Wikisource 國譯法句經 1918",
  rightsCategory: "Wikisource PD Japanese kokuyaku of Pali Dhammapada, 1918 book, translator died 1955",
  upstreamRevision: verifyMode ? revision : {
    revid: revision.revid,
    sha1: revision.sha1,
    timestamp: revision.timestamp,
    pageid: 23782,
  },
  parseHtmlSha256: parseSha256,
  rightsDecision: {
    status: "approved_public_domain_with_attribution",
    commercialUse: "allowed_public_domain",
    redistribution: "allowed",
    quotedFromPage: {
      wikitext: licenseQuotes.wikitext,
      category: licenseQuotes.category,
      japan: licenseQuotes.japanPage,
      us: licenseQuotes.usPage,
      japanTemplate: licenseQuotes.japanTemplate,
    },
    attribution: "Wikisource + 1918 國譯大藏經 經部第十二卷（國民文庫刊行會）+ 譯者 立花俊道",
    reviewedAt: "2026-08-24",
    note: "只收這一本 1918 年已出版的公有領域國譯。不收同一 Index 裡的長老偈、長老尼偈、彌蘭陀王問經。",
  },
  files: [file],
  collectionTotals: {
    newWorks: 0,
    attachedExistingWorks: 1,
    newExpressions: 1,
    newStableSegments: segments.length,
    newFolios: folios,
    workCountingDecision: "國譯法句經掛接既有巴利法句作品，不另建作品，不提高全球佛說作品數，也不改全球覆蓋率。",
  },
};

const ledger = {
  schema: "https://foxue.ai/schemas/gbcr/wikisource-kokuyaku-dhp-ingest-v0.1",
  version,
  generatedAt: "2026-08-24",
  cut: "first_principles_after_pr68",
  ingest: {
    title: "國譯法句經",
    translator: "立花俊道",
    year: 1918,
    expressionSlug: slug,
    workId,
    newWorks: 0,
    newExpressions: 1,
    completeTexts: 1,
    globalCoverage: null,
    dualHumanReview: 0,
    mapping: "Chinese T210 and Pali Dhp are separate works. This 1918 kokuyaku is the Pali 423-verse recension, so it attaches to gbcr:work:dhammapada-pali. T210 is recorded only as a family-level parallel.",
    rights: batch.rightsDecision.quotedFromPage,
  },
  refusals: [
    {
      id: "sat_leftovers",
      result: "already_refused_in_pr68_still_refused",
      note: "SAT 傳記、歎異抄、T2887 疑偽保持排除；不重做 #68。",
    },
    {
      id: "sat_2018_chinese_body",
      result: "refused_non_redistributable",
      note: "SAT 2018 漢文本文庫不可再分發；漢文已由 CBETA 持有。",
    },
    {
      id: "korean_pd_self_jingang_xinjing",
      result: "not_ingested_this_cut",
      note: "朝鮮／韓文維基上的金剛經、心經若只是維基志願者奉獻，不是 1918 年已出版的書，本切入不收。",
    },
    {
      id: "showa_shinsan_amidakyo",
      result: "skipped_already_covered_by_sat_jt0366b",
      note: "昭和新纂國譯大藏經阿彌陀經不收；SAT JT0366b 已是該作品的日文表達。",
    },
    {
      id: "kokuyaku_theragatha_therigatha_milinda",
      result: "refused_not_fosuo_jing",
      note: "同一 Index 的國譯長老偈、長老尼偈、彌蘭陀王問經不是佛說經，本切入不收。",
    },
    {
      id: "g0_g7_dual_human_or_gandhari_or_sat_taisho_crosscheck",
      result: "out_of_scope",
      note: "不啟動雙人覆核、SAT 大正對勘總帳或犍陀羅目錄。",
    },
    {
      id: "global_coverage_claim",
      result: "left_null",
      note: "不宣稱 99.9%，不把全球覆蓋率從 null 改成數字。",
    },
    {
      id: "prerender_261k_folios",
      result: "not_retouched",
      note: "不重做 #66/#67 的全量版頁預渲染。",
    },
  ],
  caveat: "本總帳只證明一份 1918 年公有領域國譯被掛接為既有巴利法句的日文表達。它不構成全球佛陀親說覆蓋率。",
};

const batchRaw = jsonRaw(batch);
const ledgerRaw = jsonRaw(ledger);

if (verifyMode) {
  if (await readFile(resolve(root, batchPath), "utf8") !== batchRaw) throw new Error("kokuyaku-dhp-batch-v1.0.0.json 不可復現");
  if (await readFile(resolve(root, ledgerPath), "utf8") !== ledgerRaw) throw new Error("wikisource-kokuyaku-dhp-ingest-v1.0.0.json 不可復現");
  if (sha256(teiBytes) !== batch.files[0].localSha256) throw new Error("TEI SHA-256 漂移");
  console.log(`Wikisource 國譯法句經審計可復現：1 個日文表達、0 部新作品、${segments.length} 個穩定句段、${folios} 品。`);
} else {
  await writeFile(resolve(root, batchPath), batchRaw, "utf8");
  await writeFile(resolve(root, ledgerPath), ledgerRaw, "utf8");
  console.log(`Wikisource 國譯法句經審計完成：掛接 ${workId}，${segments.length} 句、${folios} 品、0 部新作品。`);
}
