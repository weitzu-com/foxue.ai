import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(resolve(root, "data/corpus/cbeta/manifest-v1.9.0.json"), "utf8"),
);
const registry = JSON.parse(
  await readFile(resolve(root, "data/gbcr/registry-v1.9.0.json"), "utf8"),
);
const catalog = JSON.parse(
  await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.9.0.json"), "utf8"),
);
const errors = [];
const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

const cbetaSnapshot = registry.sourceSnapshots.find((item) => item.id === "cbeta_xml_p5");
requireValue(cbetaSnapshot?.snapshot.ref === manifest.source.commit, "CBETA 清单提交与 GBCR 来源快照不一致");
requireValue(manifest.rightsDecision?.headerMustRemain === true, "CBETA 文件必须保留 teiHeader");
requireValue(manifest.rightsDecision?.commercialUse === "prohibited_without_additional_permission", "商业使用边界缺失");

const expectedSnippets = {
  T0251: "照見五蘊皆空度一切苦厄",
  T0235: "應無所住而生其心",
  T0210: "心為法本心尊心使中心念惡",
};
const expectedReadingViews = Object.fromEntries(
  catalog.files.map((file) => [file.id, file.verification]),
);
const slugs = new Set();
const sourceUnits = (file) => file.sourceParts ?? [file];

for (const file of manifest.files) {
  const texts = [];
  const readingLines = [];
  for (const source of sourceUnits(file)) {
    const path = resolve(root, source.localPath);
    const content = await readFile(path);
    const fileStat = await stat(path);
    const text = content.toString("utf8");
    texts.push(text);

    requireValue(fileStat.size === source.localBytes, `${source.id} 本地字节数不匹配`);
    requireValue(createHash("sha256").update(content).digest("hex") === source.localSha256, `${source.id} 本地 SHA-256 不匹配`);
    requireValue(source.localBytes === source.upstreamBytes + 1, `${source.id} 规范化必须只增加一个字节`);
    requireValue(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), `${source.id} 不是声明的 UTF-8 XML`);
    requireValue(text.includes(`<TEI xmlns="http://www.tei-c.org/ns/1.0"`), `${source.id} 缺少 TEI P5 根元素`);
    const expectedTeiId = source.upstreamPath.split("/").at(-1).replace(/\.xml$/, "");
    requireValue(text.includes(`xml:id="${expectedTeiId}"`), `${source.id} TEI 标识不匹配`);
    requireValue(text.includes("<teiHeader>"), `${source.id} 缺少 teiHeader`);
    requireValue(text.includes("Available for non-commercial use when distributed with this header intact."), `${source.id} 缺少非商业与保留头部声明`);
    const hasCbetaAttribution = [
      "財團法人佛教電子佛典基金會 (CBETA)",
      "中華電子佛典協會 （CBETA）",
    ].some((attribution) => text.includes(attribution));
    requireValue(hasCbetaAttribution, `${source.id} 缺少 CBETA 来源署名`);
    requireValue(text.includes("<text><body>"), `${source.id} 缺少完整正文结构`);
    requireValue(text.trimEnd().endsWith("</back></text></TEI>"), `${source.id} XML 末尾结构不完整`);
    readingLines.push(...parseCbetaReadingLines(text, { canonId: file.id }));
  }
  const normalizedText = texts.join("")
    .replace(/<[^>]+>/g, "")
    .replace(/[\s，。；：、！？「」『』]/g, "");
  if (expectedSnippets[file.id]) {
    requireValue(normalizedText.includes(expectedSnippets[file.id]), `${file.id} 未找到已发布样本的核对短语`);
  }

  const readingView = expectedReadingViews[file.id];
  requireValue(typeof file.slug === "string" && /^[a-z0-9-]+$/.test(file.slug), `${file.id} 缺少稳定阅读 slug`);
  requireValue(!slugs.has(file.slug), `${file.id} 阅读 slug 重复`);
  slugs.add(file.slug);
  requireValue(readingLines.length === readingView.segments, `${file.id} 稳定行段数量漂移`);
  requireValue(buildPageNavigation(readingLines).length === readingView.folios, `${file.id} 页码导航数量漂移`);
  requireValue(
    JSON.stringify([...new Set(readingLines.map((line) => line.juan))]) === JSON.stringify(readingView.juans),
    `${file.id} 卷号结构漂移`,
  );
  requireValue(
    readingView.anchors.every((anchor) => readingLines.some((line) => line.id === anchor)),
    `${file.id} 关键母版锚点缺失`,
  );

  const registryExpression = registry.works
    .flatMap((work) => work.expressions)
    .find((expression) => {
      const paths = expression.sourceTextAssets?.map((asset) => asset.path) ??
        [expression.sourceTextAsset?.path].filter(Boolean);
      return JSON.stringify(paths) === JSON.stringify(sourceUnits(file).map((source) => source.localPath));
    });
  requireValue(registryExpression?.stableSegments === readingLines.length, `${file.id} 阅读行段数与 GBCR 不一致`);
}

if (errors.length > 0) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

const sourceAssetCount = manifest.files.flatMap(sourceUnits).length;
console.log(`CBETA 受控来源批次通过：${manifest.files.length} 个表达或见证、${sourceAssetCount} 个来源资产，来源提交 ${manifest.source.commit.slice(0, 12)}。`);
