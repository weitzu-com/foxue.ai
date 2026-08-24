import type { SutraSegment } from "@/data/sutras";
import { buildDefaultReadingEdition } from "@/lib/sutra-reading-edition.mjs";

export type ReadingSegmentRole = "registration" | "heading" | "byline" | "colophon" | "body";

export type ReadingFolioEdition = {
  annotationMode: "pinyin" | "plain";
  sourceKind: "cbeta" | "bilara" | "derge" | "sat" | "wikisource";
  contentLanguage: "zh-Hant" | "pi" | "bo-Tibt" | "ja" | "sa-Latn" | "pra-Latn";
  workLabel: string;
  editionLabel: string;
  documentKind: string;
  documentTitle: string;
  responsibility: string;
  description: string;
  closingMark: string;
  segmentRoles: Partial<Record<string, ReadingSegmentRole>>;
  textOverrides?: Partial<Record<string, string>>;
  primaryAction?: {
    href: string;
    label: string;
    meta: string;
  };
};

const xinjingBodyAction = {
  href: "/jingzang/xinjing/001-0848c",
  label: "直达《心经》正文",
  meta: "大正藏 0848c",
} as const;

const xinjingReadingEdition: Record<string, ReadingFolioEdition> = {
  "001-0848a": {
    annotationMode: "pinyin",
    sourceKind: "cbeta",
    contentLanguage: "zh-Hant",
    workLabel: "心经",
    editionLabel: "注音校读样板",
    documentKind: "卷首序文",
    documentTitle: "大明太祖御製序",
    responsibility: "明太祖朱元璋撰",
    description: "本页是明太祖御制序，不是《心经》正文。可顺页阅读完整序文，也可直接进入玄奘译正文。",
    closingMark: "下頁續讀",
    segmentRoles: {
      "0848a02": "registration",
      "0848a03": "heading",
      "0848a04": "heading",
    },
    textOverrides: {
      "0848a03": "大明太祖高皇帝御製",
      "0848a04": "般若心經序",
    },
    primaryAction: xinjingBodyAction,
  },
  "001-0848b": {
    annotationMode: "pinyin",
    sourceKind: "cbeta",
    contentLanguage: "zh-Hant",
    workLabel: "心经",
    editionLabel: "注音校读样板",
    documentKind: "序文续页",
    documentTitle: "御製序續文與慧忠序",
    responsibility: "明太祖朱元璋、唐释慧忠撰",
    description: "本页先续完明太祖御制序，随后收录唐代释慧忠所撰序文；《心经》正文在下一版页。",
    closingMark: "正文在後",
    segmentRoles: {
      "0848b19": "heading",
      "0848b21": "byline",
    },
    textOverrides: {
      "0848b19": "般若波羅蜜多心經序",
    },
    primaryAction: xinjingBodyAction,
  },
  "001-0848c": {
    annotationMode: "pinyin",
    sourceKind: "cbeta",
    contentLanguage: "zh-Hant",
    workLabel: "心经",
    editionLabel: "注音校读样板",
    documentKind: "经文正文",
    documentTitle: "般若波羅蜜多心經",
    responsibility: "唐玄奘译",
    description: "本页为唐玄奘译《心经》正文。拼音逐字置于经文上方，并保留大正藏原始行号供引用核对。",
    closingMark: "願觀自在",
    segmentRoles: {
      "0848c03": "heading",
      "0848c05": "byline",
      "0848c23": "colophon",
    },
  },
};

const readingEditions: Record<string, Record<string, ReadingFolioEdition>> = {
  xinjing: xinjingReadingEdition,
};

export function getReadingFolioEdition({
  slug,
  folioKey,
  title,
  alternateTitle,
  translator,
  language,
  folioLabel,
  segments,
  hasNext,
  readerMode,
}: {
  slug: string;
  folioKey: string;
  title: string;
  alternateTitle: string;
  translator: string;
  language: string;
  folioLabel: string;
  segments: SutraSegment[];
  hasNext: boolean;
  readerMode?: "cbeta-folio" | "bilara-chapter" | "bilara-sutta" | "derge-folio" | "sat-folio" | "kokuyaku-folio";
}): ReadingFolioEdition {
  return readingEditions[slug]?.[folioKey] ?? buildDefaultReadingEdition({
    slug,
    title,
    alternateTitle,
    translator,
    language,
    folioLabel,
    segments,
    hasNext,
    readerMode,
  });
}

export function getReadingSegmentRole(
  edition: ReadingFolioEdition,
  segment: Pick<SutraSegment, "sourceLine" | "text">,
): ReadingSegmentRole {
  if (segment.text.startsWith("No.")) return "registration";
  return edition.segmentRoles[segment.sourceLine ?? ""] ?? "body";
}
