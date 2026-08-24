import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "1.0.0";
const inventoryPath = "data/gbcr/cbeta-remaining-collections-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
if (inventory.totals.records !== 1176) throw new Error("剩餘館藏來源清單漂移");

const collectionClass = {
  B: "modern_translation_treatise_or_editorial_not_unique_fosuo",
  J: "jiaxing_commentary_yulu_or_liturgy",
  ZW: "zangwai_suspected_dunhuang_or_modern_edition",
  D: "rare_book_fragment_commentary_or_suspected",
  P: "already_in_taisho_or_commentary",
  C: "already_in_taisho_or_commentary",
  G: "already_in_taisho_treatise_or_ritual",
  K: "gaoli_chinese_script_taisho_overlap_not_korean",
  L: "already_in_taisho_or_commentary",
  M: "already_in_taisho_reprint",
  S: "already_in_taisho_or_fragment",
  U: "already_in_taisho_reprint",
  CC: "selected_anthology_not_unique_fosuo",
  GA: "temple_gazetteer_not_sutra",
  GB: "temple_gazetteer_not_sutra",
  I: "stone_inscription_not_sutra",
  LC: "category_b_luzheng",
  TX: "category_b_taixu",
  Y: "category_b_yinshun",
  YP: "category_b_yanpei",
  ZS: "official_history_anthology_not_sutra",
};

const specificExclusions = {
  B06n0006: "modern_chinese_of_already_held_pali_khuddaka",
  B07n0011: "modern_chinese_of_already_held_dhammacakkappavattana",
  B07n0012: "modern_chinese_of_already_held_ratanasutta",
  B07n0013: "modern_chinese_of_already_held_mangalasutta",
  B07n0014: "modern_chinese_of_already_held_pali_sutta",
  J19nB047: "jiaxing_compiled_ritual_not_unique_translation",
  ZW01n0009: "suspected_or_indigenous_buddhist_text",
  ZW01n0010: "suspected_or_indigenous_buddhist_text",
  ZW01n0011: "suspected_or_indigenous_buddhist_text",
  ZW01n0014a: "suspected_or_indigenous_buddhist_text",
  ZW01n0014b: "suspected_or_indigenous_buddhist_text",
  ZW01n0014c: "suspected_or_indigenous_buddhist_text",
  ZW01n0015a: "already_in_taisho_nirvana_maya_chapter",
  ZW02n0021: "jain_tattvartha_not_buddhist_fosuo",
  ZW04n0036: "suspected_or_indigenous_buddhist_text",
  ZW05n0048: "modern_chinese_of_already_held_mahasatipatthana",
  ZW07n0063: "suspected_or_indigenous_buddhist_text",
  D11n8817: "suspected_or_indigenous_buddhist_text",
  D12n8820: "suspected_or_indigenous_buddhist_text",
  P168n1581: "commentary_glossary_or_catalog",
  G052n1222: "esoteric_dharani_or_ritual",
  K05n0016: "already_in_taisho_t0220",
  C097n1821: "commentary_glossary_or_catalog",
};

function classifyRecord(record) {
  if (specificExclusions[record.sourceRecordId]) {
    return { class: specificExclusions[record.sourceRecordId], reason: "title_level_strict_fosuo_refusal" };
  }
  const fallback = collectionClass[record.collection];
  if (!fallback) throw new Error(`${record.sourceRecordId} 缺少館藏分類`);
  return { class: fallback, reason: "collection_level_strict_fosuo_refusal" };
}

const classifications = inventory.records.map((record) => ({
  sourceRecordId: record.sourceRecordId,
  collection: record.collection,
  volume: record.volume,
  ...classifyRecord(record),
}));
if (classifications.some((item) => item.class === "included_strict_sutra_candidate")) {
  throw new Error("剩餘館藏本批次不得收錄新的漢譯佛說經");
}
if (classifications.length !== 1176) throw new Error("剩餘館藏分類未覆蓋全部來源");

const countByClass = Object.fromEntries(
  [...new Set(classifications.map((item) => item.class))].sort().map((item) => [
    item,
    classifications.filter((entry) => entry.class === item).length,
  ]),
);
const countByCollection = Object.fromEntries(
  [...new Set(classifications.map((item) => item.collection))].sort().map((item) => [
    item,
    classifications.filter((entry) => entry.collection === item).length,
  ]),
);

const filterAudit = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-remaining-fosuo-filter-v0.1",
  version,
  generatedAt: "2026-08-24",
  sourceCommit: "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9",
  inventoryFile: inventoryPath,
  totals: {
    sourceRecordsAudited: classifications.length,
    included: 0,
    excluded: classifications.length,
    classCounts: countByClass,
    collectionCounts: countByCollection,
  },
  decision: "zero_new_chinese_fosuo_from_remaining_cbeta_collections",
  workCountingDecision: "從 1,176 份 #63 未過濾館藏中，0 份通過嚴格佛說經：譯經、譯者、大正藏／N／已收 A/F 未持有、非疑偽、Category A。嘉興以義疏語錄懺儀為主；藏外以疑偽與敦煌整理本為主（含淨度三昧經）；補編現代漢譯已由 N 或大正藏持有；高麗藏是漢文重出不是韓語；呂澂／太虛／印順／演培整集排除。",
  caveat: "本審計只證明這些館藏已被逐號分類並拒絕再盲目掃描。它不把 1,176 份來源記錄計成全球佛陀親說作品覆蓋率。",
  records: classifications,
};
const filterRaw = `${JSON.stringify(filterAudit, null, 2)}\n`;
const outputPath = resolve(root, `data/gbcr/cbeta-remaining-fosuo-filter-v${version}.json`);

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== filterRaw) throw new Error("cbeta-remaining-fosuo-filter-v1.0.0.json 不可復現");
  console.log(`CBETA 剩餘館藏佛說經過濾可復現：收錄 0/${classifications.length}。`);
} else {
  await writeFile(outputPath, filterRaw, "utf8");
  console.log(`CBETA 剩餘館藏佛說經過濾完成：收錄 0/${classifications.length}。`);
}
