import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.8.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t31.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t31-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.7.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 43 || inventory.totals.upstreamBytes !== 11039332 || candidates.length !== 43) {
  throw new Error(`T31 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const trimsikaFamily = relation(
  "trimsika_root_translations_and_composite_commentary_boundary_verified",
  "trimsika-t1585-t1587",
  "《唯识三十颂》异译与《成唯识论》复合注释边界",
  "研究与经录把 T1586、T1587 作为《唯识三十颂》的两个汉文表达；T1585 糅合十家注释并以护法释为主，是围绕根本颂形成的汉文复合注释作品，不与根本颂合并。T1587 又见从《无相论》或《显识论》抽出的目录传统，平台保留这一形成史。",
  ["T1585", "T1586", "T1587"],
);
const vimsatikaFamily = relation(
  "vimsatika_three_translations_and_dharmapala_commentary_verified",
  "vimsatika-t1588-t1591",
  "《唯识二十论》三译与护法释",
  "T1588、T1589、T1590 是世亲《唯识二十论》的三种汉译；T1591 是护法对该论的独立注释，又名《二十唯识顺释论》，故前三者共享作品标识而 T1591 另立注释作品。",
  ["T1588", "T1589", "T1590", "T1591"],
);
const samgrahaFamily = relation(
  "mahayanasamgraha_root_and_commentary_families_verified",
  "mahayanasamgraha-t1592-t1598",
  "《摄大乘论》三译、世亲释三译与无性释边界",
  "T1592–T1594 是无著根本论三译；T1595–T1597 是世亲释三译；T1598 是无性释。平台建立两个同作品异译组，并把根本论、世亲释、无性释计为三个作品。",
  ["T1592", "T1593", "T1594", "T1595", "T1596", "T1597", "T1598"],
);
const madhyantaFamily = relation(
  "madhyantavibhaga_root_and_bhasya_translations_verified",
  "madhyantavibhaga-t1599-t1601",
  "《中边分别论》本颂与世亲释边界",
  "T1599、T1600 是世亲《中边分别论释》的两个汉译；T1601 是独立译出的根本颂。T1600 大量嵌入本颂，但释论与本颂仍是不同作品。",
  ["T1599", "T1600", "T1601"],
);
const prakaranaryavacaFamily = relation(
  "prakaranaryavaca_verses_and_prose_exposition_verified",
  "prakaranaryavaca-t1602-t1603",
  "《显扬圣教论》长行与独立本颂",
  "T1603 完整保存 T1602 各品所嵌本颂，五字组短文本包含率约 79%；独立本颂与含长行解释的复合论体分列作品，作者层次的传统与现代争论照录而不强行裁决。",
  ["T1602", "T1603"],
);
const abhidharmaSamuccayaFamily = relation(
  "abhidharmasamuccaya_root_and_collated_commentary_verified",
  "abhidharmasamuccaya-t1605-t1606",
  "《集论》与《杂集论》根本论—合糅释关系",
  "T1605 是无著《大乘阿毘达磨集论》；T1606 是安慧把根本论与解释合糅而成的《杂集论》。机器对读显示根本文本大量嵌入，但二者是不同作品。",
  ["T1605", "T1606"],
);
const karmasiddhiFamily = relation(
  "karmasiddhiprakarana_two_chinese_translations_verified",
  "karmasiddhiprakarana-t1608-t1609",
  "世亲《成业论》两种汉译",
  "学术研究明确把 T1608 与 T1609 识别为世亲 Karmasiddhiprakaraṇa 的两种汉译，故共享作品标识并各保留译者、题名与稳定锚点。",
  ["T1608", "T1609"],
);
const tathagatagarbhaFamily = relation(
  "tathagatagarbha_related_distinct_treatises",
  "tathagatagarbha-t1610-t1611",
  "《佛性论》与《宝性论》的近缘但不同作品",
  "T1610 与 T1611 都是如来藏、佛性思想的重要论典，义理近缘不等于文本同一；平台分列作品，并保留 T1610 更可能为真谛编成而非单纯翻译的研究意见。",
  ["T1610", "T1611"],
);
const pancaskandhaFamily = relation(
  "pancaskandhaka_root_and_sthiramati_commentary_verified",
  "pancaskandhaka-t1612-t1613",
  "《五蕴论》与安慧广释",
  "T1612 是世亲 Pañcaskandhaka；T1613 是安慧 Pañcaskandhakavibhāṣā 的汉文节译或摘要。后者大量重用根本文本，但作为注释作品另立。",
  ["T1612", "T1613"],
);
const rajadharmaFamily = relation(
  "yogacarabhumi_independently_translated_component_verified",
  "yogacarabhumi-t1579-t1615",
  "《瑜伽师地论》卷六十一与《王法正理论》",
  "研究明确 T1615 是 T1579 卷六十一相关段落的别译并独立流通；机器对读的短文本五字组包含率约 93%。平台把它登记为组成作品，而不把一份整部论表达重复拆算为另一份完整整部论。",
  ["T1579", "T1615"],
);
const paramarthaBoundary = relation(
  "paramartha_translation_lecture_or_composition_attribution_boundary",
  "paramartha-yogacara-t1587-t1618",
  "真谛名下瑜伽论书的译作、讲录与编成边界",
  "经录把 T1587、T1617、T1618 联系到《无相论》的篇章传统；同行研究又指出 T1610、T1616、T1617、T1618 更自然地视为真谛在汉地的编成或讲录，而非可复原的逐字印度原典翻译。平台分别保存各部，不因共同来源传统合并。",
  ["T1587", "T1610", "T1616", "T1617", "T1618"],
);
const alambanaFamily = relation(
  "alambanapariksa_two_translations_and_commentary_verified",
  "alambanapariksa-t1619-t1625",
  "陈那《观所缘缘论》两译与护法释",
  "经录明确 T1619 与 T1624 同本异译，均为陈那 Ālambanaparīkṣā；T1625 是护法的独立注释。翻译词汇差异导致机器字面重合低，不据此否定书目同一性。",
  ["T1619", "T1624", "T1625"],
);
const hastavalaFamily = relation(
  "hastavalaprakarana_two_chinese_translations_verified",
  "hastavalaprakarana-t1620-t1621",
  "《解卷论》《掌中论》同本异译",
  "古代经录与现代目录均明确 T1620 是真谛初译、T1621 是义净再译的 Hastavālaprakaraṇa；两者共享作品标识，保留不同题名与译者。",
  ["T1620", "T1621"],
);
const dharmadhatuFamily = relation(
  "dharmadhatu_avisesa_alternate_chinese_versions_verified",
  "dharmadhatu-avisesa-t1626-t1627",
  "《大乘法界无差别论》两种汉文传本",
  "T1626 与 T1627 义同文异。校勘研究认为契丹系 T1626 更可能是提云般若真译，开宝、高丽系 T1627 可能是开元录之后的未知重译；平台登记为同一作品的两个完整汉文表达，并保留译者归属争议。",
  ["T1626", "T1627"],
);

const d = (workId, workTitle, sourceRole, workIdentityStatus, relations, summary) => ({
  workId: `gbcr:work:${workId}`,
  workTitle,
  sourceRole,
  workIdentityStatus,
  relations,
  summary,
  completeness: "complete_source_file",
});
const same = "verified_same_work_expression";
const decisions = new Map(Object.entries({
  T1585: d("cheng-weishi-lun-compilation", "成唯识论（十家释糅译复合论）", "traditional_composite_trimsika_commentary_translation", "verified_composite_commentary_work", [trimsikaFamily], "十卷复合论完整来源；不是任何单一梵本的逐字翻译，也不与三十颂根本作品合并。"),
  T1586: d("trimsika-vijnaptimatrata", "唯识三十颂（Triṃśikā-vijñaptimātratā）", "traditional_root_verse_translation", same, [trimsikaFamily], "玄奘所译三十颂完整来源。"),
  T1587: d("trimsika-vijnaptimatrata", "唯识三十颂（Triṃśikā-vijñaptimātratā）", "traditional_translation_or_extracted_component_recension", same, [trimsikaFamily, paramarthaBoundary], "真谛译本或《无相论》篇章传统的完整来源记录；同一性按书目研究建立，形成方式保留争议。"),
  T1588: d("vimsatika-vijnaptimatratasiddhi", "唯识二十论（Viṃśatikā-vijñaptimātratāsiddhi）", "traditional_root_treatise_translation", same, [vimsatikaFamily], "般若流支译完整表达。"),
  T1589: d("vimsatika-vijnaptimatratasiddhi", "唯识二十论（Viṃśatikā-vijñaptimātratāsiddhi）", "traditional_root_treatise_translation", same, [vimsatikaFamily], "真谛译完整表达。"),
  T1590: d("vimsatika-vijnaptimatratasiddhi", "唯识二十论（Viṃśatikā-vijñaptimātratāsiddhi）", "traditional_root_treatise_translation", same, [vimsatikaFamily], "玄奘译完整表达。"),
  T1591: d("vimsatika-commentary-dharmapala", "成唯识宝生论（护法《唯识二十论》释）", "traditional_authored_commentary_translation", "verified_distinct_commentary_work", [vimsatikaFamily], "护法注释完整来源；不与二十论根本作品合并。"),
  T1592: d("mahayanasamgraha-asanga", "摄大乘论（Mahāyānasaṃgraha）", "traditional_root_treatise_translation", same, [samgrahaFamily], "佛陀扇多译完整表达。"),
  T1593: d("mahayanasamgraha-asanga", "摄大乘论（Mahāyānasaṃgraha）", "traditional_root_treatise_translation", same, [samgrahaFamily], "真谛译完整表达。"),
  T1594: d("mahayanasamgraha-asanga", "摄大乘论（Mahāyānasaṃgraha）", "traditional_root_treatise_translation", same, [samgrahaFamily], "玄奘译完整表达。"),
  T1595: d("mahayanasamgrahabhasya-vasubandhu", "摄大乘论释（Mahāyānasaṃgrahabhāṣya）", "traditional_authored_commentary_translation", same, [samgrahaFamily], "真谛译世亲释完整表达。"),
  T1596: d("mahayanasamgrahabhasya-vasubandhu", "摄大乘论释（Mahāyānasaṃgrahabhāṣya）", "traditional_authored_commentary_translation", same, [samgrahaFamily], "笈多等译世亲释完整表达。"),
  T1597: d("mahayanasamgrahabhasya-vasubandhu", "摄大乘论释（Mahāyānasaṃgrahabhāṣya）", "traditional_authored_commentary_translation", same, [samgrahaFamily], "玄奘译世亲释完整表达。"),
  T1598: d("mahayanasamgrahopanibandhana-asvabhava", "摄大乘论释（无性释）", "traditional_authored_commentary_translation", "verified_distinct_commentary_work", [samgrahaFamily], "无性释完整来源，与世亲释分列作品。"),
  T1599: d("madhyantavibhagabhasya-vasubandhu", "中边分别论释（Madhyāntavibhāgabhāṣya）", "traditional_root_verses_with_commentary_translation", same, [madhyantaFamily], "真谛译世亲释完整表达。"),
  T1600: d("madhyantavibhagabhasya-vasubandhu", "辩中边论（Madhyāntavibhāgabhāṣya）", "traditional_root_verses_with_commentary_translation", same, [madhyantaFamily], "玄奘译世亲释完整表达，内嵌根本颂。"),
  T1601: d("madhyantavibhaga-karika", "辩中边论颂（Madhyāntavibhāgakārikā）", "traditional_root_verse_translation", "verified_distinct_root_verse_work", [madhyantaFamily], "玄奘独立译出的根本颂完整来源。"),
  T1602: d("prakaranaryavaca-sastra", "显扬圣教论", "traditional_root_verses_with_prose_exposition_translation", "verified_distinct_composite_treatise_work", [prakaranaryavacaFamily], "二十卷长行论体完整来源；作者层次争论保留。"),
  T1603: d("prakaranaryavaca-karika", "显扬圣教论颂", "traditional_root_verse_translation", "verified_distinct_root_verse_work", [prakaranaryavacaFamily], "十一品本颂的独立完整来源。"),
  T1604: d("mahayanasutralamkara-bhasya", "大乘庄严经论（Mahāyānasūtrālaṃkārabhāṣya）", "traditional_root_verses_with_commentary_translation", "verified_composite_root_and_commentary_work", [], "十三卷完整来源；本颂与长行注释责任层次按来源题记保存。"),
  T1605: d("abhidharmasamuccaya", "大乘阿毘达磨集论（Abhidharmasamuccaya）", "traditional_root_treatise_translation", "verified_distinct_root_treatise_work", [abhidharmaSamuccayaFamily], "无著根本论完整来源。"),
  T1606: d("abhidharmasamuccaya-vyakhya", "大乘阿毘达磨杂集论（Abhidharmasamuccayavyākhyā）", "traditional_collated_root_and_commentary_translation", "verified_distinct_collated_commentary_work", [abhidharmaSamuccayaFamily], "安慧合糅根本论与解释的完整复合来源。"),
  T1607: d("sad-dvara-dhyana-commentary", "六门教授习定论", "traditional_root_verses_with_commentary_translation", "verified_composite_root_and_commentary_work", [], "无著本、世亲释的完整复合论来源。"),
  T1608: d("karmasiddhiprakarana", "业成就论（Karmasiddhiprakaraṇa）", "traditional_treatise_translation", same, [karmasiddhiFamily], "毘目智仙译完整表达。"),
  T1609: d("karmasiddhiprakarana", "大乘成业论（Karmasiddhiprakaraṇa）", "traditional_treatise_translation", same, [karmasiddhiFamily], "玄奘译完整表达。"),
  T1610: d("buddhadhatu-sastra", "佛性论", "traditional_attributed_treatise_or_sinitic_compilation", "verified_distinct_work_with_attribution_boundary", [tathagatagarbhaFamily, paramarthaBoundary], "四卷完整来源；传统世亲造、真谛译题记与现代编成研究并存。"),
  T1611: d("ratnagotravibhaga", "究竟一乘宝性论（Ratnagotravibhāga）", "traditional_root_verses_with_commentary_translation", "verified_distinct_tathagatagarbha_treatise_work", [tathagatagarbhaFamily], "四卷完整来源；与《佛性论》义理近缘但不合并。"),
  T1612: d("pancaskandhaka", "大乘五蕴论（Pañcaskandhaka）", "traditional_root_treatise_translation", "verified_distinct_root_treatise_work", [pancaskandhaFamily], "世亲根本论完整来源。"),
  T1613: d("pancaskandhakavibhasa-sthiramati", "大乘广五蕴论（Pañcaskandhakavibhāṣā）", "traditional_abridged_commentary_translation", "verified_distinct_commentary_work", [pancaskandhaFamily], "安慧广释的汉文节译或摘要完整来源，不与根本论合并。"),
  T1614: d("mahayana-satadharma-prakasa-mukha", "大乘百法明门论", "traditional_short_treatise_translation", "verified_distinct_short_treatise_work", [], "世亲传统归属的短论完整来源。"),
  T1615: d("rajadharmanyaya", "王法正理论（Rājadharmanyāya）", "independently_translated_yogacarabhumi_component", "verified_component_work_translation", [rajadharmaFamily], "《瑜伽师地论》卷六十一相关组成部分的独立完整译本。"),
  T1616: d("eighteen-emptiness-treatise-paramartha", "十八空论", "paramartha_treatise_lecture_or_composition", "verified_distinct_work_with_attribution_boundary", [paramarthaBoundary], "完整来源记录；保存与《中边分别论》章节的关系及真谛编成研究，不冒充无争议逐字译本。"),
  T1617: d("three-natures-treatise-paramartha", "三无性论", "paramartha_treatise_lecture_or_composition", "verified_distinct_work_with_attribution_boundary", [paramarthaBoundary], "两卷完整来源；与《显扬论·成无性品》高度相关但按独立流通组成作品登记。"),
  T1618: d("manifest-consciousness-treatise-paramartha", "显识论", "paramartha_treatise_lecture_or_composition", "verified_distinct_work_with_attribution_boundary", [paramarthaBoundary], "完整来源记录；保存《无相论》篇章传统与汉地编成研究。"),
  T1619: d("alambanapariksa-dignaga", "观所缘缘论（Ālambanaparīkṣā）", "traditional_root_treatise_translation", same, [alambanaFamily], "真谛译完整表达，旧题《无相思尘论》。"),
  T1620: d("hastavalaprakarana-dignaga", "掌中论（Hastavālaprakaraṇa）", "traditional_treatise_translation", same, [hastavalaFamily], "真谛初译完整表达，题《解卷论》。"),
  T1621: d("hastavalaprakarana-dignaga", "掌中论（Hastavālaprakaraṇa）", "traditional_treatise_translation", same, [hastavalaFamily], "义净再译完整表达。"),
  T1622: d("hetu-prajnapti-dignaga", "取因假设论", "traditional_short_treatise_translation", "verified_distinct_short_treatise_work", [], "陈那传统归属的独立短论完整来源。"),
  T1623: d("sarvasamanyalaksana-karika-dignaga", "观总相论颂", "traditional_root_verse_translation", "verified_distinct_root_verse_work", [], "陈那传统归属的独立短颂完整来源。"),
  T1624: d("alambanapariksa-dignaga", "观所缘缘论（Ālambanaparīkṣā）", "traditional_root_treatise_translation", same, [alambanaFamily], "玄奘译完整表达。"),
  T1625: d("alambanapariksa-commentary-dharmapala", "观所缘论释（护法释）", "traditional_authored_commentary_translation", "verified_distinct_commentary_work", [alambanaFamily], "护法对陈那《观所缘缘论》的独立注释完整来源。"),
  T1626: d("dharmadhatu-avisesa-sastra", "大乘法界无差别论", "traditional_treatise_translation", same, [dharmadhatuFamily], "契丹系汉文完整表达；较可能为提云般若真译。"),
  T1627: d("dharmadhatu-avisesa-sastra", "大乘法界无差别论", "alternate_translation_or_recension_witness", same, [dharmadhatuFamily], "开宝、高丽系汉文完整表达；译者与年代未知的研究意见保留。"),
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
  const author = stripXml(required(text.match(/<author>([\s\S]*?)<\/author>/)?.[1], "传统作者与译者题记", record.sourceRecordId));
  const extent = required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const decision = decisions.get(canonId);
  if (!decision) throw new Error(`T31 出现未裁决经号 ${canonId}`);

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
    workTitle: decision.workTitle,
    sourceRole: decision.sourceRole,
    ...(decision.relations.length ? { bibliographicRelations: decision.relations } : {}),
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
      tradition: "汉传佛教 · 瑜伽部",
      language: "汉文",
      canonRef: `大正藏 T31, no. ${canonId.slice(1)}`,
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
const pairIds = [
  ["T1585", "T1586"], ["T1585", "T1587"], ["T1586", "T1587"],
  ["T1588", "T1589"], ["T1588", "T1590"], ["T1589", "T1590"], ["T1590", "T1591"],
  ["T1592", "T1593"], ["T1592", "T1594"], ["T1593", "T1594"],
  ["T1595", "T1596"], ["T1595", "T1597"], ["T1596", "T1597"],
  ["T1599", "T1600"], ["T1599", "T1601"], ["T1600", "T1601"],
  ["T1602", "T1603"], ["T1605", "T1606"], ["T1608", "T1609"],
  ["T1610", "T1611"], ["T1612", "T1613"], ["T1616", "T1617"], ["T1616", "T1618"], ["T1617", "T1618"],
  ["T1619", "T1624"], ["T1620", "T1621"], ["T1624", "T1625"], ["T1626", "T1627"],
];
const comparisonPairs = pairIds.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const expectedContainment = {
  "T1585/T1586": 0.708850, "T1600/T1601": 0.806479, "T1602/T1603": 0.793487,
  "T1605/T1606": 0.722121, "T1612/T1613": 0.415589, "T1626/T1627": 0.078245,
};
for (const [pair, expected] of Object.entries(expectedContainment)) {
  if (comparisonByPair.get(pair)?.fiveGramContainmentOfShorter !== expected) {
    throw new Error(`T31 文本比较漂移：${pair}`);
  }
}

const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const workFrequency = new Map();
for (const file of files) workFrequency.set(file.workId, (workFrequency.get(file.workId) ?? 0) + 1);
const sameWorkExpressions = files.filter((file) => workFrequency.get(file.workId) > 1).length;
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T31; T31 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T31",
    title: "大正藏 T31 瑜伽部固定来源记录",
    sourceRecordDenominator: 43,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanRange[1] - file.verification.juanRange[0] + 1, 0),
    verifiedSameWorkExpressions: sameWorkExpressions,
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
    workCountingDecision: "T31 的 43 份来源记录登记为 43 个表达或见证、31 个批次内作品。九组同作品异译或异本包括 T1586/T1587、T1588–T1590、T1592–T1594、T1595–T1597、T1599/T1600、T1608/T1609、T1619/T1624、T1620/T1621、T1626/T1627，共 21 个同作品表达；根本颂、长行释、复合注释和独立流通组成部分保持作品边界。所有 43 份来源文件均完整，但完整来源文件不等于作者归属无争议或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_translation_commentary_component_recension_and_attribution_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [
      trimsikaFamily.groupId, vimsatikaFamily.groupId, samgrahaFamily.groupId, madhyantaFamily.groupId,
      karmasiddhiFamily.groupId, alambanaFamily.groupId, hastavalaFamily.groupId, dharmadhatuFamily.groupId,
    ],
    rootTreatiseCommentaryGroups: [
      trimsikaFamily.groupId, vimsatikaFamily.groupId, samgrahaFamily.groupId, madhyantaFamily.groupId,
      prakaranaryavacaFamily.groupId, abhidharmaSamuccayaFamily.groupId, pancaskandhaFamily.groupId, alambanaFamily.groupId,
    ],
    componentGroups: [rajadharmaFamily.groupId, paramarthaBoundary.groupId],
    candidateRelationsNotMerged: [
      "T1610↔T1611（如来藏义理近缘但不是同一作品）",
      "T1616↔T1599/T1600（与《中边分别论》章节相关，但现存《十八空论》的作品形成与范围不足以合并）",
      "T1617↔T1602（对应《显扬论·成无性品》，作为独立流通组成作品登记）",
      "T1585↔T1586/T1587（复合注释与根本颂不合并）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine overlap records embedded roots or lexical continuity only; translation identity, authorship, completeness and work boundaries require independent bibliographic evidence.",
      pairs: comparisonPairs,
      crossVolumeChecks: [
        { pair: ["T1579", "T1615"], fiveGramContainmentOfShorter: 0.929173, evidence: "T1615 is an independently translated component corresponding to T1579 juan 61; computed against controlled T1579." },
      ],
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T31",
      "https://vms.dila.edu.tw/main.html",
      "https://www.kccl.ca/resources-used-in-erich-frauwallners-the-philosophy-of-buddhism/",
      "https://21dzk.l.u-tokyo.ac.jp/SAT/ddb-sat2.php?key=%E8%A6%9A%E5%B1%B1&mode=detail&useid=1591_%2C31%2C0078",
      "https://encyclopediaofbuddhism.org/wiki/Mah%C4%81y%C4%81nasa%E1%B9%83grahabh%C4%81%E1%B9%A3ya",
      "https://archive2.cbeta.org/ko/node/5424",
      "https://www.jstage.jst.go.jp/article/ibk1952/51/2/51_2_1006/_article",
      "https://www2.hf.uio.no/polyglotta/index.php?page=volume&vid=1119",
      "https://edoc.ub.uni-muenchen.de/34820/1/Tou_Minhui.pdf.pdf",
      "https://researchmap.jp/kanokazuo/published_papers/31781439/attachment_file.pdf",
      "https://www.chibs.edu.tw/ch_html/hkbj/05/hkbj0503.htm",
      "https://dazangthings.nz/cbc/text/794/",
      "https://dazangthings.nz/cbc/text/797/",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000922",
      "https://www.ss.ncu.edu.tw/~calin/scripture/t55/T55n2154.pdf",
      "https://icabs.repo.nii.ac.jp/record/419/files/%E7%A0%94%E7%A9%B6%E7%B4%80%E8%A6%81%20%E7%AC%AC%EF%BC%92%EF%BC%91%E5%8F%B7%EF%BC%88%E6%A8%AA%E7%B5%84%EF%BC%9A%E4%BD%95%E6%AD%93%E6%AD%93%EF%BC%89.pdf",
    ],
    caveat: "T31 是瑜伽行、唯识、如来藏与因明相关论书集合，不是佛说经集合。平台完整保存固定来源，同时区分根本论、根本颂、释论、合糅注释、同本异译、独立流通组成部分、异本、传统作者题记与汉地编成研究；目录邻接、题名、共同署名或机器相似度都不能单独证明作品相同、作者确定、文本完整或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 43 || batch.collection.newSourceBytes !== 11039332 ||
  batch.collection.newStableSegments !== 76949 || batch.collection.newFolios !== 2799 ||
  batch.collection.newJuans !== 164 || batch.collection.verifiedSameWorkExpressions !== 21 ||
  batch.collection.verifiedPartialWorkWitnesses !== 0 || batch.collection.provisionalRecords !== 0 ||
  batch.collection.newFullSourceTexts !== 43 || batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.newWorks !== 31 || batch.collection.controlledWorks !== 31
) throw new Error(`T31 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T31 审计完成：43/43 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
