export type QuoteVerificationStatus =
  | "原句可核验"
  | "找到近似原句"
  | "当前证据不足";

export type QuoteEvidence = {
  id: string;
  quote: string;
  context: string;
  title: string;
  attribution: string;
  canonId: string;
  locator: string;
  href: string;
  exactAliases?: string[];
  nearAliases?: Array<{
    text: string;
    note: string;
  }>;
};

export type QuoteVerificationResult = {
  query: string;
  status: QuoteVerificationStatus;
  heading: string;
  summary: string;
  canConclude: string;
  cannotConclude: string;
  matchNote?: string;
  evidence?: QuoteEvidence;
};

const variantCharacters: Record<string, string> = {
  应: "應",
  无: "無",
  为: "為",
  梦: "夢",
  电: "電",
  诸: "諸",
  恶: "惡",
  众: "眾",
  净: "淨",
  执: "執",
  着: "著",
  发: "發",
  说: "說",
  碍: "礙",
  挂: "罣",
  掛: "罣",
  观: "觀",
  见: "見",
  蕴: "蘊",
  异: "異",
  识: "識",
  复: "復",
  远: "遠",
  离: "離",
  颠: "顛",
  过: "過",
};

export function normalizeQuote(value: string) {
  return [...value.normalize("NFKC")]
    .map((character) => variantCharacters[character] ?? character)
    .join("")
    .replace(/佛(?:陀)?(?:曾經|曾经)?(?:說|说)|佛曰/gu, "")
    .replace(/[\p{P}\p{S}\s]/gu, "")
    .toLowerCase();
}

export const verifiedQuoteEvidence: QuoteEvidence[] = [
  {
    id: "heart-sutra-form-emptiness",
    quote: "色不異空，空不異色；色即是空，空即是色。",
    context: "舍利子！色不異空，空不異色，色即是空，空即是色；受、想、行、識，亦復如是。",
    title: "《般若波羅蜜多心經》",
    attribution: "唐 · 玄奘譯",
    canonId: "T0251",
    locator: "T0251.001.0848c08",
    href: "/jingzang/xinjing/001-0848c#T0251.001.0848c08",
    exactAliases: ["色即是空，空即是色", "色即是空"],
  },
  {
    id: "diamond-sutra-non-abiding",
    quote: "應無所住而生其心。",
    context: "不應住色生心，不應住聲、香、味、觸、法生心，應無所住而生其心。",
    title: "《金剛般若波羅蜜經》",
    attribution: "後秦 · 鳩摩羅什譯",
    canonId: "T0235",
    locator: "T0235.001.0749c22",
    href: "/jingzang/jingangjing/001-0749c#T0235.001.0749c22",
    nearAliases: [
      {
        text: "無所住而生心",
        note: "这是常见缩写；底本原句多了“应”与“其”二字。",
      },
      {
        text: "不執著但要發心",
        note: "这是对经义的现代概括，不是底本原句。",
      },
    ],
  },
  {
    id: "diamond-sutra-conditioned-things",
    quote: "一切有為法，如夢、幻、泡、影，如露亦如電，應作如是觀。",
    context: "不取於相，如如不動。何以故？一切有為法，如夢、幻、泡、影，如露亦如電，應作如是觀。",
    title: "《金剛般若波羅蜜經》",
    attribution: "後秦 · 鳩摩羅什譯",
    canonId: "T0235",
    locator: "T0235.001.0752b28",
    href: "/jingzang/jingangjing/001-0749c#T0235.001.0752b28",
    exactAliases: ["一切有為法，如夢幻泡影，如露亦如電，應作如是觀"],
  },
  {
    id: "dhammapada-all-buddhas",
    quote: "諸惡莫作，諸善奉行，自淨其意，是諸佛教。",
    context: "諸惡莫作，諸善奉行，自淨其意，是諸佛教。",
    title: "《法句經》卷下 · 述佛品第二十二",
    attribution: "吳 · 維祇難等譯",
    canonId: "T0210",
    locator: "T0210.002.0567b01",
    href: "/jingzang/fajujing/002-0567b#T0210.002.0567b01",
    nearAliases: [
      {
        text: "諸惡莫作眾善奉行自淨其意是諸佛教",
        note: "常见转述把“诸善”写成“众善”；本站底本文字为“诸善奉行”。",
      },
      {
        text: "佛法就是諸惡莫作眾善奉行自淨其意",
        note: "核心偈句可核验，但“佛法就是”是现代转述；底本文字为“是诸佛教”。",
      },
    ],
  },
  {
    id: "heart-sutra-without-obstruction",
    quote: "心無罣礙；無罣礙故，無有恐怖。",
    context: "菩提薩埵依般若波羅蜜多故，心無罣礙；無罣礙故，無有恐怖，遠離顛倒夢想，究竟涅槃。",
    title: "《般若波羅蜜多心經》",
    attribution: "唐 · 玄奘譯",
    canonId: "T0251",
    locator: "T0251.001.0848c15",
    href: "/jingzang/xinjing/001-0848c#T0251.001.0848c15",
    exactAliases: ["心無掛礙，無掛礙故，無有恐怖", "心無罣礙，無罣礙故，無有恐怖"],
  },
];

function exactMatch(query: string) {
  const normalizedQuery = normalizeQuote(query);
  if (normalizedQuery.length < 4) return null;

  return verifiedQuoteEvidence.find((evidence) => {
    const candidates = [evidence.quote, ...(evidence.exactAliases ?? [])]
      .map(normalizeQuote);
    return candidates.some((candidate) => (
      candidate === normalizedQuery ||
      (normalizedQuery.length >= 6 && candidate.includes(normalizedQuery))
    ));
  }) ?? null;
}

function nearMatch(query: string) {
  const normalizedQuery = normalizeQuote(query);
  if (normalizedQuery.length < 4) return null;

  for (const evidence of verifiedQuoteEvidence) {
    for (const alias of evidence.nearAliases ?? []) {
      const normalizedAlias = normalizeQuote(alias.text);
      if (
        normalizedAlias === normalizedQuery ||
        normalizedQuery.includes(normalizedAlias) ||
        normalizedAlias.includes(normalizedQuery)
      ) {
        return { evidence, note: alias.note };
      }
    }
  }
  return null;
}

export function buildQuoteVerification(query: string): QuoteVerificationResult | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const exact = exactMatch(trimmed);
  if (exact) {
    return {
      query: trimmed,
      status: "原句可核验",
      heading: "在已复核底本中找到同句",
      summary: "去除繁简、标点与空格差异后，输入与下列原文相符。请继续打开上下文，避免只凭摘句解释经义。",
      canConclude: `可以确认：这句话或其连续片段见于本站登记的 ${exact.canonId} 底本。`,
      cannotConclude: "不能仅凭一句话断定所有译本措辞相同，也不能脱离前后文推导唯一解释。",
      evidence: exact,
    };
  }

  const near = nearMatch(trimmed);
  if (near) {
    return {
      query: trimmed,
      status: "找到近似原句",
      heading: "意思接近，但不宜加引号当作原文",
      summary: "当前输入更像缩写或现代转述。下列底本原句可以支持继续核对，但两者不能混写。",
      canConclude: `可以说：这句话与 ${near.evidence.title} 的下列原文接近。`,
      cannotConclude: "不能写成“佛经原文如下”而继续使用输入措辞；引用时应改用底本文字并附定位。",
      matchNote: near.note,
      evidence: near.evidence,
    };
  }

  return {
    query: trimmed,
    status: "当前证据不足",
    heading: "在首批受控条目中没有找到可靠出处",
    summary: "这不是“佛经绝无此句”的判决。当前工具只核对五个已逐字复核的高频条目，未命中时必须停下。",
    canConclude: "可以说：foxue.ai 当前受控核验表未找到足以支持“佛经原句”标签的证据。",
    cannotConclude: "不能说：整部汉译、巴利、藏文或梵文佛典都不存在相似表达。",
  };
}
