import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import type { Sutra, SutraSegment } from "@/data/sutras";
import { buildPageNavigation, parseCbetaReadingLines } from "@/lib/cbeta-tei.mjs";

const completeAssets: Record<string, { filename: string; canonId: string }> = {
  xinjing: { filename: "T08n0251.xml", canonId: "T0251" },
  jingangjing: { filename: "T08n0235.xml", canonId: "T0235" },
  fajujing: { filename: "T04n0210.xml", canonId: "T0210" },
};

export type ReaderNavigationItem = {
  key: string;
  id: string;
  label: string;
  juan?: string;
};

export type SutraReading = {
  complete: boolean;
  segments: SutraSegment[];
  navigation: ReaderNavigationItem[];
};

const loadCompleteLines = cache(async (slug: string) => {
  const asset = completeAssets[slug];
  if (!asset) return null;
  const xml = await readFile(
    join(process.cwd(), "data", "corpus", "cbeta", asset.filename),
    "utf8",
  );
  return parseCbetaReadingLines(xml, { canonId: asset.canonId });
});

export async function getSutraReading(sutra: Sutra): Promise<SutraReading> {
  const asset = completeAssets[sutra.slug];
  if (!asset) {
    return {
      complete: false,
      segments: sutra.segments,
      navigation: sutra.segments.map((segment, index) => ({
        key: `sample-${String(index + 1).padStart(2, "0")}`,
        id: segment.id,
        label: String(index + 1).padStart(2, "0"),
      })),
    };
  }

  const lines = await loadCompleteLines(sutra.slug);
  if (!lines) throw new Error(`${sutra.slug} 缺少完整原文读取配置`);
  const sampleMetadata = new Map(sutra.segments.map((segment) => [segment.id, segment]));
  const segments = lines.map((line) => {
    const sample = sampleMetadata.get(line.id);
    return {
      ...line,
      note: sample?.note,
      legacyIds: sample?.legacyIds,
    };
  });

  return {
    complete: true,
    segments,
    navigation: buildPageNavigation(segments),
  };
}

export type SutraFolio = {
  item: ReaderNavigationItem;
  segments: SutraSegment[];
  previous?: ReaderNavigationItem;
  next?: ReaderNavigationItem;
};

export function getSutraFolio(reading: SutraReading, key: string): SutraFolio | undefined {
  const index = reading.navigation.findIndex((item) => item.key === key);
  if (index < 0) return undefined;
  const item = reading.navigation[index];
  const segments = reading.complete
    ? reading.segments.filter(
        (segment) => `${segment.juan}-${segment.page}` === item.key,
      )
    : [reading.segments[index]].filter((segment): segment is SutraSegment => Boolean(segment));

  return {
    item,
    segments,
    previous: reading.navigation[index - 1],
    next: reading.navigation[index + 1],
  };
}

export function buildLegacyAliasMap(segments: SutraSegment[]) {
  const aliases: Record<string, string> = {};
  for (const segment of segments) {
    for (const legacyId of segment.legacyIds ?? []) aliases[legacyId] = segment.id;
  }
  return aliases;
}
