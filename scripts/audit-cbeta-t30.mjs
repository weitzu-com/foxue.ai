import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.7.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t30.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作樹必須固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t30-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.6.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 21 || inventory.totals.upstreamBytes !== 13938106 || candidates.length !== 21) {
  throw new Error(`T30 固定來源分母或新增記錄漂移：${inventory.totals.records}/${candidates.length}`);
}

const mmkCommentaryFamily = {
  type: "mulamadhyamakakarika_commentary_family_verified_distinct_works",
  groupId: "mmk-chinese-commentaries-t1564-t1567",
  label: "《根本中頌》四種漢譯釋論的作品邊界",
  evidence: "同行評審研究與 DILA 經錄把 T1564 青目《中論》、T1566 清辨《般若燈論釋》、T1567 安慧《大乘中觀釋論》連到《根本中頌》，但它們是不同注釋作品；T1565 只解釋歸敬頌與核心義，不是全二十七品注釋。T1567 固定來源只到第十品，故作部分作品見證。",
  externalIds: { cbeta: ["T1564", "T1565", "T1566", "T1567"] },
};
const aryadevaFamily = {
  type: "aryadeva_treatise_root_and_commentary_family_verified",
  groupId: "aryadeva-sataka-catuhsataka-t1569-t1572",
  label: "提婆《百論》《四百論》後半、護法釋與《百字論》邊界",
  evidence: "DILA 經錄將 T1570 與 T1571 明確列為本、釋關係；研究確認 T1570 只保存《四百論》後八品，T1571 是護法對該後半的注釋。T1569《百論》與《四百論》密切相關但作品同一性仍有研究爭論；T1572《百字論》另立作品。平台不因同一傳統作者或題名相近而合併。",
  externalIds: { cbeta: ["T1569", "T1570", "T1571", "T1572"] },
};
const nagarjunaShortTreatises = {
  type: "traditional_nagarjuna_attribution_distinct_treatises",
  groupId: "nagarjuna-short-treatises-t1568-t1576",
  label: "龍樹傳統歸屬的不同短論",
  evidence: "DILA 經錄分別登記《十二門論》《壹輸盧迦論》《大乘破有論》《六十頌如理論》《大乘二十頌論》，其中《六十頌如理論》可與梵藏 Yuktisastika 對應。平台保存每部傳統責任題記與跨藏線索，但不把共同署名當成同一作品或無爭議的現代作者事實。",
  externalIds: { cbeta: ["T1568", "T1573", "T1574", "T1575", "T1576"] },
};
const bhavivekaWorks = {
  type: "same_traditional_author_distinct_madhyamaka_works",
  groupId: "bhaviveka-distinct-works-t1566-t1578",
  label: "清辨《般若燈論釋》與《大乘掌珍論》不同作品",
  evidence: "T1566 是《根本中頌》注釋，T1578 是獨立《掌珍論》；共同傳統作者只建立作者候選關係，不構成作品合併依據。",
  externalIds: { cbeta: ["T1566", "T1578"] },
};
const yogacarabhumiFamily = {
  type: "yogacarabhumi_whole_commentary_component_and_partial_translation_family_verified",
  groupId: "yogacarabhumi-t1579-t1584",
  label: "《瑜伽師地論》整部、略釋與組成部分漢譯關係",
  evidence: "法鼓文理學院《瑜伽師地論》資料庫把 T1579、T1581–T1584 列為漢譯對照本，把 T1580 列為注釋本；其科判將 T1581/T1582/T1583 對應菩薩地，DILA 經錄把 T1584 對應到 T1579 卷五十一至五十七。平台分列整部論、注釋作品、菩薩地作品與抉擇分部分見證。",
  externalIds: { cbeta: ["T1579", "T1580", "T1581", "T1582", "T1583", "T1584"] },
};
const goodPreceptsSplit = {
  type: "split_partial_witnesses_of_one_recension_verified",
  groupId: "bodhisattva-good-precepts-t1582-t1583",
  label: "《菩薩善戒經》九卷本與分離受戒法",
  evidence: "CBC@ 彙錄的經錄與研究證據指出，T1582 九卷與 T1583 一卷原為同一十卷文本，後因受戒法部分常被單獨使用而分離；平台以一個作品、兩個部分見證計數，並保留兩個大正藏經號和各自閱讀入口。",
  externalIds: { cbeta: ["T1582", "T1583"] },
};
const bodhisattvabhumiBoundary = {
  type: "alternate_translation_or_chinese_revision_candidate_unmerged",
  groupId: "bodhisattvabhumi-t1581-t1583",
  label: "《菩薩地持經》與《菩薩善戒經》異譯或改編爭議",
  evidence: "CBC@ 彙錄的研究對 T1581 與 T1582/T1583 有兩種主要判斷：同一底本異譯，或以 T1581 為基礎的漢地改編。兩者內容與結構高度相關，但開篇、戒條、術語與編排存在差異；在獨立裁決前平台保留兩個作品實體，只記候選關係。",
  externalIds: { cbeta: ["T1581", "T1582", "T1583"] },
};

const decisions = new Map(Object.entries({
  T1564: {
    slug: "taisho-t1564", workId: "gbcr:work:madhyamaka-sastra-pingala", workIdentityStatus: "verified_distinct_commentary_work",
    workTitle: "中論（Madhyamakaśāstra，含《根本中頌》與青目釋）", sourceRole: "traditional_authored_root_verses_with_commentary_translation", completeness: "complete_source_file",
    relations: [mmkCommentaryFamily], title: "中論", author: "龍樹菩薩造 梵志青目釋 姚秦 鳩摩羅什譯", extent: "4卷",
    summary: "固定來源完整保存四卷、二十七品與穩定錨點；龍樹根本頌嵌於青目釋中，故登記為青目注釋作品的漢譯表達，不把其中根本頌另重複計作一份完整表達。傳統造、釋、譯題記照錄。",
  },
  T1565: {
    slug: "taisho-t1565", workId: "gbcr:work:shunzhonglun-asanga", workIdentityStatus: "verified_distinct_selective_exposition_work",
    workTitle: "順中論（無著對《根本中頌》的選擇性解說）", sourceRole: "traditional_authored_selective_mmk_exposition_translation", completeness: "complete_source_file",
    relations: [mmkCommentaryFamily], title: "順中論", author: "龍樹菩薩造 無著菩薩釋 元魏 瞿曇般若流支譯", extent: "2卷",
    summary: "固定來源完整保存兩卷與穩定錨點；本論集中解釋《根本中頌》歸敬頌、八不與般若義，不冒充二十七品逐品全注。傳統龍樹造、無著釋、般若流支譯題記照錄。",
  },
  T1566: {
    slug: "taisho-t1566", workId: "gbcr:work:prajnapradipa-bhaviveka", workIdentityStatus: "verified_distinct_commentary_work",
    workTitle: "般若燈論釋（Prajñāpradīpa）", sourceRole: "traditional_authored_mmk_commentary_translation", completeness: "complete_source_file",
    relations: [mmkCommentaryFamily, bhavivekaWorks], title: "般若燈論釋", author: "偈本龍樹菩薩 釋論分別明菩薩 唐 波羅頗蜜多羅譯", extent: "15卷",
    summary: "固定來源完整保存十五卷與穩定錨點；登記為清辨對《根本中頌》的獨立注釋作品，與 T1564、T1567 不合併。根本頌作者、釋者與譯者題記按來源分層保存。",
  },
  T1567: {
    slug: "taisho-t1567", workId: "gbcr:work:mmk-commentary-sthiramati", workIdentityStatus: "verified_partial_work_witness",
    workTitle: "大乘中觀釋論（安慧《根本中頌》注）", sourceRole: "traditional_authored_partial_mmk_commentary_translation", completeness: "complete_source_file_partial_work_witness",
    relations: [mmkCommentaryFamily], title: "大乘中觀釋論(第1卷-第9卷)", author: "安慧菩薩造 宋 惟淨等譯", extent: "9卷",
    summary: "來源文件完整保存前九卷與穩定錨點，但正文止於第十品；高麗藏目錄另記卷十至十八，現有研究也視其為安慧二十七品注釋。平台因此標作完整來源文件中的部分作品見證。",
  },
  T1568: {
    slug: "taisho-t1568", workId: "gbcr:work:dvadasamukha-sastra", workIdentityStatus: "verified_distinct_treatise_work",
    workTitle: "十二門論（*Dvādaśamukhaśāstra）", sourceRole: "traditional_authored_madhyamaka_treatise_translation", completeness: "complete_source_file",
    relations: [nagarjunaShortTreatises], title: "十二門論", author: "龍樹菩薩造 姚秦 鳩摩羅什譯", extent: "1卷",
    summary: "固定來源完整保存一卷、十二門與穩定錨點；作為獨立中觀論書登記。僅存漢譯且作者歸屬有現代研究空間，平台保存傳統龍樹造、鳩摩羅什譯題記而不改寫為無爭議事實。",
  },
  T1569: {
    slug: "taisho-t1569", workId: "gbcr:work:sataka-sastra-aryadeva-vasu", workIdentityStatus: "verified_distinct_root_and_commentary_work",
    workTitle: "百論（Śataśāstra，提婆本頌與婆藪釋）", sourceRole: "traditional_authored_root_verses_with_commentary_translation", completeness: "complete_source_file",
    relations: [aryadevaFamily], title: "百論", author: "提婆菩薩造 婆藪開士釋 姚秦 鳩摩羅什譯", extent: "2卷",
    summary: "固定來源完整保存兩卷與穩定錨點；按提婆本頌、婆藪釋的複合注釋作品登記。其與《四百論》關係密切但同一性仍有研究爭論，故不與 T1570 合併。",
  },
  T1570: {
    slug: "taisho-t1570", workId: "gbcr:work:catuhsataka-aryadeva", workIdentityStatus: "verified_partial_work_witness",
    workTitle: "四百論（Catuḥśataka）", sourceRole: "traditional_authored_partial_root_verse_work_translation", completeness: "complete_source_file_partial_work_witness",
    relations: [aryadevaFamily], title: "廣百論本", author: "聖天菩薩造 唐 玄奘譯", extent: "1卷",
    summary: "來源文件完整保存一卷本頌與穩定錨點，但學術目錄與研究確認漢譯只覆蓋《四百論》後八品。平台因此登記為《四百論》的部分作品見證，不冒充十六品全本。",
  },
  T1571: {
    slug: "taisho-t1571", workId: "gbcr:work:catuhsataka-commentary-dharmapala", workIdentityStatus: "verified_distinct_commentary_work",
    workTitle: "大乘廣百論釋論（護法《四百論》後半釋）", sourceRole: "traditional_authored_commentary_translation", completeness: "complete_source_file",
    relations: [aryadevaFamily], title: "大乘廣百論釋論", author: "聖天菩薩本 護法菩薩釋 唐 玄奘譯", extent: "10卷",
    summary: "固定來源完整保存十卷與穩定錨點；護法釋論以《四百論》後半本頌為根本，機器對讀亦顯示大量嵌入，但注釋本身是獨立作品，不與 T1570 合併。",
  },
  T1572: {
    slug: "taisho-t1572", workId: "gbcr:work:aksarasataka-aryadeva", workIdentityStatus: "verified_distinct_short_treatise_work",
    workTitle: "百字論（Akṣaraśataka）", sourceRole: "traditional_authored_short_treatise_translation", completeness: "complete_source_file",
    relations: [aryadevaFamily], title: "百字論", author: "提婆菩薩造 後魏 菩提流支譯", extent: "1卷",
    summary: "固定來源完整保存一卷與穩定錨點；登記為提婆傳統歸屬的獨立短論，不因《百論》《廣百論》題名與作者相近而合併。",
  },
  T1573: {
    slug: "taisho-t1573", workId: "gbcr:work:ekasloka-sastra", workIdentityStatus: "verified_distinct_short_treatise_work",
    workTitle: "壹輸盧迦論（*Ekaślokaśāstra）", sourceRole: "traditional_authored_short_treatise_translation", completeness: "complete_source_file",
    relations: [nagarjunaShortTreatises], title: "壹輸盧迦論", author: "龍樹菩薩造 後魏 瞿曇般若留支譯", extent: "1卷",
    summary: "固定來源完整保存一卷短論與穩定錨點；獨立登記作品，傳統龍樹造與般若流支譯題記照錄，共同作者題記不作作品合併依據。",
  },
  T1574: {
    slug: "taisho-t1574", workId: "gbcr:work:bhavasankranti-sastra", workIdentityStatus: "verified_distinct_short_treatise_work",
    workTitle: "大乘破有論（Bhavasaṅkrāntiśāstra）", sourceRole: "traditional_authored_short_treatise_translation", completeness: "complete_source_file",
    relations: [nagarjunaShortTreatises], title: "大乘破有論", author: "龍樹菩薩造 宋 施護譯", extent: "1卷",
    summary: "固定來源完整保存一卷與穩定錨點；DILA 經錄提供梵藏題名與藏經對號，平台作獨立論書登記，傳統龍樹造、施護譯題記照錄。",
  },
  T1575: {
    slug: "taisho-t1575", workId: "gbcr:work:yuktisastika-nagarjuna", workIdentityStatus: "verified_cross_canon_treatise_work",
    workTitle: "六十頌如理論（Yuktiṣaṣṭikākārikā）", sourceRole: "traditional_authored_short_treatise_translation", completeness: "complete_source_file",
    relations: [nagarjunaShortTreatises], title: "六十頌如理論", author: "龍樹菩薩造 宋 施護譯", extent: "1卷",
    summary: "固定來源完整保存一卷與穩定錨點；DILA 經錄提供 Yuktiṣaṣṭikākārikā 梵題及德格、北京等藏譯對號，平台登記為獨立跨藏作品的漢譯表達。",
  },
  T1576: {
    slug: "taisho-t1576", workId: "gbcr:work:mahayana-vimsaka", workIdentityStatus: "verified_distinct_short_treatise_work",
    workTitle: "大乘二十頌論（Mahāyānaviṃśikā）", sourceRole: "traditional_authored_short_treatise_translation", completeness: "complete_source_file",
    relations: [nagarjunaShortTreatises], title: "大乘二十頌論", author: "龍樹菩薩造 宋 施護譯", extent: "1卷",
    summary: "固定來源完整保存一卷二十頌與穩定錨點；獨立登記作品並照錄傳統龍樹造、施護譯題記，不與其他龍樹短論合併。",
  },
  T1577: {
    slug: "taisho-t1577", workId: "gbcr:work:mahapurusa-sastra", workIdentityStatus: "verified_distinct_treatise_work",
    workTitle: "大丈夫論（Mahāpuruṣaśāstra）", sourceRole: "traditional_authored_ethics_treatise_translation", completeness: "complete_source_file",
    relations: [], title: "大丈夫論", author: "提婆羅菩薩造 北涼 道泰譯", extent: "2卷",
    summary: "固定來源完整保存兩卷與穩定錨點；依來源責任題記作獨立菩薩行論書登記。提婆羅不因漢字相近而自動等同提婆，平台不作無證據的人物或作品合併。",
  },
  T1578: {
    slug: "taisho-t1578", workId: "gbcr:work:karatalaratna-bhaviveka", workIdentityStatus: "verified_distinct_treatise_work",
    workTitle: "大乘掌珍論（*Karatalaratna）", sourceRole: "traditional_authored_madhyamaka_treatise_translation", completeness: "complete_source_file",
    relations: [bhavivekaWorks], title: "大乘掌珍論", author: "清辯菩薩造 唐 玄奘譯", extent: "2卷",
    summary: "固定來源完整保存兩卷與穩定錨點；登記為清辨的獨立中觀論書，與其《般若燈論釋》建立作者與學派關係但不合併作品。",
  },
  T1579: {
    slug: "taisho-t1579", workId: "gbcr:work:yogacarabhumi", workIdentityStatus: "verified_composite_treatise_work",
    workTitle: "瑜伽師地論（Yogācārabhūmi）", sourceRole: "traditional_attributed_composite_yogacara_treatise_translation", completeness: "complete_source_file",
    relations: [yogacarabhumiFamily], title: "瑜伽師地論", author: "彌勒菩薩說 唐 玄奘譯", extent: "100卷",
    summary: "固定來源完整保存一百卷、五分十七地與穩定錨點；作為複合瑜伽行百科論書登記，並連接注釋、菩薩地異譯與抉擇分部分譯。傳統彌勒說、玄奘譯題記照錄，不標作佛陀逐字親說。",
  },
  T1580: {
    slug: "taisho-t1580", workId: "gbcr:work:yogacarabhumi-vyakhya", workIdentityStatus: "verified_partial_work_witness",
    workTitle: "瑜伽師地論釋（*Yogācārabhūmivyākhyā）", sourceRole: "traditional_authored_abridged_yogacara_commentary_translation", completeness: "complete_source_file_partial_work_witness",
    relations: [yogacarabhumiFamily], title: "瑜伽師地論釋", author: "最勝子等造 唐 玄奘譯", extent: "1卷",
    summary: "來源文件完整保存一卷與穩定錨點；法鼓文理學院對照表標為略本，開放學術研究也稱其為更完整注釋的漢文略譯。平台因此計為注釋作品的部分見證。",
  },
  T1581: {
    slug: "taisho-t1581", workId: "gbcr:work:bodhisattvabhumi", workIdentityStatus: "verified_component_work_translation",
    workTitle: "菩薩地（Bodhisattvabhūmi）", sourceRole: "traditional_translated_bodhisattvabhumi_component", completeness: "complete_source_file",
    relations: [yogacarabhumiFamily, bodhisattvabhumiBoundary], title: "菩薩地持經", author: "北涼 曇無讖譯", extent: "10卷",
    summary: "固定來源完整保存十卷與穩定錨點；《菩薩地》雖是《瑜伽師地論》本地分的組成部分，也以獨立文本流通，故作組成作品的完整漢譯表達登記。與 T1582/T1583 的異譯或改編關係保留待裁決。",
  },
  T1582: {
    slug: "taisho-t1582", workId: "gbcr:work:bodhisattva-good-precepts-recension", workIdentityStatus: "verified_split_partial_work_witness",
    workTitle: "菩薩善戒經（十卷合體）", sourceRole: "traditional_translated_or_revised_split_bodhisattvabhumi_related_witness", completeness: "complete_source_file_partial_work_witness",
    relations: [yogacarabhumiFamily, goodPreceptsSplit, bodhisattvabhumiBoundary], title: "菩薩善戒經", author: "劉宋 求那跋摩譯", extent: "9卷",
    summary: "來源文件完整保存九卷與穩定錨點，但經錄與研究指出它原與今 T1583 一卷合成十卷文本。平台保留獨立經號和入口，兩者共享作品標識；單獨 T1582 不冒充完整十卷作品。",
  },
  T1583: {
    slug: "taisho-t1583", workId: "gbcr:work:bodhisattva-good-precepts-recension", workIdentityStatus: "verified_split_partial_work_witness",
    workTitle: "菩薩善戒經（十卷合體）", sourceRole: "traditional_translated_or_revised_split_bodhisattvabhumi_related_witness", completeness: "complete_source_file_partial_work_witness",
    relations: [yogacarabhumiFamily, goodPreceptsSplit, bodhisattvabhumiBoundary], title: "菩薩善戒經", author: "劉宋 求那跋摩譯", extent: "1卷",
    summary: "來源文件完整保存一卷受戒法與穩定錨點；研究指出它原屬 T1582 十卷合體，因頻繁單獨使用而分離。平台計為同一作品的部分見證，不另增作品，也不隱去其獨立流通史。",
  },
  T1584: {
    slug: "taisho-t1584", workId: "gbcr:work:viniscayasamgrahani", workIdentityStatus: "verified_partial_work_witness",
    workTitle: "攝抉擇分（Viniścayasaṃgrahaṇī）", sourceRole: "translated_partial_viniscayasamgrahani_witness", completeness: "complete_source_file_partial_work_witness",
    relations: [yogacarabhumiFamily], title: "決定藏論", author: "梁 真諦譯", extent: "3卷",
    summary: "來源文件完整保存三卷與穩定錨點；DILA 經錄逐卷對應 T1579 卷五十一至五十七，即攝抉擇分開頭的五識身相應地與意地，而非整個攝抉擇分。平台標作部分作品見證。",
  },
}));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
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
    throw new Error(`${record.sourceRecordId} 固定 Git 對象、字節數或換行假設不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 標識", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 標識漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商業與保留頭部聲明`);
  }
  const title = stripXml(matchRequired(text, /<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/, "正藏題名", record.sourceRecordId));
  const author = stripXml(matchRequired(text, /<author>([\s\S]*?)<\/author>/, "傳統作者與譯者題記", record.sourceRecordId));
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷數", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const decision = decisions.get(canonId);
  if (!decision) throw new Error(`T30 出現未裁決經號 ${canonId}`);
  if (title !== decision.title || author.replace(/\s+/g, " ") !== decision.author || extent !== decision.extent) {
    throw new Error(`${canonId} 題名、責任題記或卷數漂移：${title}/${author}/${extent}`);
  }

  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan !== numericJuans[index - 1] + 1))) {
    throw new Error(`${canonId} 卷次不是連續正整數`);
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  const localPath = `data/corpus/cbeta/${record.sourceRecordId}.xml`;
  const destination = resolve(root, localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${localPath} 已存在但內容不同`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
  }
  files.push({
    id: canonId,
    slug: decision.slug,
    workId: decision.workId,
    workIdentityStatus: decision.workIdentityStatus,
    workTitle: decision.workTitle,
    sourceRole: decision.sourceRole,
    ...(decision.relations?.length ? { bibliographicRelations: decision.relations } : {}),
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
      tradition: canonId <= "T1578" ? "漢傳佛教 · 中觀部" : "漢傳佛教 · 瑜伽部",
      language: "漢文",
      canonRef: `大正藏 T30, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。${decision.summary}`,
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
  ["T1564", "T1565"], ["T1564", "T1566"], ["T1564", "T1567"], ["T1570", "T1571"],
  ["T1579", "T1580"], ["T1579", "T1581"], ["T1581", "T1582"], ["T1582", "T1583"],
];
const comparisonPairs = pairIds.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const containment = (pair) => comparisonByPair.get(pair).fiveGramContainmentOfShorter;
const inRange = (pair, min, max) => containment(pair) >= min && containment(pair) <= max;
if (
  !inRange("T1564/T1565", 0.006, 0.007) || !inRange("T1564/T1566", 0.043, 0.044) ||
  !inRange("T1564/T1567", 0.025, 0.026) || !inRange("T1570/T1571", 0.725, 0.727) ||
  !inRange("T1579/T1580", 0.095, 0.097) || !inRange("T1579/T1581", 0.055, 0.057) ||
  !inRange("T1581/T1582", 0.037, 0.039) || !inRange("T1582/T1583", 0.044, 0.046)
) throw new Error(`T30 作品體系文本比較漂移：${JSON.stringify(comparisonPairs)}`);

const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T30; T30 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T30",
    title: "大正藏 T30 中觀部、瑜伽部固定來源記錄",
    sourceRecordDenominator: 21,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus.includes("partial_work_witness")).length,
    verifiedSplitWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_split_partial_work_witness").length,
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness !== "complete_source_file").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_canonical_record").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T30 的 21 份來源記錄登記為 21 個表達或見證、20 個批次內作品。T1582/T1583 原屬同一十卷文本而後分離，共享一個作品標識；T1567、T1570、T1580、T1582、T1583、T1584 是六個部分作品見證。中觀根本頌、各家釋論、《瑜伽師地論》整部、注釋與組成部分保持作品邊界，所有論書均不標為佛陀逐字親說。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_commentary_component_split_witness_and_partial_translation_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: [goodPreceptsSplit.groupId],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups: [mmkCommentaryFamily.groupId, aryadevaFamily.groupId, yogacarabhumiFamily.groupId],
    candidateRelationsNotMerged: [
      "T1581↔T1582/T1583（同底本異譯或漢地改編仍有爭議，暫不合併作品）",
      "T1569↔T1570（《百論》與《四百論》關係密切但不據題名與局部平行合併作品）",
    ],
    partialWorkWitnesses: files.filter((file) => file.completeness !== "complete_source_file").map((file) => file.id),
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine overlap only records embedded root verses or lexical continuity; work, authorship, completeness and translation decisions require independent bibliographic evidence.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T30",
      "https://www.jstage.jst.go.jp/article/ibk/65/3/65_1205/_pdf",
      "https://academic.oup.com/reference/62340/reference-article-abstract/554138929",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0004104",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001282",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001283",
      "https://www.jstage.jst.go.jp/article/ibk1952/2/2/2_2_751/_pdf/-char/ja",
      "https://www.jstage.jst.go.jp/article/ibk1952/17/1/17_1_445/_pdf",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0002099",
      "https://buddhistinformatics.dila.edu.tw/ybh2008/",
      "https://ybh.dila.edu.tw/mapping.html",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0003830",
      "https://frogbear.org/wp-content/uploads/2023/03/2.5.1_xuanzang_eng_oa-v2.pdf",
      "https://dazangthings.nz/cbc/text/1771/",
      "https://dazangthings.nz/cbc/text/1774/",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001902",
    ],
    caveat: "T30 是中觀與瑜伽行派論書集合，不是佛說經集合。平台完整保存固定來源，同時區分根本頌、釋論、略釋、僅存前半或後半的譯本、整部複合論、獨立流通的組成部分、分離來源見證、傳統作者題記與異譯或改編爭議；題名、同一傳統作者、目錄鄰接或機器相似度都不能單獨證明作品相同、作者確定、文本完整或佛陀逐字親說。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 21 || batch.collection.newSourceBytes !== 13938106 ||
  batch.collection.newStableSegments !== 88664 || batch.collection.newFolios !== 3222 ||
  batch.collection.verifiedSameWorkExpressions !== 0 || batch.collection.verifiedPartialWorkWitnesses !== 6 ||
  batch.collection.verifiedSplitWorkWitnesses !== 2 || batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 0 || batch.collection.newFullSourceTexts !== 15 ||
  batch.collection.newPartialSourceWitnesses !== 6 || batch.collection.relationAnnotatedRecords !== 20 ||
  batch.collection.attributionBoundaryRecords !== 21 || batch.collection.newWorks !== 20 ||
  batch.collection.controlledWorks !== 20
) throw new Error(`T30 關係、歸屬或作品邊界統計漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T30 審計完成：21/21 個固定來源記錄；新增 ${batch.collection.newWorks} 個作品、${batch.collection.newSourceRecords} 個表達或見證、${batch.collection.newStableSegments} 個穩定行段。`);
