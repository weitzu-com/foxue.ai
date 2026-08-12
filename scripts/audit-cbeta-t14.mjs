import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.1.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t14.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.0.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T14");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 166) throw new Error(`T14 固定来源分母应为 166，实际为 ${volumeRecords.length}`);
if (candidates.length !== 165) throw new Error(`T14 应新增 165 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 15903183) {
  throw new Error("T14 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, cbeta) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta },
});
const sameWork = (groupId, label, cbeta, evidence = "DILA 佛经目录规范资料库将这些经号互列为相关经典；平台据题名、目录关系与文本范围登记为同一作品的汉文表达，并完整保留各自译者、正文与稳定锚点。") => relation(
  "same_work_translation_group_verified",
  groupId,
  label,
  evidence,
  cbeta,
);
const groups = [
  { ids: ["T0449", "T0450"], workId: "gbcr:work:bhaisajyaguru-vow-sutra", relation: sameWork("bhaisajyaguru-vow-sutra-chinese", "Bhaiṣajyaguruvaiḍūryaprabharāja／《药师如来本愿经》汉译组", ["T0449", "T0450"], "DILA 经录把 T0449、T0450 互列；T0451 扩为七佛本愿，平台只记录相关关系而不把范围扩大的文本强并为同一完整作品。") },
  { ids: ["T0453", "T0454", "T0455"], workId: "gbcr:work:maitreya-descent-sutra", relation: sameWork("maitreya-descent-sutra-chinese", "Maitreya-vyākaraṇa／《弥勒下生成佛经》汉译组", ["T0453", "T0454", "T0455"]) },
  { ids: ["T0461", "T0462"], workId: "gbcr:work:manjusri-ratnakaranda", relation: sameWork("manjusri-ratnakaranda-chinese", "Mañjuśrī-ratnakaraṇḍaka／文殊宝箧经汉译组", ["T0461", "T0462"]) },
  { ids: ["T0464", "T0465", "T0466", "T0467"], workId: "gbcr:work:gaya-sirsa-sutra", relation: sameWork("gaya-sirsa-sutra-chinese", "Gayāśīrṣasūtra／伽耶山顶经汉译组", ["T0464", "T0465", "T0466", "T0467"]) },
  { ids: ["T0468", "T0469"], workId: "gbcr:work:manjusri-pariprccha-alphabet-chapter", relation: sameWork("manjusri-pariprccha-alphabet-chapter", "《文殊师利问经》与字母品独立译出见证", ["T0468", "T0469"], "DILA 经录将 T0469 指向 T0468；T0469 题名明确是第十四字母品的独立译出。平台共享规范作品，但将 T0469 标作部分翻译见证而非另一完整译本。"), partial: ["T0469"] },
  { ids: ["T0470", "T0471"], workId: "gbcr:work:manjusri-carya", relation: sameWork("manjusri-carya-chinese", "《文殊师利巡行经》汉译组", ["T0470", "T0471"]) },
  { ids: ["T0474", "T0476"], workId: "gbcr:work:vimalakirti-nirdesa-t0475", relation: sameWork("vimalakirti-nirdesa-chinese", "Vimalakīrtinirdeśa／《维摩诘经》汉译组", ["T0474", "T0475", "T0476"], "DILA 经录把 T0474、T0475、T0476 互列为相关经典；平台将两条新增译本并入既有 T0475 规范作品，同时保留三译的题名、译者和全文。") },
  { ids: ["T0477", "T0478", "T0479"], workId: "gbcr:work:uttara-raja-sutra", relation: sameWork("uttara-raja-sutra-chinese", "《顶王经》汉译组", ["T0477", "T0478", "T0479"]) },
  { ids: ["T0481", "T0482"], workId: "gbcr:work:dhara-sutra", relation: sameWork("dhara-sutra-chinese", "《持人／持世经》汉译组", ["T0481", "T0482"]) },
  { ids: ["T0509", "T0510"], workId: "gbcr:work:ajatasatru-prophecy", relation: sameWork("ajatasatru-prophecy-chinese", "《阿阇世王授决经》汉译组", ["T0509", "T0510"]) },
  { ids: ["T0514", "T0515", "T0516"], workId: "gbcr:work:prasenajit-admonition", relation: sameWork("prasenajit-admonition-chinese", "《胜军王所问／谏王经》汉译组", ["T0514", "T0515", "T0516"]) },
  { ids: ["T0526", "T0527", "T0528"], workId: "gbcr:work:sravaka-youth", relation: sameWork("sravaka-youth-chinese", "《逝童子／菩萨逝经》汉译组", ["T0526", "T0527", "T0528"]) },
  { ids: ["T0534", "T0535", "T0536"], workId: "gbcr:work:candraprabha-youth", relation: sameWork("candraprabha-youth-chinese", "《月光童子／申日经》汉译组", ["T0534", "T0535", "T0536"]) },
  { ids: ["T0551", "T0552"], workId: "gbcr:work:matangi-woman", relation: sameWork("matangi-woman-chinese", "《摩登女经》汉译组", ["T0551", "T0552"]) },
  { ids: ["T0553", "T0554"], workId: "gbcr:work:amrapali-jivaka", relation: sameWork("amrapali-jivaka-chinese", "《奈女耆婆经》汉译组", ["T0553", "T0554"]) },
  { ids: ["T0557", "T0558"], workId: "gbcr:work:naga-datta-woman", relation: sameWork("naga-datta-woman-chinese", "《龙施女经》汉译组", ["T0557", "T0558"]) },
  { ids: ["T0559", "T0560", "T0561"], workId: "gbcr:work:old-woman-sutra", relation: sameWork("old-woman-sutra-chinese", "《老女人／老母经》汉译组", ["T0559", "T0560", "T0561"]) },
  { ids: ["T0562", "T0563", "T0564"], workId: "gbcr:work:vimaladatta-woman", relation: sameWork("vimaladatta-woman-chinese", "《无垢贤女／转女身经》汉译组", ["T0562", "T0563", "T0564"]) },
  { ids: ["T0565", "T0566"], workId: "gbcr:work:upayakausalya-woman", relation: sameWork("upayakausalya-woman-chinese", "《顺权方便经》汉译组", ["T0565", "T0566"]) },
  { ids: ["T0567", "T0568"], workId: "gbcr:work:brahmin-woman-question", relation: sameWork("brahmin-woman-question-chinese", "《梵志女首意经》汉译组", ["T0567", "T0568"]) },
  { ids: ["T0575", "T0576", "T0577"], workId: "gbcr:work:bhava-sankranti-sutra", relation: sameWork("bhava-sankranti-sutra-chinese", "Bhavasaṅkrāntisūtra／《转有经》汉译组", ["T0575", "T0576", "T0577"]) },
];
const relationByCanonId = new Map();
const decisionByCanonId = new Map();
for (const group of groups) {
  for (const id of group.ids) {
    relationByCanonId.set(id, [group.relation]);
    decisionByCanonId.set(id, {
      workId: group.workId,
      status: group.partial?.includes(id) ? "verified_partial_work_witness" : "verified_same_work_expression",
    });
  }
}

const editionPairs = [
  ["T0446a", "T0446b", "past-thousand-buddha-name-witnesses", "《过去庄严劫千佛名经》版本见证组"],
  ["T0447a", "T0447b", "present-thousand-buddha-name-witnesses", "《现在贤劫千佛名经》版本见证组"],
  ["T0448a", "T0448b", "future-thousand-buddha-name-witnesses", "《未来星宿劫千佛名经》版本见证组"],
  ["T0492a", "T0492b", "ananda-auspicious-witnesses", "《阿难问事佛吉凶经》版本见证组"],
  ["T0540a", "T0540b", "sudatta-witnesses", "《树提伽经》版本见证组"],
  ["T0555a", "T0555b", "five-mothers-witnesses", "《五母子经》版本见证组"],
];
for (const [left, right, groupId, label] of editionPairs) {
  const item = relation(
    "same_work_edition_witness_group_verified",
    groupId,
    label,
    "CBETA 以同一经号的 a/b 记录保存两份可独立校验的文本版本；平台共享规范作品，但保留两份来源资产、字节数与稳定锚点，不把版本见证重复计作独立作品。",
    [left, right],
  );
  for (const id of [left, right]) {
    relationByCanonId.set(id, [item]);
    decisionByCanonId.set(id, { workId: `gbcr:work:${groupId}`, status: "verified_same_work_witness" });
  }
}
const teacherRelated = relation(
  "related_text_scope_not_merged",
  "bhaisajyaguru-text-family",
  "药师如来本愿与七佛本愿相关文本组",
  "DILA 经录把 T0451 与 T0449、T0450 互列，但 T0451 的标题与正文范围扩为七佛本愿。平台记录相关文本组，不在范围差异未经逐章校勘前强行合并为同一完整作品。",
  ["T0449", "T0450", "T0451"],
);
relationByCanonId.set("T0451", [teacherRelated]);

const unknownTranslatorIds = new Set([
  "T0432", "T0441", "T0442", "T0445", "T0446a", "T0446b", "T0447a", "T0447b", "T0448a", "T0448b", "T0457", "T0491", "T0499", "T0520", "T0521", "T0522", "T0523", "T0529", "T0539", "T0552", "T0561", "T0572", "T0579", "T0580",
]);
const editionWitnessIds = new Set(editionPairs.flatMap(([left, right]) => [left, right]));
const partialIds = new Set(["T0469"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const translatorLabel = (author) => ["失譯", "闕譯", "題記未載譯者"].includes(author) ? author : author.replace(/\s+/g, " · ");
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const files = [];

for (const record of candidates) {
  const upstream = await readFile(resolve(sourceRoot, record.upstreamPath));
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) throw new Error(`${record.sourceRecordId} 缺少权利声明`);
  const title = stripXml(matchRequired(text, /<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/, "正藏题名", record.sourceRecordId));
  const authorTag = text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "";
  const author = stripXml(authorTag) || "題記未載譯者";
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan) => !Number.isSafeInteger(juan) || juan < 1) || numericJuans.some((juan, index) => index > 0 && juan !== numericJuans[index - 1] + 1)) {
    throw new Error(`${canonId} 卷次不是连续正整数`);
  }
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  const localPath = `data/corpus/cbeta/${record.sourceRecordId}.xml`;
  const destination = resolve(root, localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${localPath} 已存在但内容不同`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
  }

  const decision = decisionByCanonId.get(canonId);
  const partial = partialIds.has(canonId);
  const sourceRole = partial
    ? "partial_translation_witness"
    : editionWitnessIds.has(canonId)
      ? "edition_witness"
      : unknownTranslatorIds.has(canonId)
        ? "translation_attribution_unknown"
        : "translated_canonical_record";
  const boundarySummary = partial
    ? "本记录完整保存规范作品一品的独立译出，只作部分翻译见证；"
    : sourceRole === "edition_witness"
      ? "本记录与同经号另一版本共享规范作品，版本见证分层计数；"
      : sourceRole === "translation_attribution_unknown"
        ? "目录题记为失译、阙译或未载译者，平台不补造译者归属；"
        : decision
          ? "已由权威目录确认与规范作品的多译本关系；"
          : relationByCanonId.has(canonId)
            ? "已记录相关文本范围，证据不足时不强行合并；"
            : "作品同一性与跨语种平行仍按逐条证据管理；";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: decision?.workId ?? `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: decision?.status ?? "provisional_canon_record",
    sourceRole,
    ...(relationByCanonId.has(canonId) ? { bibliographicRelations: relationByCanonId.get(canonId) } : {}),
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: partial ? "complete_source_file_partial_work_witness" : "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 經集部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、作品、表达与版本见证分层计数。`,
      sourceUrl: `https://cbetaonline.dila.edu.tw/zh/${canonId}_001`,
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      juanRange: [numericJuans[0], numericJuans.at(-1)],
      anchors: [segments[0].id, segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.8",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v2.0.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T14 source-record closure",
  collection: {
    id: "CBETA-TAISHO-T14",
    title: "大正藏 T14 经集部固定来源记录",
    sourceRecordDenominator: 166,
    previouslyControlledSourceRecords: 1,
    newSourceRecords: files.length,
    controlledSourceRecords: 166,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedSameWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_same_work_witness").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => unknownTranslatorIds.has(file.id)).length,
    workCountingDecision: "T14 固定来源共 166 条，其中既有 T0475 已受控；165 条新增记录保持独立可寻址，并新增 127 个作品实体：21 组权威目录支持的同作品汉译（其中维摩经组并入既有作品）、6 组 a/b 版本见证、1 条部分译出见证与 101 条暂定书目记录分层登记。T0451 与药师经群只记录范围相关，不在七佛本愿与单佛本愿未逐章校勘前强行合并。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_edition_witnesses_partial_translation_and_scope_boundaries_recorded",
    verifiedSameWorkGroups: groups.map((group) => group.relation.groupId),
    editionWitnessGroups: editionPairs.map(([, , groupId]) => groupId),
    partialTranslationWitnesses: ["T0469"],
    attributionCaveats: [...unknownTranslatorIds],
    scopeBoundaries: ["T0451"],
    caveat: "T14 经集部含大量短经、异译、同经号版本与部分独立译出；平台仅据 DILA 经录互列和明确文本范围合并，未列关系的经号继续保留暂定书目实体。",
  },
  workOverrides: {
    "gbcr:work:vimalakirti-nirdesa-t0475": {
      canonicalTitle: "Vimalakīrtinirdeśa／《维摩诘经》",
      bibliographicRelations: [groups.find((group) => group.workId === "gbcr:work:vimalakirti-nirdesa-t0475").relation],
    },
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 165 ||
  batch.collection.newSourceBytes !== 15903183 ||
  batch.collection.verifiedSameWorkExpressions !== 51 ||
  batch.collection.verifiedSameWorkWitnesses !== 12 ||
  batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  batch.collection.provisionalRecords !== 101 ||
  batch.collection.fullSourceTexts !== 164 ||
  batch.collection.partialSourceWitnesses !== 1 ||
  batch.collection.relationAnnotatedRecords !== 65 ||
  batch.collection.attributionBoundaryRecords !== 24
) throw new Error(`T14 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T14 审计完成：166/166 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
