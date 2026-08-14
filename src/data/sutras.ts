import catalog from "../../data/corpus/cbeta/catalog-v3.3.0.json";
import suttacentralManifest from "../../data/corpus/suttacentral/manifest-v0.7.0.json";
import dighaNikayaManifest from "../../data/corpus/suttacentral/dn-manifest-v0.8.0.json";
import majjhimaNikayaManifest from "../../data/corpus/suttacentral/mn-manifest-v0.9.0.json";
import samyuttaNikayaManifest from "../../data/corpus/suttacentral/sn-manifest-v1.0.0.json";
import anguttaraNikayaManifest from "../../data/corpus/suttacentral/an-manifest-v1.1.0.json";
import khuddakaNikayaManifest from "../../data/corpus/suttacentral/kn-manifest-v1.2.0.json";
import indicRootManifest from "../../data/corpus/suttacentral/indic-manifest-v1.3.0.json";
import vinayaRootManifest from "../../data/corpus/suttacentral/vinaya-manifest-v1.4.0.json";
import abhidhammaRootManifest from "../../data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json";

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
  status: "完整原文 · 行段试行" | "节译见证 · 完整来源记录" | "局部见证 · 完整来源记录" | "后分见证 · 完整来源记录" | "节本见证 · 完整来源记录" | "短本见证 · 完整来源记录" | "残篇候选 · 完整来源记录" | "合部见证 · 完整原文" | "完整原文 · 原生段落" | "目录样本";
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
    return "平台保留传统目录题记；现代研究提出东亚本土成书可能，平台公开争议，不将其径直当作印度译经或佛陀亲说。";
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
  if (file.sourceRole === "abridged_translation_witness") {
    return "本记录完整保存同作品的古代短本见证；文本范围短于完整传本，不把它重复计作独立完整译本。";
  }
  if (file.sourceRole === "compiled_canonical_witness") {
    return "来源题记与权威目录明确本记录为合部编纂见证；平台保留全文和编纂责任，不将其冒充单一古代译本。";
  }
  if (file.sourceRole === "translated_esoteric_canonical_record") {
    return "来源目录将本记录署为翻译；平台保留密教部目录位置与译者题记，但不据题名或部类自动声称为佛陀逐字亲说。";
  }
  if (file.sourceRole === "attributed_authored_compiled_or_taught_esoteric_text") {
    return "来源题记明确为撰、述、集、造或说的密教文本；平台保留编撰或传授责任，不改写成佛陀亲说。";
  }
  if (file.sourceRole === "attributed_authored_compiled_or_transmitted_esoteric_text") {
    return "来源题记或题名明确为撰、述、集、记、注、校、请来或口受，以及造、将来或译解的密教文本；平台保留编撰、论造、校注、记录、传承或解释责任，不改写成佛陀亲说。";
  }
  if (file.sourceRole === "traditional_attributed_translation_with_contested_history") {
    return "来源保留传统译者题记，但现代研究对成书与翻译史存在争议；平台只确认本次文本见证，不把传统署名当作已裁决事实。";
  }
  if (file.sourceRole === "unattributed_esoteric_text_or_ritual") {
    return "来源题记未载作者或译者；平台保留匿名文本或仪轨边界，不补造译者、印度来源或佛陀亲说归属。";
  }
  if (file.sourceRole === "translated_vinaya_canonical_record") {
    return "来源目录将本记录署为翻译的律部文本；平台保留广律、戒本或羯磨的文本类型与译者题记，但不据律部位置、部派归属或正文重合自动声称为同一作品或佛陀逐字亲说。";
  }
  if (file.sourceRole === "translated_and_compiled_vinaya_text") {
    return "来源同时保存古代译者题记与后世编集责任；平台并列呈现译、集两层责任，不把编集本简化为单一译经，也不据相似正文自动归并作品。";
  }
  if (file.sourceRole === "compiled_or_recorded_vinaya_text") {
    return "来源题记明确为后世所集或所录的律部文本；平台保留编集、辑录责任与完整来源，不将其改写成独立古译或佛陀逐字亲说。";
  }
  if (file.sourceRole === "compiled_or_extracted_vinaya_text") {
    return "来源题记明确为集出或依律撰出；平台保留摘集、编撰与部派传承责任，不将其改写成独立古译或佛陀逐字亲说。";
  }
  if (file.sourceRole === "unattributed_vinaya_procedure_text") {
    return "来源题记未载作者或译者；平台保存羯磨程序文本，但不补造译者、编者、印度来源或佛陀逐字亲说归属。";
  }
  if (file.sourceRole === "lost_translation_with_appended_vinaya_preface") {
    return "目录保留正文失译状态，卷内另附后世所撰续序；平台并列呈现未知译者与序作者，不把序文责任扩张到整部正文。";
  }
  if (file.sourceRole === "traditional_attributed_vinaya_translation_with_contested_history") {
    return "来源保留律部传统译者题记，同时公开现代研究对译者归属、中国撰述层或形成年代的争议；平台不把传统署名当作已经裁决的现代事实。";
  }
  if (file.sourceRole === "authored_or_taught_vinaya_text_with_translation") {
    return "来源并列保存造、说与汉译责任；平台保留论师、菩萨说与译者层次，不将其改写成佛陀逐字亲说。";
  }
  if (file.sourceRole === "lost_translation_vinaya_text") {
    return "来源目录题记为失译；平台保留译者未知的律部文本，不补造译者、印度原本或佛陀逐字亲说归属。";
  }
  if (file.sourceRole === "lost_translation_with_contested_native_compilation_history") {
    return "来源目录标为失译，研究又提示现存形态可能包含讲律记录与中国编纂层；平台同时保存两层不确定性。";
  }
  if (file.sourceRole === "unattributed_vinaya_text") {
    return "来源题记未载作者或译者；即使同作品另一版本有传统署名，平台也不把该署名自动转移到本见证。";
  }
  if (file.sourceRole === "authored_exegetical_treatise_with_translation") {
    return "来源并列保存论师造、颂、释或本论责任与汉译责任；平台将论书、根本文本、复注和译本分层，不把论师撰述改写成佛陀逐字亲说。";
  }
  if (file.sourceRole === "translated_exegetical_treatise_without_named_author") {
    return "来源保存汉译者题记，但未载论书作者；平台保留作者未知状态，不因译者、题材或目录邻接补造作者及佛陀亲说归属。";
  }
  if (file.sourceRole === "lost_translation_exegetical_treatise") {
    return "来源目录题记为失译的论释文本；平台保留译者未知状态，不补造作者、译者或佛陀逐字亲说归属。";
  }
  if (file.sourceRole === "traditional_attributed_exegetical_treatise_with_contested_authorship") {
    return "来源保留传统作者题记，同时公开现代研究对作者、译者参与程度或成书层次的争议；平台不把传统署名当作已经裁决的现代事实。";
  }
  if (file.sourceRole === "traditional_attributed_exegetical_treatise_with_contested_origin") {
    if (file.id === "T1529") {
      return "来源保留世亲造、真谛译的传统题记，同时公开现代书目研究认为现存《遗教经论》很可能是汉地撰述；平台并列呈现，不把传统署名当作已经裁决的现代事实。";
    }
    return "来源保留传统作者与解释者题记，同时公开真伪或成书来源争议；平台只确认本次文本见证，不把传统署名当作已经裁决的现代事实。";
  }
  if (file.sourceRole === "anonymous_dunhuang_exegetical_epitome") {
    return "来源题记没有作者或译者；正文提及世亲本释不足以证明本篇由世亲撰写，平台保留敦煌无署名释题身份。";
  }
  if (file.sourceRole === "traditional_taught_abhidharma_with_translation") {
    return "来源保存舍利子说、玄奘译的传统题记；平台把传统说者、现代作者概念与汉译责任分层，不改写成佛陀逐字亲说。";
  }
  if (file.sourceRole === "traditional_attributed_abhidharma_with_contested_authorship") {
    return "汉译题记归于大目乾连，梵藏传统另有舍利子归属；平台公开冲突作者传统，不替学术研究擅自裁决。";
  }
  if (file.sourceRole === "translated_abhidharma_without_named_author") {
    return "来源只保存法护等译而未载作者；平台不从“六足一身”历史分类、题名或相邻目录补造作者。";
  }
  if (file.sourceRole === "authored_abhidharma_with_translation") {
    return "来源分开保存论师与汉译者责任；作品、译本、可能的异传层与后期“六足一身”分类分别记录，不把论书改写成佛陀逐字亲说。";
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
            : file.sourceRole === "abridged_translation_witness"
              ? "短本见证 · 完整来源记录"
          : file.sourceRole === "partial_translation_witness"
            ? "节译见证 · 完整来源记录"
            : "局部见证 · 完整来源记录"
      : file.sourceRole === "compiled_canonical_witness"
        ? "合部见证 · 完整原文"
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
}))).concat(indicRootManifest.files.map((file) => ({
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
  sourceLicense: "原语佛典依 SuttaCentral 官方政策属公有领域；保留来源署名；不用于模型训练",
  bibliographicNote: file.relationDecision,
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
}))).concat(vinayaRootManifest.files.map((file) => ({
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
  sourceLicense: "巴利原文依 SuttaCentral 官方政策属公有领域；保留来源署名；不用于模型训练",
  bibliographicNote: file.relationDecision,
  status: "完整原文 · 原生段落" as const,
  readerMode: "bilara-sutta" as const,
  segments: [],
}))).concat(abhidhammaRootManifest.files.map((file) => ({
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
  sourceLicense: "巴利原文依 SuttaCentral 官方政策属公有领域；保留来源署名；不用于模型训练",
  bibliographicNote: file.relationDecision,
  attributionNote: "本页保存上座部论藏文本；论藏属于佛教经典，不据此标作佛陀逐字亲说。",
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
