import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.11.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t44.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t44-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.10.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 17 || inventory.totals.upstreamBytes !== 9429430 || candidates.length !== 17) {
  throw new Error(`T44 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const madhyantavibhagaCommentary = relation(
  "commentary_on_madhyantavibhaga_distinct",
  "madhyantavibhaga-commentary-t1600-t1835",
  "《辩中边论》与窺基《辩中边论述记》",
  "DILA 权威记录将 T1835 关联到 T1600。三卷述记保留窺基责任和独立解释结构，不是根本论的另一表达。",
  ["T1600", "T1835"],
);
const hundredDharmasCommentaries = relation(
  "commentaries_on_hundred_dharmas_treatise_distinct",
  "hundred-dharmas-commentaries-t1614-t1836-t1837",
  "《大乘百法明门论》与两部汉地论疏",
  "DILA 权威记录将 T1836、T1837 分别关联到 T1614。两书的责任题记、体例、结构和全文边界不同，均不是世亲根本论或玄奘译本的另一表达。",
  ["T1614", "T1836", "T1837"],
);
const hundredDharmasParallel = relation(
  "parallel_hundred_dharmas_commentaries_distinct",
  "hundred-dharmas-parallel-commentaries-t1836-t1837",
  "《大乘百法明门论解》与《大乘百法明门论疏》",
  "T1836 题署窺基注解、普泰增修，T1837 题署大乘光撰；共同根本论不能消除复合责任、作者与正文边界。",
  ["T1614", "T1836", "T1837"],
);
const hundredDharmasLayeredAttribution = relation(
  "layered_traditional_attribution_recorded",
  "hundred-dharmas-layered-attribution-t1836",
  "T1836 的注解—增修复合责任",
  "CBETA TEI 责任题记为“唐 窺基註解．明 普泰增修”。平台保存这一传统责任层，不把增修层抹平为单一作者，也不据题记解决现代作者学争议。",
  ["T1836"],
);
const dharmadhatuRootEditions = relation(
  "root_treatise_edition_witnesses_distinct",
  "dharmadhatu-avisesa-root-editions-t1626-t1627",
  "《大乘法界无差别论》T1626 与 T1627",
  "DILA 将 T1626、T1627 互列相关；T1627 另保留译者归属疑义。两份受控根本文本继续作为不同表达或见证保存，不因同题而自动合并。",
  ["T1626", "T1627"],
);
const dharmadhatuCommentary = relation(
  "commentary_on_dharmadhatu_avisesa_distinct",
  "dharmadhatu-avisesa-commentary-t1626-t1627-t1838",
  "《大乘法界无差别论》根本文本与法藏疏",
  "DILA 明确将 T1838 关联到 T1626，并将 T1626、T1627 互列相关。法藏疏具有独立责任与解释结构，不是任何根本文本表达。",
  ["T1626", "T1627", "T1838"],
);
const nyayamukhaCommentary = relation(
  "commentary_on_nyayamukha_distinct",
  "nyayamukha-commentary-t1628-t1839",
  "《因明正理门论本》与神泰《理门论述记》",
  "DILA 权威记录将 T1839 关联到 T1628。述记保留神泰责任和独立正文，不是陈那根本论或玄奘译本的另一表达。",
  ["T1628", "T1839"],
);
const nyayapravesaCommentaries = relation(
  "commentaries_on_nyayapravesa_distinct",
  "nyayapravesa-commentaries-t1630-t1840-t1841-t1842",
  "《因明入正理论》与窺基、慧沼三部著述",
  "DILA 分别将 T1840、T1841、T1842 关联到 T1630。三书保留不同作者责任、题名、体例与全文边界，不是根本论表达。",
  ["T1630", "T1840", "T1841", "T1842"],
);
const nyayapravesaParallel = relation(
  "parallel_nyayapravesa_commentarial_works_distinct",
  "nyayapravesa-parallel-works-t1840-t1841-t1842",
  "《因明入正理论疏》《因明义断》《因明入正理论义纂要》",
  "三书共享因明主题与 T1630 根本论，但窺基疏、慧沼义断和义纂要在作者责任、论证体例与全文边界上均独立。",
  ["T1630", "T1840", "T1841", "T1842"],
);
const huizhaoLogicCompanions = relation(
  "same_author_same_root_logic_works_scope_distinct",
  "huizhao-nyayapravesa-companions-t1841-t1842",
  "慧沼《因明义断》与《因明入正理论义纂要》",
  "两书同署慧沼并关联 T1630，但题名、撰集责任、内容组织和全文锚点不同，保持相关但不同的作品。",
  ["T1630", "T1841", "T1842"],
);
const awakeningRootTranslations = relation(
  "root_treatise_translation_expressions_distinct",
  "awakening-of-faith-root-translations-t1666-t1667",
  "《大乘起信论》T1666 与 T1667 两种汉译表达",
  "DILA 将 T1666、T1667 互列相关，并分别记录真谛、实叉难陀译者责任。两种汉译保持不同表达；旧译注疏与 T1850 新译疏也按根本译本分层。",
  ["T1666", "T1667"],
);
const awakeningOldTranslationCommentaries = relation(
  "commentaries_on_awakening_of_faith_old_translation_distinct",
  "awakening-of-faith-old-translation-commentaries-t1666-t1843-t1849",
  "T1666《大乘起信论》与七部直接或伴随论疏",
  "DILA 的 T1666 记录列出 T1843–T1849；各书分别保留慧远、元晓、法藏、子璿、太贤的责任、体例、时代与全文边界。",
  ["T1666", "T1843", "T1844", "T1845", "T1846", "T1847", "T1848", "T1849"],
);
const awakeningNewTranslationCommentary = relation(
  "commentary_on_awakening_of_faith_new_translation_distinct",
  "awakening-of-faith-new-translation-commentary-t1667-t1850",
  "T1667 新译《大乘起信论》与智旭《裂网疏》",
  "DILA 明确将 T1850 标为解释 T1667 新译的六卷疏。它不是 T1667 根本文本，也不与旧译注疏自动合并。",
  ["T1667", "T1850"],
);
const awakeningParallelCommentaries = relation(
  "parallel_awakening_of_faith_commentaries_distinct",
  "awakening-of-faith-parallel-commentaries-t1843-t1850",
  "《大乘起信论》八部汉地与新罗论疏",
  "T1843–T1850 跨慧远、元晓、法藏、子璿、太贤、智旭与两种根本译本；共同题名和引文只构成解释传统关系。",
  ["T1666", "T1667", "T1843", "T1844", "T1845", "T1846", "T1847", "T1848", "T1849", "T1850"],
);
const wonhyoAwakeningCompanions = relation(
  "same_author_awakening_commentary_and_companion_scope_distinct",
  "wonhyo-awakening-companions-t1844-t1845",
  "元晓《起信论疏》与《大乘起信论别记》",
  "DILA 将 T1844、T1845 互列相关；二卷疏与一卷别记具有不同题名、范围和全文结构，保持两个作品。",
  ["T1666", "T1844", "T1845"],
);
const fazangAwakeningCompanions = relation(
  "same_author_awakening_commentary_and_companion_scope_distinct",
  "fazang-awakening-companions-t1846-t1847",
  "法藏《大乘起信论义记》与《义记别记》",
  "DILA 将 T1846、T1847 互列相关；三卷义记与一卷别记在题名、范围与全文锚点上不同，保持两个作品。",
  ["T1666", "T1846", "T1847"],
);
const bixiaojiSubcommentary = relation(
  "subcommentary_on_fazang_awakening_commentary_distinct",
  "awakening-of-faith-yiji-subcommentary-t1846-t1847-t1848",
  "法藏《义记》系统与子璿《起信论疏笔削记》",
  "DILA 将 T1848 同时关联到 T1666、T1846、T1847。二十卷笔削记是后出的再解释，保留子璿责任与独立正文。",
  ["T1666", "T1846", "T1847", "T1848"],
);
const kuijiTreatiseCommentaries = relation(
  "kuiji_treatise_and_logic_commentaries_related_distinct",
  "kuiji-t44-commentaries-t1835-t1836-t1840",
  "窺基在 T44 的三部论疏责任记录",
  "T1835、T1836、T1840 分别关联 T1600、T1614、T1630；共同窺基责任不能消除根本论、复合增修层、体例与全文边界。",
  ["T1600", "T1614", "T1630", "T1835", "T1836", "T1840"],
);
const fazangTreatiseCommentaries = relation(
  "fazang_treatise_commentaries_related_distinct",
  "fazang-t44-commentaries-t1838-t1846-t1847",
  "法藏的法界无差别论疏与起信论著述",
  "T1838 解释 T1626，T1846、T1847 关联 T1666；共同法藏责任与华严传统不构成同一作品。",
  ["T1626", "T1666", "T1838", "T1846", "T1847"],
);
const huiyuanTreatiseWorks = relation(
  "huiyuan_commentary_and_doctrinal_compendium_related_distinct",
  "huiyuan-t44-works-t1843-t1851",
  "净影慧远《大乘起信论义疏》与《大乘义章》",
  "T1843 是对 T1666 的两卷义疏，T1851 是二十卷独立教义汇编；共同作者与大乘术语不能把综合义章降格为单一根本论注疏。",
  ["T1666", "T1843", "T1851"],
);

const d = (workId, sourceRole, tradition, relations, summary, workIdentityStatus = "verified_distinct_commentary_work") => ({
  workId: `gbcr:work:${workId}`,
  sourceRole,
  tradition,
  workIdentityStatus,
  relations,
  summary,
  completeness: "complete_source_file",
});
const decisions = new Map(Object.entries({
  T1835: d("madhyantavibhaga-shuji-kuiji", "sinitic_authored_madhyantavibhaga_commentary", "汉传佛教 · 瑜伽论疏部 · 辩中边论述记", [madhyantavibhagaCommentary, kuijiTreatiseCommentaries], "窺基《辩中边论述记》完整来源。"),
  T1836: d("hundred-dharmas-commentary-kuiji-putai", "sinitic_layered_hundred_dharmas_commentary", "汉传佛教 · 瑜伽论疏部 · 百法明门论解", [hundredDharmasCommentaries, hundredDharmasParallel, hundredDharmasLayeredAttribution, kuijiTreatiseCommentaries], "窺基注解、普泰增修《大乘百法明门论解》完整来源。", "verified_distinct_layered_commentary_work"),
  T1837: d("hundred-dharmas-shu-dachengguang", "sinitic_authored_hundred_dharmas_commentary", "汉传佛教 · 瑜伽论疏部 · 百法明门论疏", [hundredDharmasCommentaries, hundredDharmasParallel], "大乘光《大乘百法明门论疏》完整来源。"),
  T1838: d("dharmadhatu-avisesa-shu-fazang", "sinitic_authored_dharmadhatu_avisesa_commentary", "汉传佛教 · 瑜伽论疏部 · 法界无差别论疏", [dharmadhatuRootEditions, dharmadhatuCommentary, fazangTreatiseCommentaries], "法藏《大乘法界无差别论疏》完整来源。"),
  T1839: d("nyayamukha-shuji-shentai", "sinitic_authored_nyayamukha_commentary", "汉传佛教 · 因明论疏部 · 理门论述记", [nyayamukhaCommentary], "神泰《理门论述记》完整来源。"),
  T1840: d("nyayapravesa-shu-kuiji", "sinitic_authored_nyayapravesa_commentary", "汉传佛教 · 因明论疏部 · 因明入正理论疏", [nyayapravesaCommentaries, nyayapravesaParallel, kuijiTreatiseCommentaries], "窺基《因明入正理论疏》完整来源。"),
  T1841: d("nyayapravesa-yiduan-huizhao", "sinitic_authored_nyayapravesa_critical_commentary", "汉传佛教 · 因明论疏部 · 因明义断", [nyayapravesaCommentaries, nyayapravesaParallel, huizhaoLogicCompanions], "慧沼《因明义断》完整来源。"),
  T1842: d("nyayapravesa-yizuanyao-huizhao", "sinitic_compiled_nyayapravesa_commentary", "汉传佛教 · 因明论疏部 · 因明义纂要", [nyayapravesaCommentaries, nyayapravesaParallel, huizhaoLogicCompanions], "慧沼《因明入正理论义纂要》完整来源。"),
  T1843: d("awakening-of-faith-yishu-huiyuan", "sinitic_authored_awakening_of_faith_commentary", "汉传佛教 · 起信论疏部 · 慧远义疏", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries, huiyuanTreatiseWorks], "净影慧远《大乘起信论义疏》完整来源。"),
  T1844: d("awakening-of-faith-shu-wonhyo", "silla_authored_awakening_of_faith_commentary", "新罗佛教 · 起信论疏部 · 元晓疏", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries, wonhyoAwakeningCompanions], "元晓《起信论疏》完整来源。"),
  T1845: d("awakening-of-faith-bieji-wonhyo", "silla_authored_awakening_of_faith_companion_note", "新罗佛教 · 起信论疏部 · 元晓别记", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries, wonhyoAwakeningCompanions], "元晓《大乘起信论别记》完整来源。"),
  T1846: d("awakening-of-faith-yiji-fazang", "sinitic_authored_awakening_of_faith_commentary", "汉传佛教 · 起信论疏部 · 法藏义记", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries, fazangAwakeningCompanions, bixiaojiSubcommentary, fazangTreatiseCommentaries], "法藏《大乘起信论义记》完整来源。"),
  T1847: d("awakening-of-faith-yiji-bieji-fazang", "sinitic_authored_awakening_of_faith_companion_note", "汉传佛教 · 起信论疏部 · 法藏义记别记", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries, fazangAwakeningCompanions, bixiaojiSubcommentary, fazangTreatiseCommentaries], "法藏《大乘起信论义记别记》完整来源。"),
  T1848: d("awakening-of-faith-bixiaoji-zixuan", "sinitic_authored_awakening_of_faith_subcommentary", "汉传佛教 · 起信论疏部 · 笔削记再注释", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries, bixiaojiSubcommentary], "子璿《起信论疏笔削记》完整来源。"),
  T1849: d("awakening-of-faith-neiyi-luetanji-taehyeon", "silla_authored_awakening_of_faith_concise_commentary", "新罗佛教 · 起信论疏部 · 内义略探记", [awakeningRootTranslations, awakeningOldTranslationCommentaries, awakeningParallelCommentaries], "太贤《大乘起信论内义略探记》完整来源。"),
  T1850: d("awakening-of-faith-liewangshu-zhixu", "sinitic_authored_awakening_of_faith_new_translation_commentary", "汉传佛教 · 起信论疏部 · 新译裂网疏", [awakeningRootTranslations, awakeningNewTranslationCommentary, awakeningParallelCommentaries], "智旭《大乘起信论裂网疏》完整来源。"),
  T1851: d("dasheng-yizhang-huiyuan", "sinitic_authored_mahayana_doctrinal_compendium", "汉传佛教 · 诸宗义章 · 大乘义章", [huiyuanTreatiseWorks], "净影慧远《大乘义章》完整来源；它是综合教义汇编，不是单一根本论注疏。", "verified_distinct_sinitic_doctrinal_compendium"),
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
  if (!decision) throw new Error(`T44 出现未裁决经号 ${canonId}`);

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
      tradition: decision.tradition,
      language: "汉文",
      canonRef: `大正藏 T44, no. ${canonId.slice(1)}`,
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
const combinations = (ids) => ids.flatMap((left, index) => ids.slice(index + 1).map((right) => [left, right]));
const comparisonPairs = [
  ...combinations(["T1836", "T1837"]),
  ...combinations(["T1840", "T1841", "T1842"]),
  ...combinations(["T1843", "T1844", "T1845", "T1846", "T1847", "T1848", "T1849", "T1850"]),
  ["T1835", "T1836"], ["T1835", "T1840"], ["T1836", "T1840"],
  ["T1838", "T1846"], ["T1838", "T1847"], ["T1843", "T1851"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "madhyantavibhaga-commentary-t1600-t1835",
  "hundred-dharmas-commentaries-t1614-t1836-t1837",
  "dharmadhatu-avisesa-commentary-t1626-t1627-t1838",
  "nyayamukha-commentary-t1628-t1839",
  "nyayapravesa-commentaries-t1630-t1840-t1841-t1842",
  "awakening-of-faith-old-translation-commentaries-t1666-t1843-t1849",
  "awakening-of-faith-new-translation-commentary-t1667-t1850",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T44; T44 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T44",
    title: "大正藏 T44 论疏、因明与大乘义章固定来源记录",
    sourceRecordDenominator: 17,
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
    workCountingDecision: "T44 的 17 份来源记录登记为 17 个完整表达和 17 个独立汉地或新罗著述作品。T1835–T1850 分别连接 T1600、T1614、T1626/T1627、T1628、T1630、T1666/T1667 的直接注疏、伴随著作或再注释；T1851 是独立综合教义汇编。共同根本论、同作者、同题、异译、复合责任题记或解释传统均不消除作品与表达边界。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_treatise_logic_awakening_commentary_subcommentary_root_translation_layered_attribution_companion_scope_and_compendium_boundaries_recorded",
    existingControlledRecords: ["T1600", "T1614", "T1626", "T1627", "T1628", "T1630", "T1666", "T1667"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups,
    rootEditionBoundaryGroups: ["dharmadhatu-avisesa-root-editions-t1626-t1627", "awakening-of-faith-root-translations-t1666-t1667"],
    subcommentaryGroups: ["awakening-of-faith-yiji-subcommentary-t1846-t1847-t1848"],
    scopeBoundaryGroups: ["huizhao-nyayapravesa-companions-t1841-t1842", "wonhyo-awakening-companions-t1844-t1845", "fazang-awakening-companions-t1846-t1847"],
    relatedDistinctWorkGroups: ["hundred-dharmas-parallel-commentaries-t1836-t1837", "nyayapravesa-parallel-works-t1840-t1841-t1842", "awakening-of-faith-parallel-commentaries-t1843-t1850", "kuiji-t44-commentaries-t1835-t1836-t1840", "fazang-t44-commentaries-t1838-t1846-t1847", "huiyuan-t44-works-t1843-t1851"],
    candidateRelationsNotMerged: [
      "T1600↔T1835、T1614↔T1836/T1837、T1626/T1627↔T1838、T1628↔T1839、T1630↔T1840/T1841/T1842（根本论与直接论疏分层）",
      "T1666↔T1843–T1849、T1667↔T1850（《起信论》旧译、新译与各自注疏分层）",
      "T1846/T1847↔T1848（法藏义记系统与子璿二十卷再注释分层）",
      "T1841↔T1842、T1844↔T1845、T1846↔T1847（同作者、同根本论的不同体例与范围保持独立）",
      "T1836 的窺基注解—普泰增修复合责任按题记保存，不压平成单一无争议作者归属",
      "T1843↔T1851（共同净影慧远责任不把综合《大乘义章》并入单一《起信论》注疏）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records shared quotation, vocabulary and exegetical dependence; it cannot merge root translations, direct commentaries, companion notes, a subcommentary or the independent doctrinal compendium.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T44",
      ...["CA0000319", "CA0000139", "CA0000140", "CA0000142", "CA0000922", "CA0000923", "CA0000924", "CA0003778", "CA0002031", "CA0003764", "CA0003767", "CA0003772", "CA0003773", "CA0000569", "CA0000568", "CA0002551", "CA0002543", "CA0002538", "CA0000572", "CA0002537", "CA0000570", "CA0002542", "CA0002540", "CA0000574"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T44 是汉地与新罗论疏、因明著述、起信论解释传统及综合义章集合，不是佛说经或单一印度根本论集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分七条根本文本链、两组根本译本或版本边界、一条再注释链、三组同作者伴随著作范围、复合责任题记和平行异作；题名、共同作者、传统术语、引文或机器相似度都不能单独证明作品相同、作者无争议、文本已成批校本或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T44 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);
