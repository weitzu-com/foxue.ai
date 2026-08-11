import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { parseBilaraDhammapadaSources } from "../src/lib/bilara-reading.mjs";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";
import { loadCorpusReleaseContext } from "./corpus-release-context.mjs";

const root = process.cwd();
const {
  releaseId,
  releaseFingerprint,
  sourceManifests,
} = await loadCorpusReleaseContext(root);
const outputRoot = resolve(root, "artifacts", "corpus-release", releaseId);
const objectEntries = [];
const expressionEntries = [];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sourceUnits = (file) => file.sourceParts ?? [file];

async function writeGenerated(relativePath, bytes) {
  const destination = resolve(outputRoot, relativePath);
  if (!destination.startsWith(`${outputRoot}/`)) throw new Error(`拒绝越界输出：${relativePath}`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  return destination;
}

async function addObject(key, bytes, contentType, cacheControl = "public, max-age=31536000, immutable") {
  await writeGenerated(key, bytes);
  const entry = {
    key,
    relativePath: key,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentType,
    cacheControl,
  };
  objectEntries.push(entry);
  return entry;
}

const controlledExpressions = sourceManifests.flatMap((sourceManifestEntry) =>
  sourceManifestEntry.manifest.files.map((sourceFile) => ({ sourceManifestEntry, sourceFile })));

for (const { sourceManifestEntry, sourceFile } of controlledExpressions) {
  const sourceManifest = sourceManifestEntry.manifest;
  const sources = sourceUnits(sourceFile);
  const workPrefix = `v1/releases/${releaseId}/works/${sourceFile.id}`;
  let segments = [];
  let navigation = [];
  const sourceObjects = [];
  const sourceContents = [];
  for (const [index, source] of sources.entries()) {
    const sourceBytes = await readFile(resolve(root, source.localPath));
    if (sha256(sourceBytes) !== source.localSha256) {
      throw new Error(`${source.id} 源文件哈希与受控清单不一致`);
    }
    sourceContents.push({ filename: basename(source.localPath), text: sourceBytes.toString("utf8") });
    if ((sourceFile.parser ?? "cbeta_tei") === "cbeta_tei") {
      segments.push(...parseCbetaReadingLines(sourceBytes.toString("utf8"), { canonId: sourceFile.id }));
    }
    const extension = source.format === "application/json" ? "json" : "xml";
    const sourceKey = sources.length === 1
      ? `${workPrefix}/source.${extension}`
      : `${workPrefix}/sources/${String(index + 1).padStart(2, "0")}-${basename(source.localPath)}`;
    const object = await addObject(
      sourceKey,
      sourceBytes,
      `${source.format}; charset=utf-8`,
    );
    sourceObjects.push({
      part: source.part ?? index + 1,
      id: source.id,
      objectKey: object.key,
      bytes: object.bytes,
      sha256: object.sha256,
      format: source.format,
      upstreamPath: source.upstreamPath,
      upstreamGitBlobSha1: source.upstreamGitBlobSha1,
    });
  }
  if (sourceFile.parser === "bilara_root_json") {
    ({ segments, navigation } = parseBilaraDhammapadaSources(sourceContents));
  } else {
    navigation = buildPageNavigation(segments);
  }
  const folioObjects = [];

  for (const item of navigation) {
    const folioSegments = segments.filter(
      (segment) => segment.juan === item.juan && segment.page === (item.sourcePage ?? item.label),
    );
    const folioDocument = {
      schema: "https://foxue.ai/schemas/corpus-folio-v0.1",
      releaseId,
      workId: sourceFile.workId,
      canonId: sourceFile.id,
      slug: sourceFile.slug,
      folio: {
        key: item.key,
        juan: item.juan,
        label: item.label,
        ...(item.sourcePage ? { sourcePage: item.sourcePage } : {}),
        firstSegmentId: item.id,
      },
      segments: folioSegments,
    };
    const object = await addObject(
      `${workPrefix}/folios/${item.key}.json`,
      jsonBytes(folioDocument),
      "application/json; charset=utf-8",
    );
    folioObjects.push({ key: item.key, objectKey: object.key, sha256: object.sha256 });
  }

  const indexDocument = {
    schema: "https://foxue.ai/schemas/corpus-work-index-v0.2",
    releaseId,
    workId: sourceFile.workId,
    canonId: sourceFile.id,
    slug: sourceFile.slug,
    sourceSnapshotId: sourceManifestEntry.id,
    parser: sourceFile.parser ?? "cbeta_tei",
    sources: sourceObjects,
    rights: sourceManifest.rightsDecision,
    totals: {
      segments: segments.length,
      folios: navigation.length,
      juans: new Set(segments.map((segment) => segment.juan)).size,
    },
    navigation: navigation.map((item, index) => ({
      ...item,
      position: index + 1,
      objectKey: folioObjects[index].objectKey,
      sha256: folioObjects[index].sha256,
    })),
  };
  const indexObject = await addObject(
    `${workPrefix}/index.json`,
    jsonBytes(indexDocument),
    "application/json; charset=utf-8",
  );

  expressionEntries.push({
    workId: sourceFile.workId,
    canonId: sourceFile.id,
    slug: sourceFile.slug,
    indexObjectKey: indexObject.key,
    indexSha256: indexObject.sha256,
    sourceObjectKeys: sourceObjects.map((source) => source.objectKey),
    segments: segments.length,
    folios: navigation.length,
  });
}

const releaseManifest = {
  schema: "https://foxue.ai/schemas/corpus-release-manifest-v0.2",
  releaseId,
  sourceSnapshots: sourceManifests.map((source) => ({
    id: source.id,
    name: source.manifest.source.name,
    repository: source.manifest.source.repository,
    commit: source.manifest.source.commit,
    manifestSha256: sha256(source.bytes),
    rights: source.manifest.rightsDecision,
  })),
  releaseFingerprint,
  totals: {
    expressions: expressionEntries.length,
    segments: expressionEntries.reduce((sum, expression) => sum + expression.segments, 0),
    folios: expressionEntries.reduce((sum, expression) => sum + expression.folios, 0),
    immutableObjects: objectEntries.length,
    bytes: objectEntries.reduce((sum, object) => sum + object.bytes, 0),
  },
  expressions: expressionEntries,
  objects: objectEntries.map((object) => ({
    key: object.key,
    bytes: object.bytes,
    sha256: object.sha256,
    contentType: object.contentType,
    cacheControl: object.cacheControl,
  })),
};
const releaseManifestObject = await addObject(
  `v1/releases/${releaseId}/manifest.json`,
  jsonBytes(releaseManifest),
  "application/json; charset=utf-8",
);
const latestDocument = {
  schema: "https://foxue.ai/schemas/corpus-release-pointer-v0.1",
  releaseId,
  manifestObjectKey: releaseManifestObject.key,
  manifestSha256: releaseManifestObject.sha256,
};
await addObject(
  "v1/latest.json",
  jsonBytes(latestDocument),
  "application/json; charset=utf-8",
  "public, max-age=60, stale-while-revalidate=300",
);

const uploadPlan = {
  schema: "https://foxue.ai/schemas/corpus-upload-plan-v0.1",
  releaseId,
  bucket: "foxue-ai-corpus",
  entries: objectEntries,
};
await writeGenerated("upload-plan.json", jsonBytes(uploadPlan));
await writeGenerated(
  "SHA256SUMS",
  Buffer.from(objectEntries.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join("\n") + "\n"),
);

console.log(
  `佛典发布包已生成：${releaseId}，${expressionEntries.length} 个文本表达、${releaseManifest.totals.folios} 阅读单元、${releaseManifest.totals.segments} 稳定行段、${objectEntries.length} 个待发布对象。`,
);
