import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-beyond-taisho-sutra.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作樹必須固定到 ${expectedCommit}`);

const xInventoryPath = "data/gbcr/cbeta-xuzangjing-inventory-v0.1.0.json";
const aInventoryPath = "data/gbcr/cbeta-zhaochen-inventory-v0.1.0.json";
const fInventoryPath = "data/gbcr/cbeta-fangshan-inventory-v0.1.0.json";
const [xInventory, aInventory, fInventory] = await Promise.all([
  readFile(resolve(root, xInventoryPath), "utf8").then(JSON.parse),
  readFile(resolve(root, aInventoryPath), "utf8").then(JSON.parse),
  readFile(resolve(root, fInventoryPath), "utf8").then(JSON.parse),
]);
if (xInventory.totals.records !== 1236 || xInventory.totals.upstreamBytes !== 676436667) {
  throw new Error("卍續藏固定來源分母漂移");
}
if (aInventory.totals.records !== 12 || aInventory.totals.upstreamBytes !== 7592001) {
  throw new Error("趙城金藏固定來源分母漂移");
}
if (fInventory.totals.records !== 27 || fInventory.totals.upstreamBytes !== 8371545) {
  throw new Error("房山石經固定來源分母漂移");
}

const workDefinitions = [
  {
    id: "A114n1504",
    workId: "gbcr:work:sanghata-sutra",
    attachToExistingWork: true,
    slug: "zhaochen-sanghata-a1504",
    titleZh: "佛說大乘僧伽吒法義經",
    tradition: "漢傳佛教 · 大集部",
    sourceRole: "translated_canonical_record",
    strictSutraScope: "included_candidate",
    canonicalStatus: "traditional_sutra_chinese_translation",
    buddhaWordStatus: "traditional_sutra_translation_not_verbatim_authorship_claim",
    collectionLabel: "趙城金藏",
    canonRef: "趙城金藏 A114, no. 1504",
    relations: [
      {
        type: "same_work_translation_group_verified",
        groupId: "sanghata-sutra-chinese",
        label: "Saṅghāṭasūtra／《僧伽吒经》汉译组",
        evidence: "題名《佛說大乘僧伽吒法義經》對應 T0424 已登記梵名 Saṅghāṭīsūtradharmaparyāya；宋金總持等譯是大正藏未收的第三個漢譯表達。平台把它加到既有《僧伽吒經》作品，不新建作品，也不把譯文等同佛陀逐字親說。",
        externalIds: { cbeta: ["T0423", "T0424", "A114n1504"] },
      },
    ],
  },
  {
    id: "F02n0069",
    workId: "gbcr:work:fangshan-yinguo-benqi-jing",
    attachToExistingWork: false,
    slug: "fangshan-yinguo-benqi",
    titleZh: "因果本起經",
    tradition: "漢傳佛教 · 本緣部",
    sourceRole: "translated_canonical_record",
    strictSutraScope: "included_candidate",
    canonicalStatus: "traditional_sutra_chinese_translation",
    buddhaWordStatus: "traditional_sutra_translation_not_verbatim_authorship_claim",
    collectionLabel: "房山石經",
    canonRef: "房山石經 F02, no. 69",
    relations: [
      {
        type: "related_benqi_recension_distinct",
        groupId: "fangshan-yinguo-benqi-distinct",
        label: "房山《因果本起經》與大正藏本起經家族",
        evidence: "劉宋求那跋陀羅譯《因果本起經》不見於大正藏 T0184《修行本起經》、T0185《太子瑞應本起經》、T0188《異出菩薩本起經》、T0196《中本起經》。平台建立獨立作品，只保留本起部類關係，不因題名含「本起」而合併。",
        externalIds: { cbeta: ["F02n0069", "T0184", "T0185", "T0188", "T0196"] },
      },
    ],
  },
  {
    id: "F03n0089",
    workId: "gbcr:work:fangshan-hengshui-liushu-jing",
    attachToExistingWork: false,
    slug: "fangshan-hengshui-liushu",
    titleZh: "佛說恒水流樹經",
    tradition: "漢傳佛教 · 阿含部",
    sourceRole: "translated_canonical_record",
    strictSutraScope: "included_candidate",
    canonicalStatus: "traditional_sutra_chinese_translation",
    buddhaWordStatus: "traditional_sutra_translation_not_verbatim_authorship_claim",
    collectionLabel: "房山石經",
    canonRef: "房山石經 F03, no. 89",
    relations: [
      {
        type: "related_agama_recension_distinct",
        groupId: "fangshan-hengshui-liushu-distinct",
        label: "房山《佛說恒水流樹經》與大正藏《恒水經》",
        evidence: "劉宋求那跋陀羅譯《佛說恒水流樹經》與西晉法炬譯 T0033《恒水經》題名相近但譯者不同，且為房山石刻補輯。平台建立獨立作品，不自動與 T0033 合併。",
        externalIds: { cbeta: ["F03n0089", "T0033"] },
      },
    ],
  },
];

const includedIds = new Set(workDefinitions.map((work) => work.id));
const definitionByFile = new Map(workDefinitions.map((work) => [work.id, work]));
if (includedIds.size !== 3) throw new Error("本批次收錄清單應為 3 份來源");

const x01Exclusions = {
  X01n0001: "already_in_taisho_fragment_or_recension",
  X01n0005: "already_in_taisho_compiled_recension",
  X01n0006: "already_in_taisho_variant",
  X01n0008: "already_in_taisho_compiled_recension",
  X01n0010: "suspected_or_indigenous_buddhist_text",
  X01n0011: "suspected_or_indigenous_buddhist_text",
  X01n0012: "suspected_or_indigenous_buddhist_text",
  X01n0013: "suspected_or_indigenous_buddhist_text",
  X01n0014: "suspected_or_indigenous_buddhist_text",
  X01n0015: "already_in_taisho_t85_suspected_text",
  X01n0017: "esoteric_dharani_or_ritual",
  X01n0019: "suspected_or_indigenous_buddhist_text",
  X01n0020: "later_chinese_composition_not_translation",
  X01n0021: "later_chinese_composition_not_translation",
  X01n0023: "suspected_or_indigenous_buddhist_text",
  X01n0024: "suspected_or_indigenous_buddhist_text",
  X01n0025: "suspected_or_indigenous_buddhist_text",
  X01n0026: "suspected_or_indigenous_buddhist_text",
  X01n0027: "suspected_or_indigenous_buddhist_text",
  X01n0028: "already_in_taisho_esoteric",
  X01n0034: "suspected_or_indigenous_buddhist_text",
};

const aExclusions = {
  A091n1057: "commentary_glossary_or_catalog",
  A097n1267: "commentary_glossary_or_catalog",
  A098n1267: "commentary_glossary_or_catalog",
  A110n1490: "commentary_glossary_or_catalog",
  A111n1493: "commentary_glossary_or_catalog",
  A112n1493: "commentary_glossary_or_catalog",
  A112n1494: "commentary_glossary_or_catalog",
  A114n1505: "canonical_vinaya_not_strict_sutra",
  A119n1548: "commentary_glossary_or_catalog",
  A120n1561: "commentary_glossary_or_catalog",
  A121n1561: "commentary_glossary_or_catalog",
};

const fExclusions = {
  F01n0016: "already_in_taisho_t85_suspected_text",
  F02n0041: "canonical_vinaya_not_strict_sutra",
  F03n0088: "esoteric_dharani_or_ritual",
  F03n0100: "commentary_glossary_or_catalog",
  F03n0181: "commentary_glossary_or_catalog",
  F03n0248: "already_in_taisho_t85_suspected_text",
  F12n0546: "commentary_glossary_or_catalog",
  F24n0761: "esoteric_dharani_or_ritual",
  F27n1048: "esoteric_dharani_or_ritual",
  F27n1050: "esoteric_dharani_or_ritual",
  F27n1056: "already_in_taisho_variant",
  F27n1060: "already_in_taisho_variant",
  F27n1061: "esoteric_dharani_or_ritual",
  F27n1062: "esoteric_dharani_or_ritual",
  F27n1063: "esoteric_dharani_or_ritual",
  F27n1064: "esoteric_dharani_or_ritual",
  F28n1071: "esoteric_dharani_or_ritual",
  F28n1072: "commentary_glossary_or_catalog",
  F28n1076: "commentary_glossary_or_catalog",
  F28n1081: "commentary_glossary_or_catalog",
  F28n1082: "commentary_glossary_or_catalog",
  F28n1083: "commentary_glossary_or_catalog",
  F28n1084: "commentary_glossary_or_catalog",
  F29n1098: "non_buddhist_reference",
  F29n1099: "non_buddhist_reference",
};

function classifyRecord(record) {
  const id = record.sourceRecordId;
  if (includedIds.has(id)) return { class: "included_strict_sutra_candidate", reason: "translated_sutra_not_already_held_by_taisho" };
  if (x01Exclusions[id]) return { class: x01Exclusions[id], reason: "x01_filtered" };
  if (aExclusions[id]) return { class: aExclusions[id], reason: "zhaochen_filtered" };
  if (fExclusions[id]) return { class: fExclusions[id], reason: "fangshan_filtered" };
  if (record.volume?.startsWith("X02")) return { class: "esoteric_dharani_or_ritual", reason: "xuzangjing_x02_tantra_dharani_ritual" };
  if (record.volume?.startsWith("X")) return { class: "commentary_glossary_or_catalog", reason: "xuzangjing_commentary_history_liturgy_or_yulu" };
  throw new Error(`${id} 缺少排除分類`);
}

const allRecords = [
  ...xInventory.records.map((record) => ({ ...record, collection: "X" })),
  ...aInventory.records.map((record) => ({ ...record, collection: "A" })),
  ...fInventory.records.map((record) => ({ ...record, collection: "F" })),
];
const classifications = allRecords.map((record) => ({
  sourceRecordId: record.sourceRecordId,
  collection: record.collection,
  volume: record.volume,
  ...classifyRecord(record),
}));
const classifiedIds = new Set(classifications.map((item) => item.sourceRecordId));
if (classifiedIds.size !== allRecords.length) throw new Error("分類未覆蓋全部固定來源記錄");
for (const record of allRecords) {
  if (!classifiedIds.has(record.sourceRecordId)) throw new Error(`未分類：${record.sourceRecordId}`);
}
const includedClassifications = classifications.filter((item) => item.class === "included_strict_sutra_candidate");
if (includedClassifications.length !== 3) {
  throw new Error(`嚴格佛說經收錄應為 3，實際 ${includedClassifications.length}`);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const required = (value, label, id) => {
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};

const files = [];
for (const record of allRecords.filter((item) => includedIds.has(item.sourceRecordId))) {
  const work = definitionByFile.get(record.sourceRecordId);
  const upstream = execFileSync("git", ["-C", sourceRoot, "show", `HEAD:${record.upstreamPath}`], {
    encoding: "buffer",
    maxBuffer: Math.max(record.upstreamBytes + 1024, 16 * 1024 * 1024),
  });
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 上游 Git 物件與清單不一致`);
  }
  const text = upstream.toString("utf8");
  if (!text.includes(`xml:id="${record.sourceRecordId}"`)) {
    throw new Error(`${record.sourceRecordId} TEI 標識不匹配`);
  }
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商業使用與保留頭部聲明`);
  }
  const title = stripXml(required(text.match(/<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/)?.[1], "正藏題名", record.sourceRecordId));
  const author = stripXml(required(text.match(/<author>([\s\S]*?)<\/author>/)?.[1], "譯者", record.sourceRecordId));
  const extent = stripXml(required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷數", record.sourceRecordId));
  if (!title.includes(work.titleZh.replace(/^佛說/, "")) && title !== work.titleZh) {
    throw new Error(`${record.sourceRecordId} 題名「${title}」與收錄清單「${work.titleZh}」不一致`);
  }
  if (!/譯/.test(author)) throw new Error(`${record.sourceRecordId} 不是譯本責任題記：${author}`);

  const segments = parseCbetaReadingLines(text, { canonId: record.sourceRecordId });
  const navigation = buildPageNavigation(segments);
  const numericJuans = [...new Set(segments.map((segment) => segment.juan))].map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan <= numericJuans[index - 1]))) {
    throw new Error(`${record.sourceRecordId} 原始卷次不是嚴格遞增正整數`);
  }
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  const localPath = `data/corpus/cbeta/${record.sourceRecordId}.xml`;
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
    id: record.sourceRecordId,
    slug: work.slug,
    workId: work.workId,
    workTitle: work.titleZh,
    attachToExistingWork: work.attachToExistingWork,
    sourceRole: work.sourceRole,
    canonicalStatus: work.canonicalStatus,
    buddhaWordStatus: work.buddhaWordStatus,
    bibliographicRelations: work.relations,
    authorityIds: { cbetaText: record.sourceRecordId },
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: "complete_source_file",
    presentation: {
      title,
      alternateTitle: work.titleZh,
      tradition: work.tradition,
      language: "漢文",
      canonRef: work.canonRef,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI；這是大正藏未收的漢譯經文表達，不是新的梵本，也不把譯文等同佛陀逐字親說。傳統責任題記：${author}。`,
      sourceUrl: `https://cbetaonline.dila.edu.tw/zh/${record.sourceRecordId}_001`,
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      juanRange: [numericJuans[0], numericJuans.at(-1)],
      juanSequence: numericJuans,
      anchors: [segments[0].id, segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

files.sort((left, right) => left.id.localeCompare(right.id));
const newWorkIds = new Set(files.filter((file) => !file.attachToExistingWork).map((file) => file.workId));
const attachedWorkIds = new Set(files.filter((file) => file.attachToExistingWork).map((file) => file.workId));
const countByClass = Object.fromEntries(
  [...new Set(classifications.map((item) => item.class))].sort().map((item) => [
    item,
    classifications.filter((entry) => entry.class === item).length,
  ]),
);

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-24",
  baseCatalog: null,
  inventories: [xInventoryPath, aInventoryPath, fInventoryPath],
  rightsCategory: "Individually reviewed CBETA TEI files in Zhaochen Jinzang and Fangshan Shijing translated sutras not already held by Taisho; Xuzangjing commentaries, tantra, vinaya, suspected texts and Taisho duplicates excluded",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-BEYOND-TAISHO-SUTRA",
    title: "CBETA 大正藏以外嚴格佛說經過濾批次",
    sourceRecordDenominator: allRecords.length,
    xuzangjingSourceRecords: xInventory.totals.records,
    zhaochenSourceRecords: aInventory.totals.records,
    fangshanSourceRecords: fInventory.totals.records,
    previouslyControlledSourceRecords: 0,
    excludedSourceRecords: allRecords.length - files.length,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanSequence.length, 0),
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    newWorks: newWorkIds.size,
    attachedExistingWorks: attachedWorkIds.size,
    controlledWorks: newWorkIds.size + attachedWorkIds.size,
    strictSutraWorks: workDefinitions.filter((work) => work.strictSutraScope === "included_candidate").length,
    workCountingDecision: "從 X 1,236、A 12、F 27 共 1,275 份固定來源中，只收錄 3 份大正藏未持有的漢譯經文：趙城《佛說大乘僧伽吒法義經》作為既有《僧伽吒經》的第三個表達；房山《因果本起經》《佛說恒水流樹經》各建獨立作品。卍續藏經疏、儀軌、疑偽經、會譯／佚文／異本與房山律、陀羅尼、道教題名保持排除。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_filtered_sutra_inclusion_and_non_sutra_exclusion",
    classifiedSourceRecords: classifications.length,
    classCounts: countByClass,
    excludedSourceRecords: classifications
      .filter((item) => item.class !== "included_strict_sutra_candidate")
      .map((item) => item.sourceRecordId),
    excludedClasses: [...new Set(classifications.filter((item) => item.class !== "included_strict_sutra_candidate").map((item) => item.class))].sort(),
    candidateRelationsNotMerged: [
      "趙城僧伽吒法義經併入既有 sanghata-sutra 作品，不另建作品",
      "房山因果本起經不與 T0184/T0185/T0188/T0196 自動合併",
      "房山恒水流樹經不與 T0033 自動合併",
      "卍續藏 1,236 份來源不以檔案數計入佛說經",
    ],
    caveat: "本批次只證明 3 份過濾後的漢譯經文固定 TEI 被完整保存並可在經藏閱讀。它不把 1,275 份來源記錄、會譯或疑偽經計成全球佛陀親說作品覆蓋率。",
  },
  files,
};

if (
  files.length !== 3 ||
  newWorkIds.size !== 2 ||
  attachedWorkIds.size !== 1 ||
  batch.collection.strictSutraWorks !== 3 ||
  batch.collection.excludedSourceRecords !== 1272
) {
  throw new Error(`大正藏以外佛說經批次計數漂移：${JSON.stringify(batch.collection)}`);
}

const outputPath = resolve(root, `data/corpus/cbeta/beyond-taisho-sutra-batch-v${version}.json`);
const classPath = resolve(root, `data/gbcr/cbeta-beyond-taisho-sutra-filter-v${version}.json`);
const filterAudit = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-beyond-taisho-sutra-filter-v0.1",
  version,
  generatedAt: "2026-08-24",
  sourceCommit: expectedCommit,
  inventories: [xInventoryPath, aInventoryPath, fInventoryPath],
  totals: {
    sourceRecordsAudited: classifications.length,
    included: includedClassifications.length,
    excluded: classifications.length - includedClassifications.length,
    classCounts: countByClass,
  },
  records: classifications,
};
const batchRaw = `${JSON.stringify(batch, null, 2)}\n`;
const filterRaw = `${JSON.stringify(filterAudit, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== batchRaw) throw new Error("beyond-taisho-sutra-batch-v1.0.0.json 不可復現");
  if (await readFile(classPath, "utf8") !== filterRaw) throw new Error("cbeta-beyond-taisho-sutra-filter-v1.0.0.json 不可復現");
  console.log(`CBETA 大正藏以外佛說經審計可復現：收錄 ${files.length}/1275 份來源、新增 ${newWorkIds.size} 個作品、掛接 ${attachedWorkIds.size} 個既有作品。`);
} else {
  await writeFile(outputPath, batchRaw, "utf8");
  await writeFile(classPath, filterRaw, "utf8");
  console.log(`CBETA 大正藏以外佛說經審計完成：收錄 ${files.length}/1275 份來源、新增 ${newWorkIds.size} 個作品、掛接 ${attachedWorkIds.size} 個既有作品；${batch.collection.newStableSegments} 個穩定行段。`);
}
