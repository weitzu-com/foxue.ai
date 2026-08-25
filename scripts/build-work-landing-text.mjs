import { open, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCbetaFolioSlice } from "../src/lib/cbeta-tei-folio.mjs";
import { parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";
import {
  workLandingPolicies,
  workLandingRequiredPhrases,
  workLandingSchema,
  workLandingScopeLabel,
  workLandingSlugs,
} from "./corpus-advertised-work-landings.mjs";

const root = process.cwd();
const write = process.argv.includes("--write");
const outputPath = resolve(root, "src/data/work-landing-text.generated.json");

function serialize(value) {
  return `${JSON.stringify(value)}\n`;
}

async function readByteRange(absPath, start, end) {
  const handle = await open(absPath, "r");
  try {
    const length = end - start;
    const bytes = Buffer.alloc(length);
    const { bytesRead } = await handle.read(bytes, 0, length, start);
    return bytes.subarray(0, bytesRead).toString("utf8");
  } finally {
    await handle.close();
  }
}

function compactSegment(segment, folioKey) {
  return {
    id: segment.id,
    folioKey,
    sourceLine: segment.sourceLine,
    text: segment.text,
  };
}

const [catalog, folioIndex, locatorLedger, shardPaths] = await Promise.all([
  readFile(resolve(root, "data/corpus/cbeta/catalog-v4.23.0.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-index.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-locator-ledger.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-shard-paths.generated.json"), "utf8").then(JSON.parse),
]);

const catalogBySlug = new Map(catalog.files.map((file) => [file.slug, file]));
const locatorShardCache = new Map();

async function loadLocatorWork(slug) {
  const shardId = locatorLedger.slugToShard[slug];
  if (!Number.isSafeInteger(shardId)) return null;
  let shard = locatorShardCache.get(shardId);
  if (!shard) {
    shard = JSON.parse(await readFile(resolve(root, shardPaths.locator[shardId]), "utf8"));
    locatorShardCache.set(shardId, shard);
  }
  return shard.works?.[slug] ?? null;
}

async function extractFromLocator(slug, navigation) {
  const locator = await loadLocatorWork(slug);
  if (!locator) throw new Error(`${slug} 缺少版页定位账本`);
  const segments = [];
  for (const item of navigation) {
    const tuple = locator.folios[item.key];
    if (!tuple) throw new Error(`${slug} 缺少版页定位 ${item.key}`);
    const [partIndex, start, end] = tuple;
    const partPath = locator.parts[partIndex];
    if (!partPath) throw new Error(`${slug} 定位分片越界：${item.key}`);
    const xml = await readByteRange(resolve(root, "data/corpus", partPath), start, end);
    const folioSegments = parseCbetaFolioSlice(xml, {
      canonId: locator.canonId,
      juan: item.juan ?? "001",
    }).filter((segment) => segment.page === (item.sourcePage ?? item.label));
    if (folioSegments.length < 1) {
      throw new Error(`${slug}/${item.key} 切片没有可读行段`);
    }
    for (const segment of folioSegments) {
      segments.push(compactSegment(segment, item.key));
    }
  }
  return segments;
}

async function extractFromSourceFile(slug, navigation) {
  const file = catalogBySlug.get(slug);
  if (!file?.localPath) throw new Error(`${slug} 缺少 CBETA 母版路径`);
  const xml = await readFile(resolve(root, file.localPath), "utf8");
  const parsed = parseCbetaReadingLines(xml, { canonId: file.id });
  const wanted = new Set(navigation.map((item) => item.key));
  const segments = [];
  for (const segment of parsed) {
    const folioKey = `${segment.juan}-${segment.page}`;
    if (!wanted.has(folioKey)) continue;
    segments.push(compactSegment(segment, folioKey));
  }
  if (segments.length < 1) throw new Error(`${slug} 母版解析后没有着陆行段`);
  return segments;
}

const works = {};
for (const slug of workLandingSlugs) {
  const mode = workLandingPolicies[slug];
  const catalogWork = folioIndex.works?.[slug];
  if (!catalogWork?.navigation?.length) throw new Error(`${slug} 不在版页索引中`);
  const firstJuan = catalogWork.navigation[0].juan;
  const navigation = mode === "full"
    ? catalogWork.navigation
    : catalogWork.navigation.filter((item) => item.juan === firstJuan);
  if (navigation.length < 1) throw new Error(`${slug} 开卷卷次没有版页`);

  const usesLocator = Number.isSafeInteger(locatorLedger.slugToShard[slug]);
  const segments = usesLocator
    ? await extractFromLocator(slug, navigation)
    : await extractFromSourceFile(slug, navigation);
  const joined = segments.map((segment) => segment.text).join("");
  for (const phrase of workLandingRequiredPhrases[slug] ?? []) {
    if (!joined.includes(phrase)) {
      throw new Error(`${slug} 着陆原文缺少「${phrase}」`);
    }
  }

  works[slug] = {
    slug,
    mode,
    scopeLabel: workLandingScopeLabel(mode),
    juan: navigation[0].juan,
    folioKeys: navigation.map((item) => item.key),
    segmentCount: segments.length,
    segments,
  };
}

const document = {
  schema: workLandingSchema,
  workCount: workLandingSlugs.length,
  works,
};

const expected = serialize(document);
if (write) {
  await writeFile(outputPath, expected);
} else {
  const actual = await readFile(outputPath, "utf8");
  if (actual !== expected) {
    throw new Error("src/data/work-landing-text.generated.json 与广告经目原文不一致；运行 pnpm build:work-landing-text");
  }
}

const full = workLandingSlugs.filter((slug) => workLandingPolicies[slug] === "full");
const opening = workLandingSlugs.filter((slug) => workLandingPolicies[slug] === "opening");
console.log(
  `${write ? "已生成" : "已验证"} 经目着陆原文：${document.workCount} 部（全文 ${full.join("、")}；开卷 ${opening.join("、")}）。`,
);
