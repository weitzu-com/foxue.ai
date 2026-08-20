import { sutras } from "@/data/sutras";
import {
  emptinessConcept,
  impermanenceConcept,
  nonAbidingConcept,
  nonSelfConcept,
  observingMindConcept,
  type ConceptEntry,
} from "@/lib/concepts";
import { segmentHref } from "@/lib/reader-routes";

export type Evidence = {
  label: string;
  quote: string;
  href: string;
  source: string;
  locator: string;
  relation: "直接" | "相关";
};

export type ResearchResult = {
  query: string;
  status:
    | "有充分来源"
    | "仅找到间接资料"
    | "未找到可靠来源"
    | "来源存在分歧";
  title: string;
  answer: string[];
  caution: string;
  evidence: Evidence[];
  concept?: ConceptEntry;
};

function evidenceFor(slug: string, segmentIndex: number, relation: "直接" | "相关" = "直接") {
  const sutra = sutras.find((item) => item.slug === slug);
  if (!sutra) return null;
  const segment = sutra.segments[segmentIndex];
  if (!segment) return null;
  return {
    label: sutra.alternateTitle,
    quote: segment.text,
    href: segmentHref(sutra.slug, segment.id),
    source: sutra.sourceName,
    locator: segment.id,
    relation,
  } satisfies Evidence;
}

function inlineEvidence(evidence: Evidence) {
  return evidence;
}

export function buildResearchResult(rawQuery: string): ResearchResult {
  const query = rawQuery.trim();
  const has = (...words: string[]) => words.some((word) => query.includes(word));

  if (has("无我", "無我", "我所", "无我义", "無我義", "补特伽罗", "補特伽羅", "身无我", "身無我")) {
    return {
      query,
      status: "有充分来源",
      title: "无我不是否认经验，而是不把身心执为固定主宰",
      answer: [
        "《佛说五蘊皆空经》先把问题落在五蕴：色、受、想、行、识并不听命于“我欲如是”，因此不应被执成可以随意支配的“我”。",
        "《外道问圣大乘法无我义经》进一步把身体部件与内外观察逐层拆开：遍看身心结构，也找不到一个能被固定指认的主宰者。无我要拆的是执取方式，不是把经验整段删掉。",
        "实践上，更稳妥的读法是：看见感受、身份、成败和关系如何被抓成“我”或“我所有”，再把这种抓取松开，而不是借“无我”逃避责任。",
      ],
      caution:
        "这里仅依据《佛说五蘊皆空经》《外道问圣大乘法无我义经》与一条相关巴利段落说明最低限度边界，不替所有传统裁决“无我”的最终定义。",
      concept: nonSelfConcept,
      evidence: [
        inlineEvidence({
          label: "《佛说五蘊皆空经》T0102",
          quote: "汝等當知，色不是我，若是我者，色不應病及受苦惱。……是故當知，色不是我；受想行識，亦復如是。",
          href: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c10",
          source: "CBETA T02n0102",
          locator: "T0102.001.0499c10",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《佛说五蘊皆空经》T0102",
          quote: "凡所有色，若過去未來現在，內外麁細，若勝若劣、若遠若近，悉皆無我。……觀此五取蘊，知無有我及以我所。",
          href: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c18",
          source: "CBETA T02n0102",
          locator: "T0102.001.0499c18",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《外道问圣大乘法无我义经》T0846",
          quote: "當觀全身，髮、甲、皮、毛、兩手、雙足，至於脂、筋、脾、腸、骨髓等事，周遍內外，不見本性。",
          href: "/jingzang/taisho-t0846/001-0934b#T0846.001.0934b01",
          source: "CBETA T17n0846",
          locator: "T0846.001.0934b01",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 35.85",
          quote: "Yasmā ca kho, ānanda, suññaṁ attena vā attaniyena vā tasmā suñño lokoti vuccati.",
          href: "/jingzang/samyutta-nikaya-sn35/068-sn35-85-0001-0013#sn35.85:1.4",
          source: "SuttaCentral SN 35.85",
          locator: "sn35.85:1.4",
          relation: "相关",
        }),
      ],
    };
  }

  if (has("无常", "無常", "老病死", "生者皆归死", "生者皆歸死", "一切有为法", "一切有爲法")) {
    return {
      query,
      status: "有充分来源",
      title: "无常不是悲观口号，而是如实看见生灭与衰变",
      answer: [
        "《佛说无常经》把无常直接放在衰变、病苦和死亡上：生者归死，容颜变衰，没有一件条件事物能完全逃过败坏。",
        "但经文没有让人停在悲观里。它紧接着劝人“諦聽真實法”“當行不死門”，说明看见无常的目的，是松开执取、改走离苦之路，而不是把自己压垮。",
        "《佛说五蘊皆空经》又把无常带回五蕴：身体、感受、想法和识别活动都不常住。这样理解，无常就不只是谈死亡，也是在修正你当下的抓取方式。",
      ],
      caution:
        "这里主要依据《佛说无常经》与《佛说五蘊皆空经》说明最低限度边界；《佛说无常经》后段的临终劝导与仪轨，不应自动推广成所有传统的共同做法。",
      concept: impermanenceConcept,
      evidence: [
        inlineEvidence({
          label: "《佛说无常经》T0801",
          quote: "生者皆歸死，容顏盡變衰；強力病所侵，無能免斯者。……未曾有一事，不被無常吞。",
          href: "/jingzang/taisho-t0801/001-0745b#T0801.001.0745b24",
          source: "CBETA T17n0801",
          locator: "T0801.001.0745b24",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《佛说无常经》T0801",
          quote: "是故勸諸人，諦聽真實法，共捨無常處，當行不死門。佛法如甘露，除熱得清涼，一心應善聽，能滅諸煩惱。",
          href: "/jingzang/taisho-t0801/001-0745c#T0801.001.0745c11",
          source: "CBETA T17n0801",
          locator: "T0801.001.0745c11",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《佛说五蘊皆空经》T0102",
          quote: "復次苾芻！於汝意云何？色為是常？為是無常？」白言：「大德！色是無常。」",
          href: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c14",
          source: "CBETA T02n0102",
          locator: "T0102.001.0499c14",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《金刚般若波罗蜜经》T0235",
          quote: "一切有爲法，如夢幻泡影，如露亦如電，應作如是觀。",
          href: "/jingzang/jingangjing/001-0752c#T0235.001.0752c17",
          source: "CBETA T08n0235",
          locator: "T0235.001.0752c17",
          relation: "相关",
        }),
      ],
    };
  }

  if (has("空", "五蕴", "心经", "执着", "执著")) {
    return {
      query,
      status: "有充分来源",
      title: "“空”不是虚无，而是不把因缘所生误认为固定自性",
      answer: [
        "《心经》先从五蕴切入：身体、感受、表象、意志活动与识别活动都应被如实观察，而不是被当作永恒不变的“我”。",
        "“色即是空”并不要求否定生活，而是提醒我们：一切经验都依赖条件而显现。看见这种依存性，执取便有松动的可能。",
        "实践上，可以从当下最强烈的一种感受开始，观察它如何出现、变化和消退；这比把“空”当成抽象口号更接近经文的方向。",
      ],
      caution:
        "不同佛教传统对空义的论证层次和术语解释并不完全相同。这里仅依据当前已登记的汉译般若经典给出入门说明。",
      concept: emptinessConcept,
      evidence: [
        evidenceFor("xinjing", 0),
        evidenceFor("xinjing", 1),
        evidenceFor("jingangjing", 0, "相关"),
      ].filter((item): item is Evidence => item !== null),
    };
  }

  if (has("烦恼", "情绪", "痛苦", "焦虑", "心")) {
    return {
      query,
      status: "来源存在分歧",
      title: "先看清心如何带动语言与行动，再谈离苦",
      answer: [
        "汉译《法句经》把心放在行为链条的开端：念头会影响语言和行动，反复的语言与行动又形成可经验的苦乐后果。",
        "这不等于“所有痛苦都只是想出来的”。疾病、暴力、贫困和创伤都有真实条件，佛法的修心不能替代医疗、法律或社会支持。",
        "较稳妥的起点是：暂停自动反应，辨认此刻的身体感受、念头和行动冲动，再选择一个减少伤害的下一步。",
      ],
      caution:
        "此回答不是医疗或心理危机建议。若你正处于危险或强烈痛苦中，请优先联系当地紧急服务和可信赖的专业人员。",
      concept: observingMindConcept,
      evidence: [
        evidenceFor("fajujing", 0),
        evidenceFor("fajujing", 1),
        evidenceFor("xinjing", 0, "相关"),
      ].filter((item): item is Evidence => item !== null),
    };
  }

  if (has("无住", "金刚经", "如梦", "有为法", "发心")) {
    return {
      query,
      status: "有充分来源",
      title: "无住不是消极不做，而是不以占有心行动",
      answer: [
        "《金刚经》的“应无所住而生其心”把两个方向放在同一句中：不住著，同时仍然生起利益众生之心。",
        "因此，无住不是逃离责任，也不是压抑感情；它质疑的是把行动成果、身份和功德牢牢归为“我所有”的倾向。",
        "经末以梦、幻、泡、影等譬喻提醒我们看见有为法的短暂与条件性。理解无常，是更清醒地行动，而不是拒绝行动。",
      ],
      caution:
        "本说明聚焦鸠摩罗什译本的可见段落；其他汉译本及梵文本的措辞差异尚未在首版中展开。",
      concept: nonAbidingConcept,
      evidence: [
        evidenceFor("jingangjing", 1),
        evidenceFor("jingangjing", 3),
        evidenceFor("jingangjing", 0, "相关"),
      ].filter((item): item is Evidence => item !== null),
    };
  }

  return {
    query,
    status: query ? "未找到可靠来源" : "仅找到间接资料",
    title: query ? "当前经藏样本尚不足以可靠回答这个问题" : "从一个真实问题开始",
    answer: query
      ? [
          "可信系统的第一责任不是填满空白，而是知道何时停下。当前公开原型只登记了少量校验样本，不能据此生成看似完整的佛学结论。",
          "你可以换用更具体的经名、术语或句子检索，也可以先进入经藏阅读已登记文本。随着来源和评测通过，回答范围会逐步扩大。",
        ]
      : [
          "试着问：“佛教里的空是什么意思？”、“无住是不是消极？”或“烦恼来时如何观察自己的心？”",
          "首版只在已登记文本范围内回答，并把每一项证据放在结论旁边。",
        ],
    caution:
      "未找到来源不代表佛典中不存在相关教导，只代表当前索引无法支持可靠结论。",
    evidence: query
      ? []
      : [evidenceFor("xinjing", 0, "相关")].filter(
          (item): item is Evidence => item !== null,
        ),
  };
}
