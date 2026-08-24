import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.0.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-nanchuan-sutta.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作樹必須固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-nanchuan-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
if (inventory.totals.records !== 83 || inventory.totals.upstreamBytes !== 56261556) {
  throw new Error(`南傳固定來源分母漂移：${inventory.totals.records}/${inventory.totals.upstreamBytes}`);
}

const workDefinitions = [
  {
    number: "0004",
    workId: "gbcr:work:nanchuan-digha-nikaya",
    slugBase: "nanchuan-digha",
    titleZh: "長部經典",
    titlePali: "Dīgha Nikāya",
    tradition: "漢譯南傳 · 經藏",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N06n0004", "N07n0004", "N08n0004"],
    paliRelation: "對應站內已收 SuttaCentral 《長部》巴利根本文本；漢譯是同一部類的獨立表達，不與 34 部巴利經自動合併為同一作品。",
  },
  {
    number: "0005",
    workId: "gbcr:work:nanchuan-majjhima-nikaya",
    slugBase: "nanchuan-majjhima",
    titleZh: "中部經典",
    titlePali: "Majjhima Nikāya",
    tradition: "漢譯南傳 · 經藏",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N09n0005", "N10n0005", "N11n0005", "N12n0005"],
    paliRelation: "對應站內已收 SuttaCentral 《中部》巴利根本文本；漢譯按元亨寺卷冊保存，不按巴利經號拆成 152 個作品。",
  },
  {
    number: "0006",
    workId: "gbcr:work:nanchuan-samyutta-nikaya",
    slugBase: "nanchuan-samyutta",
    titleZh: "相應部經典",
    titlePali: "Saṃyutta Nikāya",
    tradition: "漢譯南傳 · 經藏",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N13n0006", "N14n0006", "N15n0006", "N16n0006", "N17n0006", "N18n0006"],
    paliRelation: "對應站內已收 SuttaCentral 《相應部》巴利根本文本；漢譯按元亨寺卷冊保存為同一部類的六個表達。",
  },
  {
    number: "0007",
    workId: "gbcr:work:nanchuan-anguttara-nikaya",
    slugBase: "nanchuan-anguttara",
    titleZh: "增支部經典",
    titlePali: "Aṅguttara Nikāya",
    tradition: "漢譯南傳 · 經藏",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N19n0007", "N20n0007", "N21n0007", "N22n0007", "N23n0007", "N24n0007", "N25n0007"],
    paliRelation: "對應站內已收 SuttaCentral 《增支部》巴利根本文本；漢譯按元亨寺卷冊保存，不按巴利經號拆分。",
  },
  {
    number: "0008",
    workId: "gbcr:work:nanchuan-khuddakapatha",
    slugBase: "nanchuan-khuddakapatha",
    titleZh: "小誦經",
    titlePali: "Khuddakapāṭha",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N26n0008"],
    paliRelation: "對應站內已收巴利《小誦》；漢譯為獨立表達。",
  },
  {
    number: "0009",
    workId: "gbcr:work:nanchuan-dhammapada",
    slugBase: "nanchuan-dhammapada",
    titleZh: "法句經",
    titlePali: "Dhammapada",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N26n0009"],
    paliRelation: "對應站內已收巴利《法句》；漢譯為獨立表達，不與 T0210 等漢譯法句自動合併。",
  },
  {
    number: "0010",
    workId: "gbcr:work:nanchuan-udana",
    slugBase: "nanchuan-udana",
    titleZh: "自說經",
    titlePali: "Udāna",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N26n0010"],
    paliRelation: "對應站內已收巴利《自說》；漢譯為獨立表達。",
  },
  {
    number: "0011",
    workId: "gbcr:work:nanchuan-itivuttaka",
    slugBase: "nanchuan-itivuttaka",
    titleZh: "如是語經",
    titlePali: "Itivuttaka",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N26n0011"],
    paliRelation: "對應站內已收巴利《如是語》；漢譯為獨立表達。",
  },
  {
    number: "0012",
    workId: "gbcr:work:nanchuan-suttanipata",
    slugBase: "nanchuan-suttanipata",
    titleZh: "經集",
    titlePali: "Suttanipāta",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_sutta_pitaka_expression",
    strictSutraScope: "included_candidate",
    files: ["N27n0012"],
    paliRelation: "對應站內已收巴利《經集》；漢譯為獨立表達。",
  },
  {
    number: "0013",
    workId: "gbcr:work:nanchuan-vimanavatthu",
    slugBase: "nanchuan-vimanavatthu",
    titleZh: "天宮事經",
    titlePali: "Vimānavatthu",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N27n0013"],
    paliRelation: "小部混合集成員；與站內巴利《天宮事》對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0014",
    workId: "gbcr:work:nanchuan-petavatthu",
    slugBase: "nanchuan-petavatthu",
    titleZh: "餓鬼事經",
    titlePali: "Petavatthu",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N28n0014"],
    paliRelation: "小部混合集成員；與站內巴利《餓鬼事》對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0015",
    workId: "gbcr:work:nanchuan-theragatha",
    slugBase: "nanchuan-theragatha",
    titleZh: "長老偈經",
    titlePali: "Theragāthā",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N28n0015"],
    paliRelation: "小部偈頌集；與站內巴利《長老偈》對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0016",
    workId: "gbcr:work:nanchuan-therigatha",
    slugBase: "nanchuan-therigatha",
    titleZh: "長老尼偈經",
    titlePali: "Therīgāthā",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N28n0016"],
    paliRelation: "小部偈頌集；與站內巴利《長老尼偈》對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0017",
    workId: "gbcr:work:nanchuan-apadana",
    slugBase: "nanchuan-apadana",
    titleZh: "譬喻經",
    titlePali: "Apadāna",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N29n0017", "N30n0017"],
    paliRelation: "小部譬喻集；與站內巴利 Apadāna 對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0018",
    workId: "gbcr:work:nanchuan-jataka",
    slugBase: "nanchuan-jataka",
    titleZh: "本生經",
    titlePali: "Jātaka",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: [
      "N31n0018", "N32n0018", "N33n0018", "N34n0018", "N35n0018", "N36n0018",
      "N37n0018", "N38n0018", "N39n0018", "N40n0018", "N41n0018", "N42n0018",
    ],
    paliRelation: "小部本生集；與站內巴利 Jātaka 對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0020",
    workId: "gbcr:work:nanchuan-buddhavamsa",
    slugBase: "nanchuan-buddhavamsa",
    titleZh: "佛種姓經",
    titlePali: "Buddhavaṃsa",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N44n0020"],
    paliRelation: "小部佛種姓；與站內巴利 Buddhavaṃsa 對應，不自動計入嚴格佛說經分母。",
  },
  {
    number: "0021",
    workId: "gbcr:work:nanchuan-cariyapitaka",
    slugBase: "nanchuan-cariyapitaka",
    titleZh: "所行藏經",
    titlePali: "Cariyāpiṭaka",
    tradition: "漢譯南傳 · 小部",
    sourceRole: "translated_mixed_khuddaka_expression",
    strictSutraScope: "scope_policy_required",
    files: ["N44n0021"],
    paliRelation: "小部所行藏；與站內巴利 Cariyāpiṭaka 對應，不自動計入嚴格佛說經分母。",
  },
];

const includedIds = new Set(workDefinitions.flatMap((work) => work.files));
if (includedIds.size !== 45) throw new Error(`南傳經藏收錄清單應為 45，實際 ${includedIds.size}`);
const definitionByFile = new Map();
for (const work of workDefinitions) {
  for (const id of work.files) definitionByFile.set(id, work);
}

const excludedIds = inventory.records
  .map((record) => record.sourceRecordId)
  .filter((id) => !includedIds.has(id));
const expectedExcluded = 38;
if (excludedIds.length !== expectedExcluded) {
  throw new Error(`南傳排除記錄應為 ${expectedExcluded}，實際 ${excludedIds.length}：${excludedIds.join(",")}`);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const required = (value, label, id) => {
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};

const files = [];
for (const record of inventory.records.filter((item) => includedIds.has(item.sourceRecordId))) {
  const work = definitionByFile.get(record.sourceRecordId);
  const upstream = execFileSync("git", ["-C", sourceRoot, "show", `HEAD:${record.upstreamPath}`], {
    encoding: "buffer",
    maxBuffer: Math.max(record.upstreamBytes + 1024, 16 * 1024 * 1024),
  });
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 上游 Git 物件與清單不一致`);
  }
  const text = upstream.toString("utf8");
  if (!text.includes(`xml:id="${record.sourceRecordId}"`)) {
    throw new Error(`${record.sourceRecordId} TEI 標識不匹配`);
  }
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商業使用與保留頭部聲明`);
  }
  const title = stripXml(required(text.match(/<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/)?.[1], "正藏題名", record.sourceRecordId));
  const author = stripXml(required(text.match(/<author>([\s\S]*?)<\/author>/)?.[1], "譯者", record.sourceRecordId));
  const extent = stripXml(required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷數", record.sourceRecordId));
  if (!title.includes(work.titleZh.replace(/經典$/, "").replace(/經$/, "")) && !title.includes(work.titleZh)) {
    throw new Error(`${record.sourceRecordId} 題名「${title}」與收錄清單「${work.titleZh}」不一致`);
  }
  if (!/譯/.test(author)) throw new Error(`${record.sourceRecordId} 不是譯本責任題記：${author}`);

  const segments = parseCbetaReadingLines(text, { canonId: record.sourceRecordId });
  const navigation = buildPageNavigation(segments);
  const numericJuans = [...new Set(segments.map((segment) => segment.juan))].map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan <= numericJuans[index - 1]))) {
    throw new Error(`${record.sourceRecordId} 原始卷次不是嚴格遞增正整數`);
  }
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

  const volumeIndex = work.files.indexOf(record.sourceRecordId) + 1;
  const relations = [
    {
      type: work.strictSutraScope === "included_candidate"
        ? "cross_language_sutta_recension_distinct"
        : "cross_language_mixed_khuddaka_recension_distinct",
      groupId: `${work.slugBase}-yuanheng-chinese`,
      label: `元亨寺漢譯《${work.titleZh}》與巴利根本文本家族`,
      evidence: work.paliRelation,
      externalIds: { cbeta: work.files },
    },
  ];
  if (work.files.length > 1) {
    relations.push({
      type: "same_work_volume_expression_group_verified",
      groupId: `${work.slugBase}-yuanheng-volumes`,
      label: `《${work.titleZh}》元亨寺分冊表達組`,
      evidence: `${work.files.length} 份固定記錄共享南傳經號 N${work.number}，按卷冊分文件保存，不拆成新作品。`,
      externalIds: { cbeta: work.files },
    });
  }

  files.push({
    id: record.sourceRecordId,
    slug: work.files.length === 1 ? work.slugBase : `${work.slugBase}-${String(volumeIndex).padStart(2, "0")}`,
    workId: work.workId,
    workTitle: work.titleZh,
    sourceRole: work.sourceRole,
    canonicalStatus: work.strictSutraScope === "included_candidate"
      ? "traditional_sutta_pitaka_chinese_translation"
      : "mixed_khuddaka_chinese_translation_not_automatic_buddha_word",
    buddhaWordStatus: work.strictSutraScope === "included_candidate"
      ? "traditional_sutta_translation_not_verbatim_authorship_claim"
      : "mixed_collection_translation_scope_policy_required",
    bibliographicRelations: relations,
    authorityIds: { cbetaText: record.sourceRecordId, nanchuanNumber: `N${work.number}` },
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
      title: title,
      alternateTitle: `${work.titlePali} · ${work.titleZh}`,
      tradition: work.tradition,
      language: "漢文",
      canonRef: `漢譯南傳大藏經（元亨寺版） N${work.number} · ${record.volume}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI 與元亨寺漢譯；這是巴利經藏的漢譯表達，不是新的巴利作品，也不把譯文等同佛陀逐字親說。傳統責任題記：${author}。`,
      sourceUrl: `https://cbetaonline.dila.edu.tw/zh/${record.sourceRecordId}_001`,
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      juanRange: [numericJuans[0], numericJuans.at(-1)],
      juanSequence: numericJuans,
      anchors: [segments[0].id, segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

files.sort((left, right) => left.id.localeCompare(right.id));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-22",
  baseCatalog: null,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Yuanheng Chinese Pali sutta-pitaka translations; vinaya, abhidhamma, niddesa, histories and commentaries excluded",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-NANCHUAN-SUTTA",
    title: "元亨寺漢譯南傳經藏固定來源記錄",
    sourceRecordDenominator: 83,
    previouslyControlledSourceRecords: 0,
    excludedSourceRecords: excludedIds.length,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanSequence.length, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.bibliographicRelations.some((item) => item.type === "same_work_volume_expression_group_verified")).length,
    excludedVinayaAbhidhammaCommentaryHistoryRecords: excludedIds.length,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    strictSutraWorks: workDefinitions.filter((work) => work.strictSutraScope === "included_candidate").length,
    mixedKhuddakaWorks: workDefinitions.filter((work) => work.strictSutraScope === "scope_policy_required").length,
    workCountingDecision: "45 份南傳經藏漢譯記錄登記為 17 個作品：長部、中部、相應部、增支部與 13 個小部書級文本。同一南傳經號的分冊是同一作品的多個表達。律、論、義釋、史傳、清淨道論與彌蘭王問經保持排除。跨語言作品身分不自動與巴利根本文本合併。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_sutta_pitaka_inclusion_and_non_sutra_exclusion",
    excludedSourceRecords: excludedIds,
    excludedClasses: [
      "vinaya_suttavibhanga_khandhaka_parivara",
      "abhidhamma_seven_books",
      "niddesa_commentaries",
      "patisambhidamagga",
      "milindapanha",
      "vamsas_and_chronicles",
      "visuddhimagga_and_abhidhammatthasangaha",
      "asoka_inscriptions",
    ],
    relatedDistinctWorkGroups: workDefinitions.map((work) => `${work.slugBase}-yuanheng-chinese`),
    candidateRelationsNotMerged: [
      "漢譯南傳與 SuttaCentral 巴利根本文本只建立文本家族關係，不因部類名稱合併 Work",
      "小部天宮事、餓鬼事、長老偈、譬喻、本生、佛種姓、所行藏與巴利 KN 一樣保持混合集範圍政策",
      "律、論、義釋、史傳與彌蘭王問經不作為佛說經導入",
    ],
    caveat: "本批次只證明元亨寺漢譯南傳經藏固定 TEI 被完整保存並可在經藏閱讀。它不把漢譯、巴利根本文本或部類名稱計成全球佛陀親說作品覆蓋率。",
  },
  files,
};

if (
  files.length !== 45 || batchWorkIds.size !== 17 ||
  batch.collection.strictSutraWorks !== 9 || batch.collection.mixedKhuddakaWorks !== 8 ||
  batch.collection.excludedSourceRecords !== 38
) {
  throw new Error(`南傳經藏批次計數漂移：${JSON.stringify(batch.collection)}`);
}

const outputPath = resolve(root, `data/corpus/cbeta/nanchuan-batch-v${version}.json`);
const batchRaw = `${JSON.stringify(batch, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== batchRaw) throw new Error("nanchuan-batch-v1.0.0.json 不可復現");
  console.log(`CBETA 南傳經藏審計可復現：收錄 ${files.length}/83 份來源、${batchWorkIds.size} 個作品、排除 ${excludedIds.length} 份律論史傳。`);
} else {
  await writeFile(outputPath, batchRaw, "utf8");
  console.log(`CBETA 南傳經藏審計完成：收錄 ${files.length}/83 份來源、${batchWorkIds.size} 個作品、排除 ${excludedIds.length} 份律論史傳；${batch.collection.newStableSegments} 個穩定行段。`);
}
