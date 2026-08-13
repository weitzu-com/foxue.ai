import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const version = "0.5.0";
const capturedAt = "2026-08-13";
const migrationRepository = "buda-base/rKTs-migration";
const migrationCommit = "7c2885721f9c5af6cfbd9e9436f223597649605d";
const migrationTree = "831801488e2626077c27f876f153d61240f0337a";
const sourceRepository = "brunogml/rKTs";
const sourceCommit = "f6a87b6965641111b566ce2db14f7641a7469e6f";
const sourceTree = "d31e7bf96b111120f48c33f4441f54b03d503618";

const baseSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v0.4.0.json");
const evidencePath = resolve(root, `data/gbcr/rkts-kangyur-catalog-snapshot-v${version}.json`);
const snapshotsPath = resolve(root, `data/gbcr/source-snapshots-v${version}.json`);

const expectedCatalogs = [
  { id: "derge", label: "Derge Kanjur", eid: "D", path: "Collections/D Derge Kanjur/D.xml", blobSha: "ccd683ba666a38367ea5fefb00dcaad8267674bf", bytes: 4177524, itemRecords: 1122, referenceFields: 1193, uniqueReferences: 1193, rktsLinks: 1193 },
  { id: "chemdo", label: "dPe bsdur ma Kanjur", eid: "A", path: "Collections/A dPe bsdur ma Kanjur/A.xml", blobSha: "0f7b49c016e0da5c1e2a11c86c016233f9274e97", bytes: 1780844, itemRecords: 1250, referenceFields: 1250, uniqueReferences: 1137, rktsLinks: 1250 },
  { id: "goldenmustang", label: "Charang Kanjur", eid: "Cx", path: "Collections/Cx Charang Kanjur/Cx.xml", missing: true },
  { id: "egoo", label: "Egoo Collection", eid: "EG", path: "Collections/Eg Egoo Collection/Eg.xml", blobSha: "e53d477dca0627f9933e1ae5cad36b1cf403a5ed", bytes: 83417, itemRecords: 172, referenceFields: 172, uniqueReferences: 172, rktsLinks: 172 },
  { id: "shey", label: "Shey Kanjur", eid: "Z", path: "Collections/Z Shey Kanjur/Z.xml", blobSha: "e394f4c8d653203bc136cf0313d1c6a53d022122", bytes: 1408331, itemRecords: 780, referenceFields: 780, uniqueReferences: 780, rktsLinks: 780 },
  { id: "stog", label: "Stog Kanjur", eid: "S", path: "Collections/S Stog Kanjur/S.xml", blobSha: "3ed2974bcb1a880fbef377b7080405d42b33e93b", bytes: 1385021, itemRecords: 817, referenceFields: 817, uniqueReferences: 817, rktsLinks: 817 },
  { id: "narthang", label: "Narthang Kanjur", eid: "N", path: "Collections/N Narthang Kanjur/N.xml", blobSha: "d9c99cfc6534ebf1ba271915985eeaa66c793cec", bytes: 438359, itemRecords: 789, referenceFields: 789, uniqueReferences: 789, rktsLinks: 789 },
  { id: "peking", label: "Peking 1737 Kanjur", eid: "Q", path: "Collections/Q Peking 1737 Kanjur/Q.xml", blobSha: "cd2aa6bd6ed1a25c42206c77212b406dd0015106", bytes: 1366581, itemRecords: 1108, referenceFields: 1108, uniqueReferences: 1108, rktsLinks: 1108 },
  { id: "lhasa", label: "Lhasa Kanjur", eid: "H", path: "Collections/H Lhasa Kanjur/H.xml", blobSha: "a1c0d10b762f5375a34440463635ca3d3a7e5d5b", bytes: 817754, itemRecords: 812, referenceFields: 812, uniqueReferences: 812, rktsLinks: 810 },
  { id: "urga", label: "Urga Kanjur", eid: "U", path: "Collections/U Urga Kanjur/U.xml", blobSha: "09f74883e4054f5c194c5b31041b11ab47a064f8", bytes: 521436, itemRecords: 1109, referenceFields: 1109, uniqueReferences: 1108, rktsLinks: 1109 },
  { id: "cone", label: "Cone Kanjur", eid: "C", path: "Collections/C Cone Kanjur/C.xml", blobSha: "2d3d2a2917d0d389e1817e82dd7fe5b4e322f99f", bytes: 353969, itemRecords: 1104, referenceFields: 1104, uniqueReferences: 1104, rktsLinks: 1101 },
  { id: "lithang", label: "Lithang Kanjur", eid: "J", path: "Collections/J Lithang Kanjur/J.xml", blobSha: "3553a21d0b157973f65bc307ce76e795d5563cd1", bytes: 671486, itemRecords: 1121, referenceFields: 1120, uniqueReferences: 1120, rktsLinks: 1121 },
  { id: "phugdrak", label: "Phugbrag Kanjur", eid: "F", path: "Collections/F Phugbrag Kanjur/F.xml", blobSha: "3224fffab5a35449dbac17021e5a89b48a289141", bytes: 416258, itemRecords: 778, referenceFields: 778, uniqueReferences: 778, rktsLinks: 778 },
  { id: "ragya", label: "Ragya Kanjur", eid: "R", path: "sql_export/R.xml", blobSha: "d28c606d66fe98b8e8c0b2b92d9dbb00cbec6d27", bytes: 563176, itemRecords: 1111, referenceFields: 1111, uniqueReferences: 1111, rktsLinks: 1111 },
  { id: "hemishi", label: "Hemis II Kanjur", eid: "Hi", path: "sql_export/Hi.xml", blobSha: "644c693d7f55cd60930e5e7c91a62a3e9d8878a1", bytes: 81487, itemRecords: 159, referenceFields: 159, uniqueReferences: 159, rktsLinks: 157 },
  { id: "tashiyangtse", label: "Tashiyangtse Kanjur", eid: "Ty", path: "sql_export/Ty.xml", blobSha: "a379ebf5a4167a4b9585cdd67b7670b5695daed4", bytes: 513574, itemRecords: 812, referenceFields: 812, uniqueReferences: 812, rktsLinks: 805 },
  { id: "go", label: "Gondhla Collection", eid: "Go", path: "sql_export/Go.xml", blobSha: "2177719e88e9aa1350d680cd44d21ba970bd308a", bytes: 199324, itemRecords: 418, referenceFields: 418, uniqueReferences: 418, rktsLinks: 418 },
  { id: "ng", label: "Namgyal Collection", eid: "Ng", path: "sql_export/Ng.xml", blobSha: "bed1ada65a8f0050dc6f850547dd7c471bc09828", bytes: 356042, itemRecords: 638, referenceFields: 638, uniqueReferences: 638, rktsLinks: 635 },
  { id: "bd", label: "Bardan Collection", eid: "Bd", path: "sql_export/Bd.xml", blobSha: "d545da3ad6bacfd9003e6545467b3ebeeaac8264", bytes: 115423, itemRecords: 218, referenceFields: 218, uniqueReferences: 218, rktsLinks: 211 },
  { id: "l", label: "London Kanjur", eid: "L", path: "sql_export/L.xml", blobSha: "fe72a2012686867c2d92ca95b72826953e4e65f4", bytes: 294570, itemRecords: 751, referenceFields: 751, uniqueReferences: 751, rktsLinks: 751 },
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const gh = async (endpoint) => {
  const { stdout } = await execFileAsync("gh", ["api", endpoint], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout);
};

const decodeBlob = (response) => Buffer.from(response.content.replace(/\s/g, ""), "base64");
const parseYamlBlocks = (yaml) => {
  const blocks = new Map();
  let key = null;
  let lines = [];
  for (const line of yaml.split(/\r?\n/)) {
    const match = line.match(/^([a-z][a-z0-9]*):\s*$/);
    if (match) {
      if (key) blocks.set(key, lines.join("\n"));
      key = match[1];
      lines = [];
    } else if (key) {
      lines.push(line);
    }
  }
  if (key) blocks.set(key, lines.join("\n"));
  return blocks;
};

const parseConfig = (id, block) => {
  requireValue(block, `rkts.yaml 缺少 ${id} 配置`);
  const ridSource = block.match(/^  RID:\s*\[([^\]]+)\]/m)?.[1] ?? "";
  return {
    rids: [...ridSource.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    path: block.match(/^  file:\s*"([^"]+)"/m)?.[1] ?? null,
    eid: block.match(/^  EID:\s*"([^"]+)"/m)?.[1] ?? null,
    printType: block.match(/^  printType:\s*'bdr:([^']+)'/m)?.[1] ?? null,
  };
};

const analyzeCatalog = (body) => {
  const text = body.toString("utf8");
  const references = [...text.matchAll(/<ref(?:\s[^>]*)?>([\s\S]*?)<\/ref>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  return {
    bytes: body.length,
    itemRecords: (text.match(/<item(?:\s|>)/g) ?? []).length,
    referenceFields: references.length,
    uniqueReferences: new Set(references).size,
    rktsLinks: (text.match(/<rkts(?:\s|>)/g) ?? []).length,
  };
};

const buildLiveDocuments = async () => {
  const baseSnapshots = JSON.parse(await readFile(baseSnapshotsPath, "utf8"));
  const [migrationTreeDocument, sourceTreeDocument] = await Promise.all([
    gh(`repos/${migrationRepository}/git/trees/${migrationTree}?recursive=1`),
    gh(`repos/${sourceRepository}/git/trees/${sourceTree}?recursive=1`),
  ]);
  requireValue(migrationTreeDocument.sha === migrationTree && migrationTreeDocument.truncated === false, "rKTs migration Git tree 不完整或修订漂移");
  requireValue(sourceTreeDocument.sha === sourceTree && sourceTreeDocument.truncated === false, "rKTs source Git tree 不完整或修订漂移");
  requireValue(migrationTreeDocument.tree.length === 6103, "rKTs migration tree 条目数漂移");
  requireValue(sourceTreeDocument.tree.length === 26340, "rKTs source tree 条目数漂移");

  const migrationByPath = new Map(migrationTreeDocument.tree.map((entry) => [entry.path, entry]));
  const sourceByPath = new Map(sourceTreeDocument.tree.map((entry) => [entry.path, entry]));
  const requiredMigrationPaths = ["rkts.yaml", "migrate.php", ".gitmodules", "README.md", "LICENSE"];
  const migrationBlobs = Object.fromEntries(await Promise.all(requiredMigrationPaths.map(async (path) => {
    const entry = migrationByPath.get(path);
    requireValue(entry?.type === "blob", `rKTs migration 缺少 ${path}`);
    return [path, decodeBlob(await gh(`repos/${migrationRepository}/git/blobs/${entry.sha}`))];
  })));
  const sourceReadmeEntry = sourceByPath.get("README.md");
  requireValue(sourceReadmeEntry?.sha === "544c574cbee9de9e6729113b171f26a48b7ba0f0", "rKTs README blob 漂移");
  const sourceReadme = decodeBlob(await gh(`repos/${sourceRepository}/git/blobs/${sourceReadmeEntry.sha}`));

  const migrationSubmodule = migrationTreeDocument.tree.find((entry) => entry.path === "rKTs");
  requireValue(migrationSubmodule?.type === "commit" && migrationSubmodule.sha === sourceCommit, "rKTs 子模块未冻结到预期数据提交");
  const yaml = migrationBlobs["rkts.yaml"].toString("utf8");
  const migratePhp = migrationBlobs["migrate.php"].toString("utf8");
  const configuredIds = [...(migratePhp.match(/\$filesList\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? "").matchAll(/"([a-z0-9]+)"/g)]
    .map((match) => match[1]);
  requireValue(JSON.stringify(configuredIds) === JSON.stringify(expectedCatalogs.map((catalog) => catalog.id)), "migrate.php 选定目录集合漂移");
  const yamlBlocks = parseYamlBlocks(yaml);

  const catalogs = [];
  for (const expected of expectedCatalogs) {
    const config = parseConfig(expected.id, yamlBlocks.get(expected.id));
    requireValue(config.path === expected.path && config.eid === expected.eid, `${expected.id} 的 rkts.yaml 路径或版号漂移`);
    const treeEntry = sourceByPath.get(expected.path);
    if (expected.missing) {
      requireValue(!treeEntry, `${expected.id} 预期缺失路径已经出现，须人工复核后刷新快照`);
      catalogs.push({
        id: expected.id,
        label: expected.label,
        eid: config.eid,
        bdrcInstanceIds: config.rids,
        printType: config.printType,
        configuredPath: config.path,
        sourcePathAvailable: false,
        exclusionReason: "configured_path_missing_at_frozen_source_commit",
      });
      continue;
    }
    requireValue(treeEntry?.type === "blob" && treeEntry.sha === expected.blobSha && treeEntry.size === expected.bytes, `${expected.id} 固定 XML blob 漂移`);
    const body = decodeBlob(await gh(`repos/${sourceRepository}/git/blobs/${treeEntry.sha}`));
    const metrics = analyzeCatalog(body);
    requireValue(gitBlobSha(body) === treeEntry.sha, `${expected.id} XML 内容与 Git blob 不一致`);
    for (const field of ["bytes", "itemRecords", "referenceFields", "uniqueReferences", "rktsLinks"]) {
      requireValue(metrics[field] === expected[field], `${expected.id} ${field} 统计漂移`);
    }
    catalogs.push({
      id: expected.id,
      label: expected.label,
      eid: config.eid,
      bdrcInstanceIds: config.rids,
      printType: config.printType,
      configuredPath: config.path,
      sourcePathAvailable: true,
      blobSha: treeEntry.sha,
      ...metrics,
    });
  }

  const availableCatalogs = catalogs.filter((catalog) => catalog.sourcePathAvailable);
  const totals = {
    configuredCatalogs: catalogs.length,
    availableCatalogs: availableCatalogs.length,
    missingConfiguredCatalogs: catalogs.length - availableCatalogs.length,
    sourceBytes: availableCatalogs.reduce((sum, catalog) => sum + catalog.bytes, 0),
    itemRecords: availableCatalogs.reduce((sum, catalog) => sum + catalog.itemRecords, 0),
    referenceFields: availableCatalogs.reduce((sum, catalog) => sum + catalog.referenceFields, 0),
    uniqueReferencesWithinCatalogs: availableCatalogs.reduce((sum, catalog) => sum + catalog.uniqueReferences, 0),
    rktsLinks: availableCatalogs.reduce((sum, catalog) => sum + catalog.rktsLinks, 0),
  };
  const sourceReadmeText = sourceReadme.toString("utf8");
  const migrationLicenseText = migrationBlobs.LICENSE.toString("utf8");
  requireValue(sourceReadmeText.includes("CC0 License") && sourceReadmeText.includes("creativecommons.org/publicdomain/zero/1.0"), "rKTs 数据 CC0 声明缺失");
  requireValue(migrationLicenseText.includes("Apache License") && migrationLicenseText.includes("Version 2.0"), "rKTs migration Apache-2.0 许可声明缺失");

  const evidence = {
    schema: "https://foxue.ai/schemas/gbcr/rkts-kangyur-catalog-snapshot-v0.5",
    version,
    capturedAt,
    status: "fixed_multi_edition_catalog_aggregate_with_one_missing_configured_path",
    scope: "rKTs migration-selected Kanjur editions, collections and fragment catalogs",
    warning: "15,069 是 19 个可用版本、合集或残片目录中的 item 物理记录总和；同一作品会跨版本重复，单一目录也可能含组件或异体编号。它不是去重作品数、全文数或全球佛典分母。",
    upstream: {
      migrationRepository,
      migrationCommit,
      migrationTree,
      sourceRepository,
      sourceCommit,
      sourceTree,
      migrationTreeEntries: migrationTreeDocument.tree.length,
      sourceTreeEntries: sourceTreeDocument.tree.length,
      submoduleVerified: true,
    },
    selection: {
      source: "migrate.php $filesList at the fixed migration commit",
      configuredIds,
      configuredIdsSha256: sha256(configuredIds.join("\n")),
      configuredYamlPathSha256: sha256(catalogs.map((catalog) => `${catalog.id}\t${catalog.configuredPath}`).join("\n")),
    },
    totals,
    integrity: {
      availablePathSha256: sha256(availableCatalogs.map((catalog) => catalog.configuredPath).join("\n")),
      catalogRecordSetSha256: sha256(availableCatalogs.map((catalog) => [
        catalog.id,
        catalog.configuredPath,
        catalog.blobSha,
        catalog.bytes,
        catalog.itemRecords,
        catalog.referenceFields,
        catalog.uniqueReferences,
        catalog.rktsLinks,
      ].join("\t")).join("\n")),
      itemInventoryPublished: false,
      reason: "CC0 允许复用，但本阶段只发布版本级汇总、路径和 blob 指纹；逐条作品归并必须另行版本学裁决。",
    },
    rights: {
      sourceDataLicense: "CC0-1.0",
      sourceLicenseEvidenceUrl: `https://github.com/${sourceRepository}/blob/${sourceCommit}/README.md#license`,
      sourceReadmeBlobSha: sourceReadmeEntry.sha,
      sourceReadmeSha256: sha256(sourceReadme),
      migrationCodeLicense: "Apache-2.0",
      migrationLicenseBlobSha: migrationByPath.get("LICENSE").sha,
      migrationLicenseSha256: sha256(migrationBlobs.LICENSE),
      attributionRequested: true,
      foxueDecision: "发布事实性版本级目录统计、固定路径、Git blob 与 BDRC 实例标识；本阶段不镜像 15 MB XML，也不把跨版本 item 相加为作品分母。",
    },
    catalogs,
  };
  const evidenceRaw = serialize(evidence);
  const rktsSource = {
    id: "rkts_kangyur_catalogs",
    provider: "Resources for Kanjur and Tanjur Studies (rKTs)",
    repository: sourceRepository,
    commit: sourceCommit,
    tree: sourceTree,
    treeTruncated: false,
    repositoryTreeEntries: sourceTreeDocument.tree.length,
    candidateRecordCount: totals.itemRecords,
    candidateBytes: totals.sourceBytes,
    recordUnit: "rKTs XML catalog item across a fixed edition, collection or fragment catalog",
    inclusionRule: "固定 migration 提交 migrate.php 选中的 20 个目录配置；统计固定 source 子模块中实际存在且 Git blob 校验通过的 19 个 XML",
    exclusionRule: "goldenmustang/Cx 配置路径在固定 source 提交中不存在，单独记录为缺失且不计入 15,069；不导入逐条 item",
    candidatePathSha256: evidence.integrity.availablePathSha256,
    recordSetSha256: evidence.integrity.catalogRecordSetSha256,
    inventoryFile: `data/gbcr/rkts-kangyur-catalog-snapshot-v${version}.json`,
    inventorySha256: sha256(evidenceRaw),
    groups: Object.fromEntries(availableCatalogs.map((catalog) => [catalog.eid, catalog.itemRecords])),
    metrics: totals,
    rights: {
      status: "cc0_catalog_metadata_aggregate_only",
      license: "CC0-1.0",
      decision: evidence.rights.foxueDecision,
    },
    denominatorCaveat: "19 个目录的 15,069 条 item 会大量跨版本重复，且混合完整甘珠尔、合集与残片目录；不能与 BDRC 德格 1,114 条表达式相加为去重作品数。",
  };
  const snapshots = {
    ...baseSnapshots,
    schema: "https://foxue.ai/schemas/gbcr/source-snapshots-v0.5",
    version,
    capturedAt,
    status: "multi_tradition_candidate_record_inventory_with_multi_edition_tibetan_catalogs",
    warning: "候选来源记录、目录项、物理文件、固定版本表达式与链接作品标识彼此重叠且计数单位不同，不得直接用作全球覆盖率分母。",
    sources: [...baseSnapshots.sources, rktsSource],
    rightsEvidence: [
      ...baseSnapshots.rightsEvidence,
      {
        id: "rkts_cc0_catalog_license",
        file: `data/gbcr/rkts-kangyur-catalog-snapshot-v${version}.json`,
        sha256: sha256(evidenceRaw),
      },
    ],
  };
  return { evidence, evidenceRaw, snapshots, snapshotsRaw: serialize(snapshots) };
};

const readFrozenDocuments = async () => {
  const evidenceRaw = await readFile(evidencePath, "utf8");
  const snapshotsRaw = await readFile(snapshotsPath, "utf8");
  return {
    evidence: JSON.parse(evidenceRaw),
    evidenceRaw,
    snapshots: JSON.parse(snapshotsRaw),
    snapshotsRaw,
  };
};

const validateFrozenDocuments = ({ evidence, evidenceRaw, snapshots }) => {
  requireValue(evidence.version === version && evidence.capturedAt === capturedAt, "rKTs 快照版本或日期不匹配");
  requireValue(evidence.upstream.migrationCommit === migrationCommit && evidence.upstream.migrationTree === migrationTree, "rKTs migration 固定提交或 tree 漂移");
  requireValue(evidence.upstream.sourceCommit === sourceCommit && evidence.upstream.sourceTree === sourceTree, "rKTs source 固定提交或 tree 漂移");
  requireValue(evidence.upstream.submoduleVerified === true, "rKTs 子模块提交未验证");
  requireValue(evidence.totals.configuredCatalogs === 20 && evidence.totals.availableCatalogs === 19 && evidence.totals.missingConfiguredCatalogs === 1, "rKTs 配置目录可用性统计漂移");
  requireValue(evidence.totals.sourceBytes === 15544576 && evidence.totals.itemRecords === 15069, "rKTs 目录字节或 item 总数漂移");
  requireValue(evidence.totals.referenceFields === 15139 && evidence.totals.uniqueReferencesWithinCatalogs === 15025 && evidence.totals.rktsLinks === 15116, "rKTs 引用与链接统计漂移");
  requireValue(evidence.catalogs.length === 20 && evidence.catalogs.filter((catalog) => catalog.sourcePathAvailable).length === 19, "rKTs 版本明细不完整");
  requireValue(evidence.catalogs.find((catalog) => catalog.id === "goldenmustang")?.exclusionReason === "configured_path_missing_at_frozen_source_commit", "rKTs 缺失 Cx 配置未显式保留");
  requireValue(evidence.rights.sourceDataLicense === "CC0-1.0" && evidence.rights.migrationCodeLicense === "Apache-2.0", "rKTs 权利证据不完整");
  requireValue(evidence.integrity.itemInventoryPublished === false, "rKTs 阶段不得把目录 item 冒充去重作品清单");
  requireValue(snapshots.version === version && snapshots.denominatorReady === false, "rKTs 来源快照状态不匹配");
  requireValue(snapshots.sources.length === 6, "全球来源快照必须含六个受审计来源");
  const source = snapshots.sources.find((candidate) => candidate.id === "rkts_kangyur_catalogs");
  requireValue(source?.candidateRecordCount === 15069 && source?.candidateBytes === 15544576, "rKTs 来源候选统计不匹配");
  requireValue(source?.inventorySha256 === sha256(evidenceRaw), "rKTs 来源证据摘要不匹配");
  requireValue(snapshots.rightsEvidence?.at(-1)?.sha256 === sha256(evidenceRaw), "rKTs 权利证据摘要不匹配");
};

if (process.argv.includes("--write")) {
  const documents = await buildLiveDocuments();
  validateFrozenDocuments(documents);
  await writeFile(evidencePath, documents.evidenceRaw, "utf8");
  await writeFile(snapshotsPath, documents.snapshotsRaw, "utf8");
  console.log("rKTs 多版本目录快照已冻结：20 个配置中 19 个可用，15,069 条 item；跨版本作品分母仍未知。");
} else if (process.argv.includes("--verify")) {
  const documents = await readFrozenDocuments();
  validateFrozenDocuments(documents);
  console.log("rKTs 多版本目录快照验证通过：19 个可用目录、15,069 条 item、1 个缺失配置已显式保留。");
} else {
  throw new Error("请使用 --write 获取并冻结 rKTs 固定来源，或使用 --verify 验证本地快照");
}
