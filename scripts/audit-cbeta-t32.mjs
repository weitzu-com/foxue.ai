import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.9.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t32.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t32-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.8.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 66 || inventory.totals.upstreamBytes !== 11121227 || candidates.length !== 66) {
  throw new Error(`T32 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const nyayamukhaFamily = relation(
  "nyayamukha_two_translations_and_nyayapravesa_boundary_verified",
  "nyayamukha-t1628-t1630",
  "《因明正理门论》两译与《因明入正理论》边界",
  "T1628 与 T1629 是陈那 Nyāyamukha 的玄奘、义净两种汉译，故共享作品标识；T1630 是商羯罗主 Nyāyapraveśa 的独立因明入门论，不因题名与主题邻近而合并。",
  ["T1628", "T1629", "T1630"],
);
const compendiumBoundary = relation(
  "sutrasamuccaya_and_siksasamuccaya_distinct_compendia_verified",
  "mahayana-compendia-t1635-t1636",
  "《大乘宝要义论》与《大乘集菩萨学论》集经边界",
  "T1635 对应 Sūtrasamuccaya，T1636 对应 Śikṣāsamuccaya；二者都大量汇集经证但书目身份、编纂责任与结构不同，分列作品。",
  ["T1635", "T1636"],
);
const lankavataraBoundary = relation(
  "lankavatara_external_doctrine_treatises_distinct",
  "lankavatara-doctrine-t1639-t1640",
  "两部《楞伽经》外道小乘论的独立边界",
  "T1639 破四宗，T1640 释外道小乘涅槃论；共同题记、译者和《楞伽经》语境只证明亲缘，不证明文本同一。",
  ["T1639", "T1640"],
);
const dependentOriginationFamily = relation(
  "dependent_origination_related_treatises_and_two_translations_verified",
  "dependent-origination-t1651-t1654",
  "缘起论群的同本异译与独立作品边界",
  "经录明确 T1652 与 T1653 是欝楞迦同一缘生论的达磨笈多、不空两译；T1651《十二因缘论》与 T1654《因缘心论颂因缘心论释》虽同论缘起，作者、范围与结构不同，分别立作品。",
  ["T1651", "T1652", "T1653", "T1654"],
);
const bodhicittaBoundary = relation(
  "bodhicitta_related_retranslation_expansion_boundary",
  "bodhicitta-t1661-t1663",
  "《菩提心离相论》与《菩提心观释》的对应、重译和扩写边界",
  "同行研究指出 T1663 与 T1661 及相关梵文材料有对应段落，并含重译、扩写痕迹；目前证据不足以把两份来源压成同一完整作品表达，故保留相关但不同作品的可复核边界。",
  ["T1661", "T1663"],
);
const awakeningFamily = relation(
  "awakening_of_faith_two_versions_commentary_and_attribution_boundary",
  "awakening-of-faith-t1666-t1668",
  "《大乘起信论》两版本、释论与汉地形成争议",
  "T1666 与 T1667 属《大乘起信论》同一作品传统的两种汉文版本或重编表达；T1668 是围绕其形成的独立释论。三者传统印度作者、译者题记与现代汉地撰成研究均并存，平台不以传统题记替代历史结论。",
  ["T1666", "T1667", "T1668"],
);
const nagasenaFamily = relation(
  "nagasena_bhiksu_sutra_two_chinese_recensions_verified",
  "nagasena-t1670a-t1670b",
  "《那先比丘经》A、B 两种汉文传本",
  "T1670A 与 T1670B 是与 Milindapañha 传统相关的两种汉文版本；卷数、藏本系统与正文差异作为同一作品的独立表达或传本保存。",
  ["T1670A", "T1670B"],
);
const suhrllekhaFamily = relation(
  "suhrllekha_three_chinese_translations_verified",
  "suhrllekha-t1672-t1674",
  "龙树《亲友书》三种汉译",
  "书目与专题研究把 T1672、T1673、T1674 识别为 Nāgārjuna Suhṛllekha 的三种汉译；三者共享作品标识，同时保留不同题名、译者和稳定锚点。",
  ["T1672", "T1673", "T1674"],
);
const kayatrayaFamily = relation(
  "kayatrayastotra_transliteration_and_translation_verified",
  "kayatrayastotra-t1677-t1678",
  "《三身赞》的梵文音写见证与汉译",
  "文献研究明确 T1677 是 Kāyatrayastotra 的梵文汉字音写见证，T1678 是汉语义译；二者共享作品标识，但分别保存音写、译文与缺文状况。",
  ["T1677", "T1678"],
);
const stupaBoundary = relation(
  "eight_stupa_hymn_and_name_sutra_distinct",
  "eight-stupas-t1684-t1685",
  "八大灵塔梵赞与名号经边界",
  "T1684 是戒日王制的赞颂，T1685 是列举八塔名号与功德的短经；主题和部分措辞亲近，不足以合并作品或责任归属。",
  ["T1684", "T1685"],
);
const pindolaBoundary = relation(
  "pindola_invitation_ritual_and_discourse_distinct",
  "pindola-t1689-t1690",
  "宾头卢请法仪轨与说法经边界",
  "T1689 是请宾头卢的仪式文本，T1690 是宾头卢为优陀延王说法的叙事经；共享人物不等于同一作品。",
  ["T1689", "T1690"],
);

const d = (workId, workTitle, sourceRole, workIdentityStatus, relations, summary, completeness = "complete_source_file") => ({
  workId: `gbcr:work:${workId}`,
  workTitle,
  sourceRole,
  workIdentityStatus,
  relations,
  summary,
  completeness,
});
const same = "verified_same_work_expression";
const distinct = "verified_distinct_work";
const decisions = new Map(Object.entries({
  T1628: d("nyayamukha-dignaga", "因明正理门论（Nyāyamukha）", "traditional_logic_treatise_translation", same, [nyayamukhaFamily], "玄奘译完整表达。"),
  T1629: d("nyayamukha-dignaga", "因明正理门论（Nyāyamukha）", "traditional_logic_treatise_translation", same, [nyayamukhaFamily], "义净译完整表达。"),
  T1630: d("nyayapravesa-sankaramin", "因明入正理论（Nyāyapraveśa）", "traditional_logic_treatise_translation", distinct, [nyayamukhaFamily], "商羯罗主因明入门论完整来源，不与 Nyāyamukha 合并。"),
  T1631: d("vigrahavyavartani-nagarjuna", "回诤论（Vigrahavyāvartanī）", "traditional_madhyamaka_treatise_translation", distinct, [], "龙树传统归属的中观论辩文本完整来源。"),
  T1632: d("upaya-hrdaya", "方便心论", "traditional_argumentation_treatise_translation", distinct, [], "失载作者的论辩方法论完整汉译来源。"),
  T1633: d("tattvasiddhi-sastra", "如实论", "traditional_argumentation_treatise_translation", distinct, [], "真谛译论理文本完整来源。"),
  T1634: d("mahayana-avatara", "入大乘论", "traditional_mahayana_treatise_translation", distinct, [], "坚意传统归属的大乘论书完整来源。"),
  T1635: d("sutrasamuccaya", "大乘宝要义论（Sūtrasamuccaya）", "traditional_sutra_compendium_translation", distinct, [compendiumBoundary], "十卷集经论完整来源；经文引证集合不等于佛陀亲说作品的一份完整表达。"),
  T1636: d("siksasamuccaya", "大乘集菩萨学论（Śikṣāsamuccaya）", "traditional_bodhisattva_training_compendium_translation", distinct, [compendiumBoundary], "二十五卷学处汇编完整来源，与 Sūtrasamuccaya 分列。"),
  T1637: d("mahayana-laksana-samuccaya", "集大乘相论", "traditional_mahayana_compendium_translation", distinct, [], "觉吉祥智传统归属的论书完整来源。"),
  T1638: d("sarvadharma-ratnottama-artha-samuccaya", "集诸法宝最上义论", "traditional_mahayana_compendium_translation", distinct, [], "善寂传统归属的论书完整来源。"),
  T1639: d("deva-lankavatara-four-schools-refutation", "提婆菩萨破楞伽经中外道小乘四宗论", "traditional_lankavatara_doctrine_treatise_translation", distinct, [lankavataraBoundary], "破四宗论完整来源，与 T1640 保持不同作品。"),
  T1640: d("deva-lankavatara-nirvana-doctrines", "提婆菩萨释楞伽经中外道小乘涅槃论", "traditional_lankavatara_doctrine_treatise_translation", distinct, [lankavataraBoundary], "涅槃宗义论完整来源，与 T1639 保持不同作品。"),
  T1641: d("laksananusara-sastra", "随相论", "traditional_abhidharma_treatise_translation", distinct, [], "德慧传统归属的阿毘达磨论书完整来源。"),
  T1642: d("vajrasuci", "金刚针论（Vajrasūcī）", "traditional_social_critique_treatise_translation", "verified_distinct_work_with_attribution_boundary", [], "完整来源；传统法称题记与梵、藏相关传本的作者归属差异必须保留。"),
  T1643: d("nirgrantha-no-self-questions-compilation", "尼乾子问无我义经", "traditional_authored_sutra_compilation_translation", "verified_distinct_compilation_with_attribution_boundary", [], "题名为经而责任题记为马鸣集；按编集作品保存，不据题名宣称历史佛陀逐字亲说。"),
  T1644: d("lokasthana-abhidharma", "佛说立世阿毘昙论", "traditional_buddha_attributed_abhidharma_translation", "verified_distinct_work_with_buddha_attribution_boundary", [], "十卷完整来源；保留“佛说”题名与阿毘昙论体分类，题名本身不充当历史亲说证明。"),
  T1645: d("ses-bya-rab-gsal", "彰所知论", "traditional_tibetan_scholastic_treatise_translation", distinct, [], "发合思巴造、沙罗巴汉译的藏传论书完整来源。"),
  T1646: d("tattvasiddhi-harivarman", "成实论（Tattvasiddhi）", "traditional_abhidharma_treatise_translation", distinct, [], "诃梨跋摩论书十六卷完整来源。"),
  T1647: d("catuhsatya-sastra", "四谛论", "traditional_abhidharma_treatise_translation", distinct, [], "婆薮跋摩传统归属的论书完整来源。"),
  T1648: d("vimuttimagga", "解脱道论（Vimuttimagga）", "traditional_meditation_manual_translation", distinct, [], "优波底沙修道论十二卷完整来源。"),
  T1649: d("sammatiya-nikaya-sastra", "三弥底部论", "traditional_school_treatise_unknown_translation", "verified_distinct_work_with_lost_translator", [], "失译部派论书完整来源，译者未知状态不得补写。"),
  T1650: d("pratyekabuddha-nidana-sastra", "辟支佛因缘论", "traditional_narrative_treatise_unknown_translation", "verified_distinct_work_with_lost_translator", [], "失译因缘论完整来源，叙事材料不等于单一历史说法现场记录。"),
  T1651: d("dvadasanga-pratityasamutpada-sastra", "十二因缘论", "traditional_dependent_origination_treatise_translation", distinct, [dependentOriginationFamily], "净意传统归属的缘起论完整来源。"),
  T1652: d("pratityasamutpada-sastra-ulanka", "缘生论（Pratītyasamutpādaśāstra）", "traditional_dependent_origination_treatise_translation", same, [dependentOriginationFamily], "达磨笈多译完整表达。"),
  T1653: d("pratityasamutpada-sastra-ulanka", "缘生论（Pratītyasamutpādaśāstra）", "traditional_dependent_origination_treatise_translation", same, [dependentOriginationFamily], "不空译完整表达。"),
  T1654: d("pratityasamutpada-hrdaya-karika-vyakhya", "因缘心论颂因缘心论释", "traditional_root_verses_with_commentary", distinct, [dependentOriginationFamily], "根本颂与释合载的完整来源，不与欝楞迦论两译合并。"),
  T1655: d("samatha-vipasyana-dvara-karika", "止观门论颂", "traditional_meditation_verse_translation", distinct, [], "世亲传统归属的止观颂完整来源。"),
  T1656: d("ratnavali-nagarjuna", "宝行王正论（Ratnāvalī）", "traditional_advice_treatise_translation", distinct, [], "龙树《宝鬘论》汉译传统的完整来源；与后列《亲友书》不是同一作品。"),
  T1657: d("hasta-danda-sastra", "手杖论", "traditional_treatise_translation", distinct, [], "释迦称造的短论完整来源。"),
  T1658: d("doctrinal-names-determination", "诸教决定名义论", "traditional_doctrinal_treatise_translation", distinct, [], "慈氏传统归属的名义论完整来源。"),
  T1659: d("bodhicitta-utpada-sutra-sastra", "发菩提心经论", "traditional_bodhicitta_treatise_translation", "verified_distinct_work_with_attribution_boundary", [], "完整来源；传统天亲造题记与早期经录不明作者记录并存。"),
  T1660: d("bodhisambhara-sastra", "菩提资粮论", "traditional_root_verses_with_commentary_translation", distinct, [], "龙树本颂、自在比丘释的复合论体完整来源。"),
  T1661: d("bodhicitta-vivarana-chinese", "菩提心离相论", "traditional_bodhicitta_treatise_translation", "verified_distinct_work_with_attribution_boundary", [bodhicittaBoundary], "龙树传统归属的完整汉文来源；与 T1663 的对应、重译和扩写关系公开但暂不合并。"),
  T1662: d("bodhicarya-sutra-anthology", "菩提行经", "traditional_bodhisattva_practice_verse_compilation_translation", distinct, [], "龙树集颂传统题记的四卷完整来源。"),
  T1663: d("bodhicittabhavana-vivarana-chinese", "菩提心观释", "traditional_bodhicitta_exposition_translation", "verified_distinct_work_with_retranslation_expansion_boundary", [bodhicittaBoundary], "完整来源；保存与 T1661 对应段落及重译、扩写研究，不自动压成同一表达。"),
  T1664: d("bhavanakrama-prathama-kamalasila", "广释菩提心论", "traditional_meditation_treatise_translation", distinct, [], "莲华戒造修习次第相关论书完整来源。"),
  T1665: d("bodhicitta-sastra-vajrasekhara-yoga", "金刚顶瑜伽中发阿耨多罗三藐三菩提心论", "traditional_esoteric_bodhicitta_treatise_translation", "verified_distinct_work_with_attribution_boundary", [], "不空译密教菩提心论完整来源；作者题记与后世归属研究保持开放。"),
  T1666: d("dasheng-qixin-lun", "大乘起信论", "traditional_treatise_translation_or_sinitic_composition", same, [awakeningFamily], "真谛译题记的一卷本完整表达；汉地撰成争议保留。"),
  T1667: d("dasheng-qixin-lun", "大乘起信论", "alternate_translation_or_sinitic_redaction", same, [awakeningFamily], "实叉难陀译题记的二卷本完整表达；可能为 T1666 汉地重编本的研究意见保留。"),
  T1668: d("shi-moheyan-lun-commentary", "释摩诃衍论", "traditional_awakening_of_faith_commentary_or_sinitic_composition", "verified_distinct_commentary_with_attribution_boundary", [awakeningFamily], "十卷释论完整来源；传统龙树造、筏提摩多译与现代汉地撰成及真谛译说并存。"),
  T1669: d("dazongdi-xuanwen-benlun", "大宗地玄文本论", "traditional_treatise_or_sinitic_apocryphon", "verified_distinct_sinitic_apocryphon_with_attribution_boundary", [], "二十卷完整来源；传统马鸣造、真谛译题记与现代汉地伪经／杂糅道教思想研究并列保存。"),
  T1670A: d("nagasena-bhiksu-sutra-chinese", "那先比丘经", "lost_translation_recension_witness", same, [nagasenaFamily], "高丽藏系二卷本完整传本，译者失载。"),
  T1670B: d("nagasena-bhiksu-sutra-chinese", "那先比丘经", "lost_translation_recension_witness", same, [nagasenaFamily], "宋元明藏系三卷本完整传本，译者失载。"),
  T1671: d("sutrartha-samuccaya-nagarjuna", "福盖正行所集经", "traditional_sutra_compendium_translation", distinct, [], "龙树集、日称等译的十二卷经义汇编完整来源；编集责任与所引佛说分层。"),
  T1672: d("suhrllekha-nagarjuna", "亲友书（Suhṛllekha）", "traditional_advice_letter_translation", same, [suhrllekhaFamily], "求那跋摩译完整表达。"),
  T1673: d("suhrllekha-nagarjuna", "亲友书（Suhṛllekha）", "traditional_advice_letter_translation", same, [suhrllekhaFamily], "僧伽跋摩译完整表达。"),
  T1674: d("suhrllekha-nagarjuna", "亲友书（Suhṛllekha）", "traditional_advice_letter_translation", same, [suhrllekhaFamily], "义净译完整表达。"),
  T1675: d("dharmadhatu-stava", "赞法界颂（Dharmadhātustava）", "traditional_hymn_translation", "verified_distinct_hymn_with_attribution_boundary", [], "龙树传统归属赞颂完整来源，传统作者题记不等于现代作者鉴定。"),
  T1676: d("pranidhana-stava", "广大发愿颂", "traditional_aspiration_hymn_translation", "verified_distinct_hymn_with_attribution_boundary", [], "龙树传统归属发愿颂完整来源。"),
  T1677: d("kayatrayastotra", "三身赞（Kāyatrayastotra）", "sanskrit_phonetic_transliteration_witness", "verified_partial_work_witness", [kayatrayaFamily], "梵文以汉字音写的完整来源文件；研究指出第 4 偈末句存在缺文，故作为部分作品见证登记。", "complete_source_file_partial_work_witness"),
  T1678: d("kayatrayastotra", "三身赞（Kāyatrayastotra）", "traditional_hymn_translation", same, [kayatrayaFamily], "汉语义译完整表达，作者传统保持未定。"),
  T1679: d("buddha-108-names-stava", "佛一百八名赞", "traditional_name_hymn_translation", distinct, [], "一百八佛名赞完整来源。"),
  T1680: d("satapancasatka-buddha-stotra", "一百五十赞佛颂（Śatapañcāśatka）", "traditional_buddha_hymn_translation", distinct, [], "摩咥里制吒造、义净译赞佛颂完整来源。"),
  T1681: d("buddha-mangalaguna-stava", "佛吉祥德赞", "traditional_buddha_hymn_translation", distinct, [], "寂友造三卷赞颂完整来源。"),
  T1682: d("seven-buddhas-stava-gatha", "七佛赞呗伽他", "traditional_buddha_hymn_translation", distinct, [], "七佛赞呗完整来源。"),
  T1683: d("ghanta-stava", "犍稚梵赞", "traditional_liturgical_hymn_translation", distinct, [], "法贤译梵赞完整来源。"),
  T1684: d("eight-great-stupas-stava", "八大灵塔梵赞", "traditional_stupa_hymn_translation", distinct, [stupaBoundary], "戒日王制赞颂完整来源，与名号经分列。"),
  T1685: d("eight-great-stupas-name-sutra", "佛说八大灵塔名号经", "traditional_buddha_attributed_short_sutra_translation", "verified_distinct_work_with_buddha_attribution_boundary", [stupaBoundary], "短经完整来源；保留“佛说”题记，同时不以题名独自证明历史亲说。"),
  T1686: d("arya-sangha-gatha-sataka", "贤圣集伽陀一百颂", "traditional_verse_anthology_translation", distinct, [], "一百颂集完整来源。"),
  T1687: d("guru-pancasika", "事师法五十颂（Gurupañcāśikā）", "traditional_instruction_verse_translation", "verified_distinct_work_with_attribution_boundary", [], "马鸣集传统题记的五十颂完整来源，作者归属保留。"),
  T1688: d("miji-lishi-daquan-shenwang-verses", "密迹力士大权神王经偈颂", "sinitic_verse_compilation", "verified_distinct_sinitic_composition", [], "元代管主八撰的汉地偈颂完整来源，不归入历史佛陀亲说表达。"),
  T1689: d("invite-pindola-ritual", "请宾头卢法", "traditional_invitation_ritual_translation", distinct, [pindolaBoundary], "请圣仪轨完整来源，与说法经分列。"),
  T1690: d("pindola-discourse-to-udayana", "宾头卢突罗阇为优陀延王说法经", "traditional_arhat_discourse_translation", distinct, [pindolaBoundary], "宾头卢说法叙事完整来源，不因共享人物与仪轨合并。"),
  T1691: d("kasyapa-heals-woman-sutra", "迦叶仙人说医女人经", "traditional_named_speaker_sutra_translation", "verified_distinct_work_with_speaker_boundary", [], "题名归于迦叶仙人说法的短经完整来源，不标作佛陀逐字亲说。"),
  T1692: d("senajit-converts-world-parable-gatha", "胜军化世百喻伽他经", "traditional_parable_gatha_translation", distinct, [], "百喻伽他类完整来源；叙事与教诫体不自动等同历史佛说记录。"),
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
  if (!decision) throw new Error(`T32 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 论集部",
      language: "汉文",
      canonRef: `大正藏 T32, no. ${canonId.slice(1)}`,
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
  ["T1628", "T1629"], ["T1628", "T1630"], ["T1635", "T1636"], ["T1639", "T1640"],
  ["T1651", "T1652"], ["T1652", "T1653"], ["T1653", "T1654"], ["T1656", "T1672"],
  ["T1661", "T1663"], ["T1663", "T1664"], ["T1666", "T1667"], ["T1666", "T1668"], ["T1667", "T1668"],
  ["T1670A", "T1670B"], ["T1672", "T1673"], ["T1672", "T1674"], ["T1673", "T1674"],
  ["T1677", "T1678"], ["T1684", "T1685"], ["T1689", "T1690"],
];
const comparisonPairs = pairIds.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const expectedContainment = {
  "T1628/T1629": 0.966817,
  "T1652/T1653": 0.581489,
  "T1661/T1663": 0.011743,
  "T1666/T1667": 0.141794,
  "T1666/T1668": 0.899743,
  "T1670A/T1670B": 0.555037,
  "T1677/T1678": 0.086792,
};
for (const [pair, expected] of Object.entries(expectedContainment)) {
  if (comparisonByPair.get(pair)?.fiveGramContainmentOfShorter !== expected) {
    throw new Error(`T32 文本比较漂移：${pair}`);
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T32; T32 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T32",
    title: "大正藏 T32 论集部固定来源记录",
    sourceRecordDenominator: 66,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanRange[1] - file.verification.juanRange[0] + 1, 0),
    verifiedSameWorkExpressions: sameWorkExpressions,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    provisionalRecords: 0,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness !== "complete_source_file").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T32 的 66 份来源记录登记为 66 个表达或见证、59 个批次内作品。六组同作品表达包括 T1628/T1629、T1652/T1653、T1666/T1667、T1670A/T1670B、T1672–T1674、T1677/T1678，共 13 个表达或见证；经集、释论、论颂、音写、仪轨、汉地编成与仅主题近缘文本保持作品和责任边界。66 份固定来源文件均被完整取得，其中 65 份是完整作品表达，T1677 因第 4 偈末句缺文登记为部分作品见证；来源完整不等于作品无缺、作者无争议或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_translation_recension_commentary_genre_and_attribution_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [
      nyayamukhaFamily.groupId, dependentOriginationFamily.groupId, awakeningFamily.groupId,
      nagasenaFamily.groupId, suhrllekhaFamily.groupId, kayatrayaFamily.groupId,
    ],
    rootTreatiseCommentaryGroups: [awakeningFamily.groupId],
    relatedDistinctWorkGroups: [
      compendiumBoundary.groupId, lankavataraBoundary.groupId, dependentOriginationFamily.groupId,
      bodhicittaBoundary.groupId, stupaBoundary.groupId, pindolaBoundary.groupId,
    ],
    candidateRelationsNotMerged: [
      "T1628/T1629↔T1630（因明主题与题名近邻，但 Nyāyamukha 与 Nyāyapraveśa 是不同作品）",
      "T1635↔T1636（均汇集经证，但 Sūtrasamuccaya 与 Śikṣāsamuccaya 不同）",
      "T1639↔T1640（共同楞伽语境、作者与译者题记，但论题及文本不同）",
      "T1651/T1654↔T1652/T1653（缘起主题近缘，只有 T1652/T1653 有同本异译证据）",
      "T1661↔T1663（存在对应、重译与扩写痕迹，证据不足以压成同一完整作品）",
      "T1668↔T1666/T1667（释论与根本作品不合并）",
      "T1684↔T1685（八塔赞颂与名号经分列）",
      "T1689↔T1690（邀请仪轨与说法经分列）",
    ],
    partialWorkWitnesses: [
      { id: "T1677", note: "固定 TEI 来源文件完整；Kāyatrayastotra 音写文本第 4 偈末句缺文，故不得把来源完整误报为作品无缺。" },
    ],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine overlap is corroborating evidence only; translation identity, authorship, completeness and work boundaries require independent bibliographic evidence.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T32",
      "https://icabs.repo.nii.ac.jp/record/533/files/%E5%AE%A4%E5%B1%8B%E5%AE%89%E5%AD%9D.pdf",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0003897",
      "https://brill.com/edcollchap-oa/book/9789004706804/BP000001.pdf",
      "https://dazangthings.nz/cbc/text/1543/",
      "https://cbc.dila.edu.tw/cbc/text/1538/",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000568",
      "https://spen.dila.edu.tw/journal_detail/956.htm",
      "https://dazangthings.nz/cbc/text/1509/",
      "https://iris.unive.it/handle/10278/5006360",
      "https://dazangthings.nz/cbc/text/1500/",
      "https://buddhism.lib.ntu.edu.tw/DLMBS/en/search/search_detail.jsp?comefrom=subjectbooklist&seq=250140",
      "https://kalavinka.org/ebooks_NEW/Nagarjunas%20Letter_Bilingual_ebk_08-19-23.pdf",
      "https://tsudax.ninja-x.jp/Tsuda2009.pdf",
      "https://tais.repo.nii.ac.jp/record/2165/files/06%20%E7%B6%9C%E4%BD%9B%E5%B9%B4%E5%A0%B144%EF%BC%8F%E6%A8%AA05%E3%83%BB%E5%90%89%E6%85%B6%E6%A2%B5%E8%AE%83%E3%81%A8%E4%B8%89%E8%BA%AB%E8%AE%83%E3%81%AE%E3%82%AE%E3%83%AB%E3%82%AE%E3%83%83%E3%83%88%E5%86%99%E6%9C%AC.pdf",
      "https://dazangthings.nz/cbc/text/1496/",
      "https://dazangthings.nz/cbc/text/1493/",
      "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001366324",
      "https://21dzk.l.u-tokyo.ac.jp/SAT/ddb-sat2.php?mode=detail&s=&useid=1640_%2C01",
    ],
    caveat: "T32 是论典、经证汇编、赞颂、书信、仪轨与少量经题文本的混合卷，不可整体标作佛说或非佛说。平台逐份保存固定来源，并区分传统佛说题名、论师撰述、编集、释论、同本异译、异本、音写见证、失译、汉地撰成和争议作者；目录邻接、共同题名、传统署名或机器相似度都不能单独证明作品相同、作者确定、文本无缺或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 66 || batch.collection.newSourceBytes !== 11121227 ||
  batch.collection.newStableSegments !== 67621 || batch.collection.newFolios !== 2509 ||
  batch.collection.newJuans !== 201 || batch.collection.verifiedSameWorkExpressions !== 13 ||
  batch.collection.verifiedPartialWorkWitnesses !== 1 || batch.collection.provisionalRecords !== 0 ||
  batch.collection.newFullSourceTexts !== 65 || batch.collection.newPartialSourceWitnesses !== 1 ||
  batch.collection.relationAnnotatedRecords !== 27 || batch.collection.newWorks !== 59 ||
  batch.collection.controlledWorks !== 59 || batch.collection.attributionBoundaryRecords !== 66
) throw new Error(`T32 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T32 审计完成：66/66 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);
