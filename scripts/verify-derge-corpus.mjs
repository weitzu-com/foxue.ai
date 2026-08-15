import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDergeSources } from "../src/lib/derge-reading.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const paths = {
  manifest: "data/corpus/derge/manifest-v0.1.0.json",
  catalog: "data/corpus/derge/catalog-v0.1.0.json",
  batch: "data/corpus/derge/batch-v0.1.0.json",
  inventory: "data/gbcr/esukhia-derge-kangyur-inventory-v0.8.0.json",
  snapshots: "data/gbcr/source-snapshots-v4.5.0.json",
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const loadJson = async (path) => {
  const bytes = await readFile(resolve(root, path));
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
};

const [manifestDoc, catalogDoc, batchDoc, inventoryDoc, snapshotsDoc] = await Promise.all(
  Object.values(paths).map(loadJson),
);
const manifest = manifestDoc.value;
const catalog = catalogDoc.value;
const batch = batchDoc.value;
const inventory = inventoryDoc.value;
const snapshots = snapshotsDoc.value;

assert.equal(manifest.source.commit, "a582cf471b7c85a101035071078032f106a8e536");
assert.equal(manifest.source.tree, "b7eb9b0f146d99d5a496a8ed10a8d26805c1a133");
assert.equal(manifest.source.textTree, "31c409a8caa740345b22c4d1c87ccf645fe3ad96");
assert.equal(manifest.rightsDecision.status, "public_domain");
assert.equal(manifest.normalization.contentChange, "none");

const snapshot = snapshots.sources.find((source) => source.id === "esukhia_derge_kangyur");
assert(snapshot, "来源快照缺少 Esukhia 德格全文");
assert.equal(snapshot.inventorySha256, sha256(inventoryDoc.bytes));
assert.equal(snapshot.manifestSha256, sha256(manifestDoc.bytes));
assert.equal(snapshot.commit, manifest.source.commit);

assert.equal(manifest.files.length, 1_122);
assert.equal(catalog.files.length, manifest.files.length);
assert.equal(batch.expressions.length, manifest.files.length);
assert.equal(new Set(manifest.files.map((file) => file.id)).size, manifest.files.length);
assert.equal(new Set(manifest.files.map((file) => file.slug)).size, manifest.files.length);
assert.equal(new Set(manifest.files.map((file) => file.workId)).size, 851);
assert.deepEqual(catalog.totals, manifest.collection);
assert.deepEqual(batch.totals, manifest.collection);

const partByPath = new Map();
let sourceBytes = 0;
let stableSegments = 0;
let readingUnits = 0;

for (const file of manifest.files) {
  const sources = [];
  for (const part of file.sourceParts) {
    assert(!partByPath.has(part.localPath), `来源切片重复登记：${part.localPath}`);
    const bytes = await readFile(resolve(root, part.localPath));
    assert.equal(bytes.length, part.localBytes, `${part.localPath} 字节数不符`);
    assert.equal(sha256(bytes), part.localSha256, `${part.localPath} 摘要不符`);
    assert.equal(part.localBytes, part.upstreamBytes);
    assert.equal(part.localSha256, part.upstreamSha256);
    partByPath.set(part.localPath, { part, bytes });
    sourceBytes += bytes.length;
    sources.push({
      filename: part.localPath.split("/").at(-1),
      volume: part.volume,
      text: bytes.toString("utf8"),
      initialPage: part.initialPage,
      initialLine: part.initialLine,
    });
  }
  const parsed = parseDergeSources(sources, { canonId: file.id });
  assert.equal(parsed.segments.length, file.verification.segments, `${file.id} 行段数不符`);
  assert.equal(parsed.navigation.length, file.verification.readingUnits, `${file.id} 阅读单元数不符`);
  assert.equal(parsed.segments[0].id, file.verification.anchors[0], `${file.id} 首锚点不符`);
  assert.equal(parsed.segments.at(-1).id, file.verification.anchors[1], `${file.id} 末锚点不符`);
  stableSegments += parsed.segments.length;
  readingUnits += parsed.navigation.length;
}

assert.equal(partByPath.size, inventory.volumes.flatMap((volume) => volume.slices).length);
for (const volume of inventory.volumes) {
  const digest = createHash("sha256");
  let cursor = 0;
  for (const slice of volume.slices) {
    assert.equal(slice.byteRange.start, cursor, `${volume.volume} 切片不连续`);
    const stored = partByPath.get(slice.localPath);
    assert(stored, `清单切片未在正文清单登记：${slice.localPath}`);
    assert.equal(stored.part.id.startsWith(slice.dergeCatalogId), true);
    assert.equal(stored.bytes.length, slice.byteRange.end - slice.byteRange.start);
    assert.equal(sha256(stored.bytes), slice.sha256);
    digest.update(stored.bytes);
    cursor = slice.byteRange.end;
  }
  assert.equal(cursor, volume.bytes, `${volume.volume} 还原字节数不符`);
  assert.equal(digest.digest("hex"), volume.sha256, `${volume.volume} 还原摘要不符`);
}

const referenceBytes = await readFile(resolve(root, inventory.referenceVolume.localPath));
assert.equal(referenceBytes.length, inventory.referenceVolume.bytes);
assert.equal(sha256(referenceBytes), inventory.referenceVolume.sha256);
const readmeBytes = await readFile(resolve(root, inventory.rights.readmePath));
assert.equal(sha256(readmeBytes), inventory.rights.readmeSha256);
assert(readmeBytes.toString("utf8").includes(inventory.rights.statement));

assert.equal(sourceBytes, inventory.totals.canonicalSourceBytes);
assert.equal(stableSegments, inventory.totals.stableSegments);
assert.equal(readingUnits, inventory.totals.readingUnits);
assert.equal(snapshot.candidateRecordCount, manifest.files.length);
assert.equal(snapshot.controlledExpressionRecords, manifest.files.length);
assert.equal(snapshot.controlledBytes, sourceBytes);
assert.equal(snapshot.stableSegments, stableSegments);

console.log(
  `德格甘珠尔离线审计通过：${manifest.files.length} 个表达、${partByPath.size} 个可逆切片、` +
  `${stableSegments} 个稳定行段、${sourceBytes} 字节，102 卷均可逐字节还原。`,
);
