import { customPinyin, pinyin } from "pinyin-pro";

export const buddhistPinyinLexicon = {
  "般若": "bō rě",
  "般若波羅蜜多": "bō rě bō luó mì duō",
  "般若波罗蜜多": "bō rě bō luó mì duō",
  "觀自在": "guān zì zài",
  "观自在": "guān zì zài",
  "菩薩": "pú sà",
  "菩萨": "pú sà",
  "菩提薩埵": "pú tí sà duǒ",
  "菩提萨埵": "pú tí sà duǒ",
  "舍利子": "shè lì zǐ",
  "三藏法師": "sān zàng fǎ shī",
  "三藏法师": "sān zàng fǎ shī",
  "鳩摩羅什": "jiū mó luó shí",
  "鸠摩罗什": "jiū mó luó shí",
  "楞伽": "léng qié",
  "長者": "zhǎng zhě",
  "长者": "zhǎng zhě",
  "阿耨多羅三藐三菩提": "ā nòu duō luó sān miǎo sān pú tí",
  "阿耨多罗三藐三菩提": "ā nòu duō luó sān miǎo sān pú tí",
  "涅槃": "niè pán",
  "罣礙": "guà ài",
  "罣碍": "guà ài",
  "於是": "yú shì",
  "于是": "yú shì",
  "世間": "shì jiān",
  "世间": "shì jiān",
  "出世間": "chū shì jiān",
  "出世间": "chū shì jiān",
  "不知其幾": "bù zhī qí jǐ",
  "不知其几": "bù zhī qí jǐ",
  "幾喪": "jī sàng",
  "几丧": "jī sàng",
  "相空": "xiàng kōng",
  "空相": "kōng xiàng",
  "色相": "sè xiàng",
  "真相": "zhēn xiàng",
  "樂相": "lè xiàng",
  "乐相": "lè xiàng",
  "般羅": "bō luó",
  "般罗": "bō luó",
  "莎婆訶": "suō pó hē",
  "莎婆诃": "suō pó hē",
};

customPinyin(buddhistPinyinLexicon);

export function pinyinForBuddhistText(text) {
  return pinyin(text, {
    type: "all",
    toneType: "symbol",
    traditional: true,
    toneSandhi: false,
    segmentit: 2,
  });
}
