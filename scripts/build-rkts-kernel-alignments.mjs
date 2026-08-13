import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const version = "0.6.0";
const capturedAt = "2026-08-14";
const snapshotPath = resolve(root, "data/gbcr/rkts-kangyur-catalog-snapshot-v0.5.0.json");
const outputPath = resolve(root, `data/gbcr/rkts-kernel-alignment-audit-v${version}.json`);
const expectedKernel = {
  path: "Kernel/rkts.xml",
  blobSha: "dd5d2c5e7dbc223e6ba88c7e9b8d682445a7a91c",
  bytes: 1529847,
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const ghBlob = async (repository, blobSha) => {
  const { stdout } = await execFileAsync("gh", ["api", `repos/${repository}/git/blobs/${blobSha}`], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const document = JSON.parse(stdout);
  requireValue(document.sha === blobSha && document.encoding === "base64", `Git blob ${blobSha} 响应不匹配`);
  return Buffer.from(document.content.replace(/\s/g, ""), "base64");
};

const itemBlocks = (xml) => [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)]
  .map((match) => match[1]);
const elementValues = (block, name) => [...block.matchAll(
  new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "g"),
)].map((match) => match[1].replace(/<[^>]+>/g, "").trim());
const elementValue = (block, name) => elementValues(block, name)[0] ?? "";
const invalidLinkValues = new Set(["-", "?", "new", "new?", "xxx"]);
const normalizeKernelId = (value) => /^[KGT](.+)$/.test(value) ? value.slice(1) : value;

const histogram = (values) => Object.fromEntries([...values.reduce((map, value) => {
  map.set(value, (map.get(value) ?? 0) + 1);
  return map;
}, new Map()).entries()].sort((left, right) => left[0] - right[0]));

const buildAudit = async () => {
  const snapshotRaw = await readFile(snapshotPath, "utf8");
  const snapshot = JSON.parse(snapshotRaw);
  requireValue(snapshot.version === "0.5.0", "rKTs 目录快照版本不匹配");
  const repository = snapshot.upstream.sourceRepository;
  const availableCatalogs = snapshot.catalogs.filter((catalog) => catalog.sourcePathAvailable);
  requireValue(availableCatalogs.length === 19, "rKTs 可用目录数量漂移");

  const kernelBody = await ghBlob(repository, expectedKernel.blobSha);
  requireValue(kernelBody.length === expectedKernel.bytes && gitBlobSha(kernelBody) === expectedKernel.blobSha, "rKTs kernel blob 内容漂移");
  const kernelRecords = itemBlocks(kernelBody.toString("utf8")).map((block, index) => ({
    ordinal: index + 1,
    id: elementValue(block, "rkts"),
    section: elementValue(block, "section") || "unsectioned",
    standardTibetan: elementValue(block, "StandardTibetan") || null,
    standardSanskrit: elementValue(block, "StandardSanskrit") || null,
  }));
  requireValue(kernelRecords.every((record) => record.id), "rKTs kernel 存在空编号记录");
  const kernelIdCounts = new Map();
  for (const record of kernelRecords) kernelIdCounts.set(record.id, (kernelIdCounts.get(record.id) ?? 0) + 1);
  const kernelIds = new Set(kernelIdCounts.keys());

  const supportByKernelId = new Map();
  const catalogAudits = [];
  let itemRecords = 0;
  let linkTags = 0;
  let nonEmptyLinkValues = 0;
  let emptyOrMissingLinkItems = 0;
  let invalidValues = 0;
  let multiLinkItems = 0;

  for (const catalog of availableCatalogs) {
    const body = await ghBlob(repository, catalog.blobSha);
    requireValue(body.length === catalog.bytes && gitBlobSha(body) === catalog.blobSha, `${catalog.id} XML blob 内容漂移`);
    const blocks = itemBlocks(body.toString("utf8"));
    requireValue(blocks.length === catalog.itemRecords, `${catalog.id} item 数量漂移`);
    let catalogLinkTags = 0;
    let catalogEmpty = 0;
    let catalogMulti = 0;
    const exactIds = new Set();
    const unresolvedIds = new Set();

    for (let index = 0; index < blocks.length; index += 1) {
      const rawIds = elementValues(blocks[index], "rkts");
      itemRecords += 1;
      linkTags += rawIds.length;
      catalogLinkTags += rawIds.length;
      if (rawIds.length > 1) {
        multiLinkItems += 1;
        catalogMulti += 1;
      }
      if (rawIds.length === 0 || rawIds.every((value) => !value)) {
        emptyOrMissingLinkItems += 1;
        catalogEmpty += 1;
      }
      for (const rawId of rawIds) {
        if (!rawId) continue;
        nonEmptyLinkValues += 1;
        const normalizedId = normalizeKernelId(rawId);
        if (invalidLinkValues.has(normalizedId)) {
          invalidValues += 1;
          continue;
        }
        if (!supportByKernelId.has(normalizedId)) {
          supportByKernelId.set(normalizedId, { catalogIds: new Set(), itemOccurrences: 0, rawValues: new Set() });
        }
        const support = supportByKernelId.get(normalizedId);
        support.catalogIds.add(catalog.eid);
        support.itemOccurrences += 1;
        support.rawValues.add(rawId);
        if (kernelIds.has(normalizedId)) exactIds.add(normalizedId);
        else unresolvedIds.add(normalizedId);
      }
    }

    catalogAudits.push({
      id: catalog.id,
      eid: catalog.eid,
      blobSha: catalog.blobSha,
      itemRecords: blocks.length,
      linkTags: catalogLinkTags,
      emptyOrMissingLinkItems: catalogEmpty,
      multiLinkItems: catalogMulti,
      exactKernelIds: exactIds.size,
      unresolvedNormalizedIds: [...unresolvedIds].sort((left, right) => left.localeCompare(right)),
    });
  }

  const exactAlignments = [...supportByKernelId.entries()]
    .filter(([id]) => kernelIds.has(id))
    .map(([id, support]) => ({
      kernelId: id,
      catalogIds: [...support.catalogIds].sort((left, right) => left.localeCompare(right)),
      distinctCatalogs: support.catalogIds.size,
      itemOccurrences: support.itemOccurrences,
      rawValues: [...support.rawValues].sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.kernelId.localeCompare(right.kernelId, undefined, { numeric: true }));
  const unresolvedIds = [...supportByKernelId.entries()]
    .filter(([id]) => !kernelIds.has(id))
    .map(([id, support]) => ({
      normalizedId: id,
      rawValues: [...support.rawValues].sort((left, right) => left.localeCompare(right)),
      catalogIds: [...support.catalogIds].sort((left, right) => left.localeCompare(right)),
      itemOccurrences: support.itemOccurrences,
      reviewReason: id.startsWith("835-")
        ? "上游 kernel 将 835 重复用于九条记录；德格目录另用 835-1 至 835-8。须人工重建组件映射，不自动折叠到 835。"
        : "目录编号无法在固定 kernel 中精确匹配。",
    }))
    .sort((left, right) => left.normalizedId.localeCompare(right.normalizedId, undefined, { numeric: true }));
  const duplicateKernelIds = [...kernelIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({
      id,
      records: count,
      reviewReason: "同一 kernel 编号对应多条记录，不能据编号自动裁决为单一作品。",
    }));
  const sections = Object.fromEntries([...kernelRecords.reduce((map, record) => {
    map.set(record.section, (map.get(record.section) ?? 0) + 1);
    return map;
  }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)));
  const linkedSections = Object.fromEntries([...kernelRecords.filter((record) => supportByKernelId.has(record.id)).reduce((map, record) => {
    map.set(record.section, (map.get(record.section) ?? 0) + 1);
    return map;
  }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)));
  const alignmentSetRaw = exactAlignments.map((alignment) => [
    alignment.kernelId,
    alignment.catalogIds.join(","),
    alignment.itemOccurrences,
    alignment.rawValues.join(","),
  ].join("\t")).join("\n");

  const audit = {
    schema: "https://foxue.ai/schemas/gbcr/rkts-kernel-alignment-audit-v0.6",
    version,
    capturedAt,
    status: "candidate_identifier_alignment_only",
    warning: "rKTs kernel 编号是跨目录候选桥梁，不等于已经裁决的作品实体。编号重复、组件后缀、目录缺链、多 item 指向与全集范围差异必须在 Work/Expression/Witness 合并前人工复核。",
    policy: {
      automaticWorkMerge: false,
      segmentEquivalenceAsserted: false,
      denominatorImpact: "none",
      prefixNormalization: "只按上游 migration editionxmltottl.php 规则移除单个 K/G/T 前缀；不修改数字和组件后缀。",
      invalidValuesExcluded: [...invalidLinkValues].sort(),
    },
    inputs: {
      catalogSnapshot: {
        file: "data/gbcr/rkts-kangyur-catalog-snapshot-v0.5.0.json",
        sha256: sha256(await readFile(snapshotPath)),
      },
      sourceRepository: repository,
      sourceCommit: snapshot.upstream.sourceCommit,
      sourceTree: snapshot.upstream.sourceTree,
      kernel: expectedKernel,
    },
    kernel: {
      itemRecords: kernelRecords.length,
      uniqueIds: kernelIds.size,
      duplicateIds: duplicateKernelIds,
      sections,
      linkedRecordSections: linkedSections,
    },
    catalogs: {
      availableCatalogs: availableCatalogs.length,
      itemRecords,
      linkTags,
      nonEmptyLinkValues,
      emptyOrMissingLinkItems,
      invalidLinkValues: invalidValues,
      multiLinkItems,
      audits: catalogAudits,
    },
    summary: {
      uniqueNormalizedCandidateIds: supportByKernelId.size,
      exactKernelIds: exactAlignments.length,
      exactKernelIdsInOneCatalog: exactAlignments.filter((alignment) => alignment.distinctCatalogs === 1).length,
      exactKernelIdsInTwoOrMoreCatalogs: exactAlignments.filter((alignment) => alignment.distinctCatalogs >= 2).length,
      exactKernelIdsInEightOrMoreCatalogs: exactAlignments.filter((alignment) => alignment.distinctCatalogs >= 8).length,
      unlinkedKernelIds: kernelIds.size - exactAlignments.length,
      unresolvedNormalizedIds: unresolvedIds.length,
      supportByDistinctCatalogs: histogram(exactAlignments.map((alignment) => alignment.distinctCatalogs)),
      denominatorImpact: "none",
    },
    integrity: {
      alignmentSetSha256: sha256(alignmentSetRaw),
      exactAlignmentInventoryPublished: true,
      catalogItemTextPublished: false,
    },
    unresolvedIds,
    exactAlignments,
  };
  return { audit, raw: serialize(audit) };
};

const validateAudit = (audit, raw) => {
  requireValue(audit.version === version && audit.status === "candidate_identifier_alignment_only", "rKTs kernel 对齐账本版本或状态不匹配");
  requireValue(audit.policy.automaticWorkMerge === false && audit.policy.denominatorImpact === "none", "rKTs kernel 对齐不得自动合并作品或改变分母");
  requireValue(audit.kernel.itemRecords === 1570 && audit.kernel.uniqueIds === 1562, "rKTs kernel 记录或唯一编号数漂移");
  requireValue(audit.kernel.duplicateIds.length === 1 && audit.kernel.duplicateIds[0].id === "835" && audit.kernel.duplicateIds[0].records === 9, "rKTs kernel 835 重号反例漂移");
  requireValue(audit.catalogs.availableCatalogs === 19 && audit.catalogs.itemRecords === 15069, "rKTs 目录对齐范围漂移");
  requireValue(audit.catalogs.linkTags === 15116 && audit.catalogs.emptyOrMissingLinkItems === 43, "rKTs 目录链接或缺链统计漂移");
  requireValue(audit.catalogs.invalidLinkValues === 119 && audit.catalogs.multiLinkItems === 3, "rKTs 无效值或多链接 item 统计漂移");
  requireValue(audit.summary.exactKernelIds === 1143 && audit.summary.exactKernelIdsInTwoOrMoreCatalogs === 971, "rKTs 精确 kernel 连接统计漂移");
  requireValue(audit.summary.exactKernelIdsInEightOrMoreCatalogs === 819 && audit.summary.unlinkedKernelIds === 419, "rKTs 广泛支持或未链接 kernel 统计漂移");
  requireValue(audit.summary.unresolvedNormalizedIds === 8 && audit.unresolvedIds.every((item) => /^835-[1-8]$/.test(item.normalizedId)), "rKTs 835 组件未决集合漂移");
  requireValue(audit.exactAlignments.length === 1143 && audit.integrity.exactAlignmentInventoryPublished === true, "rKTs 精确对齐明细不完整");
  requireValue(audit.integrity.catalogItemTextPublished === false, "rKTs 目录 item 正文不得随对齐账本发布");
  requireValue(raw === serialize(audit), "rKTs kernel 对齐 JSON 序列化不稳定");
};

if (process.argv.includes("--verify")) {
  const raw = await readFile(outputPath, "utf8");
  const audit = JSON.parse(raw);
  validateAudit(audit, raw);
  console.log("rKTs kernel 对齐账本验证通过：1,143 个精确编号连接；971 个见于至少两个目录；8 个 835 组件保持未决。");
} else {
  const { audit, raw } = await buildAudit();
  validateAudit(audit, raw);
  await writeFile(outputPath, raw, "utf8");
  console.log("rKTs kernel 对齐账本已生成：只发布候选编号连接，不自动合并作品或改变全球分母。");
}
