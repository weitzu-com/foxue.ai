import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bundlePath = process.argv[2];
const artifactRoot = process.argv[3];
if (!bundlePath || !artifactRoot) {
  throw new Error("用法：node scripts/test-corpus-search-worker.mjs <worker-bundle.mjs> <search-artifact-root>");
}

const bundleBytes = await readFile(resolve(bundlePath));
const bundleText = bundleBytes.toString("utf8");
let moduleUrl = pathToFileURL(resolve(bundlePath)).href;
if (bundleText.startsWith("--")) {
  const boundary = bundleText.slice(0, bundleText.indexOf("\r\n"));
  const disposition = 'Content-Disposition: form-data; name="index.js"; filename="index.js"';
  const dispositionStart = bundleText.indexOf(disposition);
  const codeStart = bundleText.indexOf("\r\n\r\n", dispositionStart) + 4;
  const codeEnd = bundleText.indexOf(`\r\n${boundary}`, codeStart);
  assert.ok(dispositionStart > 0 && codeStart > 3 && codeEnd > codeStart, "无法从 Wrangler 上传包提取 Worker 模块");
  moduleUrl = `data:text/javascript;base64,${Buffer.from(bundleText.slice(codeStart, codeEnd)).toString("base64")}`;
}
const worker = (await import(moduleUrl)).default;
const confirmedText = "如是我聞，一時佛在舍衛國。菩薩摩訶薩應無所住而生其心，不住色生心。";

const bucket = {
  async get(key) {
    if (key.startsWith("v1/releases/")) {
      return {
        async json() {
          return { segments: [{ id: "T08n0235_p0750a0101", text: confirmedText }] };
        },
      };
    }
    try {
      const bytes = await readFile(resolve(artifactRoot, key));
      return {
        body: bytes,
        httpEtag: '"fixture-etag"',
        writeHttpMetadata(headers) {
          headers.set("content-type", "application/json; charset=utf-8");
        },
        async json() { return JSON.parse(bytes.toString("utf8")); },
      };
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  },
  async head(key) {
    try {
      await readFile(resolve(artifactRoot, key));
      return {};
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  },
};
const env = {
  CORPUS: bucket,
  RELEASE_ID: "fixture",
  RELEASE_MANIFEST_SHA256: "0".repeat(64),
  ORIGIN_COVERAGE_URL: "https://www.foxue.ai/api/v1/corpus/coverage",
};

async function search(path) {
  const request = new Request(`https://canon.foxue.ai${path}`, {
    headers: { origin: "https://www.foxue.ai" },
  });
  const response = await worker.fetch(request, env);
  return { response, body: await response.json() };
}

const hit = await search("/search?q=%E6%87%89%E7%84%A1%E6%89%80%E4%BD%8F%EF%BC%8C%E8%80%8C%E7%94%9F%E5%85%B6%E5%BF%83&language=zh&limit=3");
assert.equal(hit.response.status, 200);
assert.equal(hit.response.headers.get("access-control-allow-origin"), "https://www.foxue.ai");
assert.equal(hit.body.query.normalized, "應無所住而生其心");
assert.ok(hit.body.results.length > 0);
assert.ok(hit.body.results.some((result) => result.title.includes("金剛")));
assert.ok(hit.body.results.every((result) => result.excerpt.match === "應無所住而生其心"));
assert.ok(hit.body.results.every((result) => result.href.includes("#T08n0235_p0750a0101")));

const firstPage = await search("/search?q=%E5%A6%82%E6%98%AF%E6%88%91%E8%81%9E&language=zh&limit=1");
assert.equal(firstPage.response.status, 200);
assert.equal(firstPage.body.counts.candidateOffset, 0);
assert.ok(firstPage.body.counts.inspectedCandidates >= 1);
assert.ok(firstPage.body.counts.inspectedCandidates <= 8);
assert.equal(firstPage.body.counts.nextCandidateOffset, 1);
assert.ok(firstPage.body.counts.remainingCandidateDocuments > 0);
assert.equal(typeof firstPage.body.nextCursor, "string");

const secondPage = await search(
  `/search?q=%E5%A6%82%E6%98%AF%E6%88%91%E8%81%9E&language=zh&limit=1&cursor=${encodeURIComponent(firstPage.body.nextCursor)}`,
);
assert.equal(secondPage.response.status, 200);
assert.equal(secondPage.body.counts.candidateOffset, 1);
assert.ok(secondPage.body.counts.inspectedCandidates >= 1);
assert.ok(secondPage.body.counts.inspectedCandidates <= 8);
assert.equal(secondPage.body.results.length, 1);
assert.notEqual(secondPage.body.results[0].documentId, firstPage.body.results[0].documentId);

const mismatchedCursor = await search(
  `/search?q=%E8%89%B2%E5%8D%B3%E6%98%AF%E7%A9%BA%E7%A9%BA%E5%8D%B3%E6%98%AF%E8%89%B2&language=zh&limit=1&cursor=${encodeURIComponent(firstPage.body.nextCursor)}`,
);
assert.equal(mismatchedCursor.response.status, 400);
assert.equal(mismatchedCursor.body.error, "invalid_cursor");

const staleCursorPayload = JSON.parse(Buffer.from(firstPage.body.nextCursor, "base64url").toString("utf8"));
staleCursorPayload.searchReleaseId = "search-stale-fixture";
const staleCursor = Buffer.from(JSON.stringify(staleCursorPayload)).toString("base64url");
const staleCursorResponse = await search(
  `/search?q=%E5%A6%82%E6%98%AF%E6%88%91%E8%81%9E&language=zh&limit=1&cursor=${encodeURIComponent(staleCursor)}`,
);
assert.equal(staleCursorResponse.response.status, 409);
assert.equal(staleCursorResponse.body.error, "stale_cursor");

const malformedCursor = await search("/search?q=%E6%87%89%E7%84%A1%E6%89%80%E4%BD%8F%E8%80%8C%E7%94%9F%E5%85%B6%E5%BF%83&cursor=%25%25%25");
assert.equal(malformedCursor.response.status, 400);
assert.equal(malformedCursor.body.error, "invalid_cursor");

const invalid = await search("/search?q=%E7%A9%BA");
assert.equal(invalid.response.status, 400);
assert.equal(invalid.body.error, "invalid_query_length");

const searchPointer = await worker.fetch(
  new Request("https://canon.foxue.ai/v1/search/latest.json"),
  env,
);
assert.equal(searchPointer.status, 200);
assert.equal(
  searchPointer.headers.get("cache-control"),
  "public, max-age=60, stale-while-revalidate=300",
);
assert.doesNotMatch(searchPointer.headers.get("cache-control") ?? "", /immutable/);

const pointerBody = await searchPointer.json();
const searchManifest = await worker.fetch(
  new Request(`https://canon.foxue.ai/${pointerBody.manifestObjectKey}`),
  env,
);
assert.equal(searchManifest.status, 200);
assert.equal(searchManifest.headers.get("cache-control"), "public, max-age=31536000, immutable");

console.log("✓ Worker 全文检索完成候选交集、发行绑定续查、原页回查、稳定锚点、CORS 与可变指针缓存验证");
