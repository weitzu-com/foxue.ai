import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.5.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-prajnaparamita.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.4.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => ["T05", "T06", "T07", "T08"].includes(record.volume));
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 57) throw new Error(`T05–T08 固定来源分母应为 57，实际为 ${volumeRecords.length}`);
if (candidates.length !== 39) throw new Error(`T05–T08 应新增 39 个来源记录，实际为 ${candidates.length}`);
if (candidates.some((record) => record.volume !== "T08")) throw new Error("T05–T07 除既有 T0220 外不应存在新增记录");
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 11312892) {
  throw new Error("T05–T08 新增来源字节数漂移");
}

const largePrajnaparamitaRelation = {
  type: "recension_family_verified",
  groupId: "large-prajnaparamita-chinese",
  label: "二万五千颂般若汉译与《大般若经》第二会",
  evidence: "DILA 经录与 84000 的《二万五千颂般若》导言共同关联 T0221、T0222、T0223 和 T0220 第二会，并提醒不同底本之间存在复杂亲疏关系；因此确认为文本家族，不直接合并为同一表达。",
  externalIds: { cbeta: ["T0220(2)", "T0221", "T0222", "T0223"], toh: ["toh9"] },
};
const eightThousandRelation = {
  type: "recension_family_verified",
  groupId: "eight-thousand-prajnaparamita-chinese",
  label: "八千颂般若汉译与《大般若经》第四、第五会",
  evidence: "84000 的《八千颂般若》导言和 IRIAB 校勘研究把 T0224–T0228 及 T0220 第四、第五会列为同一文本家族的不同译本或经会；版本差异未完成逐章裁决前不合并作品。",
  externalIds: { cbeta: ["T0220(4)", "T0220(5)", "T0224", "T0225", "T0226", "T0227", "T0228"], toh: ["toh12"] },
};
const verseSummaryRelation = {
  type: "related_distinct_work_verified",
  groupId: "prajnaparamita-verse-summary",
  label: "般若摄颂／宝德藏偈文本",
  evidence: "T0229 题名与目录对应 Prajñāpāramitā-ratnaguṇasaṃcayagāthā；84000 将其作为概括般若义的独立偈颂作品列于八千颂之后，因此只建立相关作品关系。",
  externalIds: { cbeta: ["T0229"], toh: ["toh13"] },
};
const namesRelation = {
  type: "cross_language_title_candidate",
  groupId: "prajnaparamita-one-hundred-eight-names",
  label: "般若波罗蜜多一百八名文本",
  evidence: "T0230 的题名明确为般若波罗蜜多一百八名陀罗尼；84000 藏经目录另列同名的一百八名体裁作品 Toh 25。现只登记跨语种题名候选，等待内容级对齐。",
  externalIds: { cbeta: ["T0230"], toh: ["toh25"] },
};
const suvikrantavikraminRelation = {
  type: "assembly_parallel_verified",
  groupId: "suvikrantavikramin-chinese",
  label: "《胜天王般若》与《大般若经》第六会",
  evidence: "DILA 经录把 T0231 明确关联到 T0220 第六会；在《大般若经》分会组件模型完成前，两者保留为独立可寻址表达。",
  externalIds: { cbeta: ["T0220(6)", "T0231"], toh: ["toh14"] },
};
const manjusriRelation = {
  type: "same_work_and_assembly_candidate",
  groupId: "manjusri-prajnaparamita-chinese",
  label: "文殊般若汉译与《大般若经》第七会",
  evidence: "DILA 经录把 T0232、T0233 与 T0220 第七会列为相关经典；卷数和文本形态不同，须完成逐段对齐后再决定是否合并作品。",
  externalIds: { cbeta: ["T0220(7)", "T0232", "T0233"], toh: ["toh24"] },
};
const nagasriRelation = {
  type: "assembly_parallel_verified",
  groupId: "nagasri-prajnaparamita-chinese",
  label: "《濡首菩萨经》与《大般若经》第八会",
  evidence: "DILA 经录把 T0234 明确关联到 T0220 第八会；在经会组件与版本见证层建立前不把整部《大般若经》和本经合并计数。",
  externalIds: { cbeta: ["T0220(8)", "T0234"] },
};
const diamondRelation = {
  type: "same_work_translation_group_verified",
  groupId: "vajracchedika-chinese",
  label: "Vajracchedikā／《金刚般若经》汉译组",
  evidence: "DILA 经录和 84000 均把 T0235–T0239 与 T0220 第九会识别为 Vajracchedikā 的汉译或经会表达；平台据此共享一个规范作品实体，但完整保留各译本。T0236a/b 的署名与见证差异仍单独记录。",
  externalIds: { cbeta: ["T0220(9)", "T0235", "T0236a", "T0236b", "T0237", "T0238", "T0239"], toh: ["toh16"] },
};
const reasonRelation = {
  type: "text_family_verified",
  groupId: "prajnaparamita-naya-chinese",
  label: "般若理趣汉译与扩展文本家族",
  evidence: "DILA 经录把 T0240–T0244 与 T0220 第十会列为相关经典；其中短译、密教化表达和七卷扩展本层次不同，故只建立文本家族，不合并为单一作品。",
  externalIds: { cbeta: ["T0220(10)", "T0240", "T0241", "T0242", "T0243", "T0244"], toh: ["toh17"] },
};
const humaneKingRelation = {
  type: "same_work_candidate",
  groupId: "humane-king-prajnaparamita-chinese",
  label: "《仁王般若》两译候选组",
  evidence: "DILA 经录将 T0245 与 T0246 互列为相关经典；两者内容和真言段落存在差异，来源与成书问题尚需专门复核，当前不合并。",
  externalIds: { cbeta: ["T0245", "T0246"] },
};
const fiftyLinesRelation = {
  type: "cross_language_title_candidate",
  groupId: "prajnaparamita-fifty-lines",
  label: "五十颂般若跨语种候选",
  evidence: "T0248 的题名与 84000 般若部目录所列《五十颂般若》相合；尚未逐偈对齐，先登记题名级候选。",
  externalIds: { cbeta: ["T0248"], toh: ["toh18"] },
};
const kausikaRelation = {
  type: "cross_language_parallel_candidate",
  groupId: "kausika-prajnaparamita",
  label: "帝释／Kauśika 般若跨语种候选",
  evidence: "T0249 以帝释为题，84000 的 Kauśika 般若明确讨论对应汉译；现登记跨语种候选，等待逐句对齐后确认作品边界。",
  externalIds: { cbeta: ["T0249"], toh: ["toh19"] },
};
const heartRelation = {
  type: "same_work_recension_group_verified",
  groupId: "prajnaparamita-hrdaya-chinese",
  label: "Hṛdaya／《般若心经》汉译与长短本组",
  evidence: "84000《心经》导言把 T0250、T0251 归入短本见证，把 T0252–T0255、T0257 归入长本见证，并指出传统译者署名与成书史仍有争议；平台共享一个规范作品实体，同时保留长短本和每项署名。",
  externalIds: { cbeta: ["T0250", "T0251", "T0252", "T0253", "T0254", "T0255", "T0257"], toh: ["toh21"] },
};
const heartTransliterationRelation = {
  type: "transliteration_witness_candidate",
  groupId: "prajnaparamita-hrdaya-transliteration",
  label: "《心经》梵汉对音见证",
  evidence: "T0256 以梵汉对音和音注保存《心经》读诵见证，不是另一部独立汉译；在见证层模型完成前保留为单独书目实体。",
  externalIds: { cbeta: ["T0256"], relatedWork: ["gbcr:work:prajnaparamita-hrdaya"] },
};
const fewSyllablesRelation = {
  type: "cross_language_title_candidate",
  groupId: "prajnaparamita-few-syllables",
  label: "小字／少字般若跨语种候选",
  evidence: "T0258 的“小字般若”题名与 84000 所列少字般若体裁相合；现仅登记题名级候选，等待梵藏汉内容对齐。",
  externalIds: { cbeta: ["T0258"], toh: ["toh22"] },
};

const relationByCanonId = new Map();
const addRelation = (canonIds, relation) => {
  for (const canonId of canonIds) {
    relationByCanonId.set(canonId, [...(relationByCanonId.get(canonId) ?? []), relation]);
  }
};
addRelation(["T0221", "T0222"], largePrajnaparamitaRelation);
addRelation(["T0224", "T0225", "T0226", "T0227", "T0228"], eightThousandRelation);
addRelation(["T0229"], verseSummaryRelation);
addRelation(["T0230"], namesRelation);
addRelation(["T0231"], suvikrantavikraminRelation);
addRelation(["T0232", "T0233"], manjusriRelation);
addRelation(["T0234"], nagasriRelation);
addRelation(["T0236a", "T0236b", "T0237", "T0238", "T0239"], diamondRelation);
addRelation(["T0236a", "T0236b"], {
  type: "same_translation_witness_candidate",
  groupId: "vajracchedika-bodhiruci-witnesses",
  label: "T0236a/b 菩提流支署名见证组",
  evidence: "DILA 分别保存同题、同传统译者署名的 T0236a 与 T0236b；CBETA 研究讨论另提示 T0236b 与 T0237 接近且署名可能有争议，因此保留两个表达并标记待复核。",
});
addRelation(["T0240", "T0241", "T0242", "T0243", "T0244"], reasonRelation);
addRelation(["T0245", "T0246"], humaneKingRelation);
addRelation(["T0248"], fiftyLinesRelation);
addRelation(["T0249"], kausikaRelation);
addRelation(["T0250", "T0252", "T0253", "T0254", "T0255", "T0257"], heartRelation);
addRelation(["T0256"], heartTransliterationRelation);
addRelation(["T0258"], fewSyllablesRelation);

const verifiedWorkIds = new Map([
  ...["T0236a", "T0236b", "T0237", "T0238", "T0239"].map((id) => [id, "gbcr:work:vajracchedika-prajnaparamita"]),
  ...["T0250", "T0252", "T0253", "T0254", "T0255", "T0257"].map((id) => [id, "gbcr:work:prajnaparamita-hrdaya"]),
]);
const sourceRoles = new Map([
  ["T0236b", "traditional_translation_attribution_disputed"],
  ["T0250", "traditional_translation_attribution_disputed"],
  ["T0256", "liturgical_transliteration_witness"],
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const translatorLabel = (author) => author === "失譯" ? author : author.replace(/\s+/g, " · ");
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const files = [];

for (const record of candidates) {
  const upstream = await readFile(resolve(sourceRoot, record.upstreamPath));
  if (
    upstream.length !== record.upstreamBytes ||
    gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 ||
    upstream.at(-1) === 10
  ) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业使用与保留头部声明`);
  }
  const title = matchRequired(
    text,
    /<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/,
    "正藏题名",
    record.sourceRecordId,
  );
  const author = text.match(/<author>([^<]+)<\/author>/)?.[1]?.trim()
    || stripXml(matchRequired(text, /<byline>([\s\S]*?)<\/byline>/, "译者或题记", record.sourceRecordId));
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (
    numericJuans.some((juan) => !Number.isSafeInteger(juan) || juan < 1) ||
    numericJuans.some((juan, index) => index > 0 && juan !== numericJuans[index - 1] + 1)
  ) throw new Error(`${canonId} 卷次不是连续正整数`);

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

  const verifiedWorkId = verifiedWorkIds.get(canonId);
  const sourceRole = sourceRoles.get(canonId) ?? "translated_canonical_record";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: verifiedWorkId ?? `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: verifiedWorkId ? "verified_same_work_expression" : "provisional_canon_record",
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
    completeness: "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 般若部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 文本与可校验页栏行锚点；${verifiedWorkId ? "已由权威目录确认与规范作品的译本或长短本关系，并保留为独立文本表达；" : "作品同一性、经会关系与跨语种平行仍按逐条证据管理；"}一个物理记录不自动等同于一部全球去重佛经。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.5",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v1.4.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T05–T08 source-record closure",
  workOverrides: {
    "gbcr:work:maha-prajnaparamita-t0220": {
      bibliographicRelations: [
        largePrajnaparamitaRelation,
        eightThousandRelation,
        suvikrantavikraminRelation,
        manjusriRelation,
        nagasriRelation,
        diamondRelation,
        reasonRelation,
      ],
    },
    "gbcr:work:maha-prajnaparamita-t0223": {
      bibliographicRelations: [largePrajnaparamitaRelation],
    },
    "gbcr:work:vajracchedika-prajnaparamita": {
      bibliographicRelations: [diamondRelation],
    },
    "gbcr:work:prajnaparamita-hrdaya": {
      bibliographicRelations: [heartRelation],
    },
  },
  collection: {
    id: "CBETA-TAISHO-T05-T08",
    title: "大正藏 T05–T08 般若部固定来源记录",
    sourceRecordDenominator: 57,
    previouslyControlledSourceRecords: 18,
    newSourceRecords: files.length,
    controlledSourceRecords: 57,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => sourceRoles.has(file.id)).length,
    workCountingDecision: "39 个新增来源记录全部保留为独立文本表达。依据 DILA 与 84000 的明确目录证据，金刚经五个新增译本和心经六个新增长短本分别并入既有规范作品；其余 28 个记录仍为 provisional_canon_record。大品、八千颂和《大般若经》各会只登记关系，不因题名相近而贸然合并。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_and_relation_candidates_recorded",
    verifiedSameWorkGroups: ["vajracchedika-chinese", "prajnaparamita-hrdaya-chinese"],
    assemblyRelations: ["suvikrantavikramin-chinese", "manjusri-prajnaparamita-chinese", "nagasri-prajnaparamita-chinese"],
    recensionFamilies: ["large-prajnaparamita-chinese", "eight-thousand-prajnaparamita-chinese", "prajnaparamita-naya-chinese"],
    crossLanguageCandidates: ["prajnaparamita-one-hundred-eight-names", "prajnaparamita-fifty-lines", "kausika-prajnaparamita", "prajnaparamita-few-syllables"],
    attributionCaveats: ["T0236b", "T0250", "T0256"],
    caveat: "经会平行、文本家族和题名级跨语种候选不会触发作品合并；只有权威目录明确且作品边界足够稳定的金刚经、心经译本组共享规范作品实体。",
  },
  files,
};
if (
  batch.collection.newStableSegments !== 60230 ||
  batch.collection.newFolios !== 2201 ||
  batch.collection.verifiedSameWorkExpressions !== 11 ||
  batch.collection.provisionalRecords !== 28 ||
  batch.collection.relationAnnotatedRecords !== 35 ||
  batch.collection.attributionBoundaryRecords !== 3
) {
  throw new Error(`T05–T08 新增结构、关系或作品边界统计漂移：${JSON.stringify({
    newStableSegments: batch.collection.newStableSegments,
    newFolios: batch.collection.newFolios,
    verifiedSameWorkExpressions: batch.collection.verifiedSameWorkExpressions,
    provisionalRecords: batch.collection.provisionalRecords,
    relationAnnotatedRecords: batch.collection.relationAnnotatedRecords,
    attributionBoundaryRecords: batch.collection.attributionBoundaryRecords,
  })}`);
}
await writeFile(
  resolve(root, `data/corpus/cbeta/batch-v${version}.json`),
  `${JSON.stringify(batch, null, 2)}\n`,
  "utf8",
);
console.log(
  `CBETA 般若部审计完成：T05–T08 57/57 个固定来源记录；新增 ${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段。`,
);
