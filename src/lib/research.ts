import { sutras } from "@/data/sutras";

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
};

function evidenceFor(slug: string, segmentIndex: number, relation: "直接" | "相关" = "直接") {
  const sutra = sutras.find((item) => item.slug === slug);
  if (!sutra) return null;
  const segment = sutra.segments[segmentIndex];
  if (!segment) return null;
  return {
    label: sutra.alternateTitle,
    quote: segment.text,
    href: `/jingzang/${sutra.slug}#${segment.id}`,
    source: sutra.sourceName,
    locator: segment.id,
    relation,
  } satisfies Evidence;
}

export function buildResearchResult(rawQuery: string): ResearchResult {
  const query = rawQuery.trim();
  const has = (...words: string[]) => words.some((word) => query.includes(word));

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
