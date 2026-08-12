import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.2.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t15.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.1.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T15");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 71 || candidates.length !== 71) {
  throw new Error(`T15 固定来源分母或新增记录数漂移：${volumeRecords.length}/${candidates.length}`);
}
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 16533763) {
  throw new Error("T15 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, cbeta) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta },
});
const sameWork = (groupId, label, cbeta, evidence = "DILA 佛经目录规范资料库将这些经号互列为相关经典；平台结合题名、译者、目录互列和文本范围，登记为同一规范作品的汉文表达，并保留各自正文与稳定锚点。") => relation(
  "same_work_translation_group_verified",
  groupId,
  label,
  evidence,
  cbeta,
);
const groups = [
  { ids: ["T0585", "T0586", "T0587"], workId: "gbcr:work:brahma-visesa-cinti-pariprccha", relation: sameWork("brahma-visesa-cinti-pariprccha-chinese", "Viśeṣacintibrahmaparipṛcchā／《思益梵天所问经》汉译组", ["T0585", "T0586", "T0587"]) },
  { ids: ["T0622", "T0623"], workId: "gbcr:work:svayam-pratijna-samadhi", relation: sameWork("svayam-pratijna-samadhi-chinese", "《自誓三昧经》汉译组", ["T0622", "T0623"]) },
  { ids: ["T0624", "T0625"], workId: "gbcr:work:druma-kinnara-raja-pariprccha", relation: sameWork("druma-kinnara-raja-pariprccha-chinese", "Drumakinnararājaparipṛcchā／《大树紧那罗王所问经》汉译组", ["T0624", "T0625"]) },
  { ids: ["T0626", "T0627", "T0628", "T0629"], workId: "gbcr:work:ajatasatru-kaukrtya-vinodana", relation: sameWork("ajatasatru-kaukrtya-vinodana-chinese", "Ajātaśatrukaukṛtyavinodanā／《阿阇世王经》汉译与别品译出组", ["T0626", "T0627", "T0628", "T0629"], "DILA 经录将 T0626–T0629 互列；T0629 校注明确为《普超经》第二品别译。平台令前三条完整译本与 T0629 部分翻译见证共享规范作品，不把别品译出重复计作完整译本。"), partial: ["T0629"] },
  { ids: ["T0632", "T0633", "T0634"], workId: "gbcr:work:tathagata-jnana-mudra-samadhi", relation: sameWork("tathagata-jnana-mudra-samadhi-chinese", "《慧印／如来智印／大乘智印经》汉译组", ["T0632", "T0633", "T0634"]) },
  { ids: ["T0636", "T0637"], workId: "gbcr:work:ananta-ratna-samadhi", relation: sameWork("ananta-ratna-samadhi-chinese", "《无极宝／宝如来三昧经》汉译组", ["T0636", "T0637"]) },
  { ids: ["T0639", "T0640"], workId: "gbcr:work:samadhi-raja", relation: sameWork("samadhi-raja-t0639-t0640", "Samādhirāja／《月灯三昧经》与独立译出见证", ["T0639", "T0640"], "DILA 经录将 T0639、T0640 互列，T0640 版本校注明载与 T0639 第八卷同本。平台将 T0640 标作部分翻译见证；T0641 虽同题同译者，但目录未互列且文本范围未定，暂不并入。"), partial: ["T0640"] },
  { ids: ["T0645", "T0646"], workId: "gbcr:work:niyata-aniyata-avatara-mudra", relation: sameWork("niyata-aniyata-avatara-mudra-chinese", "《定不定印经》汉译组", ["T0645", "T0646"]) },
  { ids: ["T0650", "T0651", "T0652"], workId: "gbcr:work:sarva-dharma-apravrtti", relation: sameWork("sarva-dharma-apravrtti-chinese", "《诸法无行／本无／随转宣说诸法经》汉译组", ["T0650", "T0651", "T0652"]) },
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

const practiceTextFamily = relation(
  "related_text_family_scope_not_merged",
  "yogacara-bhumi-of-practice-t0606-t0608",
  "《修行道地》相关文本家族",
  "DILA 经录把 T0606、T0607、T0608 互列，T0606 序与 T0607 题记并指僧伽罗刹撰造；但七卷、一卷与短本的具体包含关系尚未经逐章校勘。平台记录文本家族关系，不把三条记录强并为同一完整表达。",
  ["T0606", "T0607", "T0608"],
);
for (const id of ["T0606", "T0607", "T0608"]) relationByCanonId.set(id, [practiceTextFamily]);
const moonLampBoundary = relation(
  "related_text_shared_title_attribution_not_merged",
  "moon-lamp-t0640-t0641-boundary",
  "T0640/T0641 同题同译者范围待定组",
  "T0641 与 T0640 同题且同署先公译，但 DILA 经录未将 T0641 与 T0639/T0640 互列，T0641 正文又从段落中部起。未取得范围证据前，平台只记录同题同署候选关系，不把 T0641 计作已验证同作品表达或版本。",
  ["T0640", "T0641"],
);
relationByCanonId.get("T0640").push(moonLampBoundary);
relationByCanonId.set("T0641", [moonLampBoundary]);

const unknownTranslatorIds = new Set(["T0596", "T0609", "T0610", "T0629", "T0633", "T0644"]);
const authoredOrCompiledIds = new Set(["T0606", "T0607", "T0619"]);
const partialIds = new Set(groups.flatMap((group) => group.partial ?? []));
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
    : authoredOrCompiledIds.has(canonId)
      ? "attributed_authored_or_compiled_text"
      : unknownTranslatorIds.has(canonId)
        ? "translation_attribution_unknown"
        : "translated_canonical_record";
  const boundarySummary = partial
    ? "本记录完整保存规范作品一部分的独立译出，只作部分翻译见证；"
    : authoredOrCompiledIds.has(canonId)
      ? "题记或正文序文指向撰造或编纂文本，平台不把作者角色改写成佛说译经；"
      : unknownTranslatorIds.has(canonId)
        ? "目录题记为失译或阙译，平台不补造译者归属；"
        : decision
          ? "已由权威目录与明确文本范围确认多译本关系；"
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
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、作品、表达与局部见证分层计数。`,
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
  baseCatalog: "data/corpus/cbeta/catalog-v2.1.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T15 source-record closure",
  collection: {
    id: "CBETA-TAISHO-T15",
    title: "大正藏 T15 经集部固定来源记录",
    sourceRecordDenominator: 71,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: 71,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => unknownTranslatorIds.has(file.id) || authoredOrCompiledIds.has(file.id)).length,
    workCountingDecision: "T15 共 71 条固定来源记录，新增 57 个作品实体：9 组经权威目录与文本范围支持的同作品汉译或局部译出、48 条暂定书目记录。T0629 与 T0640 只计部分翻译见证；T0606–T0608 和 T0641 仅保留文本家族或同题同署关系，不在范围未经逐章校勘前强行合并。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_partial_witnesses_authorship_and_scope_boundaries_recorded",
    verifiedSameWorkGroups: groups.map((group) => group.relation.groupId),
    partialTranslationWitnesses: [...partialIds],
    attributionCaveats: [...unknownTranslatorIds],
    authoredOrCompiledTexts: [...authoredOrCompiledIds],
    scopeBoundaries: ["T0606", "T0607", "T0608", "T0641"],
    authoritySource: "https://authority.dila.edu.tw/catalog/",
    caveat: "T15 含三昧经、禅观撰述、短经、异译与单品独立译出；平台仅在 DILA 经录互列且文本范围明确时合并，卷数或起讫范围未定者保持独立暂定书目实体。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 71 ||
  batch.collection.newSourceBytes !== 16533763 ||
  batch.collection.verifiedSameWorkExpressions !== 21 ||
  batch.collection.verifiedPartialWorkWitnesses !== 2 ||
  batch.collection.provisionalRecords !== 48 ||
  batch.collection.fullSourceTexts !== 69 ||
  batch.collection.partialSourceWitnesses !== 2 ||
  batch.collection.relationAnnotatedRecords !== 27 ||
  batch.collection.attributionBoundaryRecords !== 9
) throw new Error(`T15 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T15 审计完成：71/71 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
