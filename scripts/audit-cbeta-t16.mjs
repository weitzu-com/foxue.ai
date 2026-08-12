import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.3.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t16.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.2.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T16");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 65 || candidates.length !== 62) {
  throw new Error(`T16 固定来源分母或新增记录数漂移：${volumeRecords.length}/${candidates.length}`);
}
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 11363551) {
  throw new Error("T16 新增来源字节数漂移");
}
const precontrolledIds = volumeRecords.filter((record) => controlledPaths.has(record.upstreamPath)).map((record) => record.canonWitnessId);
if (JSON.stringify(precontrolledIds) !== JSON.stringify(["T0670", "T0671", "T0672"])) {
  throw new Error(`T16 既有受控记录漂移：${precontrolledIds.join(",")}`);
}

const relation = (type, groupId, label, evidence, cbeta) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta },
});
const genericEvidence = "冻结版 CBETA TEI 的 cb:docNumber 与 DILA 佛经目录规范资料库互列这些经号；平台结合规范题名、译者题记、目录互见和文本范围，登记同一作品的汉文表达或见证，同时保留各自全文与稳定锚点。";
const group = (ids, workId, groupId, label, options = {}) => ({
  ids,
  workId,
  partial: options.partial ?? [],
  compiled: options.compiled ?? [],
  relation: relation(options.type ?? "same_work_translation_group_verified", groupId, label, options.evidence ?? genericEvidence, ids),
});
const groups = [
  group(["T0658", "T0659"], "gbcr:work:ratnamegha-t0658", "ratnamegha-t0658-t0659", "Ratnameghasūtra／《宝云经》汉译组"),
  group(["T0661", "T0662"], "gbcr:work:manjusri-pariprccha-hundred-merits", "hundred-merits-t0661-t0662", "Mañjuśrīparipṛcchā／《百福相经》两译组", {
    evidence: "CBETA 与 DILA 均把 T0661、T0662 互列并登记同一 Mañjuśrīparipṛcchā；两篇题记分别署地婆诃罗“译”与“再译”，平台登记为同一作品的两次汉译表达。",
  }),
  group(["T0663", "T0664", "T0665"], "gbcr:work:suvarnaprabhasa-t0663", "suvarnaprabhasa-t0663-t0665", "Suvarṇaprabhāsa／《金光明经》译本与合部见证组", {
    compiled: ["T0664"],
    type: "same_work_translations_and_compiled_version_verified",
    evidence: "DILA 将三经互列并登记同一 Suvarṇaprabhāsa；T0663、T0665 是译本，T0664 题记和目录明载隋宝贵“合／Compilation”。平台共享规范作品，但把 T0664 保留为合部编纂见证。",
  }),
  group(["T0666", "T0667"], "gbcr:work:tathagatagarbha-sutra-t0666", "tathagatagarbha-t0666-t0667", "Tathāgatagarbhasūtra／《如来藏经》汉译组"),
  group(["T0673", "T0674"], "gbcr:work:mahayana-abhisamaya-t0673", "mahayana-abhisamaya-t0673-t0674", "Mahāyānābhisamaya／《大乘同性经》汉译组"),
  group(["T0675", "T0676", "T0677", "T0678", "T0679"], "gbcr:work:samdhinirmocana-t0675", "samdhinirmocana-t0675-t0679", "Sandhīnirmocanasūtra／《解深密经》全译与单品译出组", {
    partial: ["T0677", "T0678", "T0679"],
    type: "same_work_translations_with_partial_witnesses_verified",
    evidence: "CBETA 目录头与 DILA 将 T0675–T0679 归于 Sandhīnirmocanasūtra；T0675、T0676 是五卷完整译本，T0677 对应 T0675 第2–5品／T0676 第2品，T0678 对应第10品／第7品，T0679 对应第11品／第8品。后三条只计单品翻译见证。",
  }),
  group(["T0681", "T0682"], "gbcr:work:ghanavyuha-t0681", "ghanavyuha-t0681-t0682", "Ghanavyūhasūtra／《大乘密严经》汉译组"),
  group(["T0685", "T0686"], "gbcr:work:ullambana-t0685", "ullambana-t0685-t0686", "《盂兰盆经》完整文本与短本见证组", {
    partial: ["T0686"],
    type: "same_work_with_abridged_witness_verified",
    evidence: "CBETA 目录将 T0685、T0686 互列；正文复核显示 T0686 仅 359 个规范汉字段内容，压缩保留目连救母与设盆供僧主干，明显短于 T0685 的完整叙事与问答。平台将 T0686 作为短本见证，不重复计作完整译本。",
  }),
  group(["T0688", "T0689"], "gbcr:work:adbhuta-t0688", "adbhuta-t0688-t0689", "《未曾有／甚希有经》汉译组"),
  group(["T0692", "T0693"], "gbcr:work:tathagata-image-installation-t0692", "image-installation-t0692-t0693", "Tathāgatapratibimbapratiṣṭhānuśaṃsā／造佛形像经汉译组"),
  group(["T0695", "T0696"], "gbcr:work:buddha-image-washing-t0695", "image-washing-t0695-t0696", "《灌洗佛形像经》汉译组"),
  group(["T0697", "T0698"], "gbcr:work:buddha-bathing-merit-t0697", "buddha-bathing-t0697-t0698", "《浴像功德经》汉译组"),
  group(["T0708", "T0709", "T0710", "T0711", "T0712"], "gbcr:work:salistamba-t0708", "salistamba-t0708-t0712", "Śālistambasūtra／《稻芉经》汉译组"),
  group(["T0713", "T0714", "T0715"], "gbcr:work:nidana-sutra-t0713", "nidana-t0713-t0715", "Nidānasūtra／《缘起圣道经》汉译组"),
  group(["T0716", "T0717"], "gbcr:work:pratitya-samutpada-adi-vibhanga-t0716", "dependent-origination-analysis-t0716-t0717", "《缘生初胜分法本经》汉译组"),
];
const lankavataraRelation = relation(
  "same_work_translation_group_verified",
  "lankavatara-t0670-t0672",
  "Laṅkāvatārasūtra／《楞伽经》汉译组",
  "冻结版 CBETA TEI 与 DILA 将 T0670、T0671、T0672 互列；三条既有受控完整译本已共享同一规范作品，本批补齐目录关系与来源角色证据。",
  ["T0670", "T0671", "T0672"],
);

const relationByCanonId = new Map();
const decisionByCanonId = new Map();
for (const item of groups) {
  for (const id of item.ids) {
    relationByCanonId.set(id, [item.relation]);
    decisionByCanonId.set(id, {
      workId: item.workId,
      status: item.partial.includes(id)
        ? "verified_partial_work_witness"
        : item.compiled.includes(id)
          ? "verified_compiled_version_witness"
          : "verified_same_work_expression",
    });
  }
}

const partialIds = new Set(groups.flatMap((item) => item.partial));
const compiledIds = new Set(groups.flatMap((item) => item.compiled));
const unknownTranslatorIds = new Set(["T0686", "T0687", "T0688", "T0692", "T0693", "T0707", "T0709", "T0712", "T0720"]);
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
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "") || "題記未載譯者";
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const docNumber = stripXml(matchRequired(text, /<cb:docNumber>([\s\S]*?)<\/cb:docNumber>/, "目录互见号", record.sourceRecordId));
  const canonId = record.canonWitnessId;
  if (relationByCanonId.has(canonId) && !docNumber.includes("[")) throw new Error(`${canonId} 缺少预期目录互见号`);
  if (canonId === "T0662" && !text.includes("地婆訶羅再譯")) throw new Error("T0662 再译题记漂移");
  if (canonId === "T0664" && !text.includes("寶貴合")) throw new Error("T0664 合部题记漂移");
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
  const sourceRole = compiledIds.has(canonId)
    ? "compiled_canonical_witness"
    : partial
      ? canonId === "T0686" ? "abridged_translation_witness" : "partial_translation_witness"
      : unknownTranslatorIds.has(canonId)
        ? "translation_attribution_unknown"
        : "translated_canonical_record";
  const boundarySummary = compiledIds.has(canonId)
    ? "题记与权威目录明确为合部编纂，平台保留编纂见证角色；"
    : partial
      ? canonId === "T0686"
        ? "本记录完整保存短本来源文件，但只作同作品的节本见证；"
        : "本记录完整保存单品独立译出，只作部分翻译见证；"
      : unknownTranslatorIds.has(canonId)
        ? "目录题记为失译或阙译，平台不补造译者归属；"
        : decision
          ? "已由权威目录、规范题名与明确文本范围确认同作品关系；"
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
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、作品、表达、编纂本与局部见证分层计数。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.9",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v2.2.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T16 source-record closure",
  workOverrides: {
    "gbcr:work:lankavatara-t0670": {
      canonicalTitle: "楞伽經",
      sourceRole: "translated_canonical_record",
      bibliographicRelations: [lankavataraRelation],
    },
  },
  collection: {
    id: "CBETA-TAISHO-T16",
    title: "大正藏 T16 经集部固定来源记录",
    sourceRecordDenominator: 65,
    previouslyControlledSourceRecords: 3,
    newSourceRecords: files.length,
    controlledSourceRecords: 65,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedCompiledVersionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_compiled_version_witness").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    previouslyControlledRelationRecords: 3,
    attributionBoundaryRecords: files.filter((file) => unknownTranslatorIds.has(file.id) || compiledIds.has(file.id)).length,
    newWorks: 39,
    workCountingDecision: "T16 共 65 条固定来源记录，其中 T0670–T0672 已受控，本批新增 62 条表达或见证与 39 个作品实体：15 组同作品汉译、合部或局部见证，24 条暂定书目记录。T0677–T0679 与 T0686 只计局部或短本见证，T0664 只计合部编纂见证；既有楞伽三译补齐关系证据但不重复新增。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_partial_and_compiled_witnesses_attribution_boundaries_recorded",
    verifiedSameWorkGroups: [...groups.map((item) => item.relation.groupId), lankavataraRelation.groupId],
    partialTranslationWitnesses: [...partialIds],
    compiledVersionWitnesses: [...compiledIds],
    attributionCaveats: [...unknownTranslatorIds],
    existingControlledTranslationGroup: ["T0670", "T0671", "T0672"],
    authoritySource: "https://authority.dila.edu.tw/catalog/",
    embeddedAuthorityEvidence: "冻结 CBETA TEI 的 cb:docNumber 目录互见号",
    caveat: "T16 含异译、同译者再译、合部编纂、单品独立译出与短本；目录互见只作为候选关系，平台再结合题记和文本范围决定表达、编纂见证或部分见证，不把相关经典机械强并。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 62 ||
  batch.collection.newSourceBytes !== 11363551 ||
  batch.collection.verifiedSameWorkExpressions !== 33 ||
  batch.collection.verifiedCompiledVersionWitnesses !== 1 ||
  batch.collection.verifiedPartialWorkWitnesses !== 4 ||
  batch.collection.provisionalRecords !== 24 ||
  batch.collection.fullSourceTexts !== 58 ||
  batch.collection.partialSourceWitnesses !== 4 ||
  batch.collection.relationAnnotatedRecords !== 38 ||
  batch.collection.attributionBoundaryRecords !== 10
) throw new Error(`T16 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T16 审计完成：65/65 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
