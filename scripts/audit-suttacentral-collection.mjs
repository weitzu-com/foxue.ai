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
  sn: {
    id: "SN",
    canonicalTitle: "Saṁyutta Nikāya",
    titleZh: "相应部",
    expectedRecords: 1819,
    expectedGroups: 56,
    version: "1.0.0",
    slugPrefix: "samyutta-nikaya",
    groupLabel: "相应",
  },
  an: {
    id: "AN",
    canonicalTitle: "Aṅguttara Nikāya",
    titleZh: "增支部",
    expectedRecords: 1408,
    expectedGroups: 11,
    version: "1.1.0",
    slugPrefix: "anguttara-nikaya",
    groupLabel: "集",
  },
};
const requested = process.argv[2]?.toLowerCase();
const collection = collections[requested];
if (!collection) {
  console.error("用法：node scripts/audit-suttacentral-collection.mjs dn|mn|sn|an");
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
const flatCollection = !["sn", "an"].includes(requested);
const apiUrl = flatCollection
  ? `https://api.github.com/repos/${source.repository}/contents/${upstreamDirectory}?ref=${source.commit}`
  : `https://api.github.com/repos/${source.repository}/git/trees/${source.commit}?recursive=1`;
const apiDocument = JSON.parse((await curl(apiUrl, flatCollection ? 8 * 1024 * 1024 : 20 * 1024 * 1024)).toString("utf8"));
const directory = flatCollection ? apiDocument : apiDocument.tree;
const filenamePattern = flatCollection
  ? new RegExp(`^${requested}(\\d+)_root-pli-ms\\.json$`)
  : new RegExp(`^${requested}(\\d+)\\.(\\d+)(?:-(\\d+))?_root-pli-ms\\.json$`);
const candidates = directory
  .map((entry) => ({ ...entry, name: entry.name ?? entry.path?.split("/").at(-1) }))
  .filter((entry) => (
    entry.type === (flatCollection ? "file" : "blob") &&
    entry.path?.startsWith(`${upstreamDirectory}/`) &&
    filenamePattern.test(entry.name)
  ))
  .map((entry) => {
    const match = entry.name.match(filenamePattern);
    return flatCollection
      ? { ...entry, number: Number(match[1]) }
      : {
          ...entry,
          groupNumber: Number(match[1]),
          start: Number(match[2]),
          end: Number(match[3] ?? match[2]),
        };
  })
  .sort((left, right) => flatCollection
    ? left.number - right.number
    : left.groupNumber - right.groupNumber || left.start - right.start);
if (candidates.length !== collection.expectedRecords) {
  throw new Error(`${collection.id} 固定目录来源记录数应为 ${collection.expectedRecords}`);
}
if (flatCollection && candidates.some((entry, index) => entry.number !== index + 1)) {
  throw new Error(`${collection.id} 固定目录单经编号不连续`);
}
if (!flatCollection) {
  const groups = new Map();
  for (const candidate of candidates) {
    const intervals = groups.get(candidate.groupNumber) ?? [];
    intervals.push(candidate);
    groups.set(candidate.groupNumber, intervals);
  }
  if (
    groups.size !== collection.expectedGroups ||
    [...groups.keys()].some((groupNumber, index) => groupNumber !== index + 1)
  ) {
    throw new Error(`${collection.id} 必须连续包含 ${collection.expectedGroups} 个相应`);
  }
  for (const [groupNumber, intervals] of groups) {
    let expectedStart = 1;
    for (const interval of intervals) {
      if (interval.start !== expectedStart || interval.end < interval.start) {
      throw new Error(`${collection.id}${groupNumber} 的经号范围不连续`);
      }
      expectedStart = interval.end + 1;
    }
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const files = new Array(candidates.length);
const concurrency = flatCollection ? 12 : 24;
let cursor = 0;

async function auditNext() {
  while (cursor < candidates.length) {
    const index = cursor;
    cursor += 1;
    const candidate = candidates[index];
    const suttaId = flatCollection
      ? `${requested}${candidate.number}`
      : `${requested}${candidate.groupNumber}.${candidate.start}${candidate.end === candidate.start ? "" : `-${candidate.end}`}`;
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
    const escapedSuttaId = suttaId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const segmentPattern = flatCollection
      ? new RegExp(`^${escapedSuttaId}:(\\d+(?:[.-]\\d+)*)$`)
      : new RegExp(`^${requested}${candidate.groupNumber}\\.(\\d+(?:-\\d+)?):(\\d+(?:[.-]\\d+)*)$`);
    const validSegmentId = (id) => {
      const match = id.match(segmentPattern);
      if (!match) return false;
      if (flatCollection) return true;
      const [representedStart, representedEnd = representedStart] = match[1]
        .split("-")
        .map(Number);
      return Number.isSafeInteger(representedStart) &&
        Number.isSafeInteger(representedEnd) &&
        representedStart >= candidate.start && representedEnd <= candidate.end &&
        representedEnd >= representedStart;
    };
    if (
      entries.length === 0 ||
      entries.some(([id, text]) => (
        !validSegmentId(id) || typeof text !== "string" || (flatCollection && !text.trim())
      ))
    ) {
      throw new Error(`${suttaId} 含无效原生段落`);
    }
    const readableEntries = entries.filter(([, text]) => text.trim());
    const emptySegmentIds = entries
      .filter(([, text]) => !text.trim())
      .map(([id]) => id);
    if (readableEntries.length === 0) throw new Error(`${suttaId} 没有可读段落`);
    const titleCandidate = entries.find(([id]) => id.endsWith(":0.3"))?.[1]?.trim();
    const titlePali = flatCollection
      ? parsed[`${suttaId}:0.2`]?.trim()
      : (
          titleCandidate && titleCandidate !== "~"
            ? titleCandidate
            : entries.find(([id]) => id.endsWith(":0.2"))?.[1]?.trim()
        );
    if (!titlePali) throw new Error(`${suttaId} 缺少 Bilara 经名段落`);
    const divisionPali = flatCollection
      ? undefined
      : entries.find(([id]) => id.endsWith(":0.2"))?.[1]?.trim();
    if (!flatCollection && !divisionPali) throw new Error(`${suttaId} 缺少 Bilara 品名段落`);
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
      ...(flatCollection ? {} : {
        groupId: `${collection.id}${candidate.groupNumber}`,
        groupNumber: candidate.groupNumber,
        representedSuttas: candidate.end - candidate.start + 1,
      }),
      slug: `${collection.slugPrefix}-${flatCollection ? suttaId : `${requested}${candidate.groupNumber}`}`,
      workId: `gbcr:work:${collection.slugPrefix}-${flatCollection ? suttaId : `${requested}${candidate.groupNumber}`}-pali`,
      language: "pi-Latn",
      parser: flatCollection ? "bilara_single_root_json" : "bilara_collection_root_json",
      format: "application/json",
      titleZh: flatCollection
        ? `${collection.titleZh}第 ${candidate.number} 经`
        : `${collection.titleZh}第 ${candidate.groupNumber} ${collection.groupLabel}`,
      titlePali,
      ...(divisionPali ? { divisionPali } : {}),
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
      firstSegmentId: readableEntries[0][0],
      lastSegmentId: readableEntries.at(-1)[0],
      segments: readableEntries.length,
      ...(emptySegmentIds.length > 0 ? { emptySegmentIds } : {}),
      readingUnits: Math.ceil(readableEntries.length / 120),
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
    ...(flatCollection ? {} : {
      groupCount: collection.expectedGroups,
      representedSuttas: files.reduce((sum, file) => sum + file.representedSuttas, 0),
      simpleRecords: files.filter((file) => file.representedSuttas === 1).length,
      rangeRecords: files.filter((file) => file.representedSuttas > 1).length,
      emptySegmentIds: files.reduce((sum, file) => sum + (file.emptySegmentIds?.length ?? 0), 0),
      workCountingDecision: `${collection.expectedGroups} ${collection.id} groups; ${files.length} physical root records and ${files.reduce((sum, file) => sum + file.representedSuttas, 0)} represented sutta numbers are tracked separately`,
    }),
  },
  files,
};
const outputPath = resolve(
  root,
  `data/corpus/suttacentral/${requested}-batch-v${collection.version}.json`,
);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(
  `${collection.titleZh}审计完成：${files.length} 个来源记录、${batch.collection.sourceBytes} 上游字节、` +
  `${batch.collection.stableSegments} 个原生段落。`,
);
