import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.13.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t46.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t46-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.12.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 46 || inventory.totals.upstreamBytes !== 12140911 || candidates.length !== 46) {
  throw new Error(`T46 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const relationGroups = [
  relation(
    "root_meditation_treatise_and_exegetical_works_distinct",
    "mohe-zhiguan-root-commentary-t1911-t1914",
    "《摩诃止观》与辅行、义例、大意的层级边界",
    "DILA 将 T1911《摩诃止观》与 T1912《止观辅行传弘决》互列相关，但分别赋予权威号；T1913、T1914 又有各自题名、责任与范围。根本止观、十卷辅行、义例和大意均是相关而独立的作品。",
    ["T1911", "T1912", "T1913", "T1914"],
  ),
  relation(
    "same_traditional_author_meditation_works_scope_distinct",
    "zhiyi-meditation-works-t1915-t1922",
    "智顗止观、禅门与观心著述范围边界",
    "T1915–T1922 横跨坐禅要、禅波罗蜜、六妙门、四念处、禅门口诀、观心论及其疏与觉意三昧。共同天台传统或智顗责任题记不能消除独立题名、结构和全文边界。",
    ["T1915", "T1916", "T1917", "T1918", "T1919", "T1920", "T1921", "T1922"],
  ),
  relation(
    "root_treatise_and_commentary_distinct",
    "guanxin-root-commentary-t1920-t1921",
    "《观心论》与《观心论疏》根本论—注疏边界",
    "DILA 将 T1920、T1921 互列相关并赋予不同权威号；T1920 题署智顗述，T1921 题署灌顶撰，正文规模与注释功能也不同，保留为根本论和独立论疏。",
    ["T1920", "T1921"],
  ),
  relation(
    "same_traditional_author_meditation_doctrinal_works_distinct",
    "huisi-meditation-works-t1923-t1924-t1926",
    "慧思三昧、止观与安乐行著述边界",
    "T1923、T1924、T1926 均传统题署慧思，但分别处理无诤三昧、大乘止观与法华安乐行；DILA 权威号、题名、卷数和正文均独立。",
    ["T1923", "T1924", "T1926"],
  ),
  relation(
    "tiantai_doctrinal_manuals_scope_distinct",
    "tiantai-doctrinal-manuals-t1925-t1932",
    "法界次第、十不二门、四教义与教仪著述边界",
    "T1925、T1927–T1932 同属天台教观著述群，却具有不同权威号、作者、时代、体例和全文范围。宗派术语、四教框架或共同引文只形成检索关系，不形成作品合并。",
    ["T1925", "T1927", "T1928", "T1929", "T1930", "T1931", "T1932"],
  ),
  relation(
    "root_doctrinal_text_and_commentary_distinct",
    "shibuer-men-root-commentary-t1927-t1928",
    "《十不二门》与《十不二门指要钞》根本著作—注释边界",
    "DILA 的 T1928 权威记录明确关联 T1927；两者分别题署湛然述、知礼述，且有独立全文和结构，因此登记为根本著作与后出注释两部作品。",
    ["T1927", "T1928"],
  ),
  relation(
    "tiantai_vow_history_letters_and_doctrine_works_distinct",
    "tiantai-historical-doctrinal-works-t1933-t1939",
    "天台愿文、宗门记录、问答书与教观纲宗边界",
    "T1933–T1939 混合愿文、百录、问答集、书信、教行录、心印记与纲宗。共同天台传承不消除文类、编纂责任、时代和正文范围差异。",
    ["T1933", "T1934", "T1935", "T1936", "T1937", "T1938", "T1939"],
  ),
  relation(
    "tiantai_ritual_liturgy_works_related_distinct",
    "tiantai-rituals-t1940-t1952",
    "方等、法华、金光明、礼赞与陀罗尼行法作品群",
    "T1940–T1952 均涉及天台礼忏与修法，但所依经典、仪轨对象、责任题记、时代和正文范围不同。相同礼忏功能、尊格或仪式语汇不能自动合并作品。",
    ["T1940", "T1941", "T1942", "T1943", "T1944", "T1945", "T1946", "T1947", "T1948", "T1949", "T1950", "T1951", "T1952"],
  ),
  relation(
    "fahua_samadhi_root_and_auxiliary_rituals_distinct",
    "fahua-samadhi-rituals-t1941-t1944",
    "法华三昧忏仪、补助仪与礼经仪式边界",
    "DILA 将 T1941–T1944 互列相关。T1941 为智顗撰的完整忏仪，T1942 为湛然撰的运想补助仪，T1943、T1944 为未署名短仪；四个不同权威号与独立全文证明其相关但不相同。",
    ["T1941", "T1942", "T1943", "T1944"],
  ),
  relation(
    "golden_light_repentance_rituals_distinct",
    "golden-light-repentance-t1945-t1946",
    "两部金光明忏仪的高重叠边界",
    "DILA 将 T1945、T1946 互列相关并赋予不同权威号；两份 TEI 分别题署遵式集、知礼集。五字组较短一方包含度约 0.665972，反映同一礼忏传统与材料复用，不能证明同一作品或同一表达。",
    ["T1945", "T1946"],
  ),
  relation(
    "same_author_ritual_works_scope_distinct",
    "zunshi-ritual-works-t1945-t1948-t1949-t1951",
    "遵式金光明忏、礼赞与陀罗尼仪轨边界",
    "T1945、T1948、T1949、T1951 传统题署遵式，却分别是金光明忏法补助仪、智者斋忌礼赞、请观音三昧仪与炽盛光念诵仪；同一作者不构成同一作品。",
    ["T1945", "T1948", "T1949", "T1951"],
  ),
  relation(
    "same_author_ritual_compilations_scope_distinct",
    "zhili-ritual-works-t1946-t1950",
    "知礼金光明忏仪与大悲行法边界",
    "T1946、T1950 均题署知礼集，但所依经典、尊格、仪轨结构与全文不同；DILA 分配不同权威号，保持两部独立作品。",
    ["T1946", "T1950"],
  ),
  relation(
    "esoteric_doctrine_inscription_and_compendia_distinct",
    "esoteric-compendia-t1953-t1956",
    "菩提心义、碑铭与显密汇编边界",
    "T1953–T1956 横跨未署名菩提心义、智慧轮碑铭、道𭮨显密汇编与智广等往生集。密教术语和显密圆通主题不能消除不同权威号、责任、文类与全文范围。",
    ["T1953", "T1954", "T1955", "T1956"],
  ),
];

const authorityIds = {
  T1911: "CA0002279", T1912: "CA0004078", T1913: "CA0004083", T1914: "CA0004074",
  T1915: "CA0003610", T1916: "CA0003109", T1917: "CA0002095", T1918: "CA0002834",
  T1919: "CA0000404", T1920: "CA0001235", T1921: "CA0001236", T1922: "CA0003142",
  T1923: "CA0004126", T1924: "CA0004075", T1925: "CA0000918", T1926: "CA0000837",
  T1927: "CA0001919", T1928: "CA0003036", T1929: "CA0002824", T1930: "CA0003236",
  T1931: "CA0003242", T1932: "CA0001610", T1933: "CA0002332", T1934: "CA0001299",
  T1935: "CA0000956", T1936: "CA0002832", T1937: "CA0002830", T1938: "CA0003237",
  T1939: "CA0001565", T1940: "CA0001008", T1941: "CA0000903", T1942: "CA0000905",
  T1943: "CA0000902", T1944: "CA0002027", T1945: "CA0001768", T1946: "CA0001793",
  T1947: "CA0003123", T1948: "CA0003253", T1949: "CA0002601", T1950: "CA0002563",
  T1951: "CA0000489", T1952: "CA0001268", T1953: "CA0002477", T1954: "CA0002259",
  T1955: "CA0003549", T1956: "CA0002210",
};

const familyFor = (id) => {
  const number = Number(id.match(/\d+/)?.[0]);
  if (number <= 1922) return { code: "tiantai-meditation", role: "tiantai_meditation_or_exegetical_work", tradition: "汉传佛教 · 天台止观与禅门" };
  if (number <= 1932) return { code: "tiantai-doctrine", role: "tiantai_doctrinal_work", tradition: "东亚佛教 · 天台教观著述" };
  if (number <= 1939) return { code: "tiantai-history", role: "tiantai_historical_or_doctrinal_collection", tradition: "东亚佛教 · 天台宗史与教义" };
  if (number <= 1952) return { code: "tiantai-ritual", role: "tiantai_ritual_or_liturgy", tradition: "汉传佛教 · 天台忏仪与行法" };
  return { code: "esoteric-compendium", role: "sinitic_esoteric_doctrinal_or_compiled_work", tradition: "汉传佛教 · 显密教义与汇编" };
};
const roleOverrides = {
  T1911: "tiantai_mohe_zhiguan_root_treatise",
  T1912: "tiantai_mohe_zhiguan_direct_commentary",
  T1920: "tiantai_guanxin_root_treatise",
  T1921: "tiantai_guanxin_commentary",
  T1927: "tiantai_shibuer_men_root_doctrinal_text",
  T1928: "tiantai_shibuer_men_commentary",
  T1933: "tiantai_vow_text",
  T1934: "tiantai_historical_record_collection",
  T1935: "tiantai_question_answer_collection",
  T1936: "tiantai_epistolary_doctrinal_collection",
  T1937: "tiantai_biographical_teaching_record_collection",
  T1941: "tiantai_fahua_samadhi_root_repentance_ritual",
  T1942: "tiantai_fahua_samadhi_auxiliary_ritual",
  T1943: "unsigned_tiantai_fahua_samadhi_auxiliary_ritual",
  T1944: "unsigned_tiantai_fahua_liturgy",
  T1945: "tiantai_golden_light_repentance_auxiliary_ritual",
  T1946: "tiantai_golden_light_repentance_ritual",
  T1952: "unsigned_sinitic_mantra_ritual",
  T1953: "unsigned_sinitic_esoteric_doctrinal_work",
  T1954: "sinitic_buddhist_inscription",
  T1955: "sinitic_esoteric_doctrinal_compendium",
  T1956: "sinitic_esoteric_rebirth_compendium",
};
const statusOverrides = {
  T1911: "verified_distinct_root_meditation_treatise",
  T1912: "verified_distinct_direct_commentary",
  T1920: "verified_distinct_root_treatise",
  T1921: "verified_distinct_commentary",
  T1927: "verified_distinct_root_doctrinal_text",
  T1928: "verified_distinct_commentary",
  T1934: "verified_distinct_compiled_historical_collection",
  T1935: "verified_distinct_compiled_question_collection",
  T1937: "verified_distinct_compiled_teaching_record",
  T1942: "verified_distinct_auxiliary_ritual",
  T1943: "verified_distinct_unsigned_auxiliary_ritual",
  T1944: "verified_distinct_unsigned_liturgy",
  T1945: "verified_distinct_related_repentance_ritual",
  T1946: "verified_distinct_related_repentance_ritual",
  T1952: "verified_distinct_unsigned_ritual",
  T1953: "verified_distinct_unsigned_doctrinal_work",
  T1955: "verified_distinct_compiled_esoteric_work",
  T1956: "verified_distinct_compiled_esoteric_work",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const required = (value, label, id) => {
  if (!value?.trim()) throw new Error(`${id} 缺少 ${label}`);
  return value.trim();
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const normalizeBody = (segments) => segments.map((segment) => segment.text).join("").replace(/[\s，。；：、！？「」『』（）]/g, "");
const normalizedBodies = new Map();
const files = [];

for (const record of candidates) {
  const upstream = execFileSync("git", ["-C", sourceRoot, "show", `HEAD:${record.upstreamPath}`], {
    encoding: "buffer",
    maxBuffer: Math.max(record.upstreamBytes + 1024, 32 * 1024 * 1024),
  });
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = required(text.match(/<TEI[^>]+xml:id="([^"]+)"/)?.[1], "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业与保留头部声明`);
  }
  const title = stripXml(required(text.match(/<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/)?.[1], "正藏题名", record.sourceRecordId));
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "") || "传统责任题记未署名";
  const extent = required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const family = familyFor(canonId);
  const relations = relationGroups.filter((group) => group.externalIds.cbeta.includes(canonId));
  if (!authorityIds[canonId] || relations.length === 0) throw new Error(`${canonId} 缺少权威号或关系裁决`);

  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan !== numericJuans[index - 1] + 1))) {
    throw new Error(`${canonId} 卷次不是连续正整数`);
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
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
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}-${family.code}`,
    workIdentityStatus: statusOverrides[canonId] ?? "verified_distinct_east_asian_authored_work",
    workTitle: title,
    sourceRole: roleOverrides[canonId] ?? family.role,
    bibliographicRelations: relations,
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
      tradition: family.tradition,
      language: "汉文",
      canonRef: `大正藏 T46, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；作为独立东亚佛教著述建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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

const grams = (value, size = 5) => {
  const values = new Set();
  for (let index = 0; index <= value.length - size; index += 1) values.add(value.slice(index, index + size));
  return values;
};
const compareBodies = (leftId, rightId) => {
  const leftText = normalizedBodies.get(leftId);
  const rightText = normalizedBodies.get(rightId);
  const left = grams(leftText);
  const right = grams(rightText);
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return {
    pair: [leftId, rightId],
    normalizedCharacters: [leftText.length, rightText.length],
    fiveGramContainmentOfShorter: Number((shared / Math.min(left.size, right.size)).toFixed(6)),
    fiveGramJaccard: Number((shared / (left.size + right.size - shared)).toFixed(6)),
  };
};
const comparisonPairs = [
  ["T1911", "T1912"], ["T1911", "T1913"], ["T1911", "T1914"],
  ["T1912", "T1913"], ["T1912", "T1914"], ["T1913", "T1914"],
  ["T1920", "T1921"],
  ["T1923", "T1924"], ["T1923", "T1926"], ["T1924", "T1926"],
  ["T1927", "T1928"],
  ["T1941", "T1942"], ["T1941", "T1943"], ["T1941", "T1944"],
  ["T1942", "T1943"], ["T1942", "T1944"], ["T1943", "T1944"],
  ["T1945", "T1946"], ["T1955", "T1956"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T46; T46 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T46",
    title: "大正藏 T46 天台止观、教观、忏仪与显密汇编固定来源记录",
    sourceRecordDenominator: 46,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanRange[1] - file.verification.juanRange[0] + 1, 0),
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    provisionalRecords: 0,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.length,
    unsignedResponsibilityRecords: files.filter((file) => file.presentation.translator === "传统责任题记未署名").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T46 的 46 份来源记录登记为 46 个完整表达和 46 个独立东亚著述作品。DILA 为每份记录分配不同权威号；T1911/T1912、T1920/T1921、T1927/T1928 的根本著作—注疏层，T1941–T1944 的法华三昧仪轨群，以及高重叠的 T1945/T1946 金光明忏仪均保持相关而独立。没有仅凭题名、作者、宗派、仪式功能、引文或文本重叠执行作品合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_tiantai_root_commentary_same_author_doctrine_history_ritual_unsigned_and_esoteric_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: ["mohe-zhiguan-root-commentary-t1911-t1914", "guanxin-root-commentary-t1920-t1921", "shibuer-men-root-commentary-t1927-t1928"],
    rootEditionBoundaryGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: [],
    layeredAttributionGroups: ["fahua-samadhi-rituals-t1941-t1944", "golden-light-repentance-t1945-t1946"],
    scopeBoundaryGroups: ["zhiyi-meditation-works-t1915-t1922", "huisi-meditation-works-t1923-t1924-t1926", "tiantai-doctrinal-manuals-t1925-t1932", "tiantai-historical-doctrinal-works-t1933-t1939", "zunshi-ritual-works-t1945-t1948-t1949-t1951", "zhili-ritual-works-t1946-t1950", "esoteric-compendia-t1953-t1956"],
    relatedDistinctWorkGroups: ["mohe-zhiguan-root-commentary-t1911-t1914", "guanxin-root-commentary-t1920-t1921", "shibuer-men-root-commentary-t1927-t1928", "tiantai-rituals-t1940-t1952", "fahua-samadhi-rituals-t1941-t1944", "golden-light-repentance-t1945-t1946"],
    candidateRelationsNotMerged: [
      "T1911↔T1912/T1913/T1914（《摩诃止观》根本著作与辅行、义例、大意分层）",
      "T1920↔T1921、T1927↔T1928（根本著作与后出论疏分别建模）",
      "T1941↔T1942/T1943/T1944（法华三昧根本忏仪、补助仪和未署名短仪分层）",
      "T1945↔T1946（五字组较短一方包含度约 0.665972，但 DILA 权威号、责任和范围不同）",
      "T1943、T1944、T1952、T1953 的 TEI 责任字段为空，按未署名记录，不据文体或传统推断作者",
      "T1940–T1952 礼忏、礼赞与陀罗尼行法，以及 T1953–T1956 教义、碑铭和汇编均按文类与责任分层，不因功能或术语接近而合并",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records quotation, ritual reuse and exegetical dependence only; it cannot merge roots, commentaries, same-author works, auxiliary rites, unsigned liturgies or esoteric compilations.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T46",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T46 是天台止观、教观、宗史、忏仪与显密汇编集合，不是佛说经或单一印度根本文本集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分根本著作—注疏、同作者异作、法华三昧仪轨层、金光明忏仪复用、编纂责任和未署名作品；共同宗派、题名、作者、仪式功能、引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T46 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);
