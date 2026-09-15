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
const confirmedText = "菩薩摩訶薩應無所住而生其心，不住色生心。";

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
      return { async json() { return JSON.parse(bytes.toString("utf8")); } };
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

const invalid = await search("/search?q=%E7%A9%BA");
assert.equal(invalid.response.status, 400);
assert.equal(invalid.body.error, "invalid_query_length");

console.log("✓ Worker 全文检索完成候选交集、原页回查、稳定锚点与 CORS 验证");
