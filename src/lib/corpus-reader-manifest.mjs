import { createHash } from "node:crypto";

// The preservation manifest contains every object and is too large for the
// Next.js Data Cache. Authenticate the original bytes, then cache only the
// index references used by the reader. Keep ample room below its 2 MB limit.
export const readerManifestMaxBytes = 1_500_000;

export function projectReaderManifest(bytes, path, expectedSha256) {
  if (createHash("sha256").update(bytes).digest("hex") !== expectedSha256) {
    throw new Error("佛典边缘对象 SHA-256 校验失败");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  if (
    typeof manifest.releaseId !== "string" ||
    !/^[a-z0-9][a-z0-9.-]{0,95}$/.test(manifest.releaseId) ||
    path !== `v1/releases/${manifest.releaseId}/manifest.json`
  ) throw new Error("佛典清单发布版本不匹配");

  const expressions = [...(manifest.expressions ?? []), ...(manifest.works ?? [])]
    .map(({ canonId, indexObjectKey, indexSha256 }) => {
      if (
        typeof canonId !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9-]{0,95}$/.test(canonId) ||
        indexObjectKey !== `v1/releases/${manifest.releaseId}/works/${canonId}/index.json` ||
        typeof indexSha256 !== "string" || !/^[a-f0-9]{64}$/.test(indexSha256)
      ) throw new Error("佛典清单经目引用无效");
      return { canonId, indexObjectKey, indexSha256 };
    });
  const projected = { releaseId: manifest.releaseId, expressions };
  if (Buffer.byteLength(JSON.stringify(projected)) > readerManifestMaxBytes) {
    throw new Error("佛典阅读清单超过缓存预算");
  }
  return projected;
}

export function createReaderManifestLoader(fetcher = globalThis.fetch) {
  const pending = new Map();
  return async function load(baseUrl, path, expectedSha256) {
    const url = new URL(path, baseUrl).href;
    const key = JSON.stringify([url, expectedSha256]);
    if (pending.has(key)) return pending.get(key);
    const request = (async () => {
      const response = await fetcher(url, {
        // Caching the full preservation payload is the original failure.
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`佛典边缘对象读取失败：${response.status}`);
      return projectReaderManifest(Buffer.from(await response.arrayBuffer()), path, expectedSha256);
    })();
    pending.set(key, request);
    try {
      return await request;
    } finally {
      // Never retain failed requests; quota resets and transient failures must
      // be recoverable. Successful compact results live in the Data Cache.
      pending.delete(key);
    }
  };
}

export const fetchReaderManifest = createReaderManifestLoader();
