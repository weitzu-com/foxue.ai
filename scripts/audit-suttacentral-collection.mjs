import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const sourceTemplate = JSON.parse(
  await readFile(resolve(root, "data/corpus/suttacentral/dn-batch-v0.8.0.json"), "utf8"),
);
const collections = {
  dn: {
    id: "DN",
    canonicalTitle: "Dīgha Nikāya",
    titleZh: "长部",
    expectedRecords: 34,
    version: "0.8.0",
    slugPrefix: "digha-nikaya",
  },
  mn: {
    id: "MN",
    canonicalTitle: "Majjhima Nikāya",
    titleZh: "中部",
    expectedRecords: 152,
    version: "0.9.0",
    slugPrefix: "majjhima-nikaya",
  },
};
const requested = process.argv[2]?.toLowerCase();
const collection = collections[requested];
if (!collection) {
  console.error("用法：node scripts/audit-suttacentral-collection.mjs dn|mn");
  process.exit(1);
}

const { source, rightsDecision, normalization } = sourceTemplate;
const execFileAsync = promisify(execFile);
const curl = async (url, maxBuffer = 2 * 1024 * 1024) => {
  const { stdout } = await execFileAsync(
    "curl",
    ["-4", "-fsSL", "--retry", "4", "--retry-all-errors", "--connect-timeout", "15", "--max-time", "120", url],
    { encoding: null, maxBuffer },
  );
  return stdout;
};
const upstreamDirectory = `root/pli/ms/sutta/${requested}`;
const apiUrl = `https://api.github.com/repos/${source.repository}/contents/${upstreamDirectory}?ref=${source.commit}`;
const directory = JSON.parse((await curl(apiUrl, 8 * 1024 * 1024)).toString("utf8"));
const filenamePattern = new RegExp(`^${requested}(\\d+)_root-pli-ms\\.json$`);
const candidates = directory
  .filter((entry) => entry.type === "file" && filenamePattern.test(entry.name))
  .map((entry) => ({ ...entry, number: Number(entry.name.match(filenamePattern)[1]) }))
  .sort((left, right) => left.number - right.number);
if (
  candidates.length !== collection.expectedRecords ||
  candidates.some((entry, index) => entry.number !== index + 1)
) {
  throw new Error(`${collection.id} 固定目录必须连续包含 ${collection.expectedRecords} 部单经`);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const files = new Array(candidates.length);
const concurrency = 12;
let cursor = 0;

async function auditNext() {
  while (cursor < candidates.length) {
    const index = cursor;
    cursor += 1;
    const candidate = candidates[index];
    const suttaId = `${requested}${candidate.number}`;
    const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${candidate.path}`;
    const upstream = await curl(rawUrl);
    if (
      upstream.length !== candidate.size ||
      gitBlobSha1(upstream) !== candidate.sha ||
      upstream.at(-1) === 10
    ) {
      throw new Error(`${suttaId} 固定 Git 对象、字节数或换行假设不一致`);
    }
    const parsed = JSON.parse(upstream.toString("utf8"));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error(`${suttaId} 不是 Bilara 键值对象`);
    }
    const entries = Object.entries(parsed);
    const segmentPattern = new RegExp(`^${suttaId}:(\\d+(?:[.-]\\d+)*)$`);
    if (
      entries.length === 0 ||
      entries.some(([id, text]) => !segmentPattern.test(id) || typeof text !== "string" || !text.trim())
    ) {
      throw new Error(`${suttaId} 含无效原生段落`);
    }
    const titlePali = parsed[`${suttaId}:0.2`]?.trim();
    if (!titlePali) throw new Error(`${suttaId} 缺少 Bilara 经名段落`);
    const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
    const localPath = `data/corpus/suttacentral/${candidate.path}`;
    const destination = resolve(root, localPath);
    await mkdir(dirname(destination), { recursive: true });
    try {
      const existing = await readFile(destination);
      if (!existing.equals(normalized)) throw new Error(`${localPath} 已存在但内容不同`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await writeFile(destination, normalized, { flag: "wx" });
    }
    files[index] = {
      id: suttaId.toUpperCase(),
      suttaId,
      slug: `${collection.slugPrefix}-${suttaId}`,
      workId: `gbcr:work:${collection.slugPrefix}-${suttaId}-pali`,
      language: "pi-Latn",
      parser: "bilara_single_root_json",
      format: "application/json",
      titleZh: `${collection.titleZh}第 ${candidate.number} 经`,
      titlePali,
      tradition: "上座部佛教",
      edition: "Mahāsaṅgīti Tipiṭaka Buddhavasse 2500",
      sourceUrl: `https://suttacentral.net/${suttaId}/pli/ms`,
      localPath,
      upstreamPath: candidate.path,
      upstreamGitBlobSha1: candidate.sha,
      upstreamBytes: upstream.length,
      upstreamSha256: sha256(upstream),
      localBytes: normalized.length,
      localSha256: sha256(normalized),
      firstSegmentId: entries[0][0],
      lastSegmentId: entries.at(-1)[0],
      segments: entries.length,
      readingUnits: Math.ceil(entries.length / 120),
    };
  }
}

await Promise.all(Array.from({ length: concurrency }, () => auditNext()));
const batch = {
  schema: "https://foxue.ai/schemas/corpus-source-batch-v0.2",
  version: collection.version,
  source,
  rightsDecision,
  normalization,
  collection: {
    id: collection.id,
    canonicalTitle: collection.canonicalTitle,
    titleZh: collection.titleZh,
    tradition: "上座部佛教",
    language: "pi-Latn",
    recordCount: files.length,
    sourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    stableSegments: files.reduce((sum, file) => sum + file.segments, 0),
  },
  files,
};
const outputPath = resolve(
  root,
  `data/corpus/suttacentral/${requested}-batch-v${collection.version}.json`,
);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(
  `${collection.titleZh}审计完成：${files.length} 部、${batch.collection.sourceBytes} 上游字节、` +
  `${batch.collection.stableSegments} 个原生段落。`,
);
