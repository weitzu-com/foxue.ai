import catalog from "../../data/corpus/cbeta/catalog-v2.0.0.json";
import suttacentralManifest from "../../data/corpus/suttacentral/manifest-v0.7.0.json";
import dighaNikayaManifest from "../../data/corpus/suttacentral/dn-manifest-v0.8.0.json";
import majjhimaNikayaManifest from "../../data/corpus/suttacentral/mn-manifest-v0.9.0.json";
import samyuttaNikayaManifest from "../../data/corpus/suttacentral/sn-manifest-v1.0.0.json";
import anguttaraNikayaManifest from "../../data/corpus/suttacentral/an-manifest-v1.1.0.json";
import khuddakaNikayaManifest from "../../data/corpus/suttacentral/kn-manifest-v1.2.0.json";

export type SutraSegment = {
  id: string;
  text: string;
  note?: string;
  legacyIds?: string[];
  juan?: string;
  sourceLine?: string;
  page?: string;
};

export type Sutra = {
  slug: string;
  title: string;
  alternateTitle: string;
  tradition: string;
  language: string;
  canonRef: string;
  translator: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  bibliographicNote?: string;
  attributionNote?: string;
  status: "完整原文 · 行段试行" | "节译见证 · 完整来源记录" | "后分见证 · 完整来源记录" | "节本见证 · 完整来源记录" | "残篇候选 · 完整来源记录" | "完整原文 · 原生段落" | "目录样本";
  readerMode?: "cbeta-folio" | "bilara-chapter" | "bilara-sutta";
  segments: SutraSegment[];
};

const curatedSutras: Sutra[] = [
  {
    slug: "xinjing",
    title: "般若波罗蜜多心经",
    alternateTitle: "心经",
    tradition: "汉传佛教 · 般若部",
    language: "汉文",
    canonRef: "大正藏 T08, no. 251",
    translator: "唐·玄奘译",
    summary:
      "以极精炼的篇幅呈现般若空义，并以“照见五蕴皆空”说明智慧与离苦的关系。",
    sourceName: "CBETA Online",
    sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0251_001",
    sourceLicense: "CBETA 授权条款；古典原文",
    status: "完整原文 · 行段试行",
    segments: [
      {
        id: "T0251.001.0848c06",
        legacyIds: ["T0251.001.0848c08"],
        text: "观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。",
        note: "“五蕴”指色、受、想、行、识；本段把观照、空与离苦连在一起。",
      },
      {
        id: "T0251.001.0848c07",
        legacyIds: ["T0251.001.0848c09"],
        text: "舍利子！色不异空，空不异色；色即是空，空即是色。",
        note: "此处不是否定经验世界，而是指出诸法不具独立、恒常的自性。",
      },
      {
        id: "T0251.001.0848c08",
        legacyIds: ["T0251.001.0848c10"],
        text: "受、想、行、识，亦复如是。",
        note: "空义同样适用于其余四蕴。",
      },
      {
        id: "T0251.001.0848c09",
        legacyIds: ["T0251.001.0848c11"],
        text: "舍利子！是诸法空相：不生不灭，不垢不净，不增不减。",
      },
    ],
  },
  {
    slug: "jingangjing",
    title: "金刚般若波罗蜜经",
    alternateTitle: "金刚经",
    tradition: "汉传佛教 · 般若部",
    language: "汉文",
    canonRef: "大正藏 T08, no. 235",
    translator: "后秦·鸠摩罗什译",
    summary:
      "以须菩提与佛陀的问答，破除对自我、功德、教法与一切相的执取。",
    sourceName: "CBETA Online",
    sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
    sourceLicense: "CBETA 授权条款；古典原文",
    status: "完整原文 · 行段试行",
    segments: [
      {
        id: "T0235.001.0749a24",
        legacyIds: ["T0235.001.0752b06"],
        text: "凡所有相，皆是虚妄；若见诸相非相，则见如来。",
        note: "“非相”不是消灭现象，而是不把现象误认作固定自性。",
      },
      {
        id: "T0235.001.0749c22",
        legacyIds: ["T0235.001.0752c17"],
        text: "应无所住而生其心。",
        note: "发心与行动并未被取消；经文强调行动时不住著于对象和自我。",
      },
      {
        id: "T0235.001.0750a19",
        legacyIds: ["T0235.001.0752c25"],
        text: "如来说世界，非世界，是名世界。",
      },
      {
        id: "T0235.001.0752b28",
        legacyIds: ["T0235.001.0752c28"],
        text: "一切有为法，如梦幻泡影，如露亦如电，应作如是观。",
      },
    ],
  },
  {
    slug: "fajujing",
    title: "法句经",
    alternateTitle: "Dharmapada",
    tradition: "汉传佛教 · 本缘部",
    language: "汉文",
    canonRef: "大正藏 T04, no. 210",
    translator: "吴·维祇难等译",
    summary:
      "以短偈汇集修心、戒行、觉察与解脱的教导；与巴利《法句》存在相关但不完全相同的传承。",
    sourceName: "CBETA Online",
    sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0210_001",
    sourceLicense: "CBETA 授权条款；古典原文",
    status: "完整原文 · 行段试行",
    segments: [
      {
        id: "T0210.001.0562a13",
        legacyIds: ["T0210.004.0562a13"],
        text: "心为法本，心尊心使；中心念恶，即言即行，罪苦自追，车轹于辙。",
        note: "汉译《法句经》的篇章结构与巴利本并非逐句对应，跨本对读必须标明版本。",
      },
      {
        id: "T0210.001.0562a15",
        legacyIds: ["T0210.004.0562a16"],
        text: "心为法本，心尊心使；中心念善，即言即行，福乐自追，如影随形。",
      },
      {
        id: "T0210.001.0562a21",
        legacyIds: ["T0210.004.0562a27"],
        text: "不好责彼，务自省身，如有知此，永灭无患。",
      },
    ],
  },
];

const curatedBySlug = new Map(curatedSutras.map((sutra) => [sutra.slug, sutra]));

const cbetaRelations = (file: (typeof catalog.files)[number]) =>
  "bibliographicRelations" in file && Array.isArray(file.bibliographicRelations)
    ? file.bibliographicRelations
    : [];

const cbetaAttributionNote = (file: (typeof catalog.files)[number]) => {
  if (!("sourceRole" in file)) return undefined;
  if (file.sourceRole === "attributed_authored_or_compiled_text") {
    return "来源题记显示为造、撰、集或论类文本；平台保留传统目录位置，但不将其标作佛陀亲说。";
  }
  if (file.sourceRole === "traditional_translation_attribution_disputed") {
    return "目录保留传统译者署名；现代研究对实际译者或成书路径存在争议，平台不把传统署名当作已裁决事实。";
  }
  if (file.sourceRole === "liturgical_transliteration_witness") {
    return "本记录保存梵汉对音与读诵见证，不作为另一部独立汉译或佛陀亲说作品计数。";
  }
  if (file.sourceRole === "partial_translation_witness") {
    return "本记录完整保存一份古代节译见证，只对应规范作品的部分章节，不作为完整译本计数。";
  }
  if (file.sourceRole === "partial_continuation_witness") {
    return "本记录完整保存规范作品的后分或续接见证，不作为另一部完整译本计数。";
  }
  if (file.sourceRole === "edition_witness") {
    return "本记录与同经号另一版本共享规范作品；平台保留各自文本、字数和稳定锚点，不把版本见证重复计作独立作品。";
  }
  if (file.sourceRole === "edited_compilation_witness") {
    return "本记录为后世据多种旧译校辑的合成本；平台保留传统版本见证，不将其冒充新的古代译本。";
  }
  if (file.sourceRole === "edited_recension_witness") {
    return "本记录为依据既有译本加治编定的版本见证；平台保留全文与编辑责任，不将其冒充独立古译。";
  }
  if (file.sourceRole === "partial_text_family_witness_candidate") {
    return "本记录题名显示只存一卷或一章；与相关文本的确切归属仍待研究，平台保存残篇并公开关系候选，不冒充完整译本。";
  }
  if (file.sourceRole === "indigenous_composition_candidate") {
    return "传统目录题记为失译；现代研究提出东亚本土成书可能，平台保留争议，不将其径直当作印度译经或佛陀亲说。";
  }
  if (file.sourceRole === "translation_attribution_unknown") {
    return "来源目录题记为失译，平台保留译者未知状态，不补造作者、译者或佛陀亲说归属。";
  }
  if (file.sourceRole === "multi_translation_collection_witness") {
    return "本记录是一部由多个时代、多个译者材料汇成的合集见证；平台保留每个组件与独立流通译本的关系，不把整部合集归给单一译者。";
  }
  if (file.sourceRole === "abridged_recension_witness") {
    return "本记录是同作品完整传本的后出节本见证；平台完整保存其来源文本，但不把它重复计作独立完整译本。";
  }
  return undefined;
};

export const sutras: Sutra[] = catalog.files.map((file) => {
  const generated: Sutra = {
    slug: file.slug,
    title: file.presentation.title,
    alternateTitle: file.presentation.alternateTitle,
    tradition: file.presentation.tradition,
    language: file.presentation.language,
    canonRef: file.presentation.canonRef,
    translator: file.presentation.translator,
    summary: file.presentation.summary,
    sourceName: "CBETA Online",
    sourceUrl: file.presentation.sourceUrl,
    sourceLicense: "CBETA 授權條款；古典原文",
    bibliographicNote: cbetaRelations(file).length
      ? cbetaRelations(file).map((relation) => `${relation.label}：${relation.evidence}`).join(" ")
      : undefined,
    attributionNote: cbetaAttributionNote(file),
    status: file.completeness === "complete_source_file_partial_work_witness"
      ? file.sourceRole === "partial_text_family_witness_candidate"
        ? "残篇候选 · 完整来源记录"
        : file.sourceRole === "partial_continuation_witness"
          ? "后分见证 · 完整来源记录"
          : file.sourceRole === "abridged_recension_witness"
            ? "节本见证 · 完整来源记录"
          : "节译见证 · 完整来源记录"
      : "完整原文 · 行段试行",
    segments: [],
  };
  const curated = curatedBySlug.get(file.slug);
  return curated ? {
    ...generated,
    ...curated,
    bibliographicNote: generated.bibliographicNote ?? curated.bibliographicNote,
    attributionNote: generated.attributionNote ?? curated.attributionNote,
    status: generated.status,
  } : generated;
}).concat(suttacentralManifest.files.map((file) => ({
  slug: file.slug,
  title: file.presentation.title,
  alternateTitle: file.presentation.alternateTitle,
  tradition: file.presentation.tradition,
  language: file.presentation.language,
  canonRef: file.presentation.canonRef,
  translator: file.presentation.translator,
  summary: file.presentation.summary,
  sourceName: "SuttaCentral",
  sourceUrl: file.presentation.sourceUrl,
  sourceLicense: "巴利原文属公有领域；请求保留 SuttaCentral 来源署名",
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-chapter" as const,
  segments: [],
}))).concat(dighaNikayaManifest.files.map((file) => ({
  slug: file.slug,
  title: file.presentation.title,
  alternateTitle: file.presentation.alternateTitle,
  tradition: file.presentation.tradition,
  language: file.presentation.language,
  canonRef: file.presentation.canonRef,
  translator: file.presentation.translator,
  summary: file.presentation.summary,
  sourceName: "SuttaCentral",
  sourceUrl: file.presentation.sourceUrl,
  sourceLicense: "巴利原文属公有领域；请求保留 SuttaCentral 来源署名",
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
}))).concat(majjhimaNikayaManifest.files.map((file) => ({
  slug: file.slug,
  title: file.presentation.title,
  alternateTitle: file.presentation.alternateTitle,
  tradition: file.presentation.tradition,
  language: file.presentation.language,
  canonRef: file.presentation.canonRef,
  translator: file.presentation.translator,
  summary: file.presentation.summary,
  sourceName: "SuttaCentral",
  sourceUrl: file.presentation.sourceUrl,
  sourceLicense: "巴利原文属公有领域；请求保留 SuttaCentral 来源署名",
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
}))).concat(samyuttaNikayaManifest.files.map((file) => ({
  slug: file.slug,
  title: file.presentation.title,
  alternateTitle: file.presentation.alternateTitle,
  tradition: file.presentation.tradition,
  language: file.presentation.language,
  canonRef: file.presentation.canonRef,
  translator: file.presentation.translator,
  summary: file.presentation.summary,
  sourceName: "SuttaCentral",
  sourceUrl: file.presentation.sourceUrl,
  sourceLicense: "巴利原文属公有领域；请求保留 SuttaCentral 来源署名",
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
}))).concat(anguttaraNikayaManifest.files.map((file) => ({
  slug: file.slug,
  title: file.presentation.title,
  alternateTitle: file.presentation.alternateTitle,
  tradition: file.presentation.tradition,
  language: file.presentation.language,
  canonRef: file.presentation.canonRef,
  translator: file.presentation.translator,
  summary: file.presentation.summary,
  sourceName: "SuttaCentral",
  sourceUrl: file.presentation.sourceUrl,
  sourceLicense: "巴利原文属公有领域；请求保留 SuttaCentral 来源署名",
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
}))).concat(khuddakaNikayaManifest.files.map((file) => ({
  slug: file.slug,
  title: file.presentation.title,
  alternateTitle: file.presentation.alternateTitle,
  tradition: file.presentation.tradition,
  language: file.presentation.language,
  canonRef: file.presentation.canonRef,
  translator: file.presentation.translator,
  summary: file.presentation.summary,
  sourceName: "SuttaCentral",
  sourceUrl: file.presentation.sourceUrl,
  sourceLicense: "巴利原文属公有领域；请求保留 SuttaCentral 来源署名",
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
})));

export function getSutra(slug: string) {
  return sutras.find((sutra) => sutra.slug === slug);
}

export const corpusPrinciples = [
  "每一段都有稳定标识，旧链接必须长期可解析。",
  "每一份文本都保留来源、版本、许可与校订记录。",
  "机器候选、人工确认与目录确认永不混为一谈。",
  "简繁转换只属于显示层，不修改母版文本。",
];
