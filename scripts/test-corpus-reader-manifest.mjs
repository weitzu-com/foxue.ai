import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { createReaderManifestLoader, projectReaderManifest, readerManifestMaxBytes } from "../src/lib/corpus-reader-manifest.mjs";

const releaseId = "test-release";
const path = `v1/releases/${releaseId}/manifest.json`;
const expression = (canonId) => ({
  canonId,
  indexObjectKey: `v1/releases/${releaseId}/works/${canonId}/index.json`,
  indexSha256: "a".repeat(64),
});
const encode = (value) => Buffer.from(JSON.stringify(value));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bytes = encode({ releaseId, expressions: [expression("T0251")], objects: [{ payload: "x".repeat(3 * 1024 * 1024) }] });

test("a preservation payload above 2 MB produces a small, authenticated reader cache value", () => {
  const projected = projectReaderManifest(bytes, path, digest(bytes));
  assert.deepEqual(projected, { releaseId, expressions: [expression("T0251")] });
  assert.ok(bytes.length > 2 * 1024 * 1024);
  assert.ok(Buffer.byteLength(JSON.stringify(projected)) < readerManifestMaxBytes);
});

test("4,190 current-size reader references fit the cache; excessive projections fail closed", () => {
  const small = encode({ releaseId, expressions: Array.from({ length: 4190 }, (_, i) => expression(`T${i}`)) });
  assert.equal(projectReaderManifest(small, path, digest(small)).expressions.length, 4190);
  const large = encode({ releaseId, expressions: Array.from({ length: 15000 }, (_, i) => expression(`T${i}`)) });
  assert.throws(() => projectReaderManifest(large, path, digest(large)), /缓存预算/);
});

test("tampered bytes, release mismatch and forged work paths never enter the cache", () => {
  assert.throws(() => projectReaderManifest(bytes, path, "0".repeat(64)), /SHA-256/);
  assert.throws(() => projectReaderManifest(bytes, "v1/releases/other/manifest.json", digest(bytes)), /版本/);
  const forged = encode({ releaseId, expressions: [{ ...expression("T0251"), indexObjectKey: "../private" }] });
  assert.throws(() => projectReaderManifest(forged, path, digest(forged)), /引用/);
});

test("concurrent misses share one download and never ask Next to cache the oversized body", async () => {
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const load = createReaderManifestLoader(async (_url, options) => {
    calls += 1;
    assert.equal(options.cache, "no-store");
    assert.equal(options.next, undefined);
    await gate;
    return new Response(bytes);
  });
  const requests = Array.from({ length: 30 }, () => load("https://canon.example/", path, digest(bytes)));
  release();
  const results = await Promise.all(requests);
  assert.equal(calls, 1);
  assert.ok(results.every((value) => value.expressions[0].canonId === "T0251"));
});

test("HTTP and integrity failures can recover, and different digests do not share a request", async () => {
  let calls = 0;
  const load = createReaderManifestLoader(async () => {
    calls += 1;
    return calls === 1 ? new Response("quota", { status: 429 }) : new Response(bytes);
  });
  await assert.rejects(load("https://canon.example/", path, digest(bytes)), /429/);
  await assert.rejects(load("https://canon.example/", path, "0".repeat(64)), /SHA-256/);
  const outcomes = await Promise.allSettled([
    load("https://canon.example/", path, digest(bytes)),
    load("https://canon.example/", path, "0".repeat(64)),
  ]);
  assert.equal(outcomes[0].status, "fulfilled");
  assert.equal(outcomes[1].status, "rejected");
  assert.equal(calls, 4);
});

test("legacy works manifests retain the same reader references", () => {
  const legacy = encode({ releaseId, works: [expression("T0251")] });
  assert.deepEqual(projectReaderManifest(legacy, path, digest(legacy)).expressions, [expression("T0251")]);
});
