import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import corpusManifest from "../../data/corpus/cbeta/manifest-v0.5.0.json";
import type { Sutra, SutraSegment } from "@/data/sutras";
import { buildPageNavigation, parseCbetaReadingLines } from "@/lib/cbeta-tei.mjs";

const completeAssets: Record<string, { filename: string; canonId: string }> = Object.fromEntries(
  corpusManifest.files.map((file) => [
    file.slug,
    { filename: file.localPath.split("/").at(-1)!, canonId: file.id },
  ]),
);

export type ReaderNavigationItem = {
  key: string;
  id: string;
  label: string;
  juan?: string;
};

export type ReaderJuanNavigationItem = {
  juan?: string;
  first: ReaderNavigationItem;
  pages: number;
};

export function buildJuanNavigation(navigation: ReaderNavigationItem[]) {
  const groups = new Map<string, ReaderJuanNavigationItem>();
  for (const item of navigation) {
    const key = item.juan ?? "";
    const group = groups.get(key);
    if (group) group.pages += 1;
    else groups.set(key, { juan: item.juan, first: item, pages: 1 });
  }
  return [...groups.values()];
}

type CorpusNavigationItem = ReaderNavigationItem & {
  objectKey: string;
  position: number;
  sha256: string;
};

export type SutraReading = {
  complete: boolean;
  source: "edge" | "local" | "sample";
  releaseId?: string;
  canonId?: string;
  segmentCount: number;
  segments: SutraSegment[];
  navigation: ReaderNavigationItem[];
};

type CorpusReleasePointer = {
  releaseId: string;
  manifestObjectKey: string;
  manifestSha256: string;
};

type CorpusReleaseManifest = {
  releaseId: string;
  works: Array<{
    canonId: string;
    indexObjectKey: string;
    indexSha256: string;
  }>;
};

type CorpusWorkIndex = {
  releaseId: string;
  canonId: string;
  totals: { segments: number; folios: number };
  navigation: CorpusNavigationItem[];
};

type CorpusFolioDocument = {
  releaseId: string;
  canonId: string;
  folio: {
    key: string;
    juan?: string;
    label: string;
    firstSegmentId: string;
  };
  segments: SutraSegment[];
};

function corpusBaseUrl() {
  const configured = process.env.CORPUS_ASSET_BASE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (url.protocol !== "https:" && !local) return null;
    return `${url.origin}/`;
  } catch {
    return null;
  }
}

async function fetchCorpusJson(
  path: string,
  revalidate: number,
  expectedSha256?: string,
): Promise<unknown> {
  const baseUrl = corpusBaseUrl();
  if (!baseUrl) return null;
  const response = await fetch(new URL(path, baseUrl), {
    next: { revalidate },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`佛典边缘对象读取失败：${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (
    expectedSha256 &&
    createHash("sha256").update(bytes).digest("hex") !== expectedSha256
  ) {
    throw new Error("佛典边缘对象 SHA-256 校验失败");
  }
  return JSON.parse(bytes.toString("utf8"));
}

function isNavigationItem(value: unknown): value is ReaderNavigationItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.key === "string" && /^\d{3}-\d{4}[a-c]$/.test(item.key) &&
    typeof item.id === "string" &&
    typeof item.label === "string" && /^\d{4}[a-c]$/.test(item.label) &&
    typeof item.juan === "string" && /^\d{3}$/.test(item.juan)
  );
}

function isCorpusNavigationItem(value: unknown): value is CorpusNavigationItem {
  if (!isNavigationItem(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.objectKey === "string" &&
    typeof item.position === "number" && Number.isSafeInteger(item.position) &&
    typeof item.sha256 === "string" && /^[a-f0-9]{64}$/.test(item.sha256)
  );
}

const loadEdgeIndex = cache(async (canonId: string): Promise<CorpusWorkIndex | null> => {
  if (!corpusBaseUrl()) return null;
  try {
    const pointer = await fetchCorpusJson("v1/latest.json", 60) as CorpusReleasePointer | null;
    if (
      !pointer || typeof pointer.releaseId !== "string" ||
      !/^[a-z0-9][a-z0-9.-]{0,95}$/.test(pointer.releaseId) ||
      pointer.manifestObjectKey !== `v1/releases/${pointer.releaseId}/manifest.json` ||
      !/^[a-f0-9]{64}$/.test(pointer.manifestSha256)
    ) {
      return null;
    }
    const manifest = await fetchCorpusJson(
      pointer.manifestObjectKey,
      86400,
      pointer.manifestSha256,
    ) as CorpusReleaseManifest | null;
    const work = manifest?.works?.find((candidate) => candidate.canonId === canonId);
    if (
      !manifest || manifest.releaseId !== pointer.releaseId || !work ||
      work.indexObjectKey !==
        `v1/releases/${pointer.releaseId}/works/${canonId}/index.json` ||
      !/^[a-f0-9]{64}$/.test(work.indexSha256)
    ) {
      return null;
    }
    const value = await fetchCorpusJson(
      work.indexObjectKey,
      86400,
      work.indexSha256,
    ) as CorpusWorkIndex | null;
    if (
      !value || value.releaseId !== pointer.releaseId || value.canonId !== canonId ||
      !Number.isSafeInteger(value.totals?.segments) || value.totals.segments < 1 ||
      !Array.isArray(value.navigation) || !value.navigation.every(isCorpusNavigationItem) ||
      value.navigation.length !== value.totals.folios ||
      value.navigation.some((item, index) => (
        item.position !== index + 1 ||
        item.objectKey !==
          `v1/releases/${pointer.releaseId}/works/${canonId}/folios/${item.key}.json`
      ))
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
});

const loadEdgeFolio = cache(async (
  releaseId: string,
  canonId: string,
  item: CorpusNavigationItem,
): Promise<CorpusFolioDocument | null> => {
  try {
    const value = await fetchCorpusJson(
      item.objectKey,
      86400,
      item.sha256,
    ) as CorpusFolioDocument | null;
    if (
      !value || value.releaseId !== releaseId || value.canonId !== canonId ||
      !isNavigationItem({ ...value.folio, id: value.folio?.firstSegmentId }) ||
      value.folio.key !== item.key || !Array.isArray(value.segments) || value.segments.length < 1
    ) {
      return null;
    }
    const valid = value.segments.every((segment) => (
      typeof segment.id === "string" && segment.id.startsWith(`${canonId}.`) &&
      typeof segment.text === "string" && segment.text.length > 0 &&
      segment.juan === value.folio.juan && segment.page === value.folio.label
    ));
    return valid ? value : null;
  } catch {
    return null;
  }
});

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
      source: "sample",
      segmentCount: sutra.segments.length,
      segments: sutra.segments,
      navigation: sutra.segments.map((segment, index) => ({
        key: `sample-${String(index + 1).padStart(2, "0")}`,
        id: segment.id,
        label: String(index + 1).padStart(2, "0"),
      })),
    };
  }

  const edgeIndex = await loadEdgeIndex(asset.canonId);
  if (edgeIndex) {
    return {
      complete: true,
      source: "edge",
      releaseId: edgeIndex.releaseId,
      canonId: asset.canonId,
      segmentCount: edgeIndex.totals.segments,
      segments: sutra.segments,
      navigation: edgeIndex.navigation,
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
    source: "local",
    canonId: asset.canonId,
    segmentCount: segments.length,
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

export async function getSutraFolio(
  sutra: Sutra,
  reading: SutraReading,
  key: string,
): Promise<SutraFolio | undefined> {
  const index = reading.navigation.findIndex((item) => item.key === key);
  if (index < 0) return undefined;
  const item = reading.navigation[index];
  let segments: SutraSegment[];

  if (reading.source === "edge" && reading.releaseId && reading.canonId) {
    const remote = await loadEdgeFolio(
      reading.releaseId,
      reading.canonId,
      item as CorpusNavigationItem,
    );
    const sampleMetadata = new Map(sutra.segments.map((segment) => [segment.id, segment]));
    const sourceSegments = remote?.segments ?? (await loadCompleteLines(sutra.slug))?.filter(
      (segment) => `${segment.juan}-${segment.page}` === item.key,
    );
    if (!sourceSegments?.length) return undefined;
    segments = sourceSegments.map((segment) => ({
      ...segment,
      note: sampleMetadata.get(segment.id)?.note,
      legacyIds: sampleMetadata.get(segment.id)?.legacyIds,
    }));
  } else if (reading.complete) {
    segments = reading.segments.filter(
      (segment) => `${segment.juan}-${segment.page}` === item.key,
    );
  } else {
    segments = [reading.segments[index]].filter(
      (segment): segment is SutraSegment => Boolean(segment),
    );
  }

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
