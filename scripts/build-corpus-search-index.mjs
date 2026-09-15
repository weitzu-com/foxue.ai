import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseBilaraDhammapadaSources,
  parseBilaraCollectionSources,
  parseBilaraSeriesSources,
  parseBilaraSuttaSource,
} from "../src/lib/bilara-reading.mjs";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";
import {
  buildCorpusSearchGrams,
  corpusSearchDocumentShardSize,
  corpusSearchLanguageCode,
  corpusSearchPointerSchema,
  corpusSearchSchema,
  corpusSearchShardCount,
  corpusSearchShardId,
  corpusSearchShardLabel,
  normalizeCorpusSearchText,
} from "../src/lib/corpus-search-contract.mjs";
import { parseDergeSources } from "../src/lib/derge-reading.mjs";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";
import { loadCorpusReleaseContext } from "./corpus-release-context.mjs";

const root = process.cwd();
const write = process.argv.includes("--write");
const argument = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const maxExpressionsValue = argument("max-expressions");
const maxExpressions = maxExpressionsValue === undefined ? null : Number(maxExpressionsValue);
if (maxExpressions !== null && (!Number.isInteger(maxExpressions) || maxExpressions < 1)) {
  throw new Error("--max-expressions 必须是正整数");
}
const intermediateBufferBytes = 128 * 1024;
const languageCodes = ["zh", "bo", "pi", "en", "ja", "indic", "other"];
const languageCodeIds = new Map(languageCodes.map((code, index) => [code, index]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value)}\n`);
const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const sourceUnits = (file) => file.sourceParts ?? [file];

const { releaseId: corpusReleaseId, sourceManifests } = await loadCorpusReleaseContext(root);
const [builderBytes, contractBytes] = await Promise.all([
  readFile(fileURLToPath(import.meta.url)),
  readFile(resolve(root, "src/lib/corpus-search-contract.mjs")),
]);
const builderFingerprint = sha256(Buffer.concat([
  Buffer.from(`${corpusReleaseId}\0`),
  builderBytes,
  Buffer.from("\0"),
  contractBytes,
])).slice(0, 12);
const corpusVersion = corpusReleaseId.split("-")[1] ?? "unknown";
const corpusFingerprint = corpusReleaseId.split("-").at(-1) ?? sha256(corpusReleaseId).slice(0, 12);
const fixtureSuffix = maxExpressions === null ? "" : `-fixture-${maxExpressions}`;
const searchReleaseId = `search-${corpusVersion}-${corpusFingerprint}-${builderFingerprint}${fixtureSuffix}`;
const outputRoot = resolve(root, "artifacts", "corpus-search", searchReleaseId);
const intermediateRoot = resolve(outputRoot, ".postings");
const searchPrefix = `v1/search/releases/${searchReleaseId}`;
const objectEntries = [];

async function writeGenerated(relativePath, bytes) {
  const destination = resolve(outputRoot, relativePath);
  if (!destination.startsWith(`${outputRoot}/`)) throw new Error(`拒绝越界输出：${relativePath}`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  return destination;
}

async function addObject(key, bytes, cacheControl = "public, max-age=31536000, immutable") {
  await writeGenerated(key, bytes);
  const entry = {
    key,
    relativePath: key,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentType: "application/json; charset=utf-8",
    cacheControl,
  };
  objectEntries.push(entry);
  return entry;
}

async function loadPresentationMap(sourceManifestEntry) {
  const catalogPath = sourceManifestEntry.relativePath.replace("manifest", "catalog");
  let catalog;
  try {
    catalog = JSON.parse(await readFile(resolve(root, catalogPath), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return new Map();
  }
  return new Map((catalog.files ?? []).map((file) => [file.id, file]));
}

async function loadExpression(sourceFile) {
  const sources = sourceUnits(sourceFile);
  const sourceContents = [];
  let segments = [];
  let navigation = [];
  for (const source of sources) {
    const path = resolve(root, source.localPath);
    const bytes = await readFile(path);
    if (sha256(bytes) !== source.localSha256) throw new Error(`${source.id} 搜索源文件哈希不一致`);
    const text = bytes.toString("utf8");
    sourceContents.push({ ...source, filename: basename(source.localPath), text });
    if ((sourceFile.parser ?? "cbeta_tei") === "cbeta_tei") {
      segments.push(...parseCbetaReadingLines(text, { canonId: sourceFile.id }));
    }
  }

  if (sourceFile.parser === "bilara_root_json") {
    ({ segments, navigation } = parseBilaraDhammapadaSources(sourceContents));
  } else if (sourceFile.parser === "bilara_single_root_json") {
    ({ segments, navigation } = parseBilaraSuttaSource(sourceContents[0]));
  } else if (sourceFile.parser === "bilara_collection_root_json") {
    ({ segments, navigation } = parseBilaraCollectionSources(sourceContents));
  } else if (sourceFile.parser === "bilara_series_root_json") {
    ({ segments, navigation } = parseBilaraSeriesSources(sourceContents, sourceFile.parserOptions));
  } else if (sourceFile.parser === "derge_plain_text") {
    ({ segments, navigation } = parseDergeSources(sourceContents, { canonId: sourceFile.id }));
  } else if (sourceFile.parser === "sat_tei") {
    segments = sourceContents.flatMap((source) => parseSatReadingLines(source.text, { canonId: sourceFile.id }));
    navigation = buildPageNavigation(segments);
  } else {
    navigation = buildPageNavigation(segments);
  }

  return { navigation, segments };
}

function groupSegmentsByFolio(segments, navigation) {
  const groups = new Map(navigation.map((item) => [
    `${item.juan}\0${item.sourcePage ?? item.label}`,
    [],
  ]));
  for (const segment of segments) {
    const key = `${segment.juan}\0${segment.page}`;
    const group = groups.get(key);
    if (group) group.push(segment);
  }
  return groups;
}

function encodePostingList(documentIds) {
  const bytes = [];
  let previous = 0;
  for (const documentId of documentIds) {
    let value = documentId - previous;
    previous = documentId;
    do {
      let byte = value & 0x7f;
      value >>>= 7;
      if (value > 0) byte |= 0x80;
      bytes.push(byte);
    } while (value > 0);
  }
  return Buffer.from(bytes).toString("base64");
}

if (!write) {
  try {
    const existing = JSON.parse(await readFile(resolve(outputRoot, `${searchPrefix}/manifest.json`), "utf8"));
    if (existing.schema !== corpusSearchSchema || existing.searchReleaseId !== searchReleaseId) {
      throw new Error("搜索清单身份不一致");
    }
    for (const object of existing.objects) {
      const path = resolve(outputRoot, object.key);
      const bytes = await readFile(path);
      if (bytes.length !== object.bytes || sha256(bytes) !== object.sha256) {
        throw new Error(`${object.key} 搜索对象哈希不一致`);
      }
    }
    console.log(`已验证全文精确检索索引：${existing.totals.documents} 个版页、${existing.totals.uniqueGrams} 个三字组。`);
    process.exit(0);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`搜索索引尚未生成；运行 node scripts/build-corpus-search-index.mjs --write${maxExpressions === null ? "" : ` --max-expressions=${maxExpressions}`}`);
    }
    throw error;
  }
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(intermediateRoot, { recursive: true });

const postingBuffers = Array.from({ length: corpusSearchShardCount }, () => []);
const postingBufferSizes = new Uint32Array(corpusSearchShardCount);
const languageMap = [];
let documentBuffer = [];
let documentShardId = 0;
let expressionCount = 0;
let segmentCount = 0;
let documentCount = 0;
let indexedDocumentCount = 0;
let normalizedCodePointCount = 0;
let postingCount = 0;

async function flushPostingBuffer(shardId) {
  if (postingBuffers[shardId].length === 0) return;
  const path = resolve(intermediateRoot, `${corpusSearchShardLabel(shardId)}.tsv`);
  await appendFile(path, postingBuffers[shardId].join(""));
  postingBuffers[shardId] = [];
  postingBufferSizes[shardId] = 0;
}

async function flushDocumentBuffer() {
  if (documentBuffer.length === 0) return;
  const label = documentShardId.toString().padStart(4, "0");
  await addObject(
    `${searchPrefix}/documents/${label}.json`,
    jsonBytes({
      schema: "https://foxue.ai/schemas/corpus-search-documents-v0.1",
      searchReleaseId,
      shard: documentShardId,
      firstDocumentId: documentBuffer[0].id,
      documents: documentBuffer,
    }),
  );
  documentBuffer = [];
  documentShardId += 1;
}

outer: for (const sourceManifestEntry of sourceManifests) {
  const presentationMap = await loadPresentationMap(sourceManifestEntry);
  for (const sourceFile of sourceManifestEntry.manifest.files) {
    if (maxExpressions !== null && expressionCount >= maxExpressions) break outer;
    const catalogFile = presentationMap.get(sourceFile.id);
    const presentation = catalogFile?.presentation ?? sourceFile.presentation ?? {};
    const language = presentation.language ?? sourceFile.language ?? "未标语言";
    const languageCode = corpusSearchLanguageCode(language);
    const languageCodeId = languageCodeIds.get(languageCode) ?? languageCodeIds.get("other");
    const { navigation, segments } = await loadExpression(sourceFile);
    const groupedSegments = groupSegmentsByFolio(segments, navigation);
    expressionCount += 1;
    segmentCount += segments.length;

    for (const item of navigation) {
      const folioSegments = groupedSegments.get(`${item.juan}\0${item.sourcePage ?? item.label}`) ?? [];
      const normalizedText = normalizeCorpusSearchText(folioSegments.map((segment) => segment.text).join("\n"));
      const grams = buildCorpusSearchGrams(normalizedText);
      const documentId = documentCount;
      documentCount += 1;
      languageMap.push(languageCodeId);
      normalizedCodePointCount += Array.from(normalizedText).length;
      if (grams.length > 0) indexedDocumentCount += 1;

      const linesByShard = new Map();
      for (const gram of grams) {
        const shardId = corpusSearchShardId(gram);
        const lines = linesByShard.get(shardId) ?? [];
        lines.push(`${gram}\t${documentId}\n`);
        linesByShard.set(shardId, lines);
      }
      postingCount += grams.length;
      for (const [shardId, lines] of linesByShard) {
        const text = lines.join("");
        postingBuffers[shardId].push(text);
        postingBufferSizes[shardId] += Buffer.byteLength(text);
        if (postingBufferSizes[shardId] >= intermediateBufferBytes) {
          await flushPostingBuffer(shardId);
        }
      }

      documentBuffer.push({
        id: documentId,
        expressionId: sourceFile.id,
        slug: sourceFile.slug,
        title: presentation.title ?? sourceFile.id,
        canonRef: presentation.canonRef ?? sourceFile.id,
        language,
        languageCode,
        folioKey: item.key,
        folioLabel: item.label,
        juan: item.juan,
        firstSegmentId: item.id,
      });
      if (documentBuffer.length >= corpusSearchDocumentShardSize) await flushDocumentBuffer();
    }

    if (expressionCount % 100 === 0) {
      console.log(`已索引 ${expressionCount} 个文本表达、${documentCount} 个版页。`);
    }
  }
}

await Promise.all(postingBuffers.map((_, shardId) => flushPostingBuffer(shardId)));
await flushDocumentBuffer();

let uniqueGramCount = 0;
let nonEmptyGramShards = 0;
let largestPostingList = 0;
let largestGramShardBytes = 0;
const gramShardLabels = [];
for (let shardId = 0; shardId < corpusSearchShardCount; shardId += 1) {
  const label = corpusSearchShardLabel(shardId);
  const path = resolve(intermediateRoot, `${label}.tsv`);
  try {
    await stat(path);
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }
  const lines = (await readFile(path, "utf8")).split("\n").filter(Boolean);
  const postings = new Map();
  for (const line of lines) {
    const separator = line.lastIndexOf("\t");
    const gram = line.slice(0, separator);
    const documentId = Number(line.slice(separator + 1));
    const documents = postings.get(gram) ?? [];
    documents.push(documentId);
    postings.set(gram, documents);
  }
  const encoded = {};
  for (const gram of [...postings.keys()].sort(compareText)) {
    const documents = postings.get(gram);
    largestPostingList = Math.max(largestPostingList, documents.length);
    encoded[gram] = encodePostingList(documents);
  }
  const bytes = jsonBytes({
    schema: "https://foxue.ai/schemas/corpus-search-grams-v0.1",
    searchReleaseId,
    shard: label,
    grams: encoded,
  });
  await addObject(`${searchPrefix}/grams/${label}.json`, bytes);
  uniqueGramCount += postings.size;
  nonEmptyGramShards += 1;
  largestGramShardBytes = Math.max(largestGramShardBytes, bytes.length);
  gramShardLabels.push(label);
  if (nonEmptyGramShards % 128 === 0) {
    console.log(`已压缩 ${nonEmptyGramShards} 个三字组分片。`);
  }
}

const languageMapEntry = await addObject(
  `${searchPrefix}/meta/languages.json`,
  jsonBytes({
    schema: "https://foxue.ai/schemas/corpus-search-language-map-v0.1",
    searchReleaseId,
    codes: languageCodes,
    documentCodesBase64: Buffer.from(languageMap).toString("base64"),
  }),
);

const immutableObjects = [...objectEntries];
const manifestDocument = {
  schema: corpusSearchSchema,
  searchReleaseId,
  corpusReleaseId,
  builderFingerprint,
  fixture: maxExpressions !== null,
  contract: {
    matchMode: "unicode_nfkc_lowercase_punctuation_and_space_insensitive_exact_substring",
    gramSize: 3,
    minimumNormalizedQueryCodePoints: 3,
    maximumNormalizedQueryCodePoints: 80,
    automaticSemanticExpansion: false,
    automaticTraditionalSimplifiedConversion: false,
    resultUnit: "folio",
  },
  totals: {
    expressions: expressionCount,
    segments: segmentCount,
    documents: documentCount,
    indexedDocuments: indexedDocumentCount,
    normalizedCodePoints: normalizedCodePointCount,
    postings: postingCount,
    uniqueGrams: uniqueGramCount,
    configuredGramShards: corpusSearchShardCount,
    nonEmptyGramShards,
    documentShards: documentShardId,
    largestPostingList,
    largestGramShardBytes,
  },
  languageCodes,
  gramShardLabels,
  languageMapObjectKey: languageMapEntry.key,
  objects: immutableObjects.map(({ key, bytes, sha256: digest, contentType, cacheControl }) => ({
    key,
    bytes,
    sha256: digest,
    contentType,
    cacheControl,
  })),
};
const manifestEntry = await addObject(`${searchPrefix}/manifest.json`, jsonBytes(manifestDocument));
const pointerEntry = await addObject(
  "v1/search/latest.json",
  jsonBytes({
    schema: corpusSearchPointerSchema,
    searchReleaseId,
    corpusReleaseId,
    manifestObjectKey: manifestEntry.key,
    manifestSha256: manifestEntry.sha256,
  }),
  "public, max-age=60, stale-while-revalidate=300",
);

const uploadPlan = {
  schema: "https://foxue.ai/schemas/corpus-search-upload-plan-v0.1",
  releaseId: searchReleaseId,
  corpusReleaseId,
  bucket: "foxue-ai-corpus",
  entries: [...objectEntries.filter((entry) => entry !== pointerEntry), pointerEntry],
};
await writeGenerated("upload-plan.json", Buffer.from(`${JSON.stringify(uploadPlan, null, 2)}\n`));
await writeGenerated(
  "SHA256SUMS",
  Buffer.from(uploadPlan.entries.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join("\n") + "\n"),
);
await rm(intermediateRoot, { recursive: true, force: true });

console.log(
  `全文精确检索索引已生成：${searchReleaseId}；${expressionCount} 个文本表达、` +
  `${documentCount} 个版页、${uniqueGramCount} 个三字组、${objectEntries.length} 个对象。`,
);
