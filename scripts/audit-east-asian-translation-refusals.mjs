import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "1.0.0";
const outputPath = resolve(root, `data/gbcr/east-asian-translation-refusal-v${version}.json`);

const ledger = {
  schema: "https://foxue.ai/schemas/gbcr/east-asian-translation-refusal-v0.1",
  version,
  generatedAt: "2026-08-24",
  decision: "no_korean_or_kokuyaku_import_this_pr",
  scanned: [
    {
      id: "sat_modern_japanese",
      url: "https://21dzk.l.u-tokyo.ac.jp/SATm/",
      result: "imported_fosuo_subset",
      note: "9 份公開標題中只收 T0353/T0360/T0365/T0366；傳記、歎異抄、父母恩重經排除。",
    },
    {
      id: "wikisource_kokuyaku_daizokyo",
      url: "https://ja.wikisource.org/",
      result: "deferred_incomplete_or_ndl_image_only",
      note: "國譯大藏經／昭和新纂國譯大藏經多數條目只連到國立國會圖書館影像。本批次不抓 NDL 頁圖、不 OCR。優先 SAT CC BY 4.0 四經，國譯留作下一層。",
    },
    {
      id: "daito_kokuyaku-issaikyo",
      result: "refused_in_copyright",
      note: "國譯一切經（大東出版社）現代重印仍在版權期，不收。",
    },
    {
      id: "sat_2018_chinese_db",
      url: "https://21dzk.l.u-tokyo.ac.jp/SAT2018/",
      result: "refused_already_held_and_terms_forbid_redistribution",
      note: "大正藏漢文已由 CBETA T 持有；SAT 2008／2018 主庫條款禁止再發布本文。",
    },
    {
      id: "hangul_tripitaka_dongguk",
      result: "refused_dongguk_copyright",
      note: "한글대장경／동국역경원／통합대장경現代韓譯屬東國大學版權，不抓。",
    },
    {
      id: "cbeta_k_tripitaka_koreana",
      result: "refused_chinese_script_taisho_overlap",
      note: "高麗藏木刻本／CBETA K 是漢文，不是韓語，且與大正藏重出。不作為「韓文版本」傾倒。",
    },
    {
      id: "ko_wikisource_bulgyeong",
      url: "https://ko.wikisource.org/wiki/분류:불경",
      result: "no_clean_legal_digital_eonhae_fosuo_body",
      note: "分類:불경 未提供可直接擷取的朝鮮諺解佛說全文。아미타경언해 回 404。不 OCR 圖像，不臆造白龍城譯本。",
    },
    {
      id: "gongyumadang_or_baek_yongseong",
      result: "no_explicit_pd_digital_source",
      note: "白龍城（1940 卒）譯本在韓國或已過保護期，但本批次找不到帶明確公有領域聲明的合法數位全文，故不收。",
    },
    {
      id: "gretil_sanskrit",
      result: "refused_zero_legally_mirrorable_bodies",
      note: "沿用既有 GRETIL 權利審計：0 份可合法鏡像的梵文本文。",
    },
    {
      id: "xuzangjing_dump",
      result: "already_filtered_in_pr63",
      note: "卍續藏 1,236 份已在 #63 過濾，本批次不再傾倒。",
    },
  ],
  importedThisPr: {
    chineseNewWorks: 0,
    chineseNewExpressions: 0,
    japaneseTranslationExpressions: 4,
    koreanTranslationExpressions: 0,
  },
  caveat: "拒絕清單是為避免下一輪盲目重掃。它不構成全球覆蓋率，也不把未找到的韓文諺解計成作品。",
};

const raw = `${JSON.stringify(ledger, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== raw) throw new Error("east-asian-translation-refusal-v1.0.0.json 不可復現");
  console.log("東亞譯文拒絕總帳可復現。");
} else {
  await writeFile(outputPath, raw, "utf8");
  console.log("東亞譯文拒絕總帳已寫入。");
}
