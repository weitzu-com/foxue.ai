import {
  corpusSearchDocumentShardId,
  corpusSearchDocumentShardLabel,
  corpusSearchMaxQueryLength,
  corpusSearchMinQueryLength,
  corpusSearchResultSchema,
  corpusSearchShardId,
  corpusSearchShardLabel,
  decodeCorpusSearchPostings,
  intersectCorpusSearchPostings,
  normalizeCorpusSearchText,
  selectCorpusSearchQueryGrams,
} from "../../../src/lib/corpus-search-contract.mjs";

const searchLatestKey = "v1/search/latest.json";
const allowedLanguages = new Set(["all", "zh", "bo", "pi", "en", "ja", "indic", "other"]);
const maximumCandidatesToInspect = 48;
const defaultResultLimit = 8;
const maximumResultLimit = 12;

type SearchPointer = {
  schema: string;
  searchReleaseId: string;
  corpusReleaseId: string;
  manifestObjectKey: string;
};

type SearchCursor = {
  version: 1;
  searchReleaseId: string;
  normalizedQuery: string;
  language: string;
  candidateOffset: number;
};

type SearchManifest = {
  schema: string;
  searchReleaseId: string;
  corpusReleaseId: string;
  contract: {
    matchMode: string;
    automaticSemanticExpansion: boolean;
    automaticTraditionalSimplifiedConversion: boolean;
  };
  totals: {
    expressions: number;
    documents: number;
    indexedDocuments: number;
  };
  languageCodes: string[];
  languageMapObjectKey: string;
};

type GramShard = { grams: Record<string, string> };
type LanguageMap = { codes: string[]; documentCodesBase64: string };
type SearchDocument = {
  id: number;
  expressionId: string;
  slug: string;
  title: string;
  canonRef: string;
  language: string;
  languageCode: string;
  folioKey: string;
  folioLabel: string;
  juan: string;
  firstSegmentId: string;
};
type DocumentShard = { documents: SearchDocument[] };
type CorpusSegment = { id: string; text: string };
type FolioDocument = { segments: CorpusSegment[] };

type SearchError = { status: number; body: Record<string, unknown> };

function searchError(status: number, error: string, message: string): SearchError {
  return { status, body: { error, message } };
}

async function readJson<T>(bucket: R2Bucket, key: string): Promise<T> {
  const object = await bucket.get(key);
  if (!object) throw new Error(`missing R2 object: ${key}`);
  return object.json<T>();
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function findNormalizedSpan(original: string, normalizedNeedle: string) {
  const originalPoints = Array.from(original);
  const normalizedPoints: string[] = [];
  const sourceIndexes: number[] = [];
  originalPoints.forEach((point, sourceIndex) => {
    for (const normalizedPoint of Array.from(normalizeCorpusSearchText(point))) {
      normalizedPoints.push(normalizedPoint);
      sourceIndexes.push(sourceIndex);
    }
  });
  const needlePoints = Array.from(normalizedNeedle);
  const lastStart = normalizedPoints.length - needlePoints.length;
  outer: for (let start = 0; start <= lastStart; start += 1) {
    for (let offset = 0; offset < needlePoints.length; offset += 1) {
      if (normalizedPoints[start + offset] !== needlePoints[offset]) continue outer;
    }
    return {
      originalPoints,
      start: sourceIndexes[start],
      end: sourceIndexes[start + needlePoints.length - 1] + 1,
    };
  }
  return null;
}

function confirmedExcerpt(segments: CorpusSegment[], normalizedQuery: string) {
  let source = "";
  const segmentOffsets: Array<{ id: string; start: number; end: number }> = [];
  for (const segment of segments) {
    if (source) source += "\n";
    const start = Array.from(source).length;
    source += segment.text;
    segmentOffsets.push({ id: segment.id, start, end: Array.from(source).length });
  }
  const span = findNormalizedSpan(source, normalizedQuery);
  if (!span) return null;
  const context = 42;
  const excerptStart = Math.max(0, span.start - context);
  const excerptEnd = Math.min(span.originalPoints.length, span.end + context);
  const locator = segmentOffsets.find((segment) => span.start >= segment.start && span.start <= segment.end)?.id
    ?? segments[0]?.id;
  return {
    locator,
    before: span.originalPoints.slice(excerptStart, span.start).join(""),
    match: span.originalPoints.slice(span.start, span.end).join(""),
    after: span.originalPoints.slice(span.end, excerptEnd).join(""),
    startsBeforeExcerpt: excerptStart > 0,
    continuesAfterExcerpt: excerptEnd < span.originalPoints.length,
  };
}

function parseLimit(value: string | null) {
  if (value === null || value === "") return defaultResultLimit;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximumResultLimit) return null;
  return parsed;
}

function encodeSearchCursor(cursor: SearchCursor) {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeSearchCursor(value: string): SearchCursor | null {
  if (!value || value.length > 1_024 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const remainder = value.length % 4;
    if (remainder === 1) return null;
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - remainder) % 4);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Partial<SearchCursor>;
    if (
      parsed.version !== 1 ||
      typeof parsed.searchReleaseId !== "string" ||
      typeof parsed.normalizedQuery !== "string" ||
      typeof parsed.language !== "string" ||
      !Number.isSafeInteger(parsed.candidateOffset) ||
      (parsed.candidateOffset ?? -1) < 0
    ) {
      return null;
    }
    return parsed as SearchCursor;
  } catch {
    return null;
  }
}

export async function corpusSearchStorageReady(env: Env) {
  if (!env.CORPUS) return false;
  try {
    return Boolean(await env.CORPUS.head(searchLatestKey));
  } catch {
    return false;
  }
}

export async function runCorpusSearch(url: URL, env: Env): Promise<{ status: number; body: unknown }> {
  if (!env.CORPUS) return searchError(503, "search_storage_not_ready", "全文索引尚未接入存储。");

  const input = url.searchParams.get("q")?.trim() ?? "";
  const normalized = normalizeCorpusSearchText(input);
  const queryLength = Array.from(normalized).length;
  if (queryLength < corpusSearchMinQueryLength || queryLength > corpusSearchMaxQueryLength) {
    return searchError(
      400,
      "invalid_query_length",
      `忽略空格与标点后，请输入 ${corpusSearchMinQueryLength}–${corpusSearchMaxQueryLength} 个字符。`,
    );
  }
  const language = (url.searchParams.get("language") ?? "all").toLocaleLowerCase("und");
  if (!allowedLanguages.has(language)) {
    return searchError(400, "invalid_language", "不支持这个语言筛选值。");
  }
  const limit = parseLimit(url.searchParams.get("limit"));
  if (limit === null) {
    return searchError(400, "invalid_limit", `limit 必须是 1–${maximumResultLimit} 的整数。`);
  }
  const cursorInput = url.searchParams.get("cursor");
  const cursor = cursorInput === null ? null : decodeSearchCursor(cursorInput);
  if (cursorInput !== null && !cursor) {
    return searchError(400, "invalid_cursor", "续查位置无效，请重新检索。");
  }

  try {
    const pointer = await readJson<SearchPointer>(env.CORPUS, searchLatestKey);
    const manifest = await readJson<SearchManifest>(env.CORPUS, pointer.manifestObjectKey);
    if (
      pointer.searchReleaseId !== manifest.searchReleaseId ||
      pointer.corpusReleaseId !== manifest.corpusReleaseId
    ) {
      throw new Error("search pointer and manifest disagree");
    }
    if (cursor && cursor.searchReleaseId !== manifest.searchReleaseId) {
      return searchError(409, "stale_cursor", "检索索引已更新，请从当前版本重新检索。");
    }
    if (cursor && (cursor.normalizedQuery !== normalized || cursor.language !== language)) {
      return searchError(400, "invalid_cursor", "续查位置与当前经句或语种不一致，请重新检索。");
    }
    const prefix = `v1/search/releases/${manifest.searchReleaseId}`;
    const grams = selectCorpusSearchQueryGrams(normalized);
    const shardGroups = new Map<string, string[]>();
    for (const gram of grams) {
      const shard = corpusSearchShardLabel(corpusSearchShardId(gram));
      shardGroups.set(shard, [...(shardGroups.get(shard) ?? []), gram]);
    }
    const shardEntries = await Promise.all([...shardGroups].map(async ([shard, shardGrams]) => [
      shardGrams,
      await readJson<GramShard>(env.CORPUS, `${prefix}/grams/${shard}.json`),
    ] as const));
    const postingLists: number[][] = [];
    for (const [shardGrams, shard] of shardEntries) {
      for (const gram of shardGrams) {
        const encoded = shard.grams[gram];
        if (!encoded) {
          postingLists.push([]);
          continue;
        }
        postingLists.push(decodeCorpusSearchPostings(decodeBase64(encoded)));
      }
    }
    let candidateIds = intersectCorpusSearchPostings(postingLists);
    if (language !== "all") {
      const languageMap = await readJson<LanguageMap>(env.CORPUS, manifest.languageMapObjectKey);
      const languageId = languageMap.codes.indexOf(language);
      const documentLanguages = decodeBase64(languageMap.documentCodesBase64);
      candidateIds = languageId < 0
        ? []
        : candidateIds.filter((documentId) => documentLanguages[documentId] === languageId);
    }

    const candidateCount = candidateIds.length;
    const candidateOffset = cursor?.candidateOffset ?? 0;
    if (candidateOffset > candidateCount) {
      return searchError(400, "invalid_cursor", "续查位置超出当前候选范围，请重新检索。");
    }
    const inspectIds = candidateIds.slice(candidateOffset, candidateOffset + maximumCandidatesToInspect);
    const documentShardIds = [...new Set(inspectIds.map(corpusSearchDocumentShardId))];
    const documentShards = await Promise.all(documentShardIds.map(async (shardId) => [
      shardId,
      await readJson<DocumentShard>(
        env.CORPUS,
        `${prefix}/documents/${corpusSearchDocumentShardLabel(shardId)}.json`,
      ),
    ] as const));
    const documentMap = new Map(
      documentShards.flatMap(([, shard]) => shard.documents).map((document) => [document.id, document]),
    );
    const results = [];
    let inspectedCandidates = 0;
    let consumedCandidates = 0;
    while (inspectedCandidates < inspectIds.length && results.length < limit) {
      const batchSize = Math.min(8, inspectIds.length - inspectedCandidates);
      const batchIds = inspectIds.slice(inspectedCandidates, inspectedCandidates + batchSize);
      const batch = await Promise.all(batchIds.map(async (documentId) => {
        const document = documentMap.get(documentId);
        if (!document) throw new Error(`missing search document: ${documentId}`);
        const key = `v1/releases/${manifest.corpusReleaseId}/works/${document.expressionId}/folios/${document.folioKey}.json`;
        const folio = await readJson<FolioDocument>(env.CORPUS, key);
        return { document, excerpt: confirmedExcerpt(folio.segments, normalized) };
      }));
      inspectedCandidates += batch.length;
      for (const { document, excerpt } of batch) {
        if (!excerpt) {
          consumedCandidates += 1;
          continue;
        }
        if (results.length >= limit) break;
        const anchor = excerpt.locator ? `#${encodeURIComponent(excerpt.locator)}` : "";
        results.push({
          documentId: document.id,
          title: document.title,
          canonRef: document.canonRef,
          language: document.language,
          languageCode: document.languageCode,
          folio: { key: document.folioKey, label: document.folioLabel, juan: document.juan },
          locator: excerpt.locator,
          href: `https://www.foxue.ai/jingzang/${encodeURIComponent(document.slug)}/${encodeURIComponent(document.folioKey)}${anchor}`,
          excerpt,
        });
        consumedCandidates += 1;
      }
    }
    const nextCandidateOffset = candidateOffset + consumedCandidates;
    const remainingCandidateDocuments = Math.max(0, candidateCount - nextCandidateOffset);
    const truncated = remainingCandidateDocuments > 0;
    const nextCursor = truncated
      ? encodeSearchCursor({
        version: 1,
        searchReleaseId: manifest.searchReleaseId,
        normalizedQuery: normalized,
        language,
        candidateOffset: nextCandidateOffset,
      })
      : undefined;
    return {
      status: 200,
      body: {
        schema: corpusSearchResultSchema,
        query: { input, normalized, normalizedCodePoints: queryLength, language },
        release: {
          searchReleaseId: manifest.searchReleaseId,
          corpusReleaseId: manifest.corpusReleaseId,
        },
        contract: manifest.contract,
        coverage: {
          expressions: manifest.totals.expressions,
          documents: manifest.totals.documents,
          indexedDocuments: manifest.totals.indexedDocuments,
        },
        counts: {
          candidateDocuments: candidateCount,
          candidateOffset,
          inspectedCandidates,
          nextCandidateOffset,
          remainingCandidateDocuments,
          results: results.length,
          truncated,
        },
        nextCursor,
        results,
      },
    };
  } catch (error) {
    console.error(JSON.stringify({
      message: "corpus search failed",
      error: error instanceof Error ? error.message : String(error),
    }));
    return searchError(503, "search_unavailable", "全文索引暂时不可用，请稍后再试。");
  }
}
