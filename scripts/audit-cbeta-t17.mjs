import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.4.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t17.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.3.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T17");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 131 || candidates.length !== 129) {
  throw new Error(`T17 固定来源分母或新增记录数漂移：${volumeRecords.length}/${candidates.length}`);
}
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 14726248) {
  throw new Error("T17 新增来源字节数漂移");
}
const precontrolledIds = volumeRecords.filter((record) => controlledPaths.has(record.upstreamPath)).map((record) => record.canonWitnessId);
if (JSON.stringify(precontrolledIds) !== JSON.stringify(["T0784", "T0842"])) {
  throw new Error(`T17 既有受控记录漂移：${precontrolledIds.join(",")}`);
}

const relation = (type, groupId, label, evidence, cbeta, externalIds = {}) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta, ...externalIds },
});
const genericEvidence = "冻结版 CBETA TEI 的目录互见、DILA 佛经目录规范资料库的规范题名或梵名，以及译者题记共同支持这些经号属于同一作品；平台保留各自全文、来源资产与稳定锚点。";
const sameWork = (ids, workId, groupId, label, evidence = genericEvidence) => ({
  ids,
  workId,
  relation: relation("same_work_translation_group_verified", groupId, label, evidence, ids),
});
const editionGroup = (ids, workId, groupId, label, evidence) => ({
  ids,
  workId,
  edition: ids,
  relation: relation("same_work_edition_witness_group_verified", groupId, label, evidence, ids),
});
const groups = [
  editionGroup(["T0747a", "T0747b"], "gbcr:work:karmic-retribution-five-paths-t0747", "t0747-edition-witnesses", "《罪福报应经》a/b 版本见证组", "两份固定 TEI 记录使用同一大正藏经号、同署求那跋陀罗译，题名和正文主干相合；平台登记为同一作品的两个独立版本见证。"),
  { ...sameWork(["T0751a", "T0751b", "T0752"], "gbcr:work:five-non-reversals-t0751", "five-non-reversals-t0751-t0752", "《五无反复经》版本与经号见证组", "T0751a、T0751b 使用同一经号且同署沮渠京声译；DILA 将 T0751a 与 T0752 互列，T0751b 与 T0752 正文高度相合。平台共享作品实体，但保留三份来源记录。"), edition: ["T0751a", "T0751b"] },
  sameWork(["T0762", "T0763"], "gbcr:work:decisive-meaning-t0762", "decisive-meaning-t0762-t0763", "《决定义经》汉译组"),
  sameWork(["T0780", "T0781"], "gbcr:work:buddha-ten-powers-t0780", "buddha-ten-powers-t0780-t0781", "《佛十力经》汉译组"),
  sameWork(["T0787", "T0788"], "gbcr:work:rosary-merit-t0787", "rosary-merit-t0787-t0788", "《校量数珠功德经》汉译组"),
  editionGroup(["T0794a", "T0794b"], "gbcr:work:proper-time-t0794", "t0794-edition-witnesses", "《时非时经》a/b 版本见证组", "两份固定 TEI 记录使用同一大正藏经号、相同题名并同署若罗严译；平台登记为同一作品的两个独立版本见证。"),
  editionGroup(["T0797a", "T0797b"], "gbcr:work:poor-old-man-t0797", "t0797-edition-witnesses", "《贫穷老公经》a/b 版本见证组", "两份固定 TEI 记录使用同一大正藏经号、相同题名并同署慧简译；平台登记为同一作品的两个独立版本见证。"),
  sameWork(["T0808", "T0809"], "gbcr:work:calf-light-t0808", "calf-light-t0808-t0809", "《犊子／乳光佛经》汉译组"),
  sameWork(["T0813", "T0814"], "gbcr:work:no-hope-elephant-armpit-t0813", "no-hope-elephant-armpit-t0813-t0814", "《无希望／象腋经》汉译组"),
  sameWork(["T0815", "T0816"], "gbcr:work:trayastrimsa-divine-feet-t0815", "trayastrimsa-divine-feet-t0815-t0816", "《昇忉利天／道神足经》汉译组"),
  sameWork(["T0817", "T0818"], "gbcr:work:great-pure-dharma-gate-t0817", "great-pure-dharma-gate-t0817-t0818", "《大净法门经》汉译组"),
  sameWork(["T0822", "T0823", "T0824"], "gbcr:work:king-of-all-dharmas-t0822", "king-of-all-dharmas-t0822-t0824", "《诸法勇王经》汉译组"),
  sameWork(["T0828", "T0829", "T0830"], "gbcr:work:wordless-jewel-casket-t0828", "wordless-jewel-casket-t0828-t0830", "《无字宝箧经》汉译组", "CBETA 与 DILA 将 T0828–T0830 互列；T0830 题记明载地婆诃罗“再译”。平台登记为同一作品的三个汉文表达。"),
  sameWork(["T0833", "T0834"], "gbcr:work:supreme-truth-victory-t0833", "supreme-truth-victory-t0833-t0834", "《第一义法胜经》汉译组"),
  sameWork(["T0835", "T0836"], "gbcr:work:tathagata-lion-roar-t0835", "tathagata-lion-roar-t0835-t0836", "《如来师子吼经》汉译组"),
  sameWork(["T0837", "T0838"], "gbcr:work:arousing-bodhicitta-t0837", "arousing-bodhicitta-t0837-t0838", "《出生菩提心经》汉译组"),
  sameWork(["T0840", "T0841"], "gbcr:work:praising-mahayana-merit-t0840", "praising-mahayana-merit-t0840-t0841", "《称赞大乘功德经》汉译组"),
];

const candidate = (ids, groupId, label, evidence, externalIds = {}) => relation(
  "same_work_candidate_unmerged",
  groupId,
  label,
  evidence,
  ids,
  externalIds,
);
const candidatesNotMerged = [
  candidate(["T0721", "T0722"], "smrtyupasthana-t0721-t0722-candidate", "Smṛtyupasthāna 相关文本候选", "DILA 为两条记录登记相关梵名，但两者篇幅相差悬殊且目录未互列；未完成章节级包含关系校勘前保持为两个暂定作品。"),
  candidate(["T0758", "T0801"], "anityata-t0758-t0801-candidate", "Anityatāsūtra 相关文本候选", "DILA 为两条记录登记 Anityatāsūtra 题名，但正文范围和长度不同且目录未互列；平台记录候选关系，不自动合并。"),
  candidate(["T0772", "T0773"], "caturdharmaka-t0772-t0773-candidate", "Caturdharmakasūtra 同题同译者候选", "两经同署地婆诃罗译并共享 Caturdharmakasūtra 规范题名，但目录未互列；短文差异可能涉及异版或不同小经，证据不足时保持独立。"),
  candidate(["T0811", "T0831"], "buddhaksepana-t0811-t0831-candidate", "Buddhakṣepana 相关文本候选", "DILA 题名资料显示相关标签，但正文相似度低且目录未互列；平台公开候选，不作作品级合并。"),
  candidate(["T0666", "T0667", "T0821"], "tathagatagarbha-t0821-candidate", "Tathāgatagarbha 相关文本候选", "DILA 为 T0821 登记 Tathāgatagarbhasūtra 相关梵名，但未与 T0666、T0667 互列；在取得章节对应或梵藏平行证据前，T0821 保持独立暂定作品。"),
];

const relationByCanonId = new Map();
const decisionByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationByCanonId.set(id, [...(relationByCanonId.get(id) ?? []), item]);
};
for (const item of groups) {
  for (const id of item.ids) {
    addRelation([id], item.relation);
    decisionByCanonId.set(id, {
      workId: item.workId,
      status: item.edition?.includes(id) ? "verified_edition_witness" : "verified_same_work_expression",
    });
  }
}
for (const item of candidatesNotMerged) {
  addRelation(item.externalIds.cbeta.filter((id) => id.startsWith("T0") && !["T0666", "T0667"].includes(id)), item);
}

const editionIds = new Set(groups.flatMap((item) => item.edition ?? []));
const unknownTranslatorIds = new Set(["T0740", "T0746", "T0748", "T0749", "T0750", "T0768", "T0785", "T0786", "T0795", "T0800", "T0805", "T0806", "T0819", "T0821", "T0825"]);
const authoredOrCompiledIds = new Set(["T0723", "T0726", "T0727", "T0728", "T0790", "T0847"]);
const indigenousCompositionIds = new Set(["T0839"]);
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
  if (canonId === "T0830" && !text.includes("地婆訶羅再譯")) throw new Error("T0830 再译题记漂移");
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
  const sourceRole = editionIds.has(canonId)
    ? "edition_witness"
    : authoredOrCompiledIds.has(canonId)
      ? "attributed_authored_or_compiled_text"
      : indigenousCompositionIds.has(canonId)
        ? "indigenous_composition_candidate"
        : unknownTranslatorIds.has(canonId)
          ? "translation_attribution_unknown"
          : "translated_canonical_record";
  const boundarySummary = editionIds.has(canonId)
    ? "本记录是同一作品的独立版本见证；"
    : authoredOrCompiledIds.has(canonId)
      ? "题记、题名或权威目录显示为撰、集、抄或诸经要集，平台不把编撰角色改写成佛陀亲说；"
      : indigenousCompositionIds.has(canonId)
        ? "传统目录保留译者署名，但现代目录研究支持中国撰述可能；平台公开争议，不作印度译经定论；"
        : unknownTranslatorIds.has(canonId)
          ? "目录题记为失译或未载译者，平台不补造译者归属；"
          : decision
            ? "已由权威目录、规范题名与文本范围确认同作品关系；"
            : relationByCanonId.has(canonId)
              ? "只记录相关文本候选，证据不足时不强行合并；"
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
    completeness: "complete_source_file",
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

const tathagatagarbhaCandidate = candidatesNotMerged.find((item) => item.groupId === "tathagatagarbha-t0821-candidate");
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-13",
  baseCatalog: "data/corpus/cbeta/catalog-v2.3.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T17 source-record closure",
  workOverrides: {
    "gbcr:work:tathagatagarbha-sutra-t0666": {
      bibliographicRelations: [tathagatagarbhaCandidate],
    },
  },
  collection: {
    id: "CBETA-TAISHO-T17",
    title: "大正藏 T17 经集部固定来源记录",
    sourceRecordDenominator: 131,
    previouslyControlledSourceRecords: 2,
    newSourceRecords: files.length,
    controlledSourceRecords: 131,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => unknownTranslatorIds.has(file.id) || authoredOrCompiledIds.has(file.id) || indigenousCompositionIds.has(file.id)).length,
    newWorks: 109,
    workCountingDecision: "T17 共 131 条固定来源记录，其中 T0784、T0842 已受控；本批新增 129 条表达或见证与 109 个作品实体。37 条有充分目录、题名或版本证据的记录归入 17 个作品，92 条保持暂定书目实体；另有 9 条只公开候选关系而不强行合并。a/b 版本见证不重复计作独立作品，失译、撰集、节抄与疑似中国撰述分别保留来源边界。",
  },
  boundaryAudit: {
    status: "verified_translation_and_edition_groups_candidate_relations_authorship_and_attribution_boundaries_recorded",
    verifiedSameWorkGroups: groups.map((item) => item.relation.groupId),
    editionWitnesses: [...editionIds],
    candidateRelationsNotMerged: candidatesNotMerged.map((item) => item.groupId),
    attributionCaveats: [...unknownTranslatorIds],
    authoredOrCompiledTexts: [...authoredOrCompiledIds],
    indigenousCompositionCandidates: [...indigenousCompositionIds],
    existingControlledRecords: ["T0784", "T0842"],
    authoritySources: [
      "https://authority.dila.edu.tw/catalog/",
      "https://dazangthings.nz/cbc/text/363/",
      "https://dazangthings.nz/cbc/text/369/",
      "https://dazangthings.nz/cbc/text/375/"
    ],
    caveat: "T17 含异译、同经号 a/b 版本、失译短经、撰集与诸经要集；平台只有在目录互见、规范题名和文本范围形成足够证据链时合并。共享梵名但未互列、篇幅差异过大或文本相似度不足者一律保留独立暂定作品。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 129 ||
  batch.collection.newSourceBytes !== 14726248 ||
  batch.collection.verifiedSameWorkExpressions !== 29 ||
  batch.collection.verifiedEditionWitnesses !== 8 ||
  batch.collection.provisionalRecords !== 92 ||
  batch.collection.fullSourceTexts !== 129 ||
  batch.collection.partialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 46 ||
  batch.collection.attributionBoundaryRecords !== 22
) throw new Error(`T17 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T17 审计完成：131/131 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
