export type BuddhistPinyinSyllable = {
  origin: string;
  result: string;
  isZh: boolean;
};

export const buddhistPinyinLexicon: Readonly<Record<string, string>>;

export function pinyinForBuddhistText(text: string): BuddhistPinyinSyllable[];
