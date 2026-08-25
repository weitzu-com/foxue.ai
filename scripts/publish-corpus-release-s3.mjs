import { createHash, createHmac } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const DEFAULT_BUCKET = "foxue-ai-corpus";
const DEFAULT_PREFLIGHT_CONCURRENCY = 16;
const DEFAULT_UPLOAD_CONCURRENCY = 32;
const MAX_CONCURRENCY = 128;

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value).digest();
}

function normalizeHeaderValue(value) {
  const normalized = String(value).trim().replace(/[\t ]+/g, " ");
  if (/[\r\n]/.test(normalized)) throw new Error("签名头不得包含换行符");
  return normalized;
}

export function signS3Request({
  accessKeyId,
  amzDate,
  canonicalQueryString = "",
  canonicalUri,
  headers,
  method,
  payloadHash,
  region = "auto",
  secretAccessKey,
}) {
  if (!/^[0-9]{8}T[0-9]{6}Z$/.test(amzDate)) throw new Error(`无效 x-amz-date：${amzDate}`);
  if (!/^[a-f0-9]{64}$/.test(payloadHash)) throw new Error("正文 SHA-256 必须是 64 位小写十六进制");
  if (!canonicalUri.startsWith("/")) throw new Error("规范 URI 必须以 / 开始");

  const canonicalHeaderEntries = Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), normalizeHeaderValue(value)])
    .sort(([left], [right]) => left.localeCompare(right));
  const duplicateHeader = canonicalHeaderEntries.find(
    ([name], index) => index > 0 && canonicalHeaderEntries[index - 1][0] === name,
  );
  if (duplicateHeader) throw new Error(`重复签名头：${duplicateHeader[0]}`);

  const canonicalHeaders = canonicalHeaderEntries
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");
  const signedHeaders = canonicalHeaderEntries.map(([name]) => name).join(";");
  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(Buffer.from(`AWS4${secretAccessKey}`, "utf8"), date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope},` +
    `SignedHeaders=${signedHeaders},Signature=${signature}`;

  return { authorization, canonicalRequest, signature, signedHeaders, stringToSign };
}

function encodeRfc3986Segment(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function buildR2CanonicalUri(bucket, key) {
  return `/${encodeRfc3986Segment(bucket)}/${key.split("/").map(encodeRfc3986Segment).join("/")}`;
}

function formatAmzDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.[0-9]{3}/g, "");
}

function parseConcurrency(value, fallback, label) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_CONCURRENCY) {
    throw new Error(`${label} 必须是 1–${MAX_CONCURRENCY} 的整数`);
  }
  return parsed;
}

export async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function hashFile(path) {
  const sha256 = createHash("sha256");
  const md5 = createHash("md5");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.length;
    sha256.update(chunk);
    md5.update(chunk);
  }
  return { bytes, md5: md5.digest("hex"), sha256: sha256.digest("hex") };
}

function validateEntryShape(entry, index, planRoot, releaseId) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`上传计划第 ${index + 1} 项不是对象`);
  }
  for (const field of ["key", "relativePath", "sha256", "contentType", "cacheControl"]) {
    if (typeof entry[field] !== "string" || entry[field].length === 0) {
      throw new Error(`上传计划第 ${index + 1} 项缺少 ${field}`);
    }
  }
  if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
    throw new Error(`${entry.key} 的字节数无效`);
  }
  if (!/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error(`${entry.key} 的 SHA-256 无效`);
  if (
    entry.key.startsWith("/") ||
    entry.key.split("/").some((segment) => segment === "" || segment === "." || segment === "..") ||
    /[\u0000-\u001f\u007f]/.test(entry.key)
  ) {
    throw new Error(`对象键不安全：${entry.key}`);
  }
  if (entry.relativePath !== entry.key) {
    throw new Error(`${entry.key} 的 relativePath 必须与对象键相同`);
  }
  for (const value of [entry.contentType, entry.cacheControl]) {
    if (/[\r\n]/.test(value)) throw new Error(`${entry.key} 的 HTTP 元数据包含换行符`);
  }
  if (entry.key !== "v1/latest.json" && !entry.key.startsWith(`v1/releases/${releaseId}/`)) {
    throw new Error(`不可变对象不在发行命名空间：${entry.key}`);
  }
  if (entry.key !== "v1/latest.json" && !entry.cacheControl.includes("immutable")) {
    throw new Error(`不可变对象缺少 immutable 缓存策略：${entry.key}`);
  }

  const absolutePath = resolve(planRoot, entry.relativePath);
  const relativePath = relative(planRoot, absolutePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`上传文件越界：${entry.relativePath}`);
  }
  return { ...entry, absolutePath };
}

export async function loadAndValidateUploadPlan(planPath, options = {}) {
  const absolutePlanPath = resolve(planPath);
  const planRoot = dirname(absolutePlanPath);
  const planBytes = await readFile(absolutePlanPath);
  const plan = JSON.parse(planBytes.toString("utf8"));
  if (plan.schema !== "https://foxue.ai/schemas/corpus-upload-plan-v0.1") {
    throw new Error(`不支持的上传计划 schema：${plan.schema ?? "缺失"}`);
  }
  if (typeof plan.releaseId !== "string" || !/^[a-z0-9][a-z0-9.-]{0,95}$/.test(plan.releaseId)) {
    throw new Error("上传计划 releaseId 无效");
  }
  if (plan.bucket !== DEFAULT_BUCKET) throw new Error(`上传计划必须指向 ${DEFAULT_BUCKET}`);
  if (!Array.isArray(plan.entries) || plan.entries.length < 2) throw new Error("上传计划对象数量不足");

  const entries = plan.entries.map((entry, index) =>
    validateEntryShape(entry, index, planRoot, plan.releaseId));
  const keys = new Set();
  for (const entry of entries) {
    if (keys.has(entry.key)) throw new Error(`上传计划包含重复对象键：${entry.key}`);
    keys.add(entry.key);
  }
  const latestEntries = entries.filter((entry) => entry.key === "v1/latest.json");
  if (latestEntries.length !== 1) throw new Error("上传计划必须且只能包含一个 v1/latest.json");
  const latestEntry = latestEntries[0];
  const immutableEntries = entries.filter((entry) => entry !== latestEntry);
  const manifestKey = `v1/releases/${plan.releaseId}/manifest.json`;
  const manifestEntry = immutableEntries.find((entry) => entry.key === manifestKey);
  if (!manifestEntry) throw new Error(`上传计划缺少发行清单：${manifestKey}`);

  const preflightConcurrency = parseConcurrency(
    options.concurrency,
    DEFAULT_PREFLIGHT_CONCURRENCY,
    "预检并发数",
  );
  const verifiedEntries = await mapConcurrent(entries, preflightConcurrency, async (entry) => {
    const file = await stat(entry.absolutePath);
    if (!file.isFile()) throw new Error(`上传对象不是普通文件：${entry.relativePath}`);
    const digest = await hashFile(entry.absolutePath);
    if (digest.bytes !== entry.bytes) {
      throw new Error(`${entry.key} 字节数不匹配：计划 ${entry.bytes}，实际 ${digest.bytes}`);
    }
    if (digest.sha256 !== entry.sha256) throw new Error(`${entry.key} SHA-256 不匹配`);
    return { ...entry, md5: digest.md5 };
  });
  const verifiedLatest = verifiedEntries.find((entry) => entry.key === "v1/latest.json");
  const verifiedImmutable = verifiedEntries.filter((entry) => entry.key !== "v1/latest.json");
  const verifiedManifest = verifiedImmutable.find((entry) => entry.key === manifestKey);
  const latestDocument = JSON.parse(await readFile(verifiedLatest.absolutePath, "utf8"));
  if (
    latestDocument.releaseId !== plan.releaseId ||
    latestDocument.manifestObjectKey !== manifestKey ||
    latestDocument.manifestSha256 !== verifiedManifest.sha256
  ) {
    throw new Error("v1/latest.json 与发行清单或上传计划不一致");
  }

  return {
    bucket: plan.bucket,
    entries: verifiedEntries,
    immutableEntries: verifiedImmutable,
    latestEntry: verifiedLatest,
    planSha256: sha256Hex(planBytes),
    releaseId: plan.releaseId,
    totalBytes: verifiedEntries.reduce((sum, entry) => sum + entry.bytes, 0),
  };
}

export async function publishCorpusRelease(validatedPlan, uploadEntry, options = {}) {
  const concurrency = parseConcurrency(
    options.concurrency,
    DEFAULT_UPLOAD_CONCURRENCY,
    "上传并发数",
  );
  let completed = 0;
  await mapConcurrent(validatedPlan.immutableEntries, concurrency, async (entry) => {
    const result = await uploadEntry(entry, { immutable: true });
    completed += 1;
    if (options.onProgress) options.onProgress(completed, validatedPlan.immutableEntries.length, result);
    return result;
  });
  const latestResult = await uploadEntry(validatedPlan.latestEntry, { immutable: false });
  return { immutableObjects: completed, latestResult };
}

function requestConfig(entry, config, method, extraHeaders = {}) {
  const amzDate = formatAmzDate();
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = buildR2CanonicalUri(config.bucket, entry.key);
  const payloadHash = method === "PUT" ? entry.sha256 : EMPTY_SHA256;
  const signedHeaders = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...extraHeaders,
  };
  const signature = signS3Request({
    accessKeyId: config.accessKeyId,
    amzDate,
    canonicalUri,
    headers: signedHeaders,
    method,
    payloadHash,
    region: "auto",
    secretAccessKey: config.secretAccessKey,
  });
  return {
    authorization: signature.authorization,
    host,
    payloadHash,
    url: `https://${host}${canonicalUri}`,
    amzDate,
  };
}

function cleanEtag(value) {
  return value?.replace(/^W\//, "").replace(/^"|"$/g, "").toLowerCase() ?? null;
}

async function responseSummary(response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, 1_000).replace(/[\r\n]+/g, " ");
}

async function headObject(entry, config) {
  const signed = requestConfig(entry, config, "HEAD");
  const response = await fetch(signed.url, {
    method: "HEAD",
    headers: {
      authorization: signed.authorization,
      "x-amz-content-sha256": signed.payloadHash,
      "x-amz-date": signed.amzDate,
    },
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`HEAD ${entry.key} 返回 ${response.status}：${await responseSummary(response)}`);
  }
  return response.headers;
}

function verifyRemoteMetadata(entry, headers) {
  const etag = cleanEtag(headers.get("etag"));
  if (etag !== entry.md5) throw new Error(`${entry.key} 的远端 ETag 与本地 MD5 不一致`);
  if (headers.get("content-length") !== String(entry.bytes)) {
    throw new Error(`${entry.key} 的远端字节数不一致`);
  }
  if (normalizeHeaderValue(headers.get("content-type") ?? "") !== normalizeHeaderValue(entry.contentType)) {
    throw new Error(`${entry.key} 的远端 Content-Type 不一致`);
  }
  if (normalizeHeaderValue(headers.get("cache-control") ?? "") !== normalizeHeaderValue(entry.cacheControl)) {
    throw new Error(`${entry.key} 的远端 Cache-Control 不一致`);
  }
}

async function putObjectOnce(entry, config, immutable) {
  const metadataHeaders = {
    "cache-control": entry.cacheControl,
    "content-type": entry.contentType,
    ...(immutable ? { "if-none-match": "*" } : {}),
  };
  const signed = requestConfig(entry, config, "PUT", metadataHeaders);
  const response = await fetch(signed.url, {
    method: "PUT",
    body: createReadStream(entry.absolutePath),
    duplex: "half",
    headers: {
      authorization: signed.authorization,
      "cache-control": entry.cacheControl,
      "content-length": String(entry.bytes),
      "content-type": entry.contentType,
      ...(immutable ? { "if-none-match": "*" } : {}),
      "x-amz-content-sha256": signed.payloadHash,
      "x-amz-date": signed.amzDate,
    },
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (immutable && response.status === 412) {
    const headers = await headObject(entry, config);
    if (!headers) throw new Error(`${entry.key} 条件写入冲突后对象不存在`);
    verifyRemoteMetadata(entry, headers);
    return { reused: true };
  }
  if (!response.ok) {
    const error = new Error(`PUT ${entry.key} 返回 ${response.status}：${await responseSummary(response)}`);
    error.retryable = response.status === 429 || response.status >= 500;
    error.retryAfter = Number(response.headers.get("retry-after"));
    throw error;
  }
  const etag = cleanEtag(response.headers.get("etag"));
  if (etag !== entry.md5) throw new Error(`${entry.key} 上传响应 ETag 与本地 MD5 不一致`);
  return { reused: false };
}

async function putObjectWithRetry(entry, config, immutable) {
  let lastError;
  for (let attempt = 1; attempt <= config.attempts; attempt += 1) {
    try {
      return await putObjectOnce(entry, config, immutable);
    } catch (error) {
      lastError = error;
      // Node's fetch rejects (rather than returning an HTTP response) for
      // transient socket, TLS and connection-reset failures.  R2 publishing
      // can span hundreds of thousands of objects, so treating one such
      // rejection as permanent makes an otherwise atomic, resumable release
      // fail near the finish line.  HTTP failures remain retryable only when
      // explicitly marked by putObjectOnce.
      const retryable = error?.retryable === true ||
        error?.name === "AbortError" ||
        error?.name === "TimeoutError" ||
        error?.message === "fetch failed";
      if (!retryable || attempt === config.attempts) break;
      const retryAfter = Number.isFinite(error.retryAfter) && error.retryAfter > 0
        ? error.retryAfter * 1_000
        : 500 * (2 ** (attempt - 1));
      await new Promise((resolveDelay) => setTimeout(resolveDelay, retryAfter + Math.random() * 250));
    }
  }
  throw lastError;
}

function parseArgument(name) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((candidate) => candidate.startsWith(prefix));
  return argument?.slice(prefix.length);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const planPath = parseArgument("plan") ?? process.env.CORPUS_UPLOAD_PLAN;
  if (!planPath) {
    throw new Error("必须通过 --plan=<upload-plan.json> 或 CORPUS_UPLOAD_PLAN 指定上传计划");
  }
  const preflightConcurrency = parseConcurrency(
    process.env.R2_PREFLIGHT_CONCURRENCY,
    DEFAULT_PREFLIGHT_CONCURRENCY,
    "R2_PREFLIGHT_CONCURRENCY",
  );
  const uploadConcurrency = parseConcurrency(
    process.env.R2_UPLOAD_CONCURRENCY,
    DEFAULT_UPLOAD_CONCURRENCY,
    "R2_UPLOAD_CONCURRENCY",
  );
  const validated = await loadAndValidateUploadPlan(planPath, { concurrency: preflightConcurrency });
  console.log(
    `R2 预检通过：${validated.releaseId}，${validated.entries.length} 个对象，` +
    `${validated.totalBytes} 字节，计划 SHA-256 ${validated.planSha256}。`,
  );
  if (dryRun) return;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CORPUS_R2_BUCKET ?? validated.bucket;
  if (!/^[a-f0-9]{32}$/.test(accountId ?? "")) throw new Error("CLOUDFLARE_ACCOUNT_ID 无效或缺失");
  if (!accessKeyId) throw new Error("R2_ACCESS_KEY_ID 缺失");
  if (!secretAccessKey) throw new Error("R2_SECRET_ACCESS_KEY 缺失");
  if (bucket !== validated.bucket) throw new Error(`目标桶必须与上传计划一致：${validated.bucket}`);

  const config = {
    accessKeyId,
    accountId,
    attempts: 4,
    bucket,
    secretAccessKey,
    timeoutMs: 120_000,
  };
  let reused = 0;
  const result = await publishCorpusRelease(
    validated,
    async (entry, { immutable }) => {
      const upload = await putObjectWithRetry(entry, config, immutable);
      if (upload.reused) reused += 1;
      return upload;
    },
    {
      concurrency: uploadConcurrency,
      onProgress(completed, total) {
        if (completed === total || completed % 1_000 === 0) {
          console.log(`已确认 ${completed}/${total} 个不可变对象；复用 ${reused} 个。`);
        }
      },
    },
  );
  const report = {
    schema: "https://foxue.ai/schemas/corpus-r2-publish-report-v0.1",
    releaseId: validated.releaseId,
    bucket,
    planSha256: validated.planSha256,
    immutableObjects: result.immutableObjects,
    reusedImmutableObjects: reused,
    totalBytes: validated.totalBytes,
    latestUpdatedLast: true,
    completedAt: new Date().toISOString(),
  };
  const reportPath = resolve(dirname(resolve(planPath)), "R2-PUBLISH-REPORT.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`R2 原子发布完成：${validated.releaseId}；latest 已最后更新；报告 ${reportPath}。`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
