import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  buildR2CanonicalUri,
  loadAndValidateUploadPlan,
  publishCorpusRelease,
  signS3Request,
} from "./publish-corpus-release-s3.mjs";

const awsExample = signS3Request({
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  amzDate: "20130524T000000Z",
  canonicalUri: "/test%24file.text",
  headers: {
    date: "Fri, 24 May 2013 00:00:00 GMT",
    host: "examplebucket.s3.amazonaws.com",
    "x-amz-content-sha256": "44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072",
    "x-amz-date": "20130524T000000Z",
    "x-amz-storage-class": "REDUCED_REDUNDANCY",
  },
  method: "PUT",
  payloadHash: "44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072",
  region: "us-east-1",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
});
assert.equal(
  awsExample.signature,
  "98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd",
  "SigV4 必须通过 AWS 官方 PUT Object 测试向量",
);
assert.equal(
  buildR2CanonicalUri("foxue-ai-corpus", "汉文/a b.json"),
  "/foxue-ai-corpus/%E6%B1%89%E6%96%87/a%20b.json",
);

const fixtureRoot = await mkdtemp(join(tmpdir(), "foxue-r2-publisher-"));
const releaseId = "gbcr-test-release";
const manifestKey = `v1/releases/${releaseId}/manifest.json`;
const latestKey = "v1/latest.json";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fixtureEntry(key, value, cacheControl = "public, max-age=31536000, immutable") {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  const path = join(fixtureRoot, key);
  await import("node:fs/promises").then(({ mkdir }) => mkdir(join(path, ".."), { recursive: true }));
  await writeFile(path, bytes);
  return {
    key,
    relativePath: key,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentType: "application/json; charset=utf-8",
    cacheControl,
  };
}

try {
  const manifest = await fixtureEntry(manifestKey, { releaseId });
  const latest = await fixtureEntry(
    latestKey,
    { releaseId, manifestObjectKey: manifestKey, manifestSha256: manifest.sha256 },
    "public, max-age=60, stale-while-revalidate=300",
  );
  const planPath = join(fixtureRoot, "upload-plan.json");
  const plan = {
    schema: "https://foxue.ai/schemas/corpus-upload-plan-v0.1",
    releaseId,
    bucket: "foxue-ai-corpus",
    entries: [manifest, latest],
  };
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);

  const validated = await loadAndValidateUploadPlan(planPath, { concurrency: 2 });
  assert.equal(validated.immutableEntries.length, 1);
  assert.equal(validated.latestEntry.key, latestKey);
  assert.match(validated.immutableEntries[0].md5, /^[a-f0-9]{32}$/);

  const uploadOrder = [];
  const result = await publishCorpusRelease(
    validated,
    async (entry, options) => {
      uploadOrder.push({ immutable: options.immutable, key: entry.key });
      return { reused: false };
    },
    { concurrency: 2 },
  );
  assert.equal(result.immutableObjects, 1);
  assert.deepEqual(uploadOrder, [
    { immutable: true, key: manifestKey },
    { immutable: false, key: latestKey },
  ]);

  const duplicatePlan = { ...plan, entries: [manifest, manifest, latest] };
  await writeFile(planPath, `${JSON.stringify(duplicatePlan, null, 2)}\n`);
  await assert.rejects(
    loadAndValidateUploadPlan(planPath, { concurrency: 2 }),
    /重复对象键/,
  );

  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFile(join(fixtureRoot, manifestKey), "tampered\n");
  await assert.rejects(
    loadAndValidateUploadPlan(planPath, { concurrency: 2 }),
    /字节数不匹配|SHA-256 不匹配/,
  );

  const latestContents = JSON.parse(await readFile(join(fixtureRoot, latestKey), "utf8"));
  assert.equal(latestContents.manifestObjectKey, manifestKey);
  console.log("✓ AWS SigV4 官方 PUT Object 测试向量通过");
  console.log("✓ 上传计划路径、哈希、重复键与 latest 原子顺序验证通过");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
