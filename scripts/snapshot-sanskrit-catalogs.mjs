import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const version = "0.4.0";
const capturedAt = "2026-08-13";
const gretilCommit = "0baf718d8e450821eb0403c03aacc9a4a82316d7";
const gretilTree = "b3f67ca1d814b5b20a33fd5a0d686ad1768703ee";

const baseSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v0.3.0.json");
const evidencePath = resolve(root, `data/gbcr/dsbc-gretil-source-snapshot-v${version}.json`);
const rightsPath = resolve(root, `data/gbcr/sanskrit-rights-policy-v${version}.json`);
const snapshotsPath = resolve(root, `data/gbcr/source-snapshots-v${version}.json`);

const endpoints = {
  dsbcRomanized: "https://dsbcproject.org/canon-text/browse-by-list/1",
  dsbcUsagePolicy: "https://dsbcproject.org/pages/usage-policy",
  gretilRepository: "https://api.github.com/repos/INDOLOGY/GRETIL-mirror",
  gretilTree: `https://api.github.com/repos/INDOLOGY/GRETIL-mirror/git/trees/${gretilTree}?recursive=1`,
};

const gretilGroups = {
  sanskritBuddhistLiterature: "gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/",
  sanskritBuddhistPhilosophy: "gretil.sub.uni-goettingen.de/gretil/1_sanskr/6_sastra/3_phil/buddh/",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const curl = async (url, accept = "text/html") => {
  const { stdout } = await execFileAsync("curl", [
    "-L", "--fail", "--silent", "--show-error",
    "--retry", "4", "--retry-all-errors", "--retry-delay", "1",
    "--connect-timeout", "20", "--max-time", "180",
    "-A", "foxue.ai corpus registry snapshot/0.4",
    "-H", `Accept: ${accept}`,
    url,
  ], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return stdout;
};

const readEvidenceCache = async (cacheDirectory) => ({
  dsbcRomanized: await readFile(resolve(cacheDirectory, "dsbcproject_org_canon_text_browse_by_list_1.html"), "utf8"),
  dsbcUsagePolicy: await readFile(resolve(cacheDirectory, "dsbcproject_org_pages_usage_policy.html"), "utf8"),
  gretilRepository: await readFile(resolve(cacheDirectory, "gretil-repo.json"), "utf8"),
  gretilTree: await readFile(resolve(cacheDirectory, "gretil-tree-b3f67ca1.json"), "utf8"),
});

const decodeHtml = (value) => value
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&gt;/g, ">")
  .replace(/&lt;/g, "<")
  .replace(/&#xbb;/g, "»")
  .replace(/\s+/g, " ")
  .trim();

const parseDsbc = (html) => {
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((match) => match[1])
    .filter((row) => row.includes("/canon-text/book/"));
  const records = rows.map((row) => {
    const id = Number(row.match(/\/canon-text\/book\/(\d+)/)?.[1]);
    const categories = [...row.matchAll(
      /<a href="https:\/\/dsbcproject\.org\/canon-text\/(?:category|list)\/\d+">([\s\S]*?)<\/a>/g,
    )].map((match) => decodeHtml(match[1])).filter(Boolean);
    return { id, categories };
  });
  requireValue(records.every((record) => Number.isInteger(record.id)), "DSBC 目录存在无法解析的记录标识");
  const uniqueIds = [...new Set(records.map((record) => record.id))].sort((a, b) => a - b);
  requireValue(uniqueIds.length === records.length, "DSBC Romanized 目录存在重复记录标识");
  const groups = {
    sutrapitaka: records.filter((record) => record.categories.includes("sūtrapiṭaka")).length,
    vinayapitaka: records.filter((record) => record.categories.includes("vinayapiṭaka")).length,
    sastrapitaka: records.filter((record) => record.categories.includes("śāstrapiṭaka")).length,
  };
  return {
    records: uniqueIds.length,
    groups,
    recordIdSha256: sha256(uniqueIds.join("\n")),
  };
};

const selectGretilFiles = (tree, prefix) => tree
  .filter((entry) => entry.type === "blob" && entry.path.startsWith(prefix) && entry.path.endsWith(".htm"))
  .sort((a, b) => a.path.localeCompare(b.path));

const summarizeGretilFiles = (files) => ({
  records: files.length,
  bytes: files.reduce((sum, file) => sum + file.size, 0),
  pathSha256: sha256(files.map((file) => file.path).join("\n")),
  blobSetSha256: sha256(files.map((file) => `${file.path}\t${file.sha}\t${file.size}`).join("\n")),
});

const buildDocuments = async ({ live, cacheDirectory }) => {
  const baseSnapshots = JSON.parse(await readFile(baseSnapshotsPath, "utf8"));
  const raw = live
    ? cacheDirectory
      ? await readEvidenceCache(cacheDirectory)
      : {
          dsbcRomanized: await curl(endpoints.dsbcRomanized),
          dsbcUsagePolicy: await curl(endpoints.dsbcUsagePolicy),
          gretilRepository: await curl(endpoints.gretilRepository, "application/vnd.github+json"),
          gretilTree: await curl(endpoints.gretilTree, "application/vnd.github+json"),
        }
    : null;

  if (!raw) {
    const evidenceRaw = await readFile(evidencePath, "utf8");
    const rightsRaw = await readFile(rightsPath, "utf8");
    const snapshotsRaw = await readFile(snapshotsPath, "utf8");
    return {
      evidence: JSON.parse(evidenceRaw),
      rights: JSON.parse(rightsRaw),
      snapshots: JSON.parse(snapshotsRaw),
      evidenceRaw,
      rightsRaw,
      snapshotsRaw,
    };
  }

  const dsbc = parseDsbc(raw.dsbcRomanized);
  const gretilRepository = JSON.parse(raw.gretilRepository);
  const gretilTreeDocument = JSON.parse(raw.gretilTree);
  requireValue(gretilTreeDocument.sha === gretilTree, "GRETIL Git tree 修订号不匹配");
  requireValue(gretilTreeDocument.truncated === false, "GRETIL Git tree 响应被截断");
  const gretilFilesByGroup = Object.fromEntries(Object.entries(gretilGroups).map(([id, prefix]) => [
    id,
    selectGretilFiles(gretilTreeDocument.tree, prefix),
  ]));
  const gretilFiles = Object.values(gretilFilesByGroup).flat().sort((a, b) => a.path.localeCompare(b.path));

  const evidence = {
    schema: "https://foxue.ai/schemas/gbcr/sanskrit-source-snapshot-v0.4",
    version,
    capturedAt,
    scope: "aggregate_catalog_and_fixed_git_file_inventory",
    warning: "DSBC 目录项与 GRETIL 物理文件可能互相重叠，也可能是同一作品的版本、分卷或转写；本快照不执行作品级去重。",
    dsbc: {
      provider: "Digital Sanskrit Buddhist Canon, University of the West",
      catalogUrl: endpoints.dsbcRomanized,
      responseBytes: Buffer.byteLength(raw.dsbcRomanized),
      responseSha256: sha256(raw.dsbcRomanized),
      candidateCatalogRecords: dsbc.records,
      recordUnit: "DSBC Romanized catalog entry or edition record",
      groups: dsbc.groups,
      integrity: {
        recordIdSha256: dsbc.recordIdSha256,
        itemInventoryPublished: false,
        reason: "DSBC 使用政策禁止未经许可复制内容；foxue.ai 只保存汇总计数、记录标识摘要与来源响应摘要。",
      },
    },
    gretil: {
      provider: "GRETIL archival mirror maintained by INDOLOGY",
      repository: "INDOLOGY/GRETIL-mirror",
      commit: gretilCommit,
      tree: gretilTree,
      treeTruncated: gretilTreeDocument.truncated,
      repositoryTreeEntries: gretilTreeDocument.tree.length,
      candidatePhysicalFiles: gretilFiles.length,
      candidateBytes: gretilFiles.reduce((sum, file) => sum + file.size, 0),
      recordUnit: "Unicode HTML physical file under a Sanskrit Buddhist source directory",
      groups: Object.fromEntries(Object.entries(gretilFilesByGroup).map(([id, files]) => [id, summarizeGretilFiles(files)])),
      integrity: {
        candidatePathSha256: sha256(gretilFiles.map((file) => file.path).join("\n")),
        recordSetSha256: sha256(gretilFiles.map((file) => `${file.path}\t${file.sha}\t${file.size}`).join("\n")),
      },
    },
  };
  const evidenceRaw = serialize(evidence);

  const policyText = decodeHtml(raw.dsbcUsagePolicy);
  const rights = {
    schema: "https://foxue.ai/schemas/gbcr/source-rights-policy-v0.4",
    version,
    capturedAt,
    dsbc: {
      provider: "Digital Sanskrit Buddhist Canon, University of the West",
      url: endpoints.dsbcUsagePolicy,
      responseBytes: Buffer.byteLength(raw.dsbcUsagePolicy),
      responseSha256: sha256(raw.dsbcUsagePolicy),
      observedPolicy: {
        noncommercialEducationalAndResearchUse: policyText.includes("strictly for noncommercial educational and research purposes"),
        indexingAndWordSearchPurpose: policyText.includes("provided for review, indexing and word search purposes only"),
        reproductionWithoutPermissionProhibited: policyText.includes("Reproduction of DSBC contents without permission is prohibited"),
        compilationIndexingTransliterationRightsHeld: policyText.includes("Rights in the compilation, indexing, and transliteration are held by University of the West"),
      },
      foxueDecision: "只发布汇总计数、页面哈希和记录标识集合摘要；不复制逐条目录、转写或正文，许可明确前不计为可发布全文。",
    },
    gretil: {
      provider: "INDOLOGY/GRETIL-mirror",
      repository: "https://github.com/INDOLOGY/GRETIL-mirror",
      repositoryLicenseDetected: Boolean(gretilRepository.license),
      detectedLicense: gretilRepository.license?.spdx_id ?? null,
      archivalDoi: "10.5281/zenodo.6486741",
      foxueDecision: "仓库级许可证未标明；只登记固定 Git 路径、blob 与字节汇总，不镜像正文。任何全文入库须逐文件核对头部来源与权利。",
    },
  };
  const rightsRaw = serialize(rights);

  const dsbcSource = {
    id: "dsbc_sanskrit_catalog",
    provider: "Digital Sanskrit Buddhist Canon, University of the West",
    repository: "public web catalog",
    capturedAt,
    candidateRecordCount: evidence.dsbc.candidateCatalogRecords,
    recordUnit: evidence.dsbc.recordUnit,
    inclusionRule: "DSBC Romanized 总目录中具有 /canon-text/book/{id} 持久页面的记录",
    candidatePathSha256: evidence.dsbc.integrity.recordIdSha256,
    responseSha256: evidence.dsbc.responseSha256,
    inventoryFile: `data/gbcr/dsbc-gretil-source-snapshot-v${version}.json`,
    inventorySha256: sha256(evidenceRaw),
    groups: evidence.dsbc.groups,
    rights: {
      policyFile: `data/gbcr/sanskrit-rights-policy-v${version}.json`,
      status: "aggregate_metadata_only_reproduction_permission_required",
      decision: rights.dsbc.foxueDecision,
    },
    denominatorCaveat: "486 是 DSBC Romanized 目录记录数，其中可能包含同题多版本、分卷、密续、律藏与论疏；不是去重梵文作品数，也不是站内全文数。",
  };
  const gretilSource = {
    id: "gretil_sanskrit_buddhist_files",
    provider: "INDOLOGY/GRETIL archival mirror",
    repository: "INDOLOGY/GRETIL-mirror",
    commit: gretilCommit,
    tree: gretilTree,
    treeTruncated: false,
    repositoryTreeEntries: evidence.gretil.repositoryTreeEntries,
    candidateRecordCount: evidence.gretil.candidatePhysicalFiles,
    candidateBytes: evidence.gretil.candidateBytes,
    recordUnit: evidence.gretil.recordUnit,
    inclusionRule: "固定 Git tree 中 Sanskrit Buddhist literature 与 philosophy 两目录下的 Unicode .htm blob；排除 .tmp 和非 HTML 文件",
    candidatePathSha256: evidence.gretil.integrity.candidatePathSha256,
    recordSetSha256: evidence.gretil.integrity.recordSetSha256,
    inventoryFile: `data/gbcr/dsbc-gretil-source-snapshot-v${version}.json`,
    inventorySha256: sha256(evidenceRaw),
    groups: Object.fromEntries(Object.entries(evidence.gretil.groups).map(([id, group]) => [id, group.records])),
    rights: {
      policyFile: `data/gbcr/sanskrit-rights-policy-v${version}.json`,
      status: "repository_license_unspecified_metadata_only",
      decision: rights.gretil.foxueDecision,
    },
    denominatorCaveat: "417 是固定镜像中的物理 HTML 文件数；同一作品可能有分卷、不同底本或多份编码，且与 DSBC 高度可能重叠，不是去重作品数。",
  };
  const snapshots = {
    ...baseSnapshots,
    schema: "https://foxue.ai/schemas/gbcr/source-snapshots-v0.4",
    version,
    capturedAt,
    status: "multi_tradition_candidate_record_inventory_with_sanskrit_aggregate_snapshots",
    warning: "候选来源记录、目录项、物理文件、固定版本表达式与链接作品标识均不是跨传统去重后的作品数，不得直接用作全球覆盖率分母。",
    sources: [...baseSnapshots.sources, dsbcSource, gretilSource],
    rightsEvidence: [
      ...baseSnapshots.rightsEvidence,
      {
        id: "sanskrit_source_rights_policy",
        file: `data/gbcr/sanskrit-rights-policy-v${version}.json`,
        sha256: sha256(rightsRaw),
      },
    ],
  };
  const snapshotsRaw = serialize(snapshots);
  return { evidence, rights, snapshots, evidenceRaw, rightsRaw, snapshotsRaw };
};

const validateFrozenDocuments = ({ evidence, rights, snapshots, evidenceRaw, rightsRaw }) => {
  requireValue(evidence.version === version && evidence.capturedAt === capturedAt, "梵文来源证据版本或日期不匹配");
  requireValue(evidence.dsbc.candidateCatalogRecords === 486, "DSBC Romanized 目录记录数漂移");
  requireValue(evidence.dsbc.groups.sutrapitaka === 111, "DSBC 经藏类记录数漂移");
  requireValue(evidence.dsbc.groups.vinayapitaka === 15, "DSBC 律藏类记录数漂移");
  requireValue(evidence.dsbc.groups.sastrapitaka === 360, "DSBC 论疏及其他类记录数漂移");
  requireValue(evidence.dsbc.integrity.recordIdSha256 === "c42d42fb6da4038b6cc5306776c57eadf0492722ad95b966e18c7329ce735f7c", "DSBC 记录标识摘要漂移");
  requireValue(evidence.dsbc.integrity.itemInventoryPublished === false, "DSBC 逐条目录不得在无许可时发布");
  requireValue(evidence.gretil.commit === gretilCommit && evidence.gretil.tree === gretilTree, "GRETIL 固定提交或 tree 漂移");
  requireValue(evidence.gretil.treeTruncated === false && evidence.gretil.repositoryTreeEntries === 5555, "GRETIL tree 不完整");
  requireValue(evidence.gretil.candidatePhysicalFiles === 417 && evidence.gretil.candidateBytes === 62432484, "GRETIL 梵文佛教物理文件统计漂移");
  requireValue(evidence.gretil.groups.sanskritBuddhistLiterature.records === 261, "GRETIL 佛教文献目录计数漂移");
  requireValue(evidence.gretil.groups.sanskritBuddhistPhilosophy.records === 156, "GRETIL 佛教哲学目录计数漂移");
  requireValue(evidence.gretil.integrity.candidatePathSha256 === "9ef8efde743abad9eb14732ec2e21d7bb0e79e3c56b313a1aa0780ef3e8964f6", "GRETIL 候选路径摘要漂移");
  requireValue(evidence.gretil.integrity.recordSetSha256 === "ff2638f75efd8928602bae4963e5d557c420d337ee079b003b5d6901ed69c17e", "GRETIL blob 记录集摘要漂移");
  requireValue(rights.dsbc.observedPolicy.noncommercialEducationalAndResearchUse === true, "DSBC 非商业教育研究边界缺失");
  requireValue(rights.dsbc.observedPolicy.reproductionWithoutPermissionProhibited === true, "DSBC 禁止未授权复制边界缺失");
  requireValue(rights.gretil.repositoryLicenseDetected === false && rights.gretil.detectedLicense === null, "GRETIL 仓库级许可状态漂移");
  requireValue(snapshots.version === version && snapshots.denominatorReady === false, "全球来源快照状态不匹配");
  requireValue(snapshots.sources.length === 5, "全球来源快照必须含 CBETA、SuttaCentral、BDRC、DSBC 与 GRETIL");
  const dsbcSource = snapshots.sources.find((source) => source.id === "dsbc_sanskrit_catalog");
  const gretilSource = snapshots.sources.find((source) => source.id === "gretil_sanskrit_buddhist_files");
  requireValue(dsbcSource?.candidateRecordCount === 486 && gretilSource?.candidateRecordCount === 417, "梵文来源候选记录数不匹配");
  requireValue(dsbcSource?.inventorySha256 === sha256(evidenceRaw) && gretilSource?.inventorySha256 === sha256(evidenceRaw), "梵文来源证据摘要不匹配");
  requireValue(snapshots.rightsEvidence?.at(-1)?.sha256 === sha256(rightsRaw), "梵文权利证据摘要不匹配");
};

if (process.argv.includes("--write")) {
  const cacheFlagIndex = process.argv.indexOf("--from-cache");
  const cacheDirectory = cacheFlagIndex >= 0 ? process.argv[cacheFlagIndex + 1] : null;
  if (cacheFlagIndex >= 0) requireValue(cacheDirectory, "--from-cache 后必须提供证据目录");
  const documents = await buildDocuments({ live: true, cacheDirectory });
  validateFrozenDocuments(documents);
  await writeFile(evidencePath, documents.evidenceRaw, "utf8");
  await writeFile(rightsPath, documents.rightsRaw, "utf8");
  await writeFile(snapshotsPath, documents.snapshotsRaw, "utf8");
  console.log("梵文来源快照已冻结：DSBC 486 条目录记录；GRETIL 417 个固定物理文件；作品分母仍未知。");
} else if (process.argv.includes("--verify")) {
  const documents = await buildDocuments({ live: false });
  validateFrozenDocuments(documents);
  console.log("梵文来源快照验证通过：DSBC 486 条、GRETIL 417 条候选记录；未复制受限正文。");
} else {
  throw new Error("请使用 --write 获取并冻结官方来源，或使用 --verify 验证本地快照");
}
