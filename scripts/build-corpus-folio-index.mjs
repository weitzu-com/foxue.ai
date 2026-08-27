import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  parseBilaraCollectionSources,
  parseBilaraDhammapadaSources,
  parseBilaraSeriesSources,
  parseBilaraSuttaSource,
} from "../src/lib/bilara-reading.mjs";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";
import { parseDergeSources } from "../src/lib/derge-reading.mjs";

function buildSegmentFolioMap(segments) {
  const foliosByPrefix = new Map();
  for (const segment of segments) {
    if (!segment.juan || !segment.page || !segment.id.includes(":")) continue;
    const prefix = segment.id.slice(0, segment.id.indexOf(":"));
    const folio = `${segment.juan}-${segment.page}`;
    const folios = foliosByPrefix.get(prefix) ?? new Set();
    folios.add(folio);
    foliosByPrefix.set(prefix, folios);
  }
  const entries = [];
  for (const [prefix, folios] of foliosByPrefix) {
    if (folios.size === 1) entries.push([`${prefix}:*`, [...folios][0]]);
  }
  return Object.fromEntries(entries);
}

function buildSegmentFolioRanges(segments) {
  const foliosByPrefix = new Map();
  for (const segment of segments) {
    if (!segment.juan || !segment.page || !segment.id.includes(":")) continue;
    const prefix = segment.id.slice(0, segment.id.indexOf(":"));
    const folio = `${segment.juan}-${segment.page}`;
    const folios = foliosByPrefix.get(prefix) ?? new Map();
    const ids = folios.get(folio) ?? [];
    ids.push(segment.id);
    folios.set(folio, ids);
    foliosByPrefix.set(prefix, folios);
  }
  return Object.fromEntries(
    [...foliosByPrefix.entries()].flatMap(([prefix, folios]) => (
      folios.size < 2
        ? []
        : [[prefix, [...folios.entries()].map(([folio, ids]) => ({
            first: ids[0],
            last: ids.at(-1),
            folio,
          }))]]
    )),
  );
}

const root = process.cwd();
const write = process.argv.includes("--write");
const outputPath = resolve(root, "src/data/corpus-folio-index.generated.json");

const manifestFamilies = [
  {
    name: "cbeta",
    manifests: [
      "data/corpus/cbeta/manifest-v4.23.0.json",
      "data/corpus/cbeta/nanchuan-manifest-v1.0.0.json",
      "data/corpus/cbeta/beyond-taisho-sutra-manifest-v1.0.0.json",
    ],
    defaultParser: "cbeta_tei",
  },
  {
    name: "sat",
    manifests: ["data/corpus/sat/modern-japanese-manifest-v1.0.0.json"],
    defaultParser: "sat_tei",
  },
  {
    name: "wikisource",
    manifests: [
      "data/corpus/wikisource/kokuyaku-dhp-manifest-v1.0.0.json",
      "data/corpus/wikisource/muller-dhp-manifest-v1.0.0.json",
    ],
    defaultParser: "sat_tei",
  },
  {
    name: "suttacentral",
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
      "data/corpus/suttacentral/sujato-en-kn-manifest-v1.0.0.json",
    ],
  },
  {
    name: "derge",
    manifests: ["data/corpus/derge/manifest-v0.1.0.json"],
  },
];

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sourceUnits(file) {
  return file.sourceParts ?? [file];
}

function serialize(value) {
  return `${JSON.stringify(value)}\n`;
}

function compactNavigation(navigation) {
  return navigation.map((item) => {
    const row = { key: item.key, id: item.id, label: item.label };
    if (item.juan) row.juan = item.juan;
    if (item.sourcePage) row.sourcePage = item.sourcePage;
    return row;
  });
}

async function parseExpression(file, defaultParser) {
  const parser = file.parser ?? defaultParser ?? "cbeta_tei";
  const sources = sourceUnits(file);
  const sourceContents = [];
  for (const source of sources) {
    const text = await readFile(resolve(root, source.localPath), "utf8");
    sourceContents.push({
      ...source,
      filename: basename(source.localPath),
      text,
    });
  }

  if (parser === "bilara_root_json") {
    return parseBilaraDhammapadaSources(sourceContents);
  }
  if (parser === "bilara_single_root_json") {
    return parseBilaraSuttaSource(sourceContents[0]);
  }
  if (parser === "bilara_collection_root_json") {
    return parseBilaraCollectionSources(sourceContents);
  }
  if (parser === "bilara_series_root_json") {
    return parseBilaraSeriesSources(sourceContents, file.parserOptions);
  }
  if (parser === "derge_plain_text") {
    return parseDergeSources(sourceContents, { canonId: file.id });
  }
  if (parser === "sat_tei") {
    const segments = sourceContents.flatMap((source) =>
      parseSatReadingLines(source.text, { canonId: file.id }),
    );
    return { segments, navigation: buildPageNavigation(segments) };
  }
  const segments = sourceContents.flatMap((source) =>
    parseCbetaReadingLines(source.text, { canonId: file.id }),
  );
  return { segments, navigation: buildPageNavigation(segments) };
}

const works = {};
let parsed = 0;
for (const family of manifestFamilies) {
  for (const manifestPath of family.manifests) {
    const manifest = JSON.parse(await readFile(resolve(root, manifestPath), "utf8"));
    for (const file of manifest.files) {
      const reading = await parseExpression(file, family.defaultParser);
      if (!reading.navigation?.length) {
        throw new Error(`${file.slug} 生成版页索引时没有导航`);
      }
      const entry = {
        segmentCount: reading.segments.length,
        navigation: compactNavigation(reading.navigation),
      };
      const segmentFolios = buildSegmentFolioMap(reading.segments);
      const segmentFolioRanges = buildSegmentFolioRanges(reading.segments);
      if (Object.keys(segmentFolios).length > 0) entry.segmentFolios = segmentFolios;
      if (Object.keys(segmentFolioRanges).length > 0) entry.segmentFolioRanges = segmentFolioRanges;
      works[file.slug] = entry;
      parsed += 1;
      if (parsed % 200 === 0) {
        console.log(`… 已解析 ${parsed} 个文本表达`);
      }
    }
  }
}

const document = {
  schema: "https://foxue.ai/schemas/corpus-folio-index-v0.1",
  totalWorks: Object.keys(works).length,
  totalFolios: Object.values(works).reduce((sum, work) => sum + work.navigation.length, 0),
  works: Object.fromEntries(Object.entries(works).sort(([left], [right]) => compareText(left, right))),
};

if (write) {
  await writeFile(outputPath, serialize(document));
} else {
  const actual = await readFile(outputPath, "utf8");
  if (actual !== serialize(document)) {
    throw new Error("src/data/corpus-folio-index.generated.json 与受控语料清单不一致；运行 pnpm build:corpus-folio-index");
  }
}

console.log(
  `${write ? "已生成" : "已验证"} 版页索引：${document.totalWorks} 个文本表达、${document.totalFolios} 个版页。`,
);
