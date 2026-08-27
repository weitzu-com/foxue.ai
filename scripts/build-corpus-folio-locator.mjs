import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  parseBilaraCollectionSources,
  parseBilaraDhammapadaSources,
} from "../src/lib/bilara-reading-folio.mjs";
import {
  parseBilaraSeriesSources,
  parseBilaraSuttaSource,
} from "../src/lib/bilara-reading.mjs";
import {
  iterateVisibleCbetaLineMarkers,
  locateCbetaBody,
  stringOffsetsToByteOffsets,
} from "../src/lib/cbeta-tei-folio.mjs";
import {
  folioLocatorLedgerSchema,
  folioLocatorMinSourceBytes,
  folioLocatorTargetShardBytes,
} from "../src/lib/corpus-folio-locator-paths.mjs";
import { iterateDergeFolioRanges } from "../src/lib/derge-reading-folio.mjs";
import { iterateSatChapterRanges, locateSatBody } from "../src/lib/sat-tei-folio.mjs";

const root = process.cwd();
const write = process.argv.includes("--write");
const folioIndexPath = resolve(root, "src/data/corpus-folio-index.generated.json");
const ledgerPath = resolve(root, "src/data/corpus-folio-locator-ledger.generated.json");
const chunksDir = resolve(root, "src/data/corpus-folio-locator-chunks");

const manifestFamilies = [
  {
    manifests: [
      "data/corpus/cbeta/manifest-v4.23.0.json",
      "data/corpus/cbeta/nanchuan-manifest-v1.0.0.json",
      "data/corpus/cbeta/beyond-taisho-sutra-manifest-v1.0.0.json",
    ],
    defaultParser: "cbeta_tei",
  },
  {
    manifests: ["data/corpus/sat/modern-japanese-manifest-v1.0.0.json"],
    defaultParser: "sat_tei",
  },
  {
    manifests: ["data/corpus/wikisource/kokuyaku-dhp-manifest-v1.0.0.json"],
    defaultParser: "sat_tei",
  },
  {
    manifests: [
      "data/corpus/suttacentral/manifest-v0.7.0.json",
      "data/corpus/suttacentral/dn-manifest-v0.8.0.json",
      "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
      "data/corpus/suttacentral/sn-manifest-v1.0.0.json",
      "data/corpus/suttacentral/an-manifest-v1.1.0.json",
      "data/corpus/suttacentral/kn-manifest-v1.2.0.json",
      "data/corpus/suttacentral/indic-manifest-v1.3.0.json",
      "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json",
      "data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json",
      "data/corpus/suttacentral/lzh-manifest-v1.6.0.json",
      "data/corpus/suttacentral/sujato-en-manifest-v1.0.0.json",
    ],
  },
  {
    manifests: ["data/corpus/derge/manifest-v0.1.0.json"],
  },
];

function serialize(value) {
  return `${JSON.stringify(value)}\n`;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sourceUnits(file) {
  return file.sourceParts ?? [file];
}

function corpusRelativePath(localPath) {
  if (!localPath?.startsWith("data/corpus/")) {
    throw new Error(`语料路径越界：${localPath}`);
  }
  return localPath.slice("data/corpus/".length);
}

function workNeedsLocator(sources, totalBytes) {
  return sources.length > 1 || totalBytes > folioLocatorMinSourceBytes;
}

function packWorks(works) {
  const items = Object.entries(works).map(([slug, work]) => ({
    slug,
    work,
    size: Buffer.byteLength(JSON.stringify(work)),
  }));
  items.sort((left, right) => right.size - left.size || compareText(left.slug, right.slug));

  const shards = [];
  let current = { works: {}, size: 0 };
  for (const item of items) {
    if (current.size > 0 && current.size + item.size > folioLocatorTargetShardBytes) {
      shards.push(current);
      current = { works: {}, size: 0 };
    }
    current.works[item.slug] = item.work;
    current.size += item.size;
  }
  if (Object.keys(current.works).length > 0) shards.push(current);
  return shards;
}

async function locateCbetaFolios(sources) {
  const folios = {};
  for (const [partIndex, source] of sources.entries()) {
    const bytes = await readFile(resolve(root, source.localPath));
    const xml = bytes.toString("utf8");
    const body = locateCbetaBody(xml);
    if (!body) throw new Error(`${source.localPath} 缺少 TEI body`);
    const markers = iterateVisibleCbetaLineMarkers(body.content);
    if (markers.length === 0) continue;
    const bodyEndString = body.contentStart + body.content.length;
    const needed = markers.map((marker) => body.contentStart + marker.index);
    needed.push(bodyEndString);
    const byteMap = stringOffsetsToByteOffsets(xml, needed);
    for (const [index, marker] of markers.entries()) {
      const key = `${marker.juan}-${marker.page}`;
      const start = byteMap.get(body.contentStart + marker.index);
      const next = markers[index + 1];
      const end = next
        ? byteMap.get(body.contentStart + next.index)
        : byteMap.get(bodyEndString);
      const existing = folios[key];
      if (!existing) folios[key] = [partIndex, start, end];
      else existing[2] = end;
    }
  }
  return folios;
}

async function locateSatFolios(sources) {
  const folios = {};
  for (const [partIndex, source] of sources.entries()) {
    const bytes = await readFile(resolve(root, source.localPath));
    const xml = bytes.toString("utf8");
    const body = locateSatBody(xml);
    if (!body) throw new Error(`${source.localPath} 缺少 SAT TEI body`);
    const ranges = iterateSatChapterRanges(body.content);
    const needed = ranges.flatMap((range) => [body.contentStart + range.start, body.contentStart + range.end]);
    const byteMap = stringOffsetsToByteOffsets(xml, needed);
    for (const range of ranges) {
      const key = `001-${range.page}`;
      const start = byteMap.get(body.contentStart + range.start);
      const end = byteMap.get(body.contentStart + range.end);
      const existing = folios[key];
      if (!existing) folios[key] = [partIndex, start, end];
      else existing[2] = end;
    }
  }
  return folios;
}

async function locateDergeFolios(sources) {
  const folios = {};
  for (const [partIndex, source] of sources.entries()) {
    const text = await readFile(resolve(root, source.localPath), "utf8");
    const ranges = iterateDergeFolioRanges({
      ...source,
      filename: basename(source.localPath),
      text,
    });
    for (const range of ranges) {
      folios[range.key] = [partIndex, range.start, range.end];
    }
  }
  return folios;
}

function parseBilaraPart(source, parser, parserOptions) {
  const input = {
    filename: basename(source.localPath),
    localPath: source.localPath,
    text: source.text,
  };
  if (parser === "bilara_root_json") {
    return parseBilaraDhammapadaSources([input]);
  }
  if (parser === "bilara_single_root_json") {
    return parseBilaraSuttaSource(input);
  }
  if (parser === "bilara_collection_root_json") {
    return parseBilaraCollectionSources([input]);
  }
  if (parser === "bilara_series_root_json") {
    return parseBilaraSeriesSources([input], parserOptions);
  }
  throw new Error(`不支持的 Bilara 解析器：${parser}`);
}

async function locateBilaraFolios(sources, parser, parserOptions, catalogKeys) {
  const byFirstId = new Map();
  for (const [partIndex, source] of sources.entries()) {
    const text = await readFile(resolve(root, source.localPath), "utf8");
    const reading = parseBilaraPart({ ...source, text }, parser, parserOptions);
    for (const item of reading.navigation) {
      byFirstId.set(item.id, partIndex);
    }
  }
  const folios = {};
  for (const item of catalogKeys) {
    const partIndex = byFirstId.get(item.id);
    if (!Number.isSafeInteger(partIndex)) {
      throw new Error(`Bilara 版页 ${item.key} 无法对应到来源分片`);
    }
    folios[item.key] = [partIndex, 0, 0];
  }
  return folios;
}

const folioIndex = JSON.parse(await readFile(folioIndexPath, "utf8"));
const catalogWorks = folioIndex.works ?? {};
const works = {};

for (const family of manifestFamilies) {
  for (const manifestPath of family.manifests) {
    const manifest = JSON.parse(await readFile(resolve(root, manifestPath), "utf8"));
    for (const file of manifest.files) {
      const parser = file.parser ?? family.defaultParser ?? "cbeta_tei";
      const sources = sourceUnits(file);
      const totalBytes = sources.reduce((sum, source) => sum + (source.localBytes ?? 0), 0);
      if (!workNeedsLocator(sources, totalBytes)) continue;
      const catalog = catalogWorks[file.slug];
      if (!catalog?.navigation?.length) {
        throw new Error(`${file.slug} 缺少版页索引，无法生成定位账本`);
      }

      let folios;
      if (parser === "cbeta_tei") {
        folios = await locateCbetaFolios(sources);
      } else if (parser === "sat_tei") {
        folios = await locateSatFolios(sources);
      } else if (parser === "derge_plain_text") {
        folios = await locateDergeFolios(sources);
      } else {
        folios = await locateBilaraFolios(sources, parser, file.parserOptions, catalog.navigation);
      }

      const missing = catalog.navigation.filter((item) => !folios[item.key]);
      if (missing.length > 0) {
        throw new Error(`${file.slug} 定位账本缺少版页 ${missing[0].key}`);
      }

      const record = {
        parser,
        canonId: file.id,
        parts: sources.map((source) => corpusRelativePath(source.localPath)),
        folios: Object.fromEntries(
          catalog.navigation.map((item) => [item.key, folios[item.key]]),
        ),
      };
      if (file.parserOptions) record.parserOptions = file.parserOptions;
      works[file.slug] = record;
    }
  }
}

const packed = packWorks(works);
const slugToShard = {};
for (const [id, shard] of packed.entries()) {
  for (const slug of Object.keys(shard.works)) slugToShard[slug] = id;
}

const ledger = {
  schema: folioLocatorLedgerSchema,
  workCount: Object.keys(works).length,
  folioCount: Object.values(works).reduce((sum, work) => sum + Object.keys(work.folios).length, 0),
  shardCount: packed.length,
  targetShardBytes: folioLocatorTargetShardBytes,
  minSourceBytes: folioLocatorMinSourceBytes,
  slugToShard,
};

const expectedLedger = serialize(ledger);
const expectedChunks = new Map(
  packed.map((shard, id) => [
    `${id}.json`,
    serialize({
      id,
      works: Object.fromEntries(
        Object.entries(shard.works).sort(([left], [right]) => compareText(left.slug, right.slug)),
      ),
    }),
  ]),
);

if (write) {
  await rm(chunksDir, { recursive: true, force: true });
  await mkdir(chunksDir, { recursive: true });
  await writeFile(ledgerPath, expectedLedger);
  for (const [name, body] of expectedChunks) {
    await writeFile(resolve(chunksDir, name), body);
  }
} else {
  const actualLedger = await readFile(ledgerPath, "utf8");
  if (actualLedger !== expectedLedger) {
    throw new Error("src/data/corpus-folio-locator-ledger.generated.json 与语料清单不一致；运行 pnpm build:corpus-folio-locator");
  }
  const actualNames = new Set(await readdir(chunksDir));
  if (actualNames.size !== expectedChunks.size) {
    throw new Error("src/data/corpus-folio-locator-chunks 分片数量与账本不一致；运行 pnpm build:corpus-folio-locator");
  }
  for (const [name, body] of expectedChunks) {
    const actual = await readFile(resolve(chunksDir, name), "utf8");
    if (actual !== body) {
      throw new Error(`${name} 与预计算版页定位分片不一致；运行 pnpm build:corpus-folio-locator`);
    }
  }
}

console.log(
  `${write ? "已生成" : "已验证"} 版页定位账本：${ledger.workCount} 个肥胖文本、${ledger.folioCount} 个版页、${ledger.shardCount} 个分片。`,
);
