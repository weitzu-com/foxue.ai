import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.6.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t39.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t39-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.5.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 21 || inventory.totals.upstreamBytes !== 12940653 || candidates.length !== 21) {
  throw new Error(`T39 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const goldenLightExegesis = relation(
  "commentaries_on_golden_light_sutra_distinct",
  "golden-light-exegesis-t0663-t1783-t1787",
  "《金光明经》与 T1783–T1787 五部玄义、文句、记及经疏",
  "DILA T1783–T1787 规范记录均把 T0663 标为相关经典。五部诠释在作者、题名、体例与层级上不同，根本经和后世注疏保持六个作品实体。",
  ["T0663", "T1783", "T1784", "T1785", "T1786", "T1787"],
);
const goldenLightXuanyiSubcommentary = relation(
  "commentary_and_subcommentary_on_golden_light_sutra_distinct",
  "golden-light-xuanyi-subcommentary-t0663-t1783-t1784",
  "《金光明经》、智顗说《玄义》与知礼《玄义拾遗记》",
  "DILA T1783 与 T1784 规范记录互相关联；T1784 依 T1783 拾遗阐释。根经、玄义讲说记录与再注释分层登记。",
  ["T0663", "T1783", "T1784"],
);
const goldenLightWenjuSubcommentary = relation(
  "commentary_and_subcommentary_on_golden_light_sutra_distinct",
  "golden-light-wenju-subcommentary-t0663-t1785-t1786",
  "《金光明经》、智顗说《文句》与知礼《文句记》",
  "DILA T1785 与 T1786 规范记录互相关联；T1786 是对 T1785 文句解释的再注。根经、文句讲说记录与再注释分层登记。",
  ["T0663", "T1785", "T1786"],
);
const zhiyiGoldenLightWorks = relation(
  "related_commentaries_by_same_teacher_distinct",
  "zhiyi-golden-light-commentaries-t1783-t1785",
  "智顗说、灌顶录《金光明经玄义》与《金光明经文句》",
  "两部记录同属智顗教说与灌顶记录传统，但玄义与随文文句具有不同题名、结构和解释任务，保持两个作品。",
  ["T0663", "T1783", "T1785"],
);
const zhiliGoldenLightWorks = relation(
  "related_subcommentaries_by_same_author_distinct",
  "zhili-golden-light-subcommentaries-t1784-t1786",
  "知礼《金光明经玄义拾遗记》与《金光明经文句记》",
  "两部再注释同署知礼，却分别依 T1783 玄义与 T1785 文句展开；共同作者与根经不构成同一作品。",
  ["T0663", "T1784", "T1786"],
);
const goldenLightBestKingExegesis = relation(
  "commentary_on_golden_light_best_king_sutra_distinct",
  "golden-light-best-king-exegesis-t0665-t1788",
  "义净译《金光明最胜王经》与慧沼《金光明最胜王经疏》",
  "DILA T1788 规范记录把 T0665 标为相关经典。六卷经疏是独立诠释作品，不与根本经或 T0663 系注疏合并。",
  ["T0665", "T1788"],
);
const lankavataraT0670Exegesis = relation(
  "commentary_on_lankavatara_t0670_distinct",
  "lankavatara-exegesis-t0670-t1789",
  "求那跋陀罗译《楞伽阿跋多罗宝经》与宗泐、如玘《注解》",
  "DILA T1789 规范记录把 T0670 标为相关经典。明代四卷注解是独立经疏，不是刘宋译本的另一表达。",
  ["T0670", "T1789"],
);
const lankavataraT0672Exegesis = relation(
  "commentaries_on_lankavatara_t0672_distinct",
  "lankavatara-exegesis-t0672-t1790-t1791",
  "实叉难陀译《大乘入楞伽经》与法藏《心玄义》、宝臣《注》",
  "DILA T1790 与 T1791 规范记录均把 T0672 标为相关经典。唐代玄义与宋代十卷注在作者、体例和篇幅上不同，根经与两部注疏保持三个作品。",
  ["T0672", "T1790", "T1791"],
);
const lankavataraCommentaries = relation(
  "related_commentaries_on_same_translation_distinct",
  "lankavatara-commentaries-t1790-t1791",
  "法藏《入楞伽心玄义》与宝臣《注大乘入楞伽经》",
  "两部作品共同解释 T0672，但一卷玄义与十卷随文注具有不同作者、结构和范围，只建立关系而不合并。",
  ["T0672", "T1790", "T1791"],
);
const singleRootRelation = (type, groupId, rootId, rootTitle, commentaryIds, commentaryLabel, evidence) => relation(
  type,
  groupId,
  `${rootTitle}与${commentaryLabel}`,
  evidence,
  [rootId, ...commentaryIds],
);
const ullambanaExegesis = singleRootRelation("commentary_on_ullambana_sutra_distinct", "ullambana-exegesis-t0685-t1792", "T0685", "《佛说盂兰盆经》", ["T1792"], "宗密《疏》", "DILA T1792 规范记录把 T0685 标为相关经典。两卷疏是独立诠释作品。根经传统译者题记与后世注疏责任分别保留。");
const bathhouseExegesis = singleRootRelation("commentary_on_bathhouse_sutra_distinct", "bathhouse-exegesis-t0701-t1793", "T0701", "《佛说温室洗浴众僧经》", ["T1793"], "慧远《义记》", "DILA T1793 规范记录把 T0701 标为相关经典。一卷义记是独立经疏，不是根本经表达。");
const fortyTwoChaptersExegesis = singleRootRelation("commentary_on_forty_two_chapters_distinct", "forty-two-chapters-exegesis-t0784-t1794", "T0784", "《四十二章经》", ["T1794"], "宋真宗《注》", "DILA T1794 规范记录把 T0784 标为相关经典。帝王注释责任、根本经传统译者题记和作品层级分别保留。");
const perfectEnlightenmentExegesis = singleRootRelation("commentary_on_perfect_enlightenment_sutra_distinct", "perfect-enlightenment-exegesis-t0842-t1795", "T0842", "《大方广圆觉修多罗了义经》", ["T1795"], "宗密《略疏》", "DILA T1795 规范记录把 T0842 标为相关经典。两卷略疏是独立诠释作品，不解决根本经的传统译者与成书争议。");
const mahavairocanaExegesis = relation(
  "commentaries_on_mahavairocana_sutra_distinct",
  "mahavairocana-exegesis-t0848-t1796-t1797",
  "《大毘卢遮那成佛神变加持经》与 T1796 全经疏、T1797 卷七供养次第法疏",
  "DILA T1796 关联 T0848 全经，T1797 明确关联 T0848 第七卷。全经疏、卷七仪轨疏与根本经的范围和责任不同，保持三个作品实体。",
  ["T0848", "T1796", "T1797"],
);
const mahavairocanaScope = relation(
  "whole_sutra_and_fascicle_commentaries_distinct",
  "mahavairocana-commentary-scope-t1796-t1797",
  "一行记《大毘卢遮那成佛经疏》与不可思议《供养次第法疏》",
  "T1796 解释全经，T1797 只解释第七卷供养次第法。共同根经和仪轨术语不构成同一作品或同一表达。",
  ["T0848", "T1796", "T1797"],
);
const vajrasekharaExegesis = singleRootRelation("commentary_on_vajrasekhara_ritual_distinct", "vajrasekhara-exegesis-t0866-t1798", "T0866", "《金刚顶瑜伽中略出念诵经》", ["T1798"], "《大瑜伽秘密心地法门义诀》", "DILA T1798 规范记录把 T0866 标为相关经典。一卷义诀是传统署名不空的独立解释作品，经轨关系不等于作品合并。");
const surangamaExegesis = singleRootRelation("commentary_on_surangama_t0945_distinct", "surangama-exegesis-t0945-t1799", "T0945", "《大佛顶首楞严经》", ["T1799"], "子璿《义疏注经》", "DILA T1799 规范记录把 T0945 标为相关经典。十卷集注是独立经疏；存在注疏传统不能反向消除 T0945 的译者与成书争议。");
const guanyinDharaniExegesis = relation(
  "commentaries_on_guanyin_dharani_sutra_distinct",
  "guanyin-dharani-exegesis-t1043-t1800-t1801",
  "《请观世音菩萨消伏毒害陀罗尼呪经》与智顗说《疏》、智圆《阐义钞》",
  "DILA T1800 与 T1801 规范记录均把 T1043 标为相关经典。根经、讲说记录和再注释保持三个作品实体。",
  ["T1043", "T1800", "T1801"],
);
const guanyinDharaniSubcommentary = relation(
  "commentary_and_subcommentary_on_guanyin_dharani_sutra_distinct",
  "guanyin-dharani-subcommentary-t1043-t1800-t1801",
  "《请观音经》、智顗说灌顶记《疏》与智圆《疏阐义钞》",
  "DILA T1800 与 T1801 规范记录互相关联；T1801 依 T1800 展开四卷再注。根经、直接疏与再注释分层登记。",
  ["T1043", "T1800", "T1801"],
);
const elevenFacedExegesis = singleRootRelation("commentary_on_eleven_faced_dharani_distinct", "eleven-faced-dharani-exegesis-t1071-t1802", "T1071", "《十一面神呪心经》", ["T1802"], "慧沼《义疏》", "DILA T1802 规范记录把 T1071 标为相关经典。一卷义疏是独立诠释作品，不是玄奘译本的另一表达。");
const usnisaVijayaExegesis = singleRootRelation("commentary_on_usnisa_vijaya_dharani_distinct", "usnisa-vijaya-exegesis-t0967-t1803", "T0967", "《佛顶尊胜陀罗尼经》", ["T1803"], "法崇《教迹义记》", "DILA T1803 规范记录把 T0967 标为相关经典。两卷教迹义记是独立经疏，不是根本经或仪轨的另一表达。");

const d = (workId, sourceRole, relations, summary) => ({
  workId: `gbcr:work:${workId}`,
  sourceRole,
  workIdentityStatus: "verified_distinct_commentary_work",
  relations,
  summary,
  completeness: "complete_source_file",
});
const decisions = new Map(Object.entries({
  T1783: d("golden-light-xuanyi-zhiyi-guanding", "sinitic_taught_commentary_record", [goldenLightExegesis, goldenLightXuanyiSubcommentary, zhiyiGoldenLightWorks], "智顗说、灌顶录《金光明经玄义》完整来源。"),
  T1784: d("golden-light-xuanyi-shiyi-ji-zhili", "sinitic_authored_subcommentary", [goldenLightExegesis, goldenLightXuanyiSubcommentary, zhiliGoldenLightWorks], "知礼《金光明经玄义拾遗记》再注释完整来源。"),
  T1785: d("golden-light-wenju-zhiyi-guanding", "sinitic_taught_commentary_record", [goldenLightExegesis, goldenLightWenjuSubcommentary, zhiyiGoldenLightWorks], "智顗说、灌顶录《金光明经文句》完整来源。"),
  T1786: d("golden-light-wenju-ji-zhili", "sinitic_authored_subcommentary", [goldenLightExegesis, goldenLightWenjuSubcommentary, zhiliGoldenLightWorks], "知礼《金光明经文句记》再注释完整来源。"),
  T1787: d("golden-light-shu-jizang", "sinitic_authored_sutra_commentary", [goldenLightExegesis], "吉藏《金光明经疏》完整来源。"),
  T1788: d("suvarnaprabhasa-uttamaraja-shu-huizhao", "sinitic_authored_sutra_commentary", [goldenLightBestKingExegesis], "慧沼《金光明最胜王经疏》完整来源。"),
  T1789: d("lankavatara-t0670-zhu-jie-zongle-ruqi", "sinitic_authored_sutra_commentary", [lankavataraT0670Exegesis], "宗泐、如玘同注《楞伽阿跋多罗宝经注解》完整来源。"),
  T1790: d("lankavatara-xin-xuanyi-fazang", "sinitic_authored_sutra_commentary", [lankavataraT0672Exegesis, lankavataraCommentaries], "法藏《入楞伽心玄义》完整来源。"),
  T1791: d("lankavatara-t0672-zhu-baochen", "sinitic_authored_sutra_commentary", [lankavataraT0672Exegesis, lankavataraCommentaries], "宝臣《注大乘入楞伽经》完整来源。"),
  T1792: d("ullambana-shu-zongmi", "sinitic_authored_sutra_commentary", [ullambanaExegesis], "宗密《佛说盂兰盆经疏》完整来源。"),
  T1793: d("bathhouse-sutra-yiji-huiyuan", "sinitic_authored_sutra_commentary", [bathhouseExegesis], "慧远《温室经义记》完整来源。"),
  T1794: d("forty-two-chapters-zhu-song-zhenzong", "sinitic_authored_sutra_commentary", [fortyTwoChaptersExegesis], "宋真宗《注四十二章经》完整来源。"),
  T1795: d("perfect-enlightenment-lueshu-zongmi", "sinitic_authored_sutra_commentary", [perfectEnlightenmentExegesis], "宗密《大方广圆觉修多罗了义经略疏》完整来源。"),
  T1796: d("mahavairocana-sutra-shu-yixing", "sinitic_recorded_sutra_commentary", [mahavairocanaExegesis, mahavairocanaScope], "一行记《大毘卢遮那成佛经疏》完整来源。"),
  T1797: d("mahavairocana-offering-sequence-shu-bukesiyi", "sinitic_authored_sutra_commentary", [mahavairocanaExegesis, mahavairocanaScope], "不可思议《大毘卢遮那经供养次第法疏》卷七范围注疏完整来源。"),
  T1798: d("vajrasekhara-yoga-xindi-yijue-amoghavajra", "sinitic_authored_sutra_commentary", [vajrasekharaExegesis], "传统署名不空《金刚顶经大瑜伽秘密心地法门义诀》完整来源。"),
  T1799: d("surangama-yishu-zhu-jing-zixuan", "sinitic_compiled_sutra_commentary", [surangamaExegesis], "子璿集《首楞严义疏注经》完整来源，保留根本经成书争议边界。"),
  T1800: d("guanyin-dharani-shu-zhiyi-guanding", "sinitic_taught_commentary_record", [guanyinDharaniExegesis, guanyinDharaniSubcommentary], "智顗说、灌顶记《请观音经疏》完整来源。"),
  T1801: d("guanyin-dharani-shu-chanyi-chao-zhiyuan", "sinitic_authored_subcommentary", [guanyinDharaniExegesis, guanyinDharaniSubcommentary], "智圆《请观音经疏阐义钞》再注释完整来源。"),
  T1802: d("eleven-faced-heart-dharani-yishu-huizhao", "sinitic_authored_sutra_commentary", [elevenFacedExegesis], "慧沼《十一面神呪心经义疏》完整来源。"),
  T1803: d("usnisa-vijaya-dharani-jiaochi-yiji-fachong", "sinitic_authored_sutra_commentary", [usnisaVijayaExegesis], "法崇《佛顶尊胜陀罗尼经教迹义记》完整来源。"),
}));

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
  const author = stripXml(required(text.match(/<author>([\s\S]*?)<\/author>/)?.[1], "传统作者题记", record.sourceRecordId));
  const extent = required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const decision = decisions.get(canonId);
  if (!decision) throw new Error(`T39 出现未裁决经号 ${canonId}`);

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
    workId: decision.workId,
    workIdentityStatus: decision.workIdentityStatus,
    workTitle: title,
    sourceRole: decision.sourceRole,
    bibliographicRelations: decision.relations,
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: decision.completeness,
    presentation: {
      title,
      alternateTitle: title,
      tradition: "汉传佛教 · 经疏部 · 金光明、楞伽与显密经疏",
      language: "汉文",
      canonRef: `大正藏 T39, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。${decision.summary}传统责任题记：${author}。`,
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
  ["T1783", "T1784"], ["T1785", "T1786"], ["T1783", "T1785"],
  ["T1784", "T1786"], ["T1790", "T1791"], ["T1796", "T1797"], ["T1800", "T1801"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "golden-light-exegesis-t0663-t1783-t1787",
  "golden-light-best-king-exegesis-t0665-t1788",
  "lankavatara-exegesis-t0670-t1789",
  "lankavatara-exegesis-t0672-t1790-t1791",
  "ullambana-exegesis-t0685-t1792",
  "bathhouse-exegesis-t0701-t1793",
  "forty-two-chapters-exegesis-t0784-t1794",
  "perfect-enlightenment-exegesis-t0842-t1795",
  "mahavairocana-exegesis-t0848-t1796-t1797",
  "vajrasekhara-exegesis-t0866-t1798",
  "surangama-exegesis-t0945-t1799",
  "guanyin-dharani-exegesis-t1043-t1800-t1801",
  "eleven-faced-dharani-exegesis-t1071-t1802",
  "usnisa-vijaya-exegesis-t0967-t1803",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T39; T39 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T39",
    title: "大正藏 T39 金光明、楞伽及显密经疏部固定来源记录",
    sourceRecordDenominator: 21,
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
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T39 的 21 份来源记录登记为 21 个完整表达和 21 个独立经疏作品。T1783/T1784、T1785/T1786 与 T1800/T1801 分别保持直接注释—再注释层级；T1790/T1791 共同解释 T0672 但保持异作；T1796 解释 T0848 全经，T1797 只解释第七卷供养次第法；T1799 连接 T0945 但不消除根本经成书争议。所有记录均不标作根本经表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_root_translation_commentary_fascicle_scope_compiled_commentary_traditional_attribution_and_subcommentary_boundaries_recorded",
    existingControlledRecords: ["T0663", "T0665", "T0670", "T0672", "T0685", "T0701", "T0784", "T0842", "T0848", "T0866", "T0945", "T0967", "T1043", "T1071"],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: [
      "golden-light-xuanyi-subcommentary-t0663-t1783-t1784",
      "golden-light-wenju-subcommentary-t0663-t1785-t1786",
      "guanyin-dharani-subcommentary-t1043-t1800-t1801",
    ],
    relatedDistinctWorkGroups: [
      "zhiyi-golden-light-commentaries-t1783-t1785",
      "zhili-golden-light-subcommentaries-t1784-t1786",
      "lankavatara-commentaries-t1790-t1791",
      "mahavairocana-commentary-scope-t1796-t1797",
    ],
    candidateRelationsNotMerged: [
      "T0663↔T1783–T1787，T1783↔T1784，T1785↔T1786（金光明根经、玄义、文句、经疏及两组再注释分层保存）",
      "T0665↔T1788（义净译《金光明最胜王经》与慧沼经疏分层保存）",
      "T0670↔T1789；T0672↔T1790/T1791（三种楞伽经译本及各自注疏不跨译本合并）",
      "T0685/T0701/T0784/T0842 与 T1792–T1795（根经、传统译者题记与后世注疏分层保存）",
      "T0848↔T1796/T1797（全经疏与只释卷七供养次第法的范围边界分层保存）",
      "T0866↔T1798，T0945↔T1799（经轨与义诀分层；楞严注疏不消除根经成书争议）",
      "T1043↔T1800↔T1801（请观音根经、直接疏与阐义钞再注释分层保存）",
      "T0967↔T1803，T1071↔T1802（陀罗尼根经与义疏、义记分层保存）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation, abridgment and exegetical dependence; it cannot merge root translations, direct commentaries, fascicle-scoped ritual commentaries, compiled annotations, subcommentaries, same-author works or texts with disputed attribution.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T39",
      ...["CA0001769", "CA0001794", "CA0001940", "CA0002683", "CA0003835", "CA0003345", "CA0002838", "CA0003889", "CA0000642", "CA0001662", "CA0000587", "CA0001042", "CA0002602", "CA0003078", "CA0001788", "CA0001790", "CA0001783", "CA0001785", "CA0001782", "CA0001797", "CA0001942", "CA0002684", "CA0002685", "CA0003837", "CA0003344", "CA0002842", "CA0003877", "CA0000641", "CA0000650", "CA0001626", "CA0002004", "CA0002603", "CA0002604", "CA0003079", "CA0001046"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T39 是经疏部，不是佛说经集合。平台完整保存固定来源，同时区分金光明、楞伽、显教与密教根经表达，以及玄义、文句、拾遗记、文句记、略疏、义诀、集注、卷七仪轨疏和再注释；共同根经、同作者、传统责任题记、章节范围、经轨关系、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T39 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);
