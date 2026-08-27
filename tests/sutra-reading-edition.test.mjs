import assert from "node:assert/strict";
import test from "node:test";
import catalog from "../data/corpus/cbeta/catalog-v4.23.0.json" with { type: "json" };
import nanchuanCatalog from "../data/corpus/cbeta/nanchuan-catalog-v1.0.0.json" with { type: "json" };
import beyondTaishoCatalog from "../data/corpus/cbeta/beyond-taisho-sutra-catalog-v1.0.0.json" with { type: "json" };
import satCatalog from "../data/corpus/sat/modern-japanese-catalog-v1.0.0.json" with { type: "json" };
import kokuyakuCatalog from "../data/corpus/wikisource/kokuyaku-dhp-catalog-v1.0.0.json" with { type: "json" };
import sujatoEnglishCatalog from "../data/corpus/suttacentral/sujato-en-catalog-v1.0.0.json" with { type: "json" };
import dhammapadaManifest from "../data/corpus/suttacentral/manifest-v0.7.0.json" with { type: "json" };
import dighaManifest from "../data/corpus/suttacentral/dn-manifest-v0.8.0.json" with { type: "json" };
import majjhimaManifest from "../data/corpus/suttacentral/mn-manifest-v0.9.0.json" with { type: "json" };
import samyuttaManifest from "../data/corpus/suttacentral/sn-manifest-v1.0.0.json" with { type: "json" };
import anguttaraManifest from "../data/corpus/suttacentral/an-manifest-v1.1.0.json" with { type: "json" };
import khuddakaManifest from "../data/corpus/suttacentral/kn-manifest-v1.2.0.json" with { type: "json" };
import indicManifest from "../data/corpus/suttacentral/indic-manifest-v1.3.0.json" with { type: "json" };
import vinayaManifest from "../data/corpus/suttacentral/vinaya-manifest-v1.4.0.json" with { type: "json" };
import abhidhammaManifest from "../data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json" with { type: "json" };
import lzhManifest from "../data/corpus/suttacentral/lzh-manifest-v1.6.0.json" with { type: "json" };
import dergeManifest from "../data/corpus/derge/manifest-v0.1.0.json" with { type: "json" };
import {
  buildDefaultReadingEdition,
  inferBilaraSegmentRoles,
  inferReadingSegmentRoles,
} from "../src/lib/sutra-reading-edition.mjs";

test("全部 4,182 個文本表達都由語種與來源生成正確閱讀模式", () => {
  const collections = [
    [catalog.files, "cbeta-folio"],
    [nanchuanCatalog.files, "cbeta-folio"],
    [beyondTaishoCatalog.files, "cbeta-folio"],
    [satCatalog.files, "sat-folio"],
    [kokuyakuCatalog.files, "kokuyaku-folio"],
    [sujatoEnglishCatalog.files.filter((file) => file.parser === "bilara_root_json"), "bilara-chapter"],
    [sujatoEnglishCatalog.files.filter((file) => file.parser !== "bilara_root_json"), "bilara-sutta"],
    [dhammapadaManifest.files, "bilara-chapter"],
    [dighaManifest.files, "bilara-sutta"],
    [majjhimaManifest.files, "bilara-sutta"],
    [samyuttaManifest.files, "bilara-sutta"],
    [anguttaraManifest.files, "bilara-sutta"],
    [khuddakaManifest.files, "bilara-sutta"],
    [indicManifest.files, "bilara-sutta"],
    [vinayaManifest.files, "bilara-sutta"],
    [abhidhammaManifest.files, "bilara-sutta"],
    [lzhManifest.files, "bilara-sutta"],
    [dergeManifest.files, "derge-folio"],
  ];
  const editions = collections.flatMap(([files, readerMode]) => files.map((file) => {
    const language = file.presentation.language;
    const edition = buildDefaultReadingEdition({
      slug: file.slug,
      title: file.presentation.title,
      alternateTitle: file.presentation.alternateTitle,
      translator: file.presentation.translator,
      language,
      folioLabel: "001",
      segments: [],
      hasNext: true,
      readerMode,
    });
    const chinese = language === "漢文" || language === "汉文" || language.startsWith("古汉语");
    assert.equal(edition.annotationMode, chinese ? "pinyin" : "plain", file.slug);
    if (language === "英文") {
      assert.equal(edition.contentLanguage, "en", file.slug);
      assert.equal(edition.editionLabel, "英文译本", file.slug);
    }
    return edition;
  }));
  assert.equal(editions.length, 4182);
});

test("保守識別註冊號、經題、譯者與品題", () => {
  const roles = inferReadingSegmentRoles({
    title: "妙法蓮華經",
    alternateTitle: "法華經",
    segments: [
      { sourceLine: "0001a01", text: "No.262" },
      { sourceLine: "0001a02", text: "妙法蓮華經" },
      { sourceLine: "0001a03", text: "姚秦三藏法師鳩摩羅什譯" },
      { sourceLine: "0001a04", text: "序品第一" },
      { sourceLine: "0001a05", text: "如是我聞。一時佛住王舍城。" },
      { sourceLine: "0001a06", text: "撰記佛言。所行非常。" },
      { sourceLine: "0001a07", text: "法華經者，括諸佛萬行之樞紐也。" },
      { sourceLine: "0001a08", text: "近世葛氏傳七百偈，偈義致深，譯" },
      { sourceLine: "0001a09", text: "數句，非數句。數句，非數句。" },
    ],
  });
  assert.deepEqual(roles, {
    "0001a01": "registration",
    "0001a02": "heading",
    "0001a03": "byline",
    "0001a04": "heading",
  });
});

test("顯示層合併 CBETA 解析產生的重複題籤", () => {
  const edition = buildDefaultReadingEdition({
    slug: "fahuajing",
    title: "妙法蓮華經",
    alternateTitle: "法華經",
    translator: "姚秦·鳩摩羅什譯",
    language: "漢文",
    folioLabel: "0001a",
    segments: [{
      sourceLine: "0001a03",
      text: "御製大乘妙法蓮華經序御製大乘妙法蓮華經序",
    }],
    hasNext: true,
  });
  assert.equal(edition?.segmentRoles["0001a03"], "heading");
  assert.equal(edition?.textOverrides?.["0001a03"], "御製大乘妙法蓮華經序");
});

test("Bilara 結構標識只提升題名與分節，不改寫正文", () => {
  const roles = inferBilaraSegmentRoles({
    segments: [
      { sourceLine: "0.1", text: "Dīgha Nikāya 1" },
      { sourceLine: "0.2", text: "Brahmajālasutta" },
      { sourceLine: "1.0", text: "1. Paribbājakakathā" },
      { sourceLine: "1.1.1", text: "Evaṁ me sutaṁ—ekaṁ samayaṁ bhagavā antarā ca rājagahaṁ antarā ca nāḷandaṁ addhānamaggappaṭipanno hoti." },
      { sourceLine: "1.1.2", text: "No hetaṁ, bhante." },
      { sourceLine: "1.3.1", text: "2.1. Cūḷasīla" },
    ],
  });
  assert.deepEqual(roles, {
    "0.1": "heading",
    "0.2": "heading",
    "1.0": "heading",
    "1.3.1": "heading",
  });
});
