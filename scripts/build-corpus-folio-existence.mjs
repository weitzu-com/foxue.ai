import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  encodePackedValues,
  folioExistenceMaxBytes,
  folioExistenceSchema,
  packFolioKey,
} from "../src/lib/corpus-folio-existence.mjs";

const root = process.cwd();
const write = process.argv.includes("--write");
const indexPath = resolve(root, "src/data/corpus-folio-index.generated.json");
const outputPath = resolve(root, "src/data/corpus-folio-existence.generated.json");

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function serialize(value) {
  return `${JSON.stringify(value)}\n`;
}

const index = JSON.parse(await readFile(indexPath, "utf8"));
if (!index?.works || typeof index.works !== "object") {
  throw new Error("版页索引缺少 works，无法生成存在账本");
}

const packedSlugs = [];
const packed = [];
const looseSlugs = [];
const looseKeys = [];
let packedFolioCount = 0;
let looseFolioCount = 0;

for (const slug of Object.keys(index.works).sort(compareText)) {
  const navigation = index.works[slug]?.navigation;
  if (!Array.isArray(navigation) || navigation.length < 1) {
    throw new Error(`${slug} 缺少版页导航，不能写入存在账本`);
  }
  const keys = navigation.map((item) => item.key);
  const values = [];
  let allPacked = true;
  for (const key of keys) {
    const value = packFolioKey(key);
    if (value === null) {
      allPacked = false;
      break;
    }
    values.push(value);
  }
  if (allPacked) {
    packedSlugs.push(slug);
    packed.push(encodePackedValues(values));
    packedFolioCount += values.length;
  } else {
    looseSlugs.push(slug);
    looseKeys.push(keys);
    looseFolioCount += keys.length;
  }
}

const document = {
  schema: folioExistenceSchema,
  workCount: index.totalWorks,
  folioCount: index.totalFolios,
  packedSlugs,
  packed,
  looseSlugs,
  looseKeys,
};

if (packedSlugs.length + looseSlugs.length !== index.totalWorks) {
  throw new Error("存在账本文本数与版页索引不一致");
}
if (packedFolioCount + looseFolioCount !== index.totalFolios) {
  throw new Error("存在账本版页数与版页索引不一致");
}

const serialized = serialize(document);
if (serialized.length > folioExistenceMaxBytes) {
  throw new Error(
    `存在账本 ${serialized.length} 字节超过 ${folioExistenceMaxBytes} 上限；未知版页不得再把 21MB 索引打进 Proxy`,
  );
}

if (write) {
  await writeFile(outputPath, serialized);
} else {
  const actual = await readFile(outputPath, "utf8");
  if (actual !== serialized) {
    throw new Error("src/data/corpus-folio-existence.generated.json 与版页索引不一致；运行 pnpm build:corpus-folio-existence");
  }
}

console.log(
  `${write ? "已生成" : "已验证"} 版页存在账本：${document.workCount} 个文本、${document.folioCount} 个版页、`
    + `${packedSlugs.length} 个紧致桶 / ${looseSlugs.length} 个散键桶、${serialized.length} 字节`,
);
