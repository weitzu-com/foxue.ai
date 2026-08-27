import { createHash } from "node:crypto";
import { open, readFile } from "node:fs/promises";
import { cache } from "react";
import corpusManifest from "../../data/corpus/cbeta/manifest-v4.23.0.json";
import nanchuanManifest from "../../data/corpus/cbeta/nanchuan-manifest-v1.0.0.json";
import beyondTaishoSutraManifest from "../../data/corpus/cbeta/beyond-taisho-sutra-manifest-v1.0.0.json";
import satModernJapaneseManifest from "../../data/corpus/sat/modern-japanese-manifest-v1.0.0.json";
import wikisourceKokuyakuDhpManifest from "../../data/corpus/wikisource/kokuyaku-dhp-manifest-v1.0.0.json";
import sujatoEnglishManifest from "../../data/corpus/suttacentral/sujato-en-manifest-v1.0.0.json";
import suttacentralManifest from "../../data/corpus/suttacentral/manifest-v0.7.0.json";
import dighaNikayaManifest from "../../data/corpus/suttacentral/dn-manifest-v0.8.0.json";
import majjhimaNikayaManifest from "../../data/corpus/suttacentral/mn-manifest-v0.9.0.json";
import samyuttaNikayaManifest from "../../data/corpus/suttacentral/sn-manifest-v1.0.0.json";
import anguttaraNikayaManifest from "../../data/corpus/suttacentral/an-manifest-v1.1.0.json";
import khuddakaNikayaManifest from "../../data/corpus/suttacentral/kn-manifest-v1.2.0.json";
import indicRootManifest from "../../data/corpus/suttacentral/indic-manifest-v1.3.0.json";
import vinayaRootManifest from "../../data/corpus/suttacentral/vinaya-manifest-v1.4.0.json";
import abhidhammaRootManifest from "../../data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json";
import lzhRootManifest from "../../data/corpus/suttacentral/lzh-manifest-v1.6.0.json";
import dergeKangyurManifest from "../../data/corpus/derge/manifest-v0.1.0.json";
import type { Sutra, SutraSegment } from "@/data/sutras";
import type { SegmentFolioRange } from "@/lib/reader-routes";
import {
  parseBilaraCollectionSources as parseBilaraCollectionFolio,
  parseBilaraDhammapadaSources as parseBilaraDhammapadaFolio,
} from "@/lib/bilara-reading-folio.mjs";
import {
  parseBilaraDhammapadaSources,
  parseBilaraCollectionSources,
  parseBilaraSeriesSources,
  parseBilaraSuttaSource,
} from "@/lib/bilara-reading.mjs";
import { parseCbetaFolioSlice } from "@/lib/cbeta-tei-folio.mjs";
import { parseSatFolioSlice } from "@/lib/sat-tei-folio.mjs";
import { parseSatReadingLines } from "@/lib/sat-tei.mjs";
import { buildPageNavigation, parseCbetaReadingLines } from "@/lib/cbeta-tei.mjs";
import { getSutraCatalogView } from "@/lib/corpus-folio-index";
import { getFolioLocator, workUsesFolioLocator } from "@/lib/corpus-folio-locator";
import { folioLocatorMaxSliceBytes } from "@/lib/corpus-folio-locator-paths.mjs";
import { parseDergeFolioSlice } from "@/lib/derge-reading-folio.mjs";
import { parseDergeSources } from "@/lib/derge-reading.mjs";

type CorpusSourcePart = {
  localPath: string;
  volume?: string;
  initialPage?: string;
  initialLine?: string;
};

type CorpusManifestFile = {
  id: string;
  slug: string;
  parser?: "cbeta_tei" | "sat_tei" | "bilara_root_json" | "bilara_single_root_json" | "bilara_collection_root_json" | "bilara_series_root_json" | "derge_plain_text";
  localPath?: string;
  sourceParts?: CorpusSourcePart[];
  parserOptions?: BilaraSeriesParserOptions;
};

type CorpusParser = "cbeta_tei" | "sat_tei" | "bilara_root_json" | "bilara_single_root_json" | "bilara_collection_root_json" | "bilara_series_root_json" | "derge_plain_text";
type BilaraSeriesParserOptions = {
  maxSegments?: number;
  collectionTitle?: string;
  collectionPrefix?: string;
  titleSuffixes?: string[];
  omitEmptySegments?: boolean;
};

const completeAssets: Record<string, { sources: CorpusSourcePart[]; canonId: string; parser: CorpusParser; parserOptions?: BilaraSeriesParserOptions }> = Object.fromEntries(
  [
    ...(corpusManifest.files as CorpusManifestFile[]).map((file) => ({ ...file, parser: "cbeta_tei" as const })),
    ...(nanchuanManifest.files as CorpusManifestFile[]).map((file) => ({ ...file, parser: "cbeta_tei" as const })),
    ...(beyondTaishoSutraManifest.files as CorpusManifestFile[]).map((file) => ({ ...file, parser: "cbeta_tei" as const })),
    ...(satModernJapaneseManifest.files as CorpusManifestFile[]).map((file) => ({ ...file, parser: (file.parser ?? "sat_tei") as CorpusParser })),
    ...(wikisourceKokuyakuDhpManifest.files as CorpusManifestFile[]).map((file) => ({ ...file, parser: (file.parser ?? "sat_tei") as CorpusParser })),
    ...(sujatoEnglishManifest.files as CorpusManifestFile[]),
    ...(suttacentralManifest.files as CorpusManifestFile[]),
    ...(dighaNikayaManifest.files as CorpusManifestFile[]),
    ...(majjhimaNikayaManifest.files as CorpusManifestFile[]),
    ...(samyuttaNikayaManifest.files as CorpusManifestFile[]),
    ...(anguttaraNikayaManifest.files as CorpusManifestFile[]),
    ...(khuddakaNikayaManifest.files as CorpusManifestFile[]),
    ...(indicRootManifest.files as CorpusManifestFile[]),
    ...(vinayaRootManifest.files as CorpusManifestFile[]),
    ...(abhidhammaRootManifest.files as CorpusManifestFile[]),
    ...(lzhRootManifest.files as CorpusManifestFile[]),
    ...(dergeKangyurManifest.files as CorpusManifestFile[]),
  ].map((file) => [
    file.slug,
    {
      sources: (file.sourceParts ?? [{ localPath: file.localPath! }]).map((source) => {
        if (!source.localPath.startsWith("data/corpus/")) {
          throw new Error(`语料路径越界：${source.localPath}`);
        }
        return { ...source, localPath: source.localPath.slice("data/corpus/".length) };
      }),
      canonId: file.id,
      parser: file.parser ?? "cbeta_tei",
      parserOptions: file.parserOptions,
    },
  ]),
);

const projectRoot = process.cwd().replace(/\/$/, "");

function normalizeCorpusLocalPath(localPath: string) {
  if (
    localPath.startsWith("/") ||
    localPath.includes("\0") ||
    localPath.includes("\\") ||
    localPath === ".." ||
    localPath.startsWith("../") ||
    localPath.includes("/../")
  ) {
    throw new Error(`语料路径越界：${localPath}`);
  }
  return localPath;
}

const registeredCorpusAssetPaths = new Map<string, string>();
for (const asset of Object.values(completeAssets)) {
  for (const source of asset.sources) {
    if (!registeredCorpusAssetPaths.has(source.localPath)) {
      const normalized = normalizeCorpusLocalPath(source.localPath);
      registeredCorpusAssetPaths.set(
        source.localPath,
        `${projectRoot}/data/corpus/${normalized}`,
      );
    }
  }
}

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
  segmentFolios?: Record<string, string>;
  segmentFolioRanges?: Record<string, SegmentFolioRange[]>;
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
        (/^(?:BV|CND|CP|ITI|JA|KP|LZH-(?:MA|SA|EA|T0765|T1536|T1537|T1548)|MIL|MND|NE|PDHP|PE|PLI-TV-(?:BU|BI)-(?:PM|VB)|PLI-TV-(?:KD|PVR)|PS|PV|SF36|SF276|SNP|THA-AP|THAG|THI-AP|THIG|UD|VV)$/.test(canonId) &&
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
  if (workUsesFolioLocator(slug)) {
    throw new Error(`${slug} 是肥胖母版，禁止在请求时整本解析`);
  }
  const asset = completeAssets[slug];
  if (!asset) return null;
  const sourceParts = await Promise.all(asset.sources.map((source) => readControlledCorpusAsset(source.localPath)));
  if (asset.parser === "bilara_root_json") {
    return parseBilaraDhammapadaSources(sourceParts.map((text, index) => ({
      filename: asset.sources[index].localPath.split("/").at(-1),
      text,
    })));
  }
  if (asset.parser === "bilara_single_root_json") {
    return parseBilaraSuttaSource({
      filename: asset.sources[0].localPath.split("/").at(-1),
      text: sourceParts[0],
    });
  }
  if (asset.parser === "bilara_collection_root_json") {
    return parseBilaraCollectionSources(sourceParts.map((text, index) => ({
      filename: asset.sources[index].localPath.split("/").at(-1),
      text,
    })));
  }
  if (asset.parser === "bilara_series_root_json") {
    return parseBilaraSeriesSources(sourceParts.map((text, index) => ({
      filename: asset.sources[index].localPath.split("/").at(-1),
      text,
    })), asset.parserOptions);
  }
  if (asset.parser === "derge_plain_text") {
    return parseDergeSources(sourceParts.map((text, index) => ({
      ...asset.sources[index],
      filename: asset.sources[index].localPath.split("/").at(-1),
      text,
    })), { canonId: asset.canonId });
  }
  if (asset.parser === "sat_tei") {
    const segments = sourceParts.flatMap((xml) => parseSatReadingLines(xml, { canonId: asset.canonId }));
    return { segments, navigation: buildPageNavigation(segments) };
  }
  const segments = sourceParts.flatMap((xml) => parseCbetaReadingLines(xml, { canonId: asset.canonId }));
  return { segments, navigation: buildPageNavigation(segments) };
});

export class CorpusAssetMissingError extends Error {
  readonly assetPath: string;

  constructor(assetPath: string) {
    super(`语料资产缺失：${assetPath}`);
    this.name = "CorpusAssetMissingError";
    this.assetPath = assetPath;
  }
}

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === "object" && "code" in error);
}

async function readControlledCorpusAsset(localPath: string) {
  const assetPath = registeredCorpusAssetPaths.get(localPath);
  if (!assetPath) throw new Error(`拒绝读取未登记的语料路径：${localPath}`);
  try {
    return await readFile(assetPath, "utf8");
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      throw new CorpusAssetMissingError(assetPath);
    }
    throw error;
  }
}

async function readControlledCorpusAssetRange(localPath: string, start: number, end: number) {
  const assetPath = registeredCorpusAssetPaths.get(localPath);
  if (!assetPath) throw new Error(`拒绝读取未登记的语料路径：${localPath}`);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start) {
    throw new Error(`拒绝读取无效的语料切片：${localPath}`);
  }
  const length = end - start;
  if (length > folioLocatorMaxSliceBytes) {
    throw new Error(`${localPath} 版页切片超过 ${folioLocatorMaxSliceBytes} 字节`);
  }
  try {
    const handle = await open(assetPath, "r");
    try {
      const bytes = Buffer.alloc(length);
      const { bytesRead } = await handle.read(bytes, 0, length, start);
      return bytes.subarray(0, bytesRead).toString("utf8");
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      throw new CorpusAssetMissingError(assetPath);
    }
    throw error;
  }
}

function remapFolioJuan(segments: SutraSegment[], item: ReaderNavigationItem) {
  return segments
    .filter((segment) => segment.page === (item.sourcePage ?? item.label))
    .map((segment) => ({
      ...segment,
      juan: item.juan ?? segment.juan,
    }));
}

async function loadLocatedFolioSegments(slug: string, item: ReaderNavigationItem) {
  const locator = await getFolioLocator(slug, item.key);
  if (!locator) return null;
  const asset = completeAssets[slug];
  if (!asset) return null;

  if (locator.parser === "cbeta_tei") {
    const xml = await readControlledCorpusAssetRange(locator.partPath, locator.start, locator.end);
    return parseCbetaFolioSlice(xml, { canonId: locator.canonId, juan: item.juan ?? "001" })
      .filter((segment: { page: string }) => segment.page === (item.sourcePage ?? item.label));
  }

  if (locator.parser === "sat_tei") {
    const xml = await readControlledCorpusAssetRange(locator.partPath, locator.start, locator.end);
    return parseSatFolioSlice(xml, { canonId: locator.canonId, page: item.sourcePage ?? item.label });
  }

  if (locator.parser === "derge_plain_text") {
    const source = asset.sources.find((candidate) => candidate.localPath === locator.partPath);
    if (!source) throw new Error(`${slug} 定位分片不在受控来源中：${locator.partPath}`);
    const text = await readControlledCorpusAssetRange(locator.partPath, locator.start, locator.end);
    return parseDergeFolioSlice({
      ...source,
      filename: locator.partPath.split("/").at(-1),
      text,
      initialPage: item.sourcePage ?? item.label,
      initialLine: source.initialLine ?? "1",
    }, { canonId: locator.canonId, juan: item.juan, sourcePage: item.sourcePage ?? item.label });
  }

  const text = locator.wholePart
    ? await readControlledCorpusAsset(locator.partPath)
    : await readControlledCorpusAssetRange(locator.partPath, locator.start, locator.end);
  const filename = locator.partPath.split("/").at(-1);
  const source = { filename, localPath: locator.partPath, text };
  let reading;
  if (locator.parser === "bilara_root_json") {
    reading = parseBilaraDhammapadaFolio([source]);
  } else if (locator.parser === "bilara_single_root_json") {
    reading = parseBilaraSuttaSource(source);
  } else if (locator.parser === "bilara_collection_root_json") {
    reading = parseBilaraCollectionFolio([source]);
  } else if (locator.parser === "bilara_series_root_json") {
    reading = parseBilaraSeriesSources([source], locator.parserOptions);
  } else {
    throw new Error(`${slug} 不支持的定位解析器：${locator.parser}`);
  }
  return remapFolioJuan(reading.segments, item);
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

  const catalog = await getSutraCatalogView(sutra.slug);
  if (!catalog) throw new Error(`${sutra.slug} 缺少完整原文读取配置`);

  return {
    complete: true,
    source: "local",
    canonId: asset.canonId,
    segmentCount: catalog.segmentCount,
    segments: sutra.segments,
    navigation: catalog.navigation,
    segmentFolios: catalog.segmentFolios,
    segmentFolioRanges: catalog.segmentFolioRanges,
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
    let sourceSegments = remote?.segments;
    if (!sourceSegments?.length) {
      try {
        sourceSegments = await loadLocatedFolioSegments(sutra.slug, item) ?? undefined;
        if (!sourceSegments?.length && !workUsesFolioLocator(sutra.slug)) {
          sourceSegments = (await loadCompleteReading(sutra.slug))?.segments.filter(
            (segment) => segment.juan === item.juan && segment.page === (item.sourcePage ?? item.label),
          );
        }
      } catch (error) {
        if (error instanceof CorpusAssetMissingError) return undefined;
        throw error;
      }
    }
    if (!sourceSegments?.length) return undefined;
    segments = sourceSegments.map((segment) => ({
      ...segment,
      note: sampleMetadata.get(segment.id)?.note,
      legacyIds: sampleMetadata.get(segment.id)?.legacyIds,
    }));
  } else if (reading.complete) {
    try {
      const located = await loadLocatedFolioSegments(sutra.slug, item);
      if (located?.length) {
        segments = located;
      } else if (!workUsesFolioLocator(sutra.slug)) {
        segments = (await loadCompleteReading(sutra.slug))?.segments.filter((segment) =>
          segment.juan === item.juan && segment.page === (item.sourcePage ?? item.label)) ?? [];
      } else {
        return undefined;
      }
    } catch (error) {
      if (error instanceof CorpusAssetMissingError) return undefined;
      throw error;
    }
    if (!segments.length) return undefined;
    const sampleMetadata = new Map(sutra.segments.map((segment) => [segment.id, segment]));
    segments = segments.map((segment) => ({
      ...segment,
      note: sampleMetadata.get(segment.id)?.note,
      legacyIds: sampleMetadata.get(segment.id)?.legacyIds,
    }));
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
