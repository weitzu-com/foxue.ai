import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";
import { loadCorpusReleaseContext } from "./corpus-release-context.mjs";

const root = process.cwd();
const {
  releaseId,
  releaseFingerprint,
  sourceCommit,
  sourceManifest,
  sourceManifestBytes,
} = await loadCorpusReleaseContext(root);
const outputRoot = resolve(root, "artifacts", "corpus-release", releaseId);
const objectEntries = [];
const workEntries = [];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

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

for (const sourceFile of sourceManifest.files) {
  const sourceBytes = await readFile(resolve(root, sourceFile.localPath));
  if (sha256(sourceBytes) !== sourceFile.localSha256) {
    throw new Error(`${sourceFile.id} 源文件哈希与受控清单不一致`);
  }

  const segments = parseCbetaReadingLines(sourceBytes.toString("utf8"), {
    canonId: sourceFile.id,
  });
  const navigation = buildPageNavigation(segments);
  const workPrefix = `v1/releases/${releaseId}/works/${sourceFile.id}`;
  const sourceObject = await addObject(
    `${workPrefix}/source.xml`,
    sourceBytes,
    "application/tei+xml; charset=utf-8",
  );
  const folioObjects = [];

  for (const item of navigation) {
    const folioSegments = segments.filter(
      (segment) => segment.juan === item.juan && segment.page === item.label,
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
    schema: "https://foxue.ai/schemas/corpus-work-index-v0.1",
    releaseId,
    workId: sourceFile.workId,
    canonId: sourceFile.id,
    slug: sourceFile.slug,
    source: {
      objectKey: sourceObject.key,
      bytes: sourceObject.bytes,
      sha256: sourceObject.sha256,
      format: sourceFile.format,
      upstreamPath: sourceFile.upstreamPath,
      upstreamGitBlobSha1: sourceFile.upstreamGitBlobSha1,
    },
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

  workEntries.push({
    workId: sourceFile.workId,
    canonId: sourceFile.id,
    slug: sourceFile.slug,
    indexObjectKey: indexObject.key,
    indexSha256: indexObject.sha256,
    sourceObjectKey: sourceObject.key,
    segments: segments.length,
    folios: navigation.length,
  });
}

const releaseManifest = {
  schema: "https://foxue.ai/schemas/corpus-release-manifest-v0.1",
  releaseId,
  sourceSnapshot: {
    name: sourceManifest.source.name,
    repository: sourceManifest.source.repository,
    commit: sourceCommit,
    manifestSha256: sha256(sourceManifestBytes),
    releaseFingerprint,
  },
  rights: sourceManifest.rightsDecision,
  totals: {
    works: workEntries.length,
    segments: workEntries.reduce((sum, work) => sum + work.segments, 0),
    folios: workEntries.reduce((sum, work) => sum + work.folios, 0),
    immutableObjects: objectEntries.length,
    bytes: objectEntries.reduce((sum, object) => sum + object.bytes, 0),
  },
  works: workEntries,
  objects: objectEntries.map(({ relativePath: _relativePath, ...object }) => object),
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
  `佛典发布包已生成：${releaseId}，${workEntries.length} 部、${releaseManifest.totals.folios} 版页、${releaseManifest.totals.segments} 稳定行段、${objectEntries.length} 个对象。`,
);
