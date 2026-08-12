import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.9.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t12.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.8.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T12");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 76) throw new Error(`T12 固定来源分母应为 76，实际为 ${volumeRecords.length}`);
if (candidates.length !== 71) throw new Error(`T12 应新增 71 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 11111518) {
  throw new Error("T12 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, cbeta, extra = {}) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta, ...extra },
});
const sameWork = (groupId, label, evidence, cbeta, extra) => relation(
  "same_work_translation_group_verified",
  groupId,
  label,
  evidence,
  cbeta,
  extra,
);
const ratnakutaComponents = relation(
  "collection_component_translation_verified",
  "maharatnakuta-component-translations-t12",
  "Mahāratnakūṭa／《大宝积经》合集会与 T12 独立流通译本",
  "DILA 经录逐条把 T0321–T0354 对应到 T0310《大宝积经》的具体会。平台记录合集组件关系，不把单会的独立译本冒充整部一百二十卷合集的另一完整译本。",
  ["T0310", "T0321-T0354"],
);
const ugra = sameWork(
  "ugra-pariprccha-chinese",
  "Ugraparipṛcchā／郁伽长者所问汉译组",
  "DILA 经录为 T0322、T0323 登记共同梵名 Ugra(datta)paripṛcchā，并互列且共同对应 T0310 第十九会。",
  ["T0322", "T0323", "T0310(19)"],
  { toh: ["toh63"] },
);
const upali = relation(
  "same_work_translation_and_partial_witness_group_verified",
  "upali-pariprccha-chinese",
  "Upāliparipṛcchā／优波离所问汉译与礼忏节译见证",
  "DILA 经录把 T0325、T0326 共同对应 T0310 第二十四会；84000《律决定·优波离所问》导言进一步说明 T0326 只保存该作品的一部分。平台把 T0325 记为完整译本、T0326 记为节译见证。",
  ["T0325", "T0326", "T0310(24)"],
  { toh: ["toh68"] },
);
const surata = sameWork("surata-pariprccha-chinese", "Surataparipṛcchā／须赖所问汉译组", "DILA 经录把 T0328、T0329 互列，并共同对应 T0310 第二十七会。", ["T0328", "T0329", "T0310(27)"]);
const viradatta = sameWork("viradatta-pariprccha-chinese", "Vīradattaparipṛcchā／无畏授所问汉译组", "DILA 经录为 T0330、T0331 登记共同梵名并互列，且共同对应 T0310 第二十八会。", ["T0330", "T0331", "T0310(28)"]);
const udayana = sameWork("udayana-vatsaraja-pariprccha-chinese", "Udayanavatsarājaparipṛcchā／优填王所问汉译组", "DILA 经录为 T0332、T0333 登记共同梵名并互列，且共同对应 T0310 第二十九会。", ["T0332", "T0333", "T0310(29)"]);
const sumati = sameWork("sumati-darika-pariprccha-chinese", "Sumatidārikāparipṛcchā／须摩提女所问汉译组", "DILA 经录把 T0334、T0335、T0336 互列，并共同对应 T0310 第三十会。", ["T0334", "T0335", "T0336", "T0310(30)"]);
const vimaladatta = sameWork("vimala-datta-pariprccha-chinese", "Vimaladattāparipṛcchā／离垢施女所问汉译组", "DILA 经录为 T0338、T0339 登记共同梵名并互列，且共同对应 T0310 第三十三会。", ["T0338", "T0339", "T0310(33)"]);
const susthitamati = sameWork("susthitamati-devaputra-pariprccha-chinese", "Suṣṭhitamatidevaputraparipṛcchā／善住意天子所问汉译组", "DILA 经录为 T0341、T0342 登记共同梵名并互列，且共同对应 T0310 第三十六会。", ["T0341", "T0342", "T0310(36)"]);
const simha = sameWork("simha-pariprccha-chinese", "Siṃhaparipṛcchā／阿阇世王子所问汉译组", "DILA 经录为 T0343、T0344 登记共同梵名并互列，且共同对应 T0310 第三十七会。", ["T0343", "T0344", "T0310(37)"]);
const upaya = sameWork("upaya-kaushalya-chinese", "Upāyakauśalya／大乘善巧方便汉译组", "DILA 经录把 T0345、T0346 互列，并共同对应 T0310 第三十八会。", ["T0345", "T0346", "T0310(38)"]);
const kashyapa = sameWork("kashyapa-parivarta-chinese", "Kāśyapaparivarta／大迦叶问汉译组", "DILA 经录为 T0350、T0351、T0352 登记共同梵名并互列，且共同对应 T0310 第四十三会。", ["T0350", "T0351", "T0352", "T0310(43)"]);
const ratnakutaSutra = sameWork("ratnakuta-sutra-t0355-chinese", "Ratnakūṭasūtra／入法界体性汉译组", "DILA 经录为 T0355、T0356 登记共同梵名 Ratnakūṭasūtra 并互列；本组与《大宝积经》合集名称相近，但不据名称直接合并为整部合集。", ["T0355", "T0356"]);
const buddhaRealm = sameWork("sarvabuddha-vishaya-avatarajnanaloka-alamkara-chinese", "Sarvabuddhaviṣayāvatārajñānālokālaṃkāra 汉译组", "DILA 经录为 T0357、T0358、T0359 登记共同梵名并互列。", ["T0357", "T0358", "T0359"]);
const largerSukhavati = relation(
  "same_work_translation_and_compilation_group_verified",
  "larger-sukhavati-vyuha-chinese",
  "Sukhāvatīvyūha／《无量寿经》汉译与校辑见证组",
  "DILA 经录把 T0360–T0364 互列并共同对应 T0310 第五会；T0364 题记明确为宋代王日休校辑，平台保留为后世校辑见证，不冒充新的古代译本。",
  ["T0360", "T0361", "T0362", "T0363", "T0364", "T0310(5)"],
);
const smallerSukhavati = sameWork("smaller-sukhavati-vyuha-chinese", "Sukhāvatīvyūha／《阿弥陀经》汉译组", "DILA 经录把 T0366、T0367 互列，并登记为同一 Sukhāvatīvyūha 作品的汉译。", ["T0366", "T0367"]);
const maya = sameWork("maya-upama-samadhi-chinese", "Māyopamasamādhi／如幻三昧汉译组", "DILA 经录为 T0371、T0372 登记共同梵名 Māyopamasamādhisūtra 并互列。", ["T0371", "T0372"]);
const mahaparinirvana = relation(
  "same_work_translation_recension_and_partial_witness_group_verified",
  "mahaparinirvana-mahayana-chinese",
  "Mahāparinirvāṇasūtra／大乘《大般涅槃经》汉译、校订本与后分见证",
  "DILA 经录为 T0374–T0377 登记 Mahāparinirvāṇasūtra 题名，并把法显六卷本 T0376 对应到 T0374、T0375 的相关章节；T0375 题记为慧严等依旧译加治，T0377 题名明确为后分。平台分列完整译本、编辑校订本与后分见证。",
  ["T0374", "T0375", "T0376", "T0377"],
  { toh: ["toh119", "toh120", "toh121"] },
);
const caturdaraka = sameWork("caturdaraka-samadhi-chinese", "Caturdārakasamādhi／四童子三昧汉译组", "DILA 经录为 T0378、T0379 登记共同梵名 Caturdārakasamādhisūtra 并互列。", ["T0378", "T0379"]);
const sarvapunya = sameWork("sarvapunya-samuccaya-samadhi-chinese", "Sarvapuṇyasamuccayasamādhi／集一切福德三昧汉译组", "DILA 经录为 T0381、T0382 登记共同梵名并互列。", ["T0381", "T0382"]);
const greatCloudFamily = relation(
  "text_family_relation_unresolved",
  "mahamegha-chinese-text-family",
  "Mahāmegha／《大云经》汉文文本家族待考",
  "84000《大云经》导言明确指出 T0387、T0388 等相关文本的归属、年代与共享历史仍需进一步研究。平台保存 T0388 的完整来源文件，但按题名将其标为单卷残篇候选，不在证据不足时强行并入 T0387。",
  ["T0387", "T0388"],
  { toh: ["toh232", "toh233"] },
);

const relationByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationByCanonId.set(id, [...(relationByCanonId.get(id) ?? []), item]);
};
const range = (first, last) => Array.from({ length: last - first + 1 }, (_, index) => `T${String(first + index).padStart(4, "0")}`);
addRelation(range(321, 354), ratnakutaComponents);
for (const [ids, item] of [
  [["T0322", "T0323"], ugra],
  [["T0325", "T0326"], upali],
  [["T0328", "T0329"], surata],
  [["T0330", "T0331"], viradatta],
  [["T0332", "T0333"], udayana],
  [["T0334", "T0335", "T0336"], sumati],
  [["T0338", "T0339"], vimaladatta],
  [["T0341", "T0342"], susthitamati],
  [["T0343", "T0344"], simha],
  [["T0345", "T0346"], upaya],
  [["T0350", "T0351", "T0352"], kashyapa],
  [["T0355", "T0356"], ratnakutaSutra],
  [["T0357", "T0358", "T0359"], buddhaRealm],
  [["T0361", "T0362", "T0363", "T0364"], largerSukhavati],
  [["T0367"], smallerSukhavati],
  [["T0371", "T0372"], maya],
  [["T0376", "T0377"], mahaparinirvana],
  [["T0378", "T0379"], caturdaraka],
  [["T0381", "T0382"], sarvapunya],
  [["T0387", "T0388"], greatCloudFamily],
]) addRelation(ids, item);

const sameExpression = (workId) => ({ workId, status: "verified_same_work_expression" });
const sameWitness = (workId) => ({ workId, status: "verified_same_work_witness" });
const partialWitness = (workId) => ({ workId, status: "verified_partial_work_witness" });
const workDecisions = new Map([
  ...["T0322", "T0323"].map((id) => [id, sameExpression("gbcr:work:ugra-pariprccha")]),
  ["T0325", sameExpression("gbcr:work:upali-pariprccha")],
  ["T0326", partialWitness("gbcr:work:upali-pariprccha")],
  ...["T0328", "T0329"].map((id) => [id, sameExpression("gbcr:work:surata-pariprccha")]),
  ...["T0330", "T0331"].map((id) => [id, sameExpression("gbcr:work:viradatta-pariprccha")]),
  ...["T0332", "T0333"].map((id) => [id, sameExpression("gbcr:work:udayana-vatsaraja-pariprccha")]),
  ...["T0334", "T0335", "T0336"].map((id) => [id, sameExpression("gbcr:work:sumati-darika-pariprccha")]),
  ...["T0338", "T0339"].map((id) => [id, sameExpression("gbcr:work:vimala-datta-pariprccha")]),
  ...["T0341", "T0342"].map((id) => [id, sameExpression("gbcr:work:susthitamati-devaputra-pariprccha")]),
  ...["T0343", "T0344"].map((id) => [id, sameExpression("gbcr:work:simha-pariprccha")]),
  ...["T0345", "T0346"].map((id) => [id, sameExpression("gbcr:work:upaya-kaushalya")]),
  ...["T0350", "T0351", "T0352"].map((id) => [id, sameExpression("gbcr:work:kashyapa-parivarta")]),
  ...["T0355", "T0356"].map((id) => [id, sameExpression("gbcr:work:ratnakuta-sutra-t0355")]),
  ...["T0357", "T0358", "T0359"].map((id) => [id, sameExpression("gbcr:work:sarvabuddha-vishaya-avatarajnanaloka-alamkara")]),
  ...["T0361", "T0362", "T0363"].map((id) => [id, sameExpression("gbcr:work:larger-sukhavati-vyuha-t0360")]),
  ["T0364", sameWitness("gbcr:work:larger-sukhavati-vyuha-t0360")],
  ["T0367", sameExpression("gbcr:work:smaller-sukhavati-vyuha-t0366")],
  ...["T0371", "T0372"].map((id) => [id, sameExpression("gbcr:work:maya-upama-samadhi")]),
  ["T0376", sameExpression("gbcr:work:mahaparinirvana-t0374")],
  ["T0377", partialWitness("gbcr:work:mahaparinirvana-t0374")],
  ...["T0378", "T0379"].map((id) => [id, sameExpression("gbcr:work:caturdaraka-samadhi")]),
  ...["T0381", "T0382"].map((id) => [id, sameExpression("gbcr:work:sarvapunya-samuccaya-samadhi")]),
]);
const sourceRoles = new Map([
  ["T0326", "partial_translation_witness"],
  ["T0344", "translation_attribution_unknown"],
  ["T0351", "translation_attribution_unknown"],
  ["T0364", "edited_compilation_witness"],
  ["T0369", "translation_attribution_unknown"],
  ["T0370", "translation_attribution_unknown"],
  ["T0373", "translation_attribution_unknown"],
  ["T0377", "partial_continuation_witness"],
  ["T0388", "partial_text_family_witness_candidate"],
  ["T0392", "translation_attribution_unknown"],
  ["T0394", "translation_attribution_unknown"],
  ["T0396", "translation_attribution_unknown"],
]);
const partialSourceRecords = new Set(["T0326", "T0377", "T0388"]);
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
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业使用与保留头部声明`);
  }
  const title = matchRequired(text, /<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/, "正藏题名", record.sourceRecordId);
  const authorTag = text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "";
  const bylineTag = text.match(/<byline>([\s\S]*?)<\/byline>/)?.[1] ?? "";
  const author = stripXml(authorTag) || stripXml(bylineTag) || "題記未載譯者";
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

  const decision = workDecisions.get(canonId);
  const sourceRole = sourceRoles.get(canonId) ?? "translated_canonical_record";
  const partial = partialSourceRecords.has(canonId);
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
      tradition: Number(canonId.slice(1)) <= 373 ? "漢傳佛教 · 寶積部" : "漢傳佛教 · 涅槃部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${partial ? "本记录只作为规范作品后分、节译或文本家族残篇见证，不冒充完整译本；" : sourceRole === "edited_compilation_witness" ? "本记录是后世校辑见证，不冒充新的古代译本；" : decision ? "已由权威目录确认与规范作品的多译本或版本关系；" : "作品同一性与跨语种平行仍按逐条证据管理；"}物理记录、合集、作品、表达与版本见证分层计数。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.7",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v1.8.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T12 source-record closure",
  workOverrides: {
    "gbcr:work:maharatnakuta-t0310": { bibliographicRelations: [ratnakutaComponents, largerSukhavati] },
    "gbcr:work:larger-sukhavati-vyuha-t0360": { bibliographicRelations: [largerSukhavati] },
    "gbcr:work:smaller-sukhavati-vyuha-t0366": { bibliographicRelations: [smallerSukhavati] },
    "gbcr:work:mahaparinirvana-t0374": { bibliographicRelations: [mahaparinirvana] },
  },
  fileOverrides: {
    T0375: { sourceRole: "edited_recension_witness" },
  },
  collection: {
    id: "CBETA-TAISHO-T12",
    title: "大正藏 T12 宝积部末与涅槃部固定来源记录",
    sourceRecordDenominator: 76,
    previouslyControlledSourceRecords: 5,
    newSourceRecords: files.length,
    controlledSourceRecords: 76,
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
    attributionBoundaryRecords: files.filter((file) => sourceRoles.has(file.id)).length,
    workCountingDecision: "71 个新增来源记录全部独立可寻址；经权威经录确认的异译归入共同作品。T0326、T0377 作为节译或后分见证，T0364 作为后世校辑见证，T0388 作为归属待考的文本家族残篇候选；合集、作品、完整表达、编辑本与残篇不混计。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_collection_components_recensions_and_partial_witnesses_recorded",
    verifiedSameWorkGroups: [
      "ugra-pariprccha-chinese", "upali-pariprccha-chinese", "surata-pariprccha-chinese",
      "viradatta-pariprccha-chinese", "udayana-vatsaraja-pariprccha-chinese",
      "sumati-darika-pariprccha-chinese", "vimala-datta-pariprccha-chinese",
      "susthitamati-devaputra-pariprccha-chinese", "simha-pariprccha-chinese",
      "upaya-kaushalya-chinese", "kashyapa-parivarta-chinese", "ratnakuta-sutra-t0355-chinese",
      "sarvabuddha-vishaya-avatarajnanaloka-alamkara-chinese", "larger-sukhavati-vyuha-chinese",
      "smaller-sukhavati-vyuha-chinese", "maya-upama-samadhi-chinese",
      "mahaparinirvana-mahayana-chinese", "caturdaraka-samadhi-chinese",
      "sarvapunya-samuccaya-samadhi-chinese",
    ],
    collectionComponentFamilies: ["maharatnakuta-component-translations-t12"],
    partialWitnesses: ["T0326", "T0377", "T0388"],
    editorialWitnesses: ["T0364", "T0375"],
    unresolvedTextFamilies: ["mahamegha-chinese-text-family"],
    attributionCaveats: [...sourceRoles.entries()].filter(([, role]) => role === "translation_attribution_unknown").map(([id]) => id),
    caveat: "同经异译、合集组件、校订本、节译、后分与残篇候选分层登记；证据不足的《大云经》家族关系只作待考关联，不提前合并作品。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 71 ||
  batch.collection.newSourceBytes !== 11111518 ||
  batch.collection.verifiedSameWorkExpressions !== 39 ||
  batch.collection.verifiedSameWorkWitnesses !== 1 ||
  batch.collection.verifiedPartialWorkWitnesses !== 2 ||
  batch.collection.provisionalRecords !== 29 ||
  batch.collection.fullSourceTexts !== 68 ||
  batch.collection.partialSourceWitnesses !== 3 ||
  batch.collection.relationAnnotatedRecords !== 54 ||
  batch.collection.attributionBoundaryRecords !== 12
) throw new Error(`T12 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T12 审计完成：76/76 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
