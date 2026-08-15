import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.12.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t45.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t45-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.11.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 61 || inventory.totals.upstreamBytes !== 11260895 || candidates.length !== 61) {
  throw new Error(`T45 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "same_school_doctrinal_works_scope_distinct",
    "sanlun-doctrinal-works-t1852-t1855",
    "三论宗义著述的作品范围边界",
    "DILA 为 T1852–T1855 分配四个不同作品权威号；吉藏、硕法师的玄义、玄论、二谛义与游意义分别具有独立题名、责任和全文边界。",
    ["T1852", "T1853", "T1854", "T1855"],
  ),
  relation(
    "traditional_author_corpus_attribution_boundary",
    "sengzhao-corpus-boundary-t1856-t1858",
    "罗什—慧远问答与传统僧肇著述边界",
    "T1856 明署慧远问、罗什答；T1857 传统题署僧肇但现代真伪问题不能由题记解决；T1858 是另一部独立《肇论》。三者不因时代、人物或思想联系而合并。",
    ["T1856", "T1857", "T1858"],
  ),
  relation(
    "commentaries_on_zhaolun_distinct",
    "zhaolun-commentaries-t1858-t1860",
    "《肇论》与元康、文才两部论疏",
    "DILA 的 T1858 权威记录明确关联 T1859、T1860，后两者也反向指向 T1858。两部疏各有独立责任、时代和正文，保留为根本文本上的不同注疏作品。",
    ["T1858", "T1859", "T1860"],
  ),
  relation(
    "same_school_yogacara_works_scope_distinct",
    "faxiang-doctrinal-works-t1861-t1865",
    "法相宗义章、论辩、入道次第与补注边界",
    "DILA 为 T1861–T1865 分配五个独立权威号。共同法相术语、作者师承或八识主题不消除义章、论辩、修道次第和后世补注的范围差异。",
    ["T1861", "T1862", "T1863", "T1864", "T1865"],
  ),
  relation(
    "huayan_school_works_related_distinct",
    "huayan-school-works-t1866-t1891",
    "华严宗义、观门、论书与图赞作品群",
    "T1866–T1891 在物理卷册中构成华严著述群，但 DILA 权威号、题名、责任、体例和全文锚点逐部不同；宗派归类只构成检索关系，不构成作品合并证据。",
    ["T1866", "T1867", "T1868", "T1869", "T1870", "T1871", "T1872", "T1873", "T1874", "T1875", "T1876", "T1877", "T1878", "T1879a", "T1879b", "T1880", "T1881", "T1882", "T1883", "T1884", "T1885", "T1886", "T1887A", "T1887B", "T1888", "T1889", "T1890", "T1891"],
  ),
  relation(
    "layered_traditional_attribution_recorded",
    "dushun-zhiyan-layered-attribution-t1867-t1868",
    "杜顺说与智俨撰的复合传承责任",
    "T1867 传统题署杜顺说；T1868 题署杜顺说、智俨撰。平台保存“说—撰”两层责任，不压平成单一作者，也不据同宗同题自动合并。",
    ["T1867", "T1868"],
  ),
  relation(
    "same_author_huayan_works_scope_distinct",
    "fazang-huayan-works-t1866-t1881",
    "法藏华严著述与后世注释范围边界",
    "T1866 及 T1871–T1881 中多部传统题署法藏，T1880、T1881 又分别保存净源述、承迁注的后出解释层。同一传统作者或根本文本不能消除各部作品和注释层。",
    ["T1866", "T1871", "T1872", "T1873", "T1874", "T1875", "T1876", "T1877", "T1878", "T1879a", "T1879b", "T1880", "T1881"],
  ),
  relation(
    "same_number_related_works_not_merged",
    "huayan-guanmai-boundary-t1879a-t1879b",
    "T1879a、T1879b 两部关脉义记边界",
    "两份来源拥有不同 DILA 权威号、不同题名责任字段、相邻但不重合的版页范围和独立正文；五字组重叠只记录文本关系，不足以把 a/b 合并为同一表达。",
    ["T1879a", "T1879b"],
  ),
  relation(
    "parallel_commentaries_on_golden_lion_treatise_distinct",
    "golden-lion-commentaries-t1880-t1881",
    "法藏《金师子章》与净源、承迁两种解释层",
    "DILA 从 T1880 关联 T1881；两份 TEI 分别明署净源述和承迁注，并保存法藏根本文本责任。它们是相关但不同的注释作品。",
    ["T1880", "T1881"],
  ),
  relation(
    "huayan_dharmadhatu_contemplation_works_distinct",
    "huayan-dharmadhatu-contemplation-t1882-t1885",
    "华严法界观门的玄镜、注释与颂释边界",
    "T1882–T1885 各有独立 DILA 权威号；澄观玄镜、宗密注和本嵩述—琮湛注的颂释具有不同文本对象、责任层与结构，不按共享法界观术语合并。",
    ["T1882", "T1883", "T1884", "T1885"],
  ),
  relation(
    "subcommentary_on_huayan_dharmadhatu_diagram_distinct",
    "huayan-dharmadhatu-diagram-t1887a-t1887b",
    "义湘《华严一乘法界图》与《法界图记丛髓录》",
    "DILA 将 T1887A、T1887B 互列相关。A 是义湘法界图根本文本，B 是四分卷编码的后出集注；高包含重叠反映引文依赖，不是同一表达。",
    ["T1887A", "T1887B"],
  ),
  relation(
    "silla_huayan_works_related_distinct",
    "silla-huayan-works-t1887a-t1890",
    "新罗华严著述范围边界",
    "T1887A、T1887B、T1889、T1890 在新罗华严传统中相关，但义湘法界图、丛髓录、明皛论和见登集具有不同责任与作品范围。",
    ["T1887A", "T1887B", "T1889", "T1890"],
  ),
  relation(
    "same_author_vinaya_works_scope_distinct",
    "daoxuan-vinaya-works-t1892-t1899",
    "道宣戒坛、律仪、感通传与图经作品群",
    "DILA 为 T1892–T1899 分配八个独立权威号。共同道宣责任不能把戒坛图经、诫观法、章服仪、量处仪、归敬仪、学比丘律仪、感通传和寺图经合并。",
    ["T1892", "T1893", "T1894", "T1895", "T1896", "T1897", "T1898", "T1899"],
  ),
  relation(
    "vinaya_material_culture_works_related_distinct",
    "vinaya-material-culture-t1892-t1900",
    "戒坛、章服、量处与比丘六物的物质律仪边界",
    "T1892、T1894、T1895、T1900 共享律仪物质文化主题，但作者、时代、题名和正文结构不同，保持相关而不同的作品。",
    ["T1892", "T1894", "T1895", "T1900"],
  ),
  relation(
    "same_author_vinaya_manuals_scope_distinct",
    "yijing-vinaya-manuals-t1901-t1903",
    "义净三部短篇律仪行法",
    "T1901–T1903 同署义净，却分别处理护命放生、受用三水和说罪；DILA 权威号、题名、版页和正文均独立。",
    ["T1901", "T1902", "T1903"],
  ),
  relation(
    "same_compiler_mulasarvastivada_manuals_scope_distinct",
    "phagpa-mulasarvastivada-manuals-t1904-t1905",
    "拔合思巴集两部根本说一切有部仪范",
    "T1904、T1905 同署拔合思巴集并属根本说一切有部，但出家授近圆羯磨与苾芻习学略法的功能、范围和全文不同。",
    ["T1904", "T1905"],
  ),
  relation(
    "silla_bodhisattva_precept_and_repentance_works_distinct",
    "silla-precept-repentance-t1906-t1908",
    "新罗菩萨戒与忏悔著述边界",
    "T1906 大贤宗要、T1907 元晓持犯要记与 T1908 元晓六情忏悔分别具有独立权威号、题名和功能；共同新罗传统或作者不构成同一作品。",
    ["T1906", "T1907", "T1908"],
  ),
  relation(
    "same_author_precept_and_repentance_scope_distinct",
    "wonhyo-precept-repentance-t1907-t1908",
    "元晓戒本要记与六情忏悔范围边界",
    "T1907 是戒本持犯要记，T1908 是忏悔文本；共同元晓责任不消除文类、功能与正文边界。",
    ["T1907", "T1908"],
  ),
  relation(
    "repentance_rituals_related_distinct",
    "repentance-rituals-t1908-t1910",
    "六情忏悔、慈悲道场忏与水忏边界",
    "T1908–T1910 均涉及忏悔实践，但一卷新罗撰述、十卷集撰道场仪轨和三卷无署名水忏在题名、责任、结构和全文上均独立。",
    ["T1908", "T1909", "T1910"],
  ),
  relation(
    "compiled_and_unsigned_repentance_works_distinct",
    "cibei-repentance-boundary-t1909-t1910",
    "《慈悲道场忏法》与《慈悲水忏法》责任边界",
    "DILA 为 T1909、T1910 分配不同权威号；前者题署梁诸大法师集撰，后者 TEI 责任字段为空。共同“慈悲”与忏法功能不能证明同作、节本或同一表达。",
    ["T1909", "T1910"],
  ),
];

const authorityIds = {
  T1852: "CA0002725", T1853: "CA0000573", T1854: "CA0000815", T1855: "CA0002726",
  T1856: "CA0000567", T1857: "CA0000273", T1858: "CA0004035", T1859: "CA0004038",
  T1860: "CA0004041", T1861: "CA0000949", T1862: "CA0002613", T1863: "CA0002347",
  T1864: "CA0002678", T1865: "CA0000110", T1866: "CA0001454", T1867: "CA0001447",
  T1868: "CA0001461", T1869: "CA0001448", T1870: "CA0001396", T1871: "CA0001437",
  T1872: "CA0001394", T1873: "CA0001423", T1874: "CA0001395", T1875: "CA0001433",
  T1876: "CA0003604", T1877: "CA0001462", T1878: "CA0001360", T1879a: "CA0001367a",
  T1879b: "CA0001367b", T1880: "CA0001371", T1881: "CA0001370", T1882: "CA0002742",
  T1883: "CA0001365", T1884: "CA0001363", T1885: "CA0001364", T1886: "CA0001463",
  T1887A: "CA0001453", T1887B: "CA0000921", T1888: "CA0001410", T1889: "CA0001309",
  T1890: "CA0001452", T1891: "CA0003383", T1892: "CA0001190", T1893: "CA0001861",
  T1894: "CA0003139", T1895: "CA0002062", T1896: "CA0003135", T1897: "CA0001568",
  T1898: "CA0002132", T1899: "CA0002931", T1900: "CA0001108", T1901: "CA0001350",
  T1902: "CA0003178", T1903: "CA0003203", T1904: "CA0001152", T1905: "CA0001151",
  T1906: "CA0000982", T1907: "CA0000975", T1908: "CA0002097", T1909: "CA0000373",
  T1910: "CA0000374",
};

const familyFor = (id) => {
  const number = Number(id.match(/\d+/)?.[0]);
  if (number <= 1860) return { code: "sanlun-zhaolun", role: "sinitic_madhyamaka_or_zhaolun_work", tradition: "汉传佛教 · 三论与肇论著述" };
  if (number <= 1865) return { code: "faxiang", role: "sinitic_yogacara_school_work", tradition: "汉传佛教 · 法相宗义著述" };
  if (number <= 1891) return { code: "huayan", role: "east_asian_huayan_school_work", tradition: "东亚佛教 · 华严宗义著述" };
  if (number <= 1905) return { code: "vinaya-ritual", role: "east_asian_vinaya_or_ritual_manual", tradition: "东亚佛教 · 律仪与行法" };
  if (number <= 1908) return { code: "bodhisattva-precept", role: "silla_bodhisattva_precept_or_repentance_work", tradition: "新罗佛教 · 菩萨戒与忏悔" };
  return { code: "repentance", role: "sinitic_compiled_repentance_liturgy", tradition: "汉传佛教 · 忏法仪轨" };
};
const roleOverrides = {
  T1856: "sinitic_buddhist_epistolary_question_answer_collection",
  T1857: "sinitic_treatise_with_traditional_attribution_boundary",
  T1858: "sinitic_zhaolun_root_treatise",
  T1859: "sinitic_authored_zhaolun_commentary",
  T1860: "sinitic_authored_zhaolun_new_commentary",
  T1865: "sinitic_later_supplementary_yogacara_commentary",
  T1868: "sinitic_layered_huayan_teaching_and_composition",
  T1879a: "sinitic_authored_huayan_guanmai_work_a",
  T1879b: "unsigned_huayan_guanmai_work_b",
  T1880: "sinitic_layered_golden_lion_commentary",
  T1881: "sinitic_layered_golden_lion_commentary",
  T1885: "sinitic_layered_huayan_verse_and_commentary",
  T1887A: "silla_huayan_dharmadhatu_diagram_root_work",
  T1887B: "east_asian_huayan_dharmadhatu_diagram_subcommentary_compendium",
  T1909: "sinitic_collectively_compiled_repentance_liturgy",
  T1910: "unsigned_sinitic_repentance_liturgy",
};
const statusOverrides = {
  T1857: "verified_distinct_work_with_traditional_attribution_boundary",
  T1868: "verified_distinct_layered_attribution_work",
  T1879a: "verified_distinct_same_number_related_work",
  T1879b: "verified_distinct_same_number_related_unsigned_work",
  T1880: "verified_distinct_layered_commentary_work",
  T1881: "verified_distinct_layered_commentary_work",
  T1885: "verified_distinct_layered_commentary_work",
  T1887A: "verified_distinct_root_doctrinal_diagram_work",
  T1887B: "verified_distinct_subcommentary_compendium",
  T1909: "verified_distinct_collectively_compiled_liturgy",
  T1910: "verified_distinct_unsigned_liturgy",
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
      canonRef: `大正藏 T45, no. ${canonId.slice(1)}`,
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
  ["T1858", "T1859"], ["T1858", "T1860"], ["T1859", "T1860"],
  ["T1879a", "T1879b"], ["T1880", "T1881"],
  ["T1883", "T1884"], ["T1883", "T1885"], ["T1884", "T1885"],
  ["T1887A", "T1887B"], ["T1907", "T1908"], ["T1909", "T1910"],
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T45; T45 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T45",
    title: "大正藏 T45 三论、法相、华严、律仪与忏法固定来源记录",
    sourceRecordDenominator: 61,
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
    workCountingDecision: "T45 的 61 份来源记录登记为 61 个完整表达和 61 个独立东亚著述作品。T1858–T1860 的根本文本—注疏、T1879a/b 的同经号边界、T1880/T1881 的平行注释层、T1887A/B 的根本法界图—集注层，以及同作者、同宗派、律仪和忏法作品群均保持独立；没有仅凭题名、作者、宗派、引文或文本重叠执行作品合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_east_asian_school_root_commentary_subcommentary_same_number_layered_attribution_vinaya_ritual_and_repentance_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: ["zhaolun-commentaries-t1858-t1860"],
    rootEditionBoundaryGroups: [],
    subcommentaryGroups: ["huayan-dharmadhatu-diagram-t1887a-t1887b"],
    sameNumberBoundaryGroups: ["huayan-guanmai-boundary-t1879a-t1879b", "huayan-dharmadhatu-diagram-t1887a-t1887b"],
    layeredAttributionGroups: ["sengzhao-corpus-boundary-t1856-t1858", "dushun-zhiyan-layered-attribution-t1867-t1868", "golden-lion-commentaries-t1880-t1881", "huayan-dharmadhatu-contemplation-t1882-t1885", "cibei-repentance-boundary-t1909-t1910"],
    scopeBoundaryGroups: ["sanlun-doctrinal-works-t1852-t1855", "faxiang-doctrinal-works-t1861-t1865", "fazang-huayan-works-t1866-t1881", "daoxuan-vinaya-works-t1892-t1899", "yijing-vinaya-manuals-t1901-t1903", "phagpa-mulasarvastivada-manuals-t1904-t1905", "wonhyo-precept-repentance-t1907-t1908"],
    relatedDistinctWorkGroups: ["huayan-school-works-t1866-t1891", "golden-lion-commentaries-t1880-t1881", "huayan-dharmadhatu-contemplation-t1882-t1885", "silla-huayan-works-t1887a-t1890", "vinaya-material-culture-t1892-t1900", "silla-precept-repentance-t1906-t1908", "repentance-rituals-t1908-t1910", "cibei-repentance-boundary-t1909-t1910"],
    candidateRelationsNotMerged: [
      "T1858↔T1859/T1860（《肇论》根本文本与元康、文才两部疏分层）",
      "T1879a↔T1879b（不同 DILA 权威号、题名责任与版页正文的同经号 a/b 边界）",
      "T1880↔T1881（法藏根本文本上净源述、承迁注的平行解释层）",
      "T1887A↔T1887B（义湘法界图与后出《法界图记丛髓录》集注层）",
      "T1857 的传统僧肇题记、T1868 的杜顺说—智俨撰、T1885 的本嵩述—琮湛注、T1909 的集撰和 T1879b/T1887B/T1910 无署名均按来源记录，不伪装成现代无争议作者事实",
      "T1892–T1905 律仪、行法和仪范及 T1906–T1910 戒本、忏悔与集撰仪轨均按文类与责任分层，不因功能接近而合并",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records quotation and exegetical dependence only; it cannot merge roots, commentaries, subcommentaries, same-number texts, same-author works or repentance liturgies.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T45",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T45 是东亚三论、法相、华严、律仪与忏法著述集合，不是佛说经或单一印度根本文本集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分根本论—注疏、法界图—集注、同经号 a/b 与 A/B、复合责任、同作者异作、律仪功能和集撰或无署名忏法；共同宗派、题名、作者、引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T45 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);
