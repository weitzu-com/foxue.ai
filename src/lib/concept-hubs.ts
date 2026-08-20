export type ConceptSlug = "kong" | "wuzhu" | "guanxin";

export type ConceptEntry = {
  slug: ConceptSlug;
  title: string;
  href: `/gainian/${ConceptSlug}`;
  summary: string;
  aliases: string[];
  prompt: string;
};

type ConceptStat = {
  label: string;
  value: string;
};

type ConceptLensNote = {
  label: string;
  text: string;
};

type ConceptHero = {
  eyebrow: string;
  highlight: string;
  beforeBreak: string;
  afterBreak: string;
  lead: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  lensNotes: [ConceptLensNote, ConceptLensNote, ConceptLensNote];
};

type ConceptTerm = {
  label: string;
  heading: string;
  detail: string;
};

type ConceptTradition = {
  label: string;
  term: string;
  supported: string;
  boundary: string;
  sources: string;
};

type ConceptEvidence = {
  kind: "直接证据" | "相关证据";
  canon: string;
  title: string;
  quote: string;
  reading: string;
  locator: string;
  href: string;
  sourceUrl: string;
  language?: string;
};

type ConceptMisreading = {
  myth: string;
  correction: string;
};

type ConceptReadingStep = {
  step: string;
  title: string;
  text: string;
  href: string;
};

export type ConceptHub = {
  entry: ConceptEntry;
  metadataTitle: string;
  description: string;
  about: string[];
  termCode: string;
  heading: string;
  sectionTitle: string;
  sectionDescription: string;
  hero: ConceptHero;
  stats: [ConceptStat, ConceptStat, ConceptStat, ConceptStat];
  termsHeading: string;
  termsIntro: string;
  terms: [ConceptTerm, ConceptTerm, ConceptTerm, ConceptTerm];
  boundariesHeading: string;
  boundariesIntro: string;
  traditions: [ConceptTradition, ConceptTradition, ConceptTradition];
  evidence: readonly ConceptEvidence[];
  translationNote?: string;
  misreadingsHeading: string;
  misreadingsIntro: string;
  misconceptions: readonly ConceptMisreading[];
  readingHeading: string;
  readingIntro: string;
  readingPath: readonly ConceptReadingStep[];
  footerNote: string;
  updatedAt: string;
  footerActionLabel: string;
  footerActionHref: string;
  related: ConceptSlug[];
};

const conceptHubs: readonly ConceptHub[] = [
  {
    entry: {
      slug: "kong",
      title: "空",
      href: "/gainian/kong",
      summary: "区分巴利经藏与汉译般若的术语语境，并从每项判断回到稳定原典。",
      aliases: ["空", "空性", "空相", "五蕴皆空", "五蘊皆空", "śūnya", "śūnyatā", "sunyata", "suñña", "suññatā", "sunnata"],
      prompt: "佛教里的“空”是什么意思？",
    },
    metadataTitle: "空｜概念 Hub",
    description: "从受控巴利经藏与汉译般若证据理解“空”的术语范围、传统边界、常见误解，并回到稳定原典段落。",
    about: ["空", "佛教概念", "巴利经藏", "汉译般若"],
    termCode: "kong",
    heading: "空",
    sectionTitle: "概念",
    sectionDescription: "语词进入佛学系统后，必须先回到具体文本语境，不能直接拿现代印象替代证据。",
    hero: {
      eyebrow: "概念 HUB · 受控证据版",
      highlight: "空",
      beforeBreak: "，不是一个",
      afterBreak: "脱离语境的答案。",
      lead:
        "在现有原典中，“空”可以指空于我与我所、辨认某处所无与所余，也可以在般若经典中说明五蕴与诸法。先分清经藏语境，才不会把它误读成虚无。",
      primaryActionLabel: "查看原典证据",
      primaryActionHref: "#evidence",
      secondaryActionLabel: "继续问经",
      secondaryActionHref: "/wenjing",
      lensNotes: [
        { label: "巴利经藏", text: "空于我与我所" },
        { label: "汉译般若", text: "五蕴与诸法空相" },
        { label: "共同底线", text: "不等于断灭虚无" },
      ],
    },
    stats: [
      { label: "可定位证据", value: "4 处" },
      { label: "直接语境", value: "2 组" },
      { label: "统一教义裁决", value: "0 个" },
      { label: "证据状态", value: "受控原文" },
    ],
    termsHeading: "先问：在什么语言、哪一层文本里？",
    termsIntro: "词形能帮助定位语境，但相近译名并不自动证明各传统的论证完全相同。",
    terms: [
      {
        label: "巴利语",
        heading: "suñña",
        detail: "常表达“空的”或“空于某物”。SN 35.85 明确把范围落在“我”与“我所”。",
      },
      {
        label: "巴利语",
        heading: "suññatā",
        detail: "可指空性或空的住处／修习。MN 121 展开一条逐层辨认的实践路径。",
      },
      {
        label: "梵语对照",
        heading: "śūnya · śūnyatā",
        detail: "这里只作术语导航；当前证据集没有用受控梵文段落支持独立结论。",
      },
      {
        label: "汉译佛典",
        heading: "空 · 空相 · 空性",
        detail: "本页的汉译直接证据来自《心经》；“空性”作为现代总称使用时，仍须回看具体文本措辞。",
      },
    ],
    boundariesHeading: "同一个汉字，不抹平三种文本层次。",
    boundariesIntro: "以下边界只说明当前证据能支持到哪里，并不替任何传统作最终定义。",
    traditions: [
      {
        label: "巴利尼柯耶语境",
        term: "suñña · suññatā",
        supported: "现有证据可直接支持“空于我与我所”，以及按“其中没有什么／仍有什么”如实辨认的修习语境。",
        boundary: "不据此代替上座部后世论书的完整空观体系，也不把经藏用法缩成单一哲学定义。",
        sources: "SN 35.85 · MN 121",
      },
      {
        label: "汉译般若语境",
        term: "空 · 空相",
        supported: "现有证据可直接支持五蕴皆空、色空不二与诸法空相；其语境把般若观照与离苦相连。",
        boundary: "《金刚经》的“无住”在本页只作相关证据；不能把所有“非相”“无住”都机械替换成同一空义。",
        sources: "T0251 · T0235（相关）",
      },
      {
        label: "后续论释与宗派",
        term: "中观 · 唯识 · 禅等",
        supported: "这些传统对空义形成了不同论证、术语与修行表达，值得分别建立证据页。",
        boundary: "当前问经证据没有纳入对应论典与注疏，本页不裁决它们的异同，也不选定唯一宗派解释。",
        sources: "待受控论典与注疏证据",
      },
    ],
    evidence: [
      {
        kind: "直接证据",
        canon: "巴利《相应部》SN 35.85",
        title: "空于“我”或“我所”",
        quote: "Yasmā ca kho, ānanda, suññaṁ attena vā attaniyena vā tasmā suñño lokoti vuccati.",
        reading: "工作释义：因为世间空于我或我所，所以说世间是空。",
        locator: "sn35.85:1.4",
        href: "/jingzang/samyutta-nikaya-sn35/068-sn35-85-0001-0013#sn35.85:1.4",
        sourceUrl: "https://suttacentral.net/sn35.85/pli/ms",
        language: "pi",
      },
      {
        kind: "直接证据",
        canon: "巴利《中部》MN 121",
        title: "空无其物，也如实知其所余",
        quote: "Iti yañhi kho tattha na hoti tena taṁ suññaṁ samanupassati, yaṁ pana tattha avasiṭṭhaṁ hoti taṁ ‘santamidaṁ atthī’ti pajānāti.",
        reading: "工作释义：其中没有什么，就在那个意义上观其为空；仍有余者，则如实知其为有。",
        locator: "mn121:4.10",
        href: "/jingzang/majjhima-nikaya-mn121/001-mn121-0001-0102#mn121:4.10",
        sourceUrl: "https://suttacentral.net/mn121/pli/ms",
        language: "pi",
      },
      {
        kind: "直接证据",
        canon: "《般若波罗蜜多心经》T0251",
        title: "从五蕴进入诸法空相",
        quote: "舍利子！色不异空，空不异色；色即是空，空即是色。",
        reading: "本站受控汉译样本；“受、想、行、识，亦复如是”紧随其后。",
        locator: "T0251.001.0848c07",
        href: "/jingzang/xinjing/001-0848c#T0251.001.0848c07",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0251_001",
        language: "zh-Hans",
      },
      {
        kind: "相关证据",
        canon: "《金刚般若波罗蜜经》T0235",
        title: "不住著，不等于不行动",
        quote: "应无所住而生其心。",
        reading: "这段不直接定义“空”，但为“空等于消极不做”的误解提供边界证据。",
        locator: "T0235.001.0749c22",
        href: "/jingzang/jingangjing/001-0749c#T0235.001.0749c22",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
        language: "zh-Hans",
      },
    ],
    translationNote: "巴利文下方中文为本站工作释义，用来说明取证范围，不冒充受控古译或现代授权译本。",
    misreadingsHeading: "先去掉四个太快的等号。",
    misreadingsIntro: "这些不是新的教义断言，而是用上方证据为理解划出最低限度的护栏。",
    misconceptions: [
      {
        myth: "空 = 什么都不存在",
        correction: "不成立。MN 121 明说：对所无者观空，对所余者如实知其为有；“空”不是把经验、因果与责任一笔抹去。",
      },
      {
        myth: "懂空就应该没有感受",
        correction: "不成立。《心经》从色、受、想、行、识切入，不是删除五蕴，而是改变对五蕴的固着方式。",
      },
      {
        myth: "空会导向消极不做",
        correction: "证据不支持。《金刚经》把“无所住”与“生其心”放在同一句中：不住著与发心行动并不冲突。",
      },
      {
        myth: "所有佛教传统说的是同一套空",
        correction: "过度合并。经藏语境、论证对象与修习方法不同；可以比较，但必须保留来源、年代、语言与文本层次。",
      },
    ],
    readingHeading: "从定义到修习，再进入般若。",
    readingIntro: "这是一条有顺序的阅读路径：每一步都用下一部经纠正上一步可能出现的单向理解。",
    readingPath: [
      {
        step: "先定边界",
        title: "SN 35.85《空世间经》",
        text: "先读“空于我或我所”的直接定义，避免一开始就把空理解成宇宙虚无。",
        href: "/jingzang/samyutta-nikaya-sn35/068-sn35-85-0001-0013#sn35.85:1.4",
      },
      {
        step: "再看方法",
        title: "MN 121《小空经》",
        text: "观察经文怎样逐层辨认“所无”与“所余”，理解空也可以是一种严格的注意方法。",
        href: "/jingzang/majjhima-nikaya-mn121/001-mn121-0001-0102#mn121:4.10",
      },
      {
        step: "进入般若",
        title: "《般若波罗蜜多心经》",
        text: "从“照见五蕴皆空”读到“诸法空相”，同时留意观照、般若与度苦的上下文。",
        href: "/jingzang/xinjing/001-0848c#T0251.001.0848c06",
      },
      {
        step: "核对行动",
        title: "《金刚般若波罗蜜经》",
        text: "用“应无所住而生其心”检查：不住著是否被误读成退场、冷漠或拒绝承担。",
        href: "/jingzang/jingangjing/001-0749c#T0235.001.0749c22",
      },
    ],
    footerNote: "本页只综合 foxue.ai 当前受控的巴利经藏与汉译般若原文。它不代替师承、论典、注疏与学术研究，也不把一种传统包装成全佛教的唯一答案。",
    updatedAt: "2026-08-20",
    footerActionLabel: "带着语境继续问",
    footerActionHref: "/wenjing",
    related: ["wuzhu", "guanxin"],
  },
  {
    entry: {
      slug: "wuzhu",
      title: "无住",
      href: "/gainian/wuzhu",
      summary: "从《金刚经》现有受控样本理解“无住”为什么不是退场，而是不以占有心行动。",
      aliases: ["无住", "应无所住", "无所住", "住著", "住著于相", "金刚经 无住"],
      prompt: "无住是不是消极？",
    },
    metadataTitle: "无住｜概念 Hub",
    description: "从《金刚经》等现有汉译般若证据理解“无住”的行动边界、常见误读与原文出处。",
    about: ["无住", "金刚经", "般若", "发心行动"],
    termCode: "wuzhu",
    heading: "无住",
    sectionTitle: "概念",
    sectionDescription: "这个页面不把“无住”抽空成口号，而是先回到经文中它和发心、行动、诸相的关系。",
    hero: {
      eyebrow: "概念 HUB · 行动边界版",
      highlight: "无住",
      beforeBreak: "，不是退场，",
      afterBreak: "而是不以占有心行动。",
      lead:
        "现有证据里，“无住”不是把责任、关系或行动一起取消，而是要求行动时不把身份、成果和功德固着为“我所有”。它是行动方式的校正，不是逃离行动的许可。",
      primaryActionLabel: "查看原典证据",
      primaryActionHref: "#evidence",
      secondaryActionLabel: "继续问经",
      secondaryActionHref: "/wenjing",
      lensNotes: [
        { label: "直接句子", text: "应无所住而生其心" },
        { label: "相关边界", text: "诸相非相，不等于否定世界" },
        { label: "最低底线", text: "不等于冷漠退场" },
      ],
    },
    stats: [
      { label: "可定位证据", value: "4 处" },
      { label: "直接语境", value: "1 组" },
      { label: "统一宗派裁决", value: "0 个" },
      { label: "证据状态", value: "受控汉译" },
    ],
    termsHeading: "先问：无住，究竟去掉的是什么？",
    termsIntro: "当前受控样本主要来自《金刚经》汉译。这里先描述经文里看得见的动作，不代替后世完整义理系统。",
    terms: [
      {
        label: "关键句",
        heading: "应无所住",
        detail: "要求不把心安住在被执取的对象、身份或成果上；它说的是“住著方式”，不是“停止行动”。",
      },
      {
        label: "同句下半",
        heading: "而生其心",
        detail: "同一句同时保留发心与行动，因此“无住”不能被裁成一种拒绝进入现实的姿态。",
      },
      {
        label: "相关证据",
        heading: "诸相非相",
        detail: "这类句子提醒人不要把现象误当固定自性，但不支持把经验世界一笔抹成“什么都没有”。",
      },
      {
        label: "修习边界",
        heading: "不住著 ≠ 不承担",
        detail: "当代阅读若把“无住”简化为“别在乎、别投入”，就已经越过了现有证据能支持的范围。",
      },
    ],
    boundariesHeading: "同一句经文，同时约束心与行动。",
    boundariesIntro: "这里的边界不是新发明的伦理，而是把《金刚经》现有句子能支持的意思与它不能直接支持的意思分开。",
    traditions: [
      {
        label: "《金刚经》直观语境",
        term: "无住 · 生心",
        supported: "现有证据可直接支持：不住著与发心行动并置；不把外相、世界与功德执成固定可占有之物。",
        boundary: "当前证据不能单独推出完整的般若哲学体系，也不能直接替代后世中观、唯识或禅门的详细论证。",
        sources: "T0235.001.0749c22 · 0749a24 · 0752b28",
      },
      {
        label: "般若相关语境",
        term: "非相 · 梦幻泡影",
        supported: "这些句子能帮助防止把“无住”误读成重新抓住另一种固定观念，也能说明为何行动不应建立在占有心上。",
        boundary: "不能把一切“如梦幻泡影”的句子直接拿来证明“世界不真实所以无需负责”。",
        sources: "T0235.001.0749a24 · 0752b28",
      },
      {
        label: "现代实践转译",
        term: "关系 · 工作 · 修行",
        supported: "本页允许的现代转译只有一层：行动可以继续，但减少把角色、评价和结果抓成“我所有”。",
        boundary: "本页不提供心理治疗、职场建议或宗派修行次第；需要更细致的方法时，应回到各传统的老师与文献。",
        sources: "当前受控样本 + 明示边界",
      },
    ],
    evidence: [
      {
        kind: "直接证据",
        canon: "《金刚般若波罗蜜经》T0235",
        title: "不住著，与生心同句出现",
        quote: "应无所住而生其心。",
        reading: "最小可证结论：经文没有叫人退出行动，而是要求在行动时不把心安住于可占有对象。",
        locator: "T0235.001.0749c22",
        href: "/jingzang/jingangjing/001-0749c#T0235.001.0749c22",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
        language: "zh-Hans",
      },
      {
        kind: "直接证据",
        canon: "《金刚般若波罗蜜经》T0235",
        title: "诸相非相，不等于删除世界",
        quote: "凡所有相，皆是虚妄；若见诸相非相，则见如来。",
        reading: "这段推翻的是把“相”当成固定自性的抓取方式，而不是把经验本身宣布为无意义。",
        locator: "T0235.001.0749a24",
        href: "/jingzang/jingangjing/001-0749a#T0235.001.0749a24",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
        language: "zh-Hans",
      },
      {
        kind: "直接证据",
        canon: "《金刚般若波罗蜜经》T0235",
        title: "梦幻泡影是对执著方式的校正",
        quote: "一切有为法，如梦幻泡影，如露亦如电，应作如是观。",
        reading: "这类譬喻强调条件性与短暂性，不能据此直接推出“既然如梦，就无需承担后果”。",
        locator: "T0235.001.0752b28",
        href: "/jingzang/jingangjing/001-0752b#T0235.001.0752b28",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
        language: "zh-Hans",
      },
      {
        kind: "相关证据",
        canon: "《般若波罗蜜多心经》T0251",
        title: "般若观照的相关边界",
        quote: "照见五蕴皆空，度一切苦厄。",
        reading: "相关证据只说明般若观照与离苦相连，不足以把《心经》与《金刚经》的所有用语机械合并。",
        locator: "T0251.001.0848c06",
        href: "/jingzang/xinjing/001-0848c#T0251.001.0848c06",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0251_001",
        language: "zh-Hans",
      },
    ],
    misreadingsHeading: "先停下四个常见误读。",
    misreadingsIntro: "这些误读大多来自把“去执著”偷换成“去责任”或“去关系”。当前证据不足以支持这样的跳跃。",
    misconceptions: [
      {
        myth: "无住 = 什么都不要做",
        correction: "证据不支持。《金刚经》把“不住”与“生其心”放在同一句里；若把行动一起删除，就已经删掉了经文自己保留的部分。",
      },
      {
        myth: "无住 = 对人对事都别投入",
        correction: "证据不支持。现有原文只反对占有心与固着方式，不反对发心、承担与利益他人。",
      },
      {
        myth: "无住 = 压住所有情感",
        correction: "过度推论。当前样本没有命令你变成没有感受的人；它要求的是看清并松动抓取方式。",
      },
      {
        myth: "懂无住就能替代全部修行次第",
        correction: "不成立。本页只处理当前受控句子能证明的最低边界，不代替完整的禅修、戒学或般若教学。",
      },
    ],
    readingHeading: "先读句子，再谈生活应用。",
    readingIntro: "阅读顺序决定误解概率。先把经文的动作看清楚，再把它带回关系、工作与修行场景。",
    readingPath: [
      {
        step: "先抓主句",
        title: "《金刚经》“应无所住而生其心”",
        text: "先确认“不住”与“生心”同时存在，防止把其中一半删掉。",
        href: "/jingzang/jingangjing/001-0749c#T0235.001.0749c22",
      },
      {
        step: "再核诸相",
        title: "《金刚经》“凡所有相，皆是虚妄”",
        text: "再看经文如何处理“相”与“非相”，避免把它直接滑向虚无主义。",
        href: "/jingzang/jingangjing/001-0749a#T0235.001.0749a24",
      },
      {
        step: "最后看譬喻",
        title: "《金刚经》“如梦幻泡影”",
        text: "把短暂与条件性的譬喻放回行动语境里，检查自己是否误把“轻安”读成“轻率”。",
        href: "/jingzang/jingangjing/001-0752b#T0235.001.0752b28",
      },
    ],
    footerNote: "本页只综合 foxue.ai 当前受控的《金刚经》与相关般若样本。它不替任何宗派裁决“无住”的最终义理，也不把一句经文包装成完整人生指南。",
    updatedAt: "2026-08-20",
    footerActionLabel: "带着边界继续问",
    footerActionHref: "/wenjing",
    related: ["kong", "guanxin"],
  },
  {
    entry: {
      slug: "guanxin",
      title: "观心",
      href: "/gainian/guanxin",
      summary: "从《法句经》与《心经》现有样本理解“观心”如何面对烦恼、语言、行动与离苦。",
      aliases: ["观心", "烦恼", "情绪", "焦虑", "怎样观察自己的心", "观察自己的心", "心乱"],
      prompt: "烦恼生起时，怎样观察自己的心？",
    },
    metadataTitle: "观心｜概念 Hub",
    description: "从《法句经》与《心经》现有受控样本理解“观心”如何与烦恼、语言、行动和离苦相连。",
    about: ["观心", "烦恼", "法句经", "修心"],
    termCode: "guanxin",
    heading: "观心",
    sectionTitle: "主题",
    sectionDescription: "这里说的“观心”不是给出一套万能心理方法，而是把现有原典里关于心、语言、行动与离苦的最小证据链整理出来。",
    hero: {
      eyebrow: "主题 HUB · 修心入口版",
      highlight: "观心",
      beforeBreak: "，不是压住情绪，",
      afterBreak: "而是看清心怎样带动语言与行为。",
      lead:
        "现有样本能支持一个很朴素的起点：心念会影响言语与行动，而言语与行动又会带来可经验的苦乐后果。观心不是否认痛苦，而是先把反应链看清楚。",
      primaryActionLabel: "查看原典证据",
      primaryActionHref: "#evidence",
      secondaryActionLabel: "继续问经",
      secondaryActionHref: "/wenjing",
      lensNotes: [
        { label: "法句次第", text: "心先于言与行" },
        { label: "般若相关", text: "也看五蕴与感受" },
        { label: "最低底线", text: "不代替医疗与支持" },
      ],
    },
    stats: [
      { label: "可定位证据", value: "3 处" },
      { label: "直接语境", value: "1 组" },
      { label: "医疗替代", value: "0 个" },
      { label: "证据状态", value: "受控样本" },
    ],
    termsHeading: "先问：这里观察的“心”，在做什么？",
    termsIntro: "当前受控样本还不足以覆盖所有佛教心理学术语。本页只整理现有原典直接可见的关系：心念、语言、行动、苦乐后果。",
    terms: [
      {
        label: "法句经",
        heading: "心为法本",
        detail: "心不是抽象名词，而是行为链条的起点：它影响说什么、做什么，以及后续经验到怎样的苦乐。",
      },
      {
        label: "法句经",
        heading: "念恶 · 念善",
        detail: "当前样本直接保留了恶念与善念两种方向；这让“观心”首先成为辨认方向，而非立刻宣称已经解脱。",
      },
      {
        label: "般若相关",
        heading: "五蕴观察",
        detail: "《心经》提醒我们，观察不只盯住一个念头，还要看身体、感受、想象、意志和识别如何一起起伏。",
      },
      {
        label: "实践边界",
        heading: "离苦 ≠ 否认痛苦",
        detail: "现有证据不支持把疾病、创伤或暴力都说成“只是你想太多”；观心可以帮助辨认反应，但不能代替现实支持。",
      },
    ],
    boundariesHeading: "先把修心、照见与现实支持分开。",
    boundariesIntro: "以下边界的目标不是缩小佛法，而是防止把现有样本无法支持的结论硬塞给正在受苦的人。",
    traditions: [
      {
        label: "《法句经》修心语境",
        term: "心为法本 · 念善念恶",
        supported: "现有证据可直接支持：心念会带动语言与行动，并与苦乐经验形成链条；因此先观察起心动念是合理入口。",
        boundary: "不能据此把所有复杂痛苦都简化成“心态问题”，也不能用它否定社会、身体与关系层面的真实条件。",
        sources: "T0210.001.0562a13 · 0562a15",
      },
      {
        label: "般若相关语境",
        term: "照见五蕴",
        supported: "相关证据可支持：观察对象不只是一个想法，还包括身体、感受、想象、意志活动和识别活动。",
        boundary: "当前样本不足以展开完整禅修次第，也不足以把所有“观心”传统整理成统一操作手册。",
        sources: "T0251.001.0848c06（相关）",
      },
      {
        label: "现代使用边界",
        term: "烦恼 · 情绪 · 焦虑",
        supported: "本页允许的现代转译只有一层：当反应强烈时，先辨认心念、言语冲动与行动冲动，比立即把自己判死刑更接近现有证据。",
        boundary: "这不是医疗、心理危机或法律建议；遇到危险、创伤或失控状态时，仍应优先寻求现实帮助。",
        sources: "当前受控样本 + 明示边界",
      },
    ],
    evidence: [
      {
        kind: "直接证据",
        canon: "《法句经》T0210",
        title: "恶念如何带动言与行",
        quote: "心为法本，心尊心使；中心念恶，即言即行，罪苦自追，车轹于辙。",
        reading: "最小可证结论：心念不会停在心里，它会进入言语和行动，并带来后续可经验的苦。",
        locator: "T0210.001.0562a13",
        href: "/jingzang/fajujing/001-0559a#T0210.001.0562a13",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0210_001",
        language: "zh-Hans",
      },
      {
        kind: "直接证据",
        canon: "《法句经》T0210",
        title: "善念也会形成另一条链",
        quote: "心为法本，心尊心使；中心念善，即言即行，福乐自追，如影随形。",
        reading: "这不是空泛的鸡汤，而是与上一条成对出现的证据：观察心念时，方向判断本身就很关键。",
        locator: "T0210.001.0562a15",
        href: "/jingzang/fajujing/001-0559a#T0210.001.0562a15",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0210_001",
        language: "zh-Hans",
      },
      {
        kind: "相关证据",
        canon: "《般若波罗蜜多心经》T0251",
        title: "观察不只盯住一个念头",
        quote: "照见五蕴皆空，度一切苦厄。",
        reading: "相关证据提示：若只盯着“我现在怎么想”，可能会漏掉身体、感受与识别活动的共同作用。",
        locator: "T0251.001.0848c06",
        href: "/jingzang/xinjing/001-0848c#T0251.001.0848c06",
        sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0251_001",
        language: "zh-Hans",
      },
    ],
    misreadingsHeading: "先停下四种会伤人的快结论。",
    misreadingsIntro: "如果把修心话语用错方向，它很快就会从帮助变成指责。这些边界是为了防止这种伤害。",
    misconceptions: [
      {
        myth: "观心 = 把情绪压下去",
        correction: "证据不支持。当前样本要求先看清念头怎样进入话语和行动，而不是要求你假装自己没有感受。",
      },
      {
        myth: "痛苦都是自己想出来的",
        correction: "不成立。身体疾病、暴力、贫困与创伤有真实条件；观心只能处理其中的反应链，不能抹掉外部现实。",
      },
      {
        myth: "学会观心就不需要现实帮助",
        correction: "危险。当前证据明确不支持把佛法语言拿来替代医疗、心理危机干预或法律支持。",
      },
      {
        myth: "观心就是不停责怪自己起了坏念头",
        correction: "过度用力。现有证据更接近“看见方向，再选择较少伤害的下一步”，不是把自己钉死在内疚里。",
      },
    ],
    readingHeading: "先看反应链，再扩大观察范围。",
    readingIntro: "这条路径故意从最易理解的地方开始：先看心念怎样进到言与行，再把身体和感受一起带回来。",
    readingPath: [
      {
        step: "先看恶念",
        title: "《法句经》“中心念恶，即言即行”",
        text: "先观察一个强烈念头如何迅速改变说话和动作，这一步最容易对上现实经验。",
        href: "/jingzang/fajujing/001-0559a#T0210.001.0562a13",
      },
      {
        step: "再看善念",
        title: "《法句经》“中心念善，即言即行”",
        text: "再看同一结构如何朝另一方向展开，理解“观心”不仅是止损，也是在选择方向。",
        href: "/jingzang/fajujing/001-0559a#T0210.001.0562a15",
      },
      {
        step: "扩大范围",
        title: "《心经》“照见五蕴皆空”",
        text: "最后把身体、感受、想象、意志与识别活动一起带回观察，避免把问题缩成“我脑子里的一句念头”。",
        href: "/jingzang/xinjing/001-0848c#T0251.001.0848c06",
      },
    ],
    footerNote: "本页只综合 foxue.ai 当前受控的《法句经》与相关《心经》样本。它不能替代医疗、心理危机支持或师承训练，也不会把复杂痛苦缩成一句“都是你自己的心”。",
    updatedAt: "2026-08-20",
    footerActionLabel: "带着问题继续问",
    footerActionHref: "/wenjing",
    related: ["kong", "wuzhu"],
  },
] as const;

export const allConceptHubs = [...conceptHubs];
export const allConcepts = conceptHubs.map((hub) => hub.entry);

export function getConceptHub(slug: ConceptSlug): ConceptHub {
  const hub = conceptHubs.find((item) => item.entry.slug === slug);

  if (!hub) {
    throw new Error(`缺少概念 Hub 配置: ${slug}`);
  }

  return hub;
}

export function getConceptEntry(slug: ConceptSlug) {
  return getConceptHub(slug).entry;
}
