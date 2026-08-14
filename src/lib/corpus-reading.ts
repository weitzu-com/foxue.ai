import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import corpusManifest from "../../data/corpus/cbeta/manifest-v3.4.0.json";
import suttacentralManifest from "../../data/corpus/suttacentral/manifest-v0.7.0.json";
import dighaNikayaManifest from "../../data/corpus/suttacentral/dn-manifest-v0.8.0.json";
import majjhimaNikayaManifest from "../../data/corpus/suttacentral/mn-manifest-v0.9.0.json";
import samyuttaNikayaManifest from "../../data/corpus/suttacentral/sn-manifest-v1.0.0.json";
import anguttaraNikayaManifest from "../../data/corpus/suttacentral/an-manifest-v1.1.0.json";
import khuddakaNikayaManifest from "../../data/corpus/suttacentral/kn-manifest-v1.2.0.json";
import indicRootManifest from "../../data/corpus/suttacentral/indic-manifest-v1.3.0.json";
import vinayaRootManifest from "../../data/corpus/suttacentral/vinaya-manifest-v1.4.0.json";
import abhidhammaRootManifest from "../../data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json";
import type { Sutra, SutraSegment } from "@/data/sutras";
import {
  parseBilaraDhammapadaSources,
  parseBilaraCollectionSources,
  parseBilaraSeriesSources,
  parseBilaraSuttaSource,
} from "@/lib/bilara-reading.mjs";
import { buildPageNavigation, parseCbetaReadingLines } from "@/lib/cbeta-tei.mjs";

type CorpusManifestFile = {
  id: string;
  slug: string;
  parser?: "cbeta_tei" | "bilara_root_json" | "bilara_single_root_json" | "bilara_collection_root_json" | "bilara_series_root_json";
  localPath?: string;
  sourceParts?: Array<{ localPath: string }>;
  parserOptions?: BilaraSeriesParserOptions;
};

type CorpusParser = "cbeta_tei" | "bilara_root_json" | "bilara_single_root_json" | "bilara_collection_root_json" | "bilara_series_root_json";
type BilaraSeriesParserOptions = {
  maxSegments?: number;
  collectionTitle?: string;
  collectionPrefix?: string;
  titleSuffixes?: string[];
  omitEmptySegments?: boolean;
};

const completeAssets: Record<string, { localPaths: string[]; canonId: string; parser: CorpusParser; parserOptions?: BilaraSeriesParserOptions }> = Object.fromEntries(
  [
    ...(corpusManifest.files as CorpusManifestFile[]).map((file) => ({ ...file, parser: "cbeta_tei" as const })),
    ...(suttacentralManifest.files as CorpusManifestFile[]),
    ...(dighaNikayaManifest.files as CorpusManifestFile[]),
    ...(majjhimaNikayaManifest.files as CorpusManifestFile[]),
    ...(samyuttaNikayaManifest.files as CorpusManifestFile[]),
    ...(anguttaraNikayaManifest.files as CorpusManifestFile[]),
    ...(khuddakaNikayaManifest.files as CorpusManifestFile[]),
    ...(indicRootManifest.files as CorpusManifestFile[]),
    ...(vinayaRootManifest.files as CorpusManifestFile[]),
    ...(abhidhammaRootManifest.files as CorpusManifestFile[]),
  ].map((file) => [
    file.slug,
    {
      localPaths: (file.sourceParts ?? [{ localPath: file.localPath! }]).map((source) => {
        if (!source.localPath.startsWith("data/corpus/")) {
          throw new Error(`语料路径越界：${source.localPath}`);
        }
        return source.localPath.slice("data/corpus/".length);
      }),
      canonId: file.id,
      parser: file.parser ?? "cbeta_tei",
      parserOptions: file.parserOptions,
    },
  ]),
);

export type ReaderNavigationItem = {
  key: string;
  id: string;
  label: string;
  juan?: string;
  sourcePage?: string;
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
  expressions?: Array<{
    canonId: string;
    indexObjectKey: string;
    indexSha256: string;
  }>;
  works?: Array<{
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
    sourcePage?: string;
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
    typeof item.key === "string" && /^[a-z0-9][a-z0-9.-]{0,95}$/.test(item.key) &&
    typeof item.id === "string" &&
    typeof item.label === "string" && item.label.length > 0 &&
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
    const work = [...(manifest?.expressions ?? []), ...(manifest?.works ?? [])]
      .find((candidate) => candidate.canonId === canonId);
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
      typeof segment.id === "string" && (
        segment.id.startsWith(`${canonId}.`) ||
        (canonId === "DHP" && /^dhp\d+:/.test(segment.id)) ||
        (/^(?:DN|MN)\d+$/.test(canonId) && /^(?:dn|mn)\d+:/.test(segment.id)) ||
        (/^(?:SN|AN)\d+$/.test(canonId) && /^(?:sn|an)\d+\./.test(segment.id)) ||
        (/^(?:BV|CND|CP|ITI|JA|KP|MIL|MND|NE|PDHP|PE|PLI-TV-(?:BU|BI)-(?:PM|VB)|PLI-TV-(?:KD|PVR)|PS|PV|SF36|SF276|SNP|THA-AP|THAG|THI-AP|THIG|UD|VV)$/.test(canonId) &&
          /^[a-z][a-z0-9.-]*:\d+(?:[.-]\d+)*$/.test(segment.id))
      ) &&
      typeof segment.text === "string" && segment.text.length > 0 &&
      segment.juan === value.folio.juan &&
      segment.page === (value.folio.sourcePage ?? value.folio.label)
    ));
    return valid ? value : null;
  } catch {
    return null;
  }
});

const loadCompleteReading = cache(async (slug: string) => {
  const asset = completeAssets[slug];
  if (!asset) return null;
  const sourceParts = await Promise.all(asset.localPaths.map(readControlledCorpusAsset));
  if (asset.parser === "bilara_root_json") {
    return parseBilaraDhammapadaSources(sourceParts.map((text, index) => ({
      filename: asset.localPaths[index].split("/").at(-1),
      text,
    })));
  }
  if (asset.parser === "bilara_single_root_json") {
    return parseBilaraSuttaSource({
      filename: asset.localPaths[0].split("/").at(-1),
      text: sourceParts[0],
    });
  }
  if (asset.parser === "bilara_collection_root_json") {
    return parseBilaraCollectionSources(sourceParts.map((text, index) => ({
      filename: asset.localPaths[index].split("/").at(-1),
      text,
    })));
  }
  if (asset.parser === "bilara_series_root_json") {
    return parseBilaraSeriesSources(sourceParts.map((text, index) => ({
      filename: asset.localPaths[index].split("/").at(-1),
      text,
    })), asset.parserOptions);
  }
  const segments = sourceParts.flatMap((xml) => parseCbetaReadingLines(xml, { canonId: asset.canonId }));
  return { segments, navigation: buildPageNavigation(segments) };
});

async function readControlledCorpusAsset(localPath: string) {
  const root = process.cwd();
  if (/^cbeta\/[A-Za-z0-9._-]+\.xml$/.test(localPath)) {
    return readFile(join(root, "data", "corpus", "cbeta", localPath.slice("cbeta/".length)), "utf8");
  }
  const dhammapadaPrefix = "suttacentral/root/pli/ms/sutta/kn/dhp/";
  if (localPath.startsWith(dhammapadaPrefix) && /^dhp\d+-\d+_root-pli-ms\.json$/.test(localPath.slice(dhammapadaPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "sutta", "kn", "dhp", localPath.slice(dhammapadaPrefix.length)), "utf8");
  }
  const dighaPrefix = "suttacentral/root/pli/ms/sutta/dn/";
  if (localPath.startsWith(dighaPrefix) && /^dn\d+_root-pli-ms\.json$/.test(localPath.slice(dighaPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "sutta", "dn", localPath.slice(dighaPrefix.length)), "utf8");
  }
  const majjhimaPrefix = "suttacentral/root/pli/ms/sutta/mn/";
  if (localPath.startsWith(majjhimaPrefix) && /^mn\d+_root-pli-ms\.json$/.test(localPath.slice(majjhimaPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "sutta", "mn", localPath.slice(majjhimaPrefix.length)), "utf8");
  }
  const samyuttaPrefix = "suttacentral/root/pli/ms/sutta/sn/";
  if (localPath.startsWith(samyuttaPrefix) && /^sn\d+\/sn\d+\.\d+(?:-\d+)?_root-pli-ms\.json$/.test(localPath.slice(samyuttaPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "sutta", "sn", localPath.slice(samyuttaPrefix.length)), "utf8");
  }
  const anguttaraPrefix = "suttacentral/root/pli/ms/sutta/an/";
  if (localPath.startsWith(anguttaraPrefix) && /^an\d+\/an\d+\.\d+(?:-\d+)?_root-pli-ms\.json$/.test(localPath.slice(anguttaraPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "sutta", "an", localPath.slice(anguttaraPrefix.length)), "utf8");
  }
  const khuddakaPrefix = "suttacentral/root/pli/ms/sutta/kn/";
  const khuddakaRelative = localPath.startsWith(khuddakaPrefix)
    ? localPath.slice(khuddakaPrefix.length)
    : "";
  if (
    /^((?:tha-ap|thi-ap|bv|cnd|cp|iti|ja|kp|mil|mnd|ne|pe|ps|pv|snp|thag|thig|ud|vv))\/(?:vagga\d+\/)?\1\d+(?:\.\d+)*_root-pli-ms\.json$/.test(khuddakaRelative)
  ) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "sutta", "kn", khuddakaRelative), "utf8");
  }
  const sanskritPrefix = "suttacentral/root/san/sutta/sf/";
  if (localPath.startsWith(sanskritPrefix) && /^sf(?:36|276)_root-san\.json$/.test(localPath.slice(sanskritPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "san", "sutta", "sf", localPath.slice(sanskritPrefix.length)), "utf8");
  }
  const prakritPrefix = "suttacentral/root/pra/pts/sutta/pdhp/";
  if (localPath.startsWith(prakritPrefix) && /^pdhp\d+-\d+_root-pra-pts\.json$/.test(localPath.slice(prakritPrefix.length))) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pra", "pts", "sutta", "pdhp", localPath.slice(prakritPrefix.length)), "utf8");
  }
  const vinayaPrefix = "suttacentral/root/pli/ms/vinaya/";
  const vinayaRelative = localPath.startsWith(vinayaPrefix)
    ? localPath.slice(vinayaPrefix.length)
    : "";
  if (
    /^(?:pli-tv-(?:bu|bi)-pm_root-pli-ms\.json|pli-tv-(?:bu|bi)-vb\/(?:pli-tv-(?:bu|bi)-vb-[a-z]+\/)?pli-tv-(?:bu|bi)-vb-[a-z]+\d+(?:\.\d+)*(?:-\d+)?_root-pli-ms\.json|pli-tv-(?:kd|pvr)\/pli-tv-(?:kd|pvr)\d+(?:\.\d+)*(?:-\d+)?_root-pli-ms\.json)$/.test(vinayaRelative)
  ) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "vinaya", vinayaRelative), "utf8");
  }
  const abhidhammaPrefix = "suttacentral/root/pli/ms/abhidhamma/";
  const abhidhammaRelative = localPath.startsWith(abhidhammaPrefix)
    ? localPath.slice(abhidhammaPrefix.length)
    : "";
  if (
    /^(?:ds\/ds\d+\/ds\d+(?:\.\d+)+(?:-\d+)?|vb\/vb\d+(?:-\d+)?|dt\/dt\d+\/dt\d+(?:\.\d+)+(?:-\d+)?|pp\/pp\d+\/pp\d+(?:\.\d+)+(?:-\d+)?|kv\/kv\d+\/kv\d+(?:\.\d+)+(?:-\d+)?|ya\/ya\d+\/ya\d+(?:\.\d+)+(?:-\d+)?|patthana\/patthana\d+\/patthana\d+(?:\.\d+)+(?:-\d+)?)_root-pli-ms\.json$/.test(abhidhammaRelative)
  ) {
    return readFile(join(root, "data", "corpus", "suttacentral", "root", "pli", "ms", "abhidhamma", abhidhammaRelative), "utf8");
  }
  throw new Error(`拒绝读取未登记的语料路径：${localPath}`);
}

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

  const completeReading = await loadCompleteReading(sutra.slug);
  if (!completeReading) throw new Error(`${sutra.slug} 缺少完整原文读取配置`);
  const sampleMetadata = new Map(sutra.segments.map((segment) => [segment.id, segment]));
  const segments = completeReading.segments.map((line) => {
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
    navigation: completeReading.navigation,
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
    const sourceSegments = remote?.segments ?? (await loadCompleteReading(sutra.slug))?.segments.filter(
      (segment) => segment.juan === item.juan && segment.page === (item.sourcePage ?? item.label),
    );
    if (!sourceSegments?.length) return undefined;
    segments = sourceSegments.map((segment) => ({
      ...segment,
      note: sampleMetadata.get(segment.id)?.note,
      legacyIds: sampleMetadata.get(segment.id)?.legacyIds,
    }));
  } else if (reading.complete) {
    segments = reading.segments.filter((segment) =>
      segment.juan === item.juan && segment.page === (item.sourcePage ?? item.label));
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
