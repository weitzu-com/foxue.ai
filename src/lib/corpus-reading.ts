import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Sutra, SutraSegment } from "@/data/sutras";
import { buildPageNavigation, parseCbetaReadingLines } from "@/lib/cbeta-tei.mjs";

const completeAssets: Record<string, { filename: string; canonId: string }> = {
  xinjing: { filename: "T08n0251.xml", canonId: "T0251" },
  jingangjing: { filename: "T08n0235.xml", canonId: "T0235" },
  fajujing: { filename: "T04n0210.xml", canonId: "T0210" },
};

export type SutraReading = {
  complete: boolean;
  segments: SutraSegment[];
  navigation: Array<{ id: string; label: string; juan?: string }>;
};

export async function getSutraReading(sutra: Sutra): Promise<SutraReading> {
  const asset = completeAssets[sutra.slug];
  if (!asset) {
    return {
      complete: false,
      segments: sutra.segments,
      navigation: sutra.segments.map((segment, index) => ({
        id: segment.id,
        label: String(index + 1).padStart(2, "0"),
      })),
    };
  }

  const xml = await readFile(
    join(process.cwd(), "data", "corpus", "cbeta", asset.filename),
    "utf8",
  );
  const sampleMetadata = new Map(sutra.segments.map((segment) => [segment.id, segment]));
  const segments = parseCbetaReadingLines(xml, { canonId: asset.canonId }).map((line) => {
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
