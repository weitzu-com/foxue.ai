import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { parseDergeSources } from "../src/lib/derge-reading.mjs";

const root = process.cwd();
const expectedCommit = "a582cf471b7c85a101035071078032f106a8e536";
const expectedTree = "b7eb9b0f146d99d5a496a8ed10a8d26805c1a133";
const expectedTextTree = "31c409a8caa740345b22c4d1c87ccf645fe3ad96";
const inventoryVersion = "0.8.0";
const manifestVersion = "0.1.0";
const snapshotVersion = "4.5.0";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
const writeMode = process.argv.includes("--write");
const verifyMode = process.argv.includes("--verify");
if (!sourceArgument || writeMode === verifyMode) {
  console.error("用法：node scripts/snapshot-derge-kangyur.mjs --source-dir=/固定提交的/derge-kangyur (--write|--verify)");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const outputEntries = new Map();
const addOutput = (relativePath, bytes) => outputEntries.set(relativePath, Buffer.from(bytes));

const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const actualTree = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
const actualTextTree = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD:text"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);
if (actualTree !== expectedTree) throw new Error(`上游根 Git tree 必须固定到 ${expectedTree}`);
if (actualTextTree !== expectedTextTree) throw new Error(`上游 text Git tree 必须固定到 ${expectedTextTree}`);

const treeRaw = execFileSync(
  "git",
  ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", "text"],
  { maxBuffer: 4 * 1024 * 1024 },
).toString("utf8");
const treeEntries = treeRaw.split("\0").filter(Boolean).map((entry) => {
  const match = entry.match(/^\d+\s+blob\s+([a-f0-9]{40})\s+(\d+)\t(.+)$/s);
  if (!match) throw new Error(`无法解析德格 Git tree 记录：${entry}`);
  return { blob: match[1], bytes: Number(match[2]), path: match[3] };
}).filter((entry) => /^text\/\d{3}_.+\.txt$/u.test(entry.path)).sort((a, b) => a.path.localeCompare(b.path, "en"));
if (treeEntries.length !== 103) throw new Error(`德格固定来源应有 103 卷文件，实际 ${treeEntries.length}`);

const readmeBytes = await readFile(resolve(sourceRoot, "README.md"));
const readmeText = readmeBytes.toString("utf8");
const licenseStatement = "This work is a mechanical reproduction of a Public Domain work, and as such is also in the Public Domain.";
if (!readmeText.includes(`# License\n\n${licenseStatement}`)) throw new Error("上游 README 的 Public Domain 声明漂移");
const readmeBlob = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD:README.md"], { encoding: "utf8" }).trim();
if (readmeBlob !== "338b3176ce8cbe1fff9121adfe1cf8d2647cd5c3") throw new Error("上游 README Git blob 漂移");

const bdrcPath = "data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json";
const bdrcBytes = await readFile(resolve(root, bdrcPath));
const bdrc = JSON.parse(bdrcBytes.toString("utf8"));
const naturalDergeOrder = (left, right) => {
  const parse = (value) => {
    const match = value.match(/^D(\d+)([a-z])?$/);
    if (!match) throw new Error(`不是顶层德格目录号：${value}`);
    return [Number(match[1]), match[2] ?? ""];
  };
  const a = parse(left.dergeCatalogId ?? left);
  const b = parse(right.dergeCatalogId ?? right);
  return a[0] - b[0] || a[1].localeCompare(b[1]);
};
const records = [...bdrc.records, ...bdrc.excludedCatalogRecords].sort(naturalDergeOrder);
if (records.length !== 1122) throw new Error("BDRC 顶层德格目录记录应为 1,122 项");
const topLevelIds = new Set(records.map((record) => record.dergeCatalogId));
if (topLevelIds.size !== 1122) throw new Error("BDRC 顶层德格目录号不唯一");

const sectionLabels = {
  MW22084_S0001: "律藏",
  MW22084_S0002: "十万颂般若",
  MW22084_S0003: "二万五千颂般若",
  MW22084_S0004: "一万八千颂般若",
  MW22084_S0005: "一万颂般若",
  MW22084_S0006: "八千颂般若",
  MW22084_S0007: "般若杂集",
  MW22084_S0008: "华严",
  MW22084_S0009: "宝积",
  MW22084_S0010: "经部",
  MW22084_S0011: "续部",
  MW22084_S0012: "旧续",
  MW22084_S0013: "陀罗尼集",
  MW22084_S0014: "时轮",
};
const slugFor = (canonId) => {
  const match = canonId.match(/^D(\d+)([a-z])?$/);
  return `derge-kangyur-d${match[1].padStart(4, "0")}${match[2] ?? ""}`;
};
const workIdFor = (record) => `gbcr:work:bdrc-${record.linkedAbstractWorkId.toLowerCase()}`;
const recordById = new Map(records.map((record) => [record.dergeCatalogId, record]));
const fragmentsById = new Map(records.map((record) => [record.dergeCatalogId, []]));
const volumeInventory = [];
const markerIds = [];
let activeId = null;
let canonicalSourceBytes = 0;

for (const entry of treeEntries.slice(0, 102)) {
  const filename = basename(entry.path);
  const volume = filename.slice(0, 3);
  const bytes = await readFile(resolve(sourceRoot, entry.path));
  if (bytes.length !== entry.bytes) throw new Error(`${entry.path} Git 字节数漂移`);
  canonicalSourceBytes += bytes.length;
  const text = bytes.toString("utf8");
  let currentPage;
  let currentLine;
  const topMarkers = [];
  const combined = /\[(\d+x?[ab])(?:\.(\d+))?\]|\{(D\d+(?:[a-z]|-\d+)?)\}/g;
  for (const match of text.matchAll(combined)) {
    if (match[1]) {
      currentPage = match[1];
      currentLine = match[2];
      continue;
    }
    const id = match[3];
    markerIds.push(id);
    if (!topLevelIds.has(id)) continue;
    topMarkers.push({
      id,
      byteOffset: Buffer.byteLength(text.slice(0, match.index)),
      initialPage: currentPage,
      initialLine: currentLine,
    });
  }

  const slices = [];
  let start = 0;
  let initialPage;
  let initialLine;
  if (!activeId && !topMarkers.length) throw new Error(`${entry.path} 在首个顶层目录号前无法归属`);
  if (!activeId) {
    activeId = topMarkers.shift().id;
    initialPage = undefined;
    initialLine = undefined;
  }
  for (const marker of topMarkers) {
    if (marker.byteOffset > start) {
      slices.push({ id: activeId, start, end: marker.byteOffset, initialPage, initialLine });
    }
    activeId = marker.id;
    start = marker.byteOffset;
    initialPage = marker.initialPage;
    initialLine = marker.initialLine;
  }
  if (start < bytes.length) slices.push({ id: activeId, start, end: bytes.length, initialPage, initialLine });
  if (!slices.length) throw new Error(`${entry.path} 未生成任何可逆切片`);

  const reconstruction = Buffer.concat(slices.map((slice) => bytes.subarray(slice.start, slice.end)));
  if (!reconstruction.equals(bytes)) throw new Error(`${entry.path} 切片无法逐字节重建`);
  let cursor = 0;
  for (const slice of slices) {
    if (!recordById.has(slice.id)) throw new Error(`${entry.path} 切片归属未知顶层目录号 ${slice.id}`);
    if (slice.start !== cursor) throw new Error(`${entry.path} 切片出现空洞或重叠`);
    cursor = slice.end;
    const fragment = bytes.subarray(slice.start, slice.end);
    const slug = slugFor(slice.id);
    const localPath = `data/corpus/derge/works/${slug}/${volume}.txt`;
    if (outputEntries.has(localPath)) throw new Error(`${slice.id} 在卷 ${volume} 出现多个不连续切片`);
    addOutput(localPath, fragment);
    const fragmentRecord = {
      part: fragmentsById.get(slice.id).length + 1,
      id: `${slice.id}-v${volume}`,
      volume,
      localPath,
      upstreamPath: entry.path,
      upstreamGitBlobSha1: entry.blob,
      byteRange: { start: slice.start, end: slice.end },
      upstreamBytes: fragment.length,
      upstreamSha256: sha256(fragment),
      localBytes: fragment.length,
      localSha256: sha256(fragment),
      format: "text/plain",
      ...(slice.initialPage ? { initialPage: slice.initialPage } : {}),
      ...(slice.initialLine ? { initialLine: slice.initialLine } : {}),
    };
    fragmentsById.get(slice.id).push({ ...fragmentRecord, text: fragment.toString("utf8") });
  }
  volumeInventory.push({
    volume,
    filename,
    upstreamPath: entry.path,
    upstreamGitBlobSha1: entry.blob,
    bytes: bytes.length,
    sha256: sha256(bytes),
    slices: slices.map((slice) => ({
      dergeCatalogId: slice.id,
      byteRange: { start: slice.start, end: slice.end },
      localPath: `data/corpus/derge/works/${slugFor(slice.id)}/${volume}.txt`,
      sha256: sha256(bytes.subarray(slice.start, slice.end)),
    })),
  });
}

const allMarkerSet = new Set(markerIds);
const missingTopLevelIds = [...topLevelIds].filter((id) => !allMarkerSet.has(id));
if (missingTopLevelIds.length) throw new Error(`德格正文缺少顶层目录号：${missingTopLevelIds.join(", ")}`);
const componentIds = [...allMarkerSet].filter((id) => !topLevelIds.has(id)).sort();
if (componentIds.length !== 76) throw new Error(`德格正文组件目录号应为 76，实际 ${componentIds.length}`);
if (new Set(markerIds).size !== 1198) throw new Error("德格正文目录标记唯一集合应为 1,198 项");

const manifestFiles = [];
for (const record of records) {
  const sourcesWithText = fragmentsById.get(record.dergeCatalogId);
  if (!sourcesWithText.length) throw new Error(`${record.dergeCatalogId} 没有正文切片`);
  const reading = parseDergeSources(sourcesWithText.map((source) => ({
    filename: basename(source.localPath),
    text: source.text,
    volume: source.volume,
    initialPage: source.initialPage,
    initialLine: source.initialLine,
  })), { canonId: record.dergeCatalogId });
  const sourceParts = sourcesWithText.map(({ text, ...source }) => {
    void text;
    return source;
  });
  const section = bdrc.sections.find((item) => item.id === record.sectionId);
  const sourceUrl = `https://github.com/Esukhia/derge-kangyur/tree/${expectedCommit}/text`;
  manifestFiles.push({
    id: record.dergeCatalogId,
    slug: slugFor(record.dergeCatalogId),
    workId: workIdFor(record),
    language: "bo-Tibt",
    parser: "derge_plain_text",
    format: "text/plain",
    completeness: "complete_top_level_catalog_expression",
    sourceParts,
    catalogAlignment: {
      authority: "BDRC MW22084 outline metadata",
      expressionId: record.expressionId,
      linkedAbstractWorkId: record.linkedAbstractWorkId,
      sectionId: record.sectionId,
      resourceUrl: record.resourceUrl,
      editionBoundary: "BDRC 初印本目录只作编号、题名与作品链接对齐；本全文以 Esukhia 的 LOC W4CZ5369 校勘来源为文本见证，不宣称两版本逐字相同。",
    },
    presentation: {
      title: `德格《甘珠尔》${record.dergeCatalogId}`,
      alternateTitle: record.titleEwts,
      tradition: `藏传佛教 · 德格甘珠尔 · ${sectionLabels[record.sectionId] ?? section?.titleEwts ?? "未分部"}`,
      language: "藏文（Unicode 藏文字母，NFD）",
      canonRef: `德格目录 ${record.dergeCatalogId}`,
      translator: "藏译责任依各经题记；本批次未逐条裁决",
      summary: `${sectionLabels[record.sectionId] ?? "德格甘珠尔"}顶层文本 ${record.dergeCatalogId}；EWTS 题名：${record.titleEwts}。保留 Esukhia 版页行号与目录标记，不自动声称为佛陀逐字亲说。`,
      sourceUrl,
    },
    relationDecision: `BDRC ${record.linkedAbstractWorkId} 作为固定目录作品链接候选；同一链接下的多个德格编号保留为不同文本表达，不进行未经复核的跨传统合并。`,
    attributionDecision: "canonical_text_not_automatically_verbatim_buddha_word",
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      volumes: [...new Set(sourceParts.map((source) => source.volume))],
      anchors: [reading.segments[0].id, reading.segments.at(-1).id],
      duplicateStableAnchors: reading.segments.length - new Set(reading.segments.map((segment) => segment.id.replace(/\.\d{2}$/, ""))).size,
      humanSampleVerified: false,
    },
  });
}

const totalSegments = manifestFiles.reduce((sum, file) => sum + file.verification.segments, 0);
const totalReadingUnits = manifestFiles.reduce((sum, file) => sum + file.verification.readingUnits, 0);
const uniqueWorkIds = new Set(manifestFiles.map((file) => file.workId));
if (uniqueWorkIds.size !== 851) throw new Error(`BDRC 链接作品标识应为 851 个，实际 ${uniqueWorkIds.size}`);

const referenceEntry = treeEntries[102];
const referenceBytes = await readFile(resolve(sourceRoot, referenceEntry.path));
const referencePath = "data/corpus/derge/reference/103_catalog.txt";
addOutput(referencePath, referenceBytes);
addOutput("data/corpus/derge/UPSTREAM_README.md", readmeBytes);
const notice = `# 德格《甘珠尔》全文来源与权利\n\n` +
  `- 来源：Esukhia/derge-kangyur，固定提交 \`${expectedCommit}\`。\n` +
  `- 上游声明：${licenseStatement}\n` +
  `- 正文范围：001–102 卷；按 1,122 个顶层德格目录号无损切片，所有切片可按清单逐字节重建原卷。\n` +
  `- 第 103 卷：只作为目录参考保存，不计入佛典正文表达或覆盖率。\n` +
  `- 书目边界：BDRC MW22084 初印本目录仅用于编号、EWTS 题名、部类和抽象作品链接对齐；Esukhia 文本以 LOC W4CZ5369 为主要图像来源，两个版本不得声称逐字相同。\n` +
  `- 归属边界：《甘珠尔》是传统规范文献集合；平台不会仅因目录位置而把每一项标作佛陀逐字亲说。\n`;
addOutput("data/corpus/derge/NOTICE.md", Buffer.from(notice));

const inventory = {
  schema: "https://foxue.ai/schemas/gbcr/esukhia-derge-kangyur-inventory-v0.1",
  version: inventoryVersion,
  capturedAt: "2026-08-16",
  status: "fixed_public_domain_full_text_with_reversible_top_level_slices",
  source: {
    repository: "Esukhia/derge-kangyur",
    commit: expectedCommit,
    tree: expectedTree,
    textTree: expectedTextTree,
    homepage: "https://github.com/Esukhia/derge-kangyur",
    primaryEdition: "Library of Congress Derge edition W4CZ5369",
    fallbackEdition: "Karmapa/Parphud edition W22084 for missing or unreadable passages",
    derivedFrom: "UVA-SOAS 2013 eKangyur with BDRC OCR, ACIP and Adarsha comparisons; further proofread by Esukhia-Barom",
  },
  rights: {
    status: "public_domain",
    statement: licenseStatement,
    readmePath: "data/corpus/derge/UPSTREAM_README.md",
    readmeGitBlobSha1: readmeBlob,
    readmeSha256: sha256(readmeBytes),
  },
  definition: {
    canonicalVolumeRange: "001–102",
    catalogReferenceVolume: "103",
    recordUnit: "top-level Derge catalog text occurrence",
    workUnit: "distinct BDRC linked abstract work identifier, retained as a catalog-authority candidate",
    inclusionRule: "All 1,122 BDRC top-level D identifiers found in Esukhia volumes 001–102, including eight entries absent or unlocated in the Parphud outline but present in the LOC-oriented Esukhia text.",
    exclusionRule: "Volume 103 and 76 nested component markers are preserved as reference or structure but excluded from top-level scripture-expression counts.",
    denominatorCaveat: "1,122 is complete for this fixed digital Derge witness, not the global number of Buddhist works; 851 linked BDRC work identifiers are not a cross-tradition deduplicated global denominator.",
    attributionCaveat: "Canonical inclusion does not establish that every item is the Buddha's verbatim speech.",
  },
  totals: {
    canonicalVolumes: 102,
    referenceVolumes: 1,
    topLevelExpressions: manifestFiles.length,
    linkedAbstractWorkIds: uniqueWorkIds.size,
    allUniqueDergeMarkers: new Set(markerIds).size,
    nestedComponentMarkers: componentIds.length,
    canonicalSourceBytes,
    stableSegments: totalSegments,
    readingUnits: totalReadingUnits,
  },
  integrity: {
    volumePathBytesSha256: sha256(volumeInventory.map((volume) => `${volume.upstreamPath}\0${volume.bytes}\0${volume.sha256}`).join("\n")),
    topLevelIdSha256: sha256(records.map((record) => record.dergeCatalogId).join("\n")),
    componentIdSha256: sha256(componentIds.join("\n")),
    bdrcInventoryFile: bdrcPath,
    bdrcInventorySha256: sha256(bdrcBytes),
  },
  anomalies: {
    byteOrderMarkVolumes: volumeInventory.filter((volume) => outputEntries.get(volume.slices[0].localPath)?.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).map((volume) => volume.volume),
    sourcePagePolicy: "Duplicate, skipped and x-marked page numbers are preserved; repeated page-line anchors receive a deterministic two-digit occurrence suffix in stable segment IDs.",
    multiTopLevelMarkerLines: 9,
    bdrcNestedPartCount: 71,
    esukhiaComponentMarkerCount: componentIds.length,
    componentCountDecision: "The five-item difference and identifier sets remain published as evidence; no silent equivalence is asserted.",
  },
  referenceVolume: {
    upstreamPath: referenceEntry.path,
    upstreamGitBlobSha1: referenceEntry.blob,
    bytes: referenceBytes.length,
    sha256: sha256(referenceBytes),
    localPath: referencePath,
    role: "catalog_reference_excluded_from_canonical_full_text_counts",
  },
  sections: bdrc.sections.map((section) => ({ ...section, titleZh: sectionLabels[section.id] })),
  componentMarkers: componentIds,
  volumes: volumeInventory,
};

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.4",
  version: manifestVersion,
  source: {
    id: "esukhia_derge_kangyur",
    name: "Esukhia Digital Derge Kangyur",
    repository: "Esukhia/derge-kangyur",
    commit: expectedCommit,
    tree: expectedTree,
    textTree: expectedTextTree,
    homepage: "https://github.com/Esukhia/derge-kangyur",
    licenseUrl: `https://github.com/Esukhia/derge-kangyur/blob/${expectedCommit}/README.md#license`,
  },
  rightsDecision: {
    status: "public_domain",
    sourceTexts: "public_domain",
    attributionRequested: true,
    trainingUse: "prohibited_by_foxue_policy",
    summary: "上游明确声明为公有领域作品的机械复制；foxue.ai 保留来源、固定提交、版本边界和可逆切片证据，仅用于阅读、研究与有来源检索，不用于生成式模型训练。",
  },
  normalization: {
    operation: "reversible_byte_slicing_by_top_level_derge_marker",
    contentChange: "none",
    unicode: "upstream UTF-8 NFD preserved byte-for-byte",
    displayOnly: "page and Derge markers are hidden by the reader but retained in source slices",
  },
  collection: {
    id: "DERGE-KANGYUR",
    canonicalTitle: "sDe dge bKa' 'gyur",
    titleZh: "德格版《甘珠尔》",
    tradition: "藏传佛教",
    language: "bo-Tibt",
    expressionCount: manifestFiles.length,
    linkedWorkCandidates: uniqueWorkIds.size,
    sourceBytes: canonicalSourceBytes,
    stableSegments: totalSegments,
    readingUnits: totalReadingUnits,
  },
  files: manifestFiles,
};

const catalog = {
  schema: "https://foxue.ai/schemas/derge-corpus-catalog-v0.1",
  version: manifestVersion,
  sourceManifest: "data/corpus/derge/manifest-v0.1.0.json",
  totals: manifest.collection,
  files: manifestFiles.map((file) => ({
    id: file.id,
    slug: file.slug,
    workId: file.workId,
    titleEwts: file.presentation.alternateTitle,
    sectionId: file.catalogAlignment.sectionId,
    linkedAbstractWorkId: file.catalogAlignment.linkedAbstractWorkId,
    expressionId: file.catalogAlignment.expressionId,
    presentation: file.presentation,
    relationDecision: file.relationDecision,
    attributionDecision: file.attributionDecision,
    verification: file.verification,
  })),
};

const batch = {
  schema: "https://foxue.ai/schemas/derge-corpus-batch-v0.1",
  version: manifestVersion,
  generatedFrom: {
    inventory: `data/gbcr/esukhia-derge-kangyur-inventory-v${inventoryVersion}.json`,
    inventorySha256: sha256(jsonBytes(inventory)),
    bdrcInventory: bdrcPath,
    bdrcInventorySha256: sha256(bdrcBytes),
  },
  totals: manifest.collection,
  expressions: manifestFiles.map((file) => ({
    id: file.id,
    slug: file.slug,
    workId: file.workId,
    sourceParts: file.sourceParts.map((source) => source.localPath),
    stableSegments: file.verification.segments,
    readingUnits: file.verification.readingUnits,
    firstSegmentId: file.verification.anchors[0],
    lastSegmentId: file.verification.anchors[1],
  })),
};

const baseSnapshotsPath = "data/gbcr/source-snapshots-v4.4.0.json";
const baseSnapshotsBytes = await readFile(resolve(root, baseSnapshotsPath));
const baseSnapshots = JSON.parse(baseSnapshotsBytes.toString("utf8"));
if (baseSnapshots.sources.some((source) => source.id === "esukhia_derge_kangyur")) throw new Error("既有来源快照已包含 Esukhia 德格全文");
const inventoryPath = `data/gbcr/esukhia-derge-kangyur-inventory-v${inventoryVersion}.json`;
const manifestPath = `data/corpus/derge/manifest-v${manifestVersion}.json`;
const catalogPath = `data/corpus/derge/catalog-v${manifestVersion}.json`;
const batchPath = `data/corpus/derge/batch-v${manifestVersion}.json`;
const sourceSnapshots = {
  ...baseSnapshots,
  version: snapshotVersion,
  capturedAt: "2026-08-16",
  status: "multi_tradition_candidate_record_inventory_with_public_domain_tibetan_full_text",
  derivedFrom: { file: baseSnapshotsPath, sha256: sha256(baseSnapshotsBytes) },
  sources: [...baseSnapshots.sources, {
    id: "esukhia_derge_kangyur",
    repository: "Esukhia/derge-kangyur",
    commit: expectedCommit,
    tree: expectedTree,
    textTree: expectedTextTree,
    treeTruncated: false,
    candidateRecordCount: manifestFiles.length,
    controlledExpressionRecords: manifestFiles.length,
    linkedAbstractWorkIds: uniqueWorkIds.size,
    canonicalVolumes: 102,
    candidateBytes: canonicalSourceBytes,
    controlledBytes: canonicalSourceBytes,
    stableSegments: totalSegments,
    recordUnit: "top-level Derge catalog text occurrence",
    inclusionRule: inventory.definition.inclusionRule,
    exclusionRule: inventory.definition.exclusionRule,
    inventoryFile: inventoryPath,
    inventorySha256: sha256(jsonBytes(inventory)),
    manifestFile: manifestPath,
    manifestSha256: sha256(jsonBytes(manifest)),
    denominatorCaveat: inventory.definition.denominatorCaveat,
  }],
};

addOutput(inventoryPath, jsonBytes(inventory));
addOutput(manifestPath, jsonBytes(manifest));
addOutput(catalogPath, jsonBytes(catalog));
addOutput(batchPath, jsonBytes(batch));
addOutput(`data/gbcr/source-snapshots-v${snapshotVersion}.json`, jsonBytes(sourceSnapshots));

if (writeMode) {
  for (const [relativePath, bytes] of outputEntries) {
    const destination = resolve(root, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  console.log(`德格《甘珠尔》来源快照已写入：${manifestFiles.length} 个顶层表达、${uniqueWorkIds.size} 个 BDRC 链接作品、${totalSegments} 个稳定行段、${canonicalSourceBytes} 字节。`);
} else {
  for (const [relativePath, expected] of outputEntries) {
    const actual = await readFile(resolve(root, relativePath));
    if (!actual.equals(expected)) throw new Error(`${relativePath} 与固定德格来源不可复现`);
  }
  console.log(`德格《甘珠尔》来源快照可复现：${manifestFiles.length} 个顶层表达、${uniqueWorkIds.size} 个 BDRC 链接作品、${totalSegments} 个稳定行段、${canonicalSourceBytes} 字节。`);
}
