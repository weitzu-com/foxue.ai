import document from "@/data/work-landing-text.generated.json";
import type { Sutra } from "@/data/sutras";

export const workLandingSchema = "https://foxue.ai/schemas/work-landing-text-v0.1";

export type WorkLandingMode = "full" | "opening";

export type WorkLandingSegment = {
  id: string;
  folioKey: string;
  sourceLine: string;
  text: string;
  note?: string;
  legacyIds?: string[];
};

export type WorkLandingText = {
  slug: string;
  mode: WorkLandingMode;
  scopeLabel: string;
  juan: string;
  folioKeys: string[];
  segmentCount: number;
  segments: WorkLandingSegment[];
};

const landingDocument = document as {
  schema: string;
  workCount: number;
  works: Record<string, WorkLandingText>;
};

if (landingDocument.schema !== workLandingSchema) {
  throw new Error("经目着陆原文 schema 不正确");
}

export function getWorkLandingText(slug: string): WorkLandingText | null {
  return landingDocument.works[slug] ?? null;
}

export function hasWorkLandingText(slug: string) {
  return Boolean(landingDocument.works[slug]);
}

export function decorateWorkLandingSegments(sutra: Sutra, landing: WorkLandingText): WorkLandingSegment[] {
  const sample = new Map(sutra.segments.map((segment) => [segment.id, segment]));
  return landing.segments.map((segment) => ({
    ...segment,
    note: sample.get(segment.id)?.note,
    legacyIds: sample.get(segment.id)?.legacyIds,
  }));
}

export function buildWorkLandingAttribution(sutra: Sutra) {
  return {
    translator: { "@type": "Person", name: sutra.translator },
    isBasedOn: {
      "@type": "CreativeWork",
      name: sutra.canonRef,
      url: sutra.sourceUrl,
      publisher: { "@type": "Organization", name: sutra.sourceName },
    },
  };
}
