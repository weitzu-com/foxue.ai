import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation } from "../src/lib/cbeta-tei.mjs";
import { extractSatTitle, extractSatTranslators, parseSatReadingLines } from "../src/lib/sat-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const expectedCommitNote = "SAT現代日本語訳仏典 CC BY 4.0 固定下載；不抓 SAT 2018 漢文本文庫";

const workDefinitions = [
  {
    id: "JT0353b",
    taisho: "T0353",
    workId: "gbcr:work:taisho-t0353",
    slug: "sat-ja-t0353",
    titleZh: "勝鬘師子吼一乘大方便方廣經",
    titleJa: "勝鬘師子吼一乗大方便方広経",
    tradition: "漢傳佛教 · 寶積部",
    expectedBytes: 143022,
    translators: ["松本知己", "真野新也", "大久保良峻"],
  },
  {
    id: "JT0360b",
    taisho: "T0360",
    workId: "gbcr:work:larger-sukhavati-vyuha-t0360",
    slug: "sat-ja-t0360",
    titleZh: "佛說無量壽經",
    titleJa: "佛説無量壽經",
    tradition: "漢傳佛教 · 寶積部",
    expectedBytes: 295888,
    translators: ["ダニエル ウィックスロトーム", "亀山隆彦", "壬生泰紀", "野呂靖"],
  },
  {
    id: "JT0365b",
    taisho: "T0365",
    workId: "gbcr:work:amitayurdhyana-sutra-t0365",
    slug: "sat-ja-t0365",
    titleZh: "佛說觀無量壽佛經",
    titleJa: "佛説觀無量壽佛經",
    tradition: "漢傳佛教 · 寶積部",
    expectedBytes: 145456,
    translators: ["ダニエル ウィックスロトーム", "亀山隆彦", "壬生泰紀", "野呂靖"],
  },
  {
    id: "JT0366b",
    taisho: "T0366",
    workId: "gbcr:work:smaller-sukhavati-vyuha-t0366",
    slug: "sat-ja-t0366",
    titleZh: "佛說阿彌陀經",
    titleJa: "佛説阿彌陀經",
    tradition: "漢傳佛教 · 寶積部",
    expectedBytes: 58033,
    translators: ["ダニエル ウィックスロトーム", "亀山隆彦", "壬生泰紀", "野呂靖"],
  },
];

const refusedSatTitles = {
  T2046: "biography_not_fosuo",
  T2047: "biography_not_fosuo",
  T2063: "biography_not_fosuo",
  T2661: "tannisho_not_fosuo",
  T2887: "suspected_or_indigenous_buddhist_text",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const verifyMode = process.argv.includes("--verify");
const files = [];

for (const work of workDefinitions) {
  const sourceUrl = `https://21dzk.l.u-tokyo.ac.jp/SATm/${work.id}.xml`;
  const localPath = `data/corpus/sat/${work.id}.xml`;
  let upstream;
  if (verifyMode) {
    const normalized = await readFile(resolve(root, localPath));
    if (!normalized.toString("utf8").endsWith("\n")) throw new Error(`${localPath} 缺少固定末尾 LF`);
    upstream = normalized.subarray(0, normalized.length - 1);
  } else {
    upstream = execFileSync("curl", ["-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "90", sourceUrl], {
      encoding: "buffer",
      maxBuffer: 2 * 1024 * 1024,
    });
  }
  if (upstream.length !== work.expectedBytes) {
    throw new Error(`${work.id} 上游位元組數漂移：${upstream.length}`);
  }
  const text = upstream.toString("utf8");
  if (!text.includes("creativecommons.org/licenses/by/4.0")) {
    throw new Error(`${work.id} 缺少 CC BY 4.0 聲明`);
  }
  if (!text.includes("SAT大蔵経テキストデータベース研究会")) {
    throw new Error(`${work.id} 缺少 SAT 研究会署名`);
  }
  const title = extractSatTitle(text);
  if (title !== work.titleJa) throw new Error(`${work.id} 題名「${title}」與收錄清單不一致`);
  const translators = extractSatTranslators(text);
  if (JSON.stringify(translators) !== JSON.stringify(work.translators)) {
    throw new Error(`${work.id} 譯者漂移：${translators.join(" · ")}`);
  }
  const segments = parseSatReadingLines(text, { canonId: work.id });
  const navigation = buildPageNavigation(segments);
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  const destination = resolve(root, localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${localPath} 已存在但內容不同`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
  }

  files.push({
    id: work.id,
    slug: work.slug,
    workId: work.workId,
    workTitle: work.titleZh,
    attachToExistingWork: true,
    sourceRole: "modern_japanese_translation_expression",
    canonicalStatus: "traditional_sutra_modern_japanese_translation",
    buddhaWordStatus: "translation_not_verbatim_authorship_claim",
    bibliographicRelations: [
      {
        type: "same_work_translation_group_verified",
        groupId: `sat-ja-${work.taisho.toLowerCase()}`,
        label: `SAT 現代日本語訳／${work.titleZh}`,
        evidence: `SAT現代日本語訳仏典 ${work.id} 對應已持有漢文 ${work.taisho}；掛接既有作品，不新建作品，也不把現代日譯等同佛陀逐字親說。`,
        externalIds: { cbeta: [work.taisho], sat: [work.id] },
      },
    ],
    authorityIds: { satText: work.id, cbetaText: work.taisho },
    localPath,
    upstreamPath: `${work.id}.xml`,
    upstreamUrl: sourceUrl,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: "complete_source_file",
    parser: "sat_tei",
    presentation: {
      title: `${work.titleJa}（現代日本語訳）`,
      alternateTitle: work.titleZh,
      tradition: work.tradition,
      language: "日文",
      canonRef: `SAT現代日本語訳 ${work.taisho}`,
      translator: `${translators.join(" · ")} · SAT大蔵経テキストデータベース研究会`,
      summary: `SAT 現代日本語訳。CC BY 4.0。對應已持有漢文 ${work.taisho}，作為既有作品的日文表達，不另建作品。署名：SAT大蔵経テキストデータベース研究会；譯者 ${translators.join("、")}。`,
      sourceUrl: "https://21dzk.l.u-tokyo.ac.jp/SATm/",
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      juanRange: [1, 1],
      juanSequence: [1],
      anchors: [segments[0].id, segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

files.sort((left, right) => left.id.localeCompare(right.id));

const batch = {
  schema: "https://foxue.ai/schemas/sat-modern-japanese-batch-v1.0",
  version,
  publishedAt: "2026-08-24",
  rightsCategory: "SAT modern Japanese sutra translations, CC BY 4.0, attribution to SAT Daizokyo Text Database Study Group and named translators",
  collection: {
    id: "SAT-MODERN-JAPANESE-FOSUO",
    title: "SAT 現代日本語訳佛說經批次",
    sourceRecordDenominator: 9,
    includedSourceRecords: files.length,
    excludedSourceRecords: 5,
    newWorks: 0,
    attachedExistingWorks: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    workCountingDecision: "9 份 SAT 現代日本語訳中只收 4 份已持有佛說的日譯：T0353、T0360、T0365、T0366。T2046/T2047/T2063 是傳記，T2661 是歎異抄，T2887 父母恩重經是疑偽／中國撰述。日譯掛接既有作品，提高譯文覆蓋，不增加全球佛說作品數。",
  },
  boundaryAudit: {
    status: "verified_cc_by_4_and_fosuo_subset",
    refusedSatTitles,
    note: expectedCommitNote,
    caveat: "本批次只證明 4 份 CC BY 4.0 日譯被完整保存並可在經藏閱讀。它不把 SAT 2018 漢文本文庫、國譯大藏經殘缺條目或國譯一切經現代重印計入。",
  },
  files,
};

if (files.length !== 4 || batch.collection.newWorks !== 0 || batch.collection.attachedExistingWorks !== 4) {
  throw new Error(`SAT 日譯批次計數漂移：${JSON.stringify(batch.collection)}`);
}

const filterAudit = {
  schema: "https://foxue.ai/schemas/gbcr/sat-modern-japanese-filter-v0.1",
  version,
  generatedAt: "2026-08-24",
  source: {
    site: "https://21dzk.l.u-tokyo.ac.jp/SATm/",
    license: "CC BY 4.0",
    attribution: "SAT大蔵経テキストデータベース研究会 and named translators",
  },
  totals: {
    titlesAdvertised: 9,
    included: 4,
    excluded: 5,
  },
  included: files.map((file) => file.id),
  excluded: Object.entries(refusedSatTitles).map(([id, reason]) => ({ id, reason })),
};

const batchPath = resolve(root, `data/corpus/sat/modern-japanese-batch-v${version}.json`);
const filterPath = resolve(root, `data/gbcr/sat-modern-japanese-filter-v${version}.json`);
const batchRaw = `${JSON.stringify(batch, null, 2)}\n`;
const filterRaw = `${JSON.stringify(filterAudit, null, 2)}\n`;

if (process.argv.includes("--verify")) {
  if (await readFile(batchPath, "utf8") !== batchRaw) throw new Error("modern-japanese-batch-v1.0.0.json 不可復現");
  if (await readFile(filterPath, "utf8") !== filterRaw) throw new Error("sat-modern-japanese-filter-v1.0.0.json 不可復現");
  for (const file of files) {
    const existing = await readFile(resolve(root, file.localPath));
    if (sha256(existing) !== file.localSha256) throw new Error(`${file.localPath} SHA-256 漂移`);
  }
  console.log(`SAT 現代日本語訳審計可復現：收錄 ${files.length}/9、掛接 ${files.length} 個既有作品。`);
} else {
  await mkdir(dirname(batchPath), { recursive: true });
  await writeFile(batchPath, batchRaw, "utf8");
  await writeFile(filterPath, filterRaw, "utf8");
  console.log(`SAT 現代日本語訳審計完成：收錄 ${files.length}/9、${batch.collection.newStableSegments} 個穩定句段。`);
}
