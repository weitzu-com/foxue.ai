export type FajuStudyStanza = {
  label: string;
  locator: string;
  href: string;
  text: string;
};

export type FajuStudySource = {
  id: "chinese" | "pali" | "english";
  eyebrow: string;
  title: string;
  subtitle: string;
  language: string;
  lang: "zh-Hant" | "pi" | "en";
  workHref: string;
  sourceNote: string;
  qualityNote: string;
  stanzas: FajuStudyStanza[];
};

export const fajuStudySources: FajuStudySource[] = [
  {
    id: "chinese",
    eyebrow: "汉译传本 · T0210",
    title: "《法句经》双要品",
    subtitle: "吴·维祇难等译",
    language: "文言汉语",
    lang: "zh-Hant",
    workHref: "/jingzang/fajujing",
    sourceNote: "CBETA《大正新修大藏经》T04, no. 210，卷一，第 562 页上栏。",
    qualityNote: "保留大正藏版页行号；链接直达受控 TEI 原文中的稳定行段。",
    stanzas: [
      {
        label: "双要品 · 第一组",
        locator: "T0210.001.0562a13–14",
        href: "/jingzang/fajujing/001-0562a#T0210.001.0562a13",
        text: "心為法本，心尊心使，中心念惡，\n即言即行，罪苦自追，車轢于轍。",
      },
      {
        label: "双要品 · 第二组",
        locator: "T0210.001.0562a15–16",
        href: "/jingzang/fajujing/001-0562a#T0210.001.0562a15",
        text: "心為法本，心尊心使，中心念善，\n即言即行，福樂自追，如影隨形。",
      },
    ],
  },
  {
    id: "pali",
    eyebrow: "巴利原文 · DHAMMAPADA",
    title: "Yamakavagga",
    subtitle: "Dhp 1–2 · Twin Verses",
    language: "巴利语",
    lang: "pi",
    workHref: "/jingzang/dhammapada-pali",
    sourceNote: "SuttaCentral Bilara root Pāli，Khuddakanikāya / Dhammapada / Yamakavagga。",
    qualityNote: "逐段保留 SuttaCentral 键；链接直达 dhp1 与 dhp2 的稳定段号。",
    stanzas: [
      {
        label: "Dhp 1",
        locator: "dhp1:1–6",
        href: "/jingzang/dhammapada-pali/001-dhp1-20#dhp1:1",
        text: "Manopubbaṅgamā dhammā,\nmanoseṭṭhā manomayā;\nManasā ce paduṭṭhena,\nbhāsati vā karoti vā;\nTato naṁ dukkhamanveti,\ncakkaṁva vahato padaṁ.",
      },
      {
        label: "Dhp 2",
        locator: "dhp2:1–6",
        href: "/jingzang/dhammapada-pali/001-dhp1-20#dhp2:1",
        text: "Manopubbaṅgamā dhammā,\nmanoseṭṭhā manomayā;\nManasā ce pasannena,\nbhāsati vā karoti vā;\nTato naṁ sukhamanveti,\nchāyāva anapāyinī.",
      },
    ],
  },
  {
    id: "english",
    eyebrow: "历史英译 · 1881",
    title: "The Dhammapada",
    subtitle: "F. Max Müller · Chapter I",
    language: "英语",
    lang: "en",
    workHref: "/jingzang/wikisource-en-dhp-muller",
    sourceNote: "F. Max Müller, The Dhammapada, Sacred Books of the East, vol. 10, Oxford, 1881。",
    qualityNote: "Wikisource 423 偈转录已做结构验证；本站未声称已逐页扫描校勘或真人抽样复核。",
    stanzas: [
      {
        label: "Verse 1",
        locator: "WIKISOURCE-DHP-MULLER-1881.001.s0000000100",
        href: "/jingzang/wikisource-en-dhp-muller/001-c01#WIKISOURCE-DHP-MULLER-1881.001.s0000000100",
        text: "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts. If a man speaks or acts with an evil thought, pain follows him, as the wheel follows the foot of the ox that draws the carriage.",
      },
      {
        label: "Verse 2",
        locator: "WIKISOURCE-DHP-MULLER-1881.001.s0000000200",
        href: "/jingzang/wikisource-en-dhp-muller/001-c01#WIKISOURCE-DHP-MULLER-1881.001.s0000000200",
        text: "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts. If a man speaks or acts with a pure thought, happiness follows him, like a shadow that never leaves him.",
      },
    ],
  },
];

export const fajuComparisonBoundary =
  "三组材料在“心意—言行—苦乐后果”的结构上彼此照见，适合并读；但汉译《法句经》T0210、巴利《Dhammapada》与 Müller 英译并不是同一份数字文本。本站当前展示的是同一文本家族中的相关表达，不发布未经人工校勘的逐词或逐偈对齐结论。";
