import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const version = "0.9.0";
const batchVersion = "1.4.0";
const capturedAt = "2026-08-14";
const sourceCommit = "eac6c24781dd1eefdc17dc2f787b54bf6fe31719";
const sourceTree = "949e4ec6b6636fe63d678c46894897ec4fad81e7";
const policyCommit = "b2cb0f91eed45e42c234e39ce17cdb87a2965167";
const policyTree = "7c10ea8556fedeb303af5099e5d09f822b7ebae9";
const policyPath = "client/localization/elements/licensing_en.json";
const auditPath = resolve(root, `data/gbcr/suttacentral-vinaya-root-rights-audit-v${version}.json`);
const batchPath = resolve(root, `data/corpus/suttacentral/vinaya-batch-v${batchVersion}.json`);
const sourceRepository = "suttacentral/bilara-data";
const licensingUrl = "https://suttacentral.net/licensing";
const args = process.argv.slice(2);
const writeMode = args.includes("--write");
const verifyMode = args.includes("--verify");
const sourceRepoIndex = args.indexOf("--source-repo");
const sourceRepo = sourceRepoIndex >= 0 ? resolve(args[sourceRepoIndex + 1] ?? "") : null;
const policyRepoIndex = args.indexOf("--policy-repo");
const policyRepo = policyRepoIndex >= 0 ? resolve(args[policyRepoIndex + 1] ?? "") : null;
const execFileAsync = promisify(execFile);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const vinayaCategoryOrder = new Map([
  ["pj", 1], ["ss", 2], ["ay", 3], ["np", 4],
  ["pc", 5], ["pd", 6], ["sk", 7], ["as", 8],
]);
const numericTuple = (value) => value.split(/[.-]/).map(Number);
const compareNumericTuples = (left, right) => {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? -1) - (right[index] ?? -1);
    if (difference !== 0) return difference;
  }
  return 0;
};
const vinayaSourceOrder = (leftPath, rightPath) => {
  const left = leftPath.split("/").at(-1).replace("_root-pli-ms.json", "");
  const right = rightPath.split("/").at(-1).replace("_root-pli-ms.json", "");
  const leftVibhanga = left.match(/^pli-tv-(?:bu|bi)-vb-([a-z]+)(\d+(?:\.\d+)*(?:-\d+)?)$/);
  const rightVibhanga = right.match(/^pli-tv-(?:bu|bi)-vb-([a-z]+)(\d+(?:\.\d+)*(?:-\d+)?)$/);
  if (leftVibhanga && rightVibhanga) {
    return (vinayaCategoryOrder.get(leftVibhanga[1]) ?? 99) - (vinayaCategoryOrder.get(rightVibhanga[1]) ?? 99) ||
      compareNumericTuples(numericTuple(leftVibhanga[2]), numericTuple(rightVibhanga[2]));
  }
  const leftNumber = left.match(/^pli-tv-(?:kd|pvr)(\d+(?:\.\d+)*)$/)?.[1];
  const rightNumber = right.match(/^pli-tv-(?:kd|pvr)(\d+(?:\.\d+)*)$/)?.[1];
  if (leftNumber && rightNumber) {
    return compareNumericTuples(numericTuple(leftNumber), numericTuple(rightNumber));
  }
  return left.localeCompare(right, "en");
};

if (writeMode === verifyMode) throw new Error("必须且只能指定 --write 或 --verify");
if (writeMode && (!sourceRepo || !policyRepo)) {
  throw new Error("写入模式必须提供 --source-repo 与 --policy-repo 两个固定 Git 工作树");
}

const workDefinitions = [
  {
    id: "PLI-TV-BU-PM",
    prefix: "pli-tv-bu-pm",
    slug: "pali-bhikkhu-patimokkha",
    workId: "gbcr:work:theravada-bhikkhu-patimokkha-pali",
    title: "Theravāda Bhikkhupātimokkha",
    titleZh: "上座部比丘波罗提木叉（巴利原文）",
    tradition: "上座部佛教 · 律藏 · 戒本",
    canonRef: "SuttaCentral Pli Tv Bu Pm",
    sourceUrl: "https://suttacentral.net/pli-tv-bu-pm/pli/ms",
    pathPattern: /^root\/pli\/ms\/vinaya\/pli-tv-bu-pm_root-pli-ms\.json$/,
  },
  {
    id: "PLI-TV-BI-PM",
    prefix: "pli-tv-bi-pm",
    slug: "pali-bhikkhuni-patimokkha",
    workId: "gbcr:work:theravada-bhikkhuni-patimokkha-pali",
    title: "Bhikkhunīpātimokkhapāḷi",
    titleZh: "上座部比丘尼波罗提木叉（巴利原文）",
    tradition: "上座部佛教 · 律藏 · 戒本",
    canonRef: "SuttaCentral Pli Tv Bi Pm",
    sourceUrl: "https://suttacentral.net/pli-tv-bi-pm/pli/ms",
    pathPattern: /^root\/pli\/ms\/vinaya\/pli-tv-bi-pm_root-pli-ms\.json$/,
  },
  {
    id: "PLI-TV-BU-VB",
    prefix: "pli-tv-bu-vb",
    slug: "pali-mahavibhanga",
    workId: "gbcr:work:theravada-mahavibhanga-pali",
    title: "Mahāvibhaṅga",
    titleZh: "上座部大分别（巴利原文）",
    tradition: "上座部佛教 · 律藏 · 经分别",
    canonRef: "SuttaCentral Pli Tv Bu Vb",
    sourceUrl: "https://suttacentral.net/pli-tv-bu-vb/pli/ms",
    pathPattern: /^root\/pli\/ms\/vinaya\/pli-tv-bu-vb\/.+_root-pli-ms\.json$/,
  },
  {
    id: "PLI-TV-BI-VB",
    prefix: "pli-tv-bi-vb",
    slug: "pali-bhikkhuni-vibhanga",
    workId: "gbcr:work:theravada-bhikkhuni-vibhanga-pali",
    title: "Bhikkhunivibhaṅga",
    titleZh: "上座部比丘尼分别（巴利原文）",
    tradition: "上座部佛教 · 律藏 · 经分别",
    canonRef: "SuttaCentral Pli Tv Bi Vb",
    sourceUrl: "https://suttacentral.net/pli-tv-bi-vb/pli/ms",
    pathPattern: /^root\/pli\/ms\/vinaya\/pli-tv-bi-vb\/.+_root-pli-ms\.json$/,
  },
  {
    id: "PLI-TV-KD",
    prefix: "pli-tv-kd",
    slug: "pali-vinaya-khandhaka",
    workId: "gbcr:work:theravada-vinaya-khandhaka-pali",
    title: "Theravāda Vinayapiṭaka Khandhaka",
    titleZh: "上座部律藏犍度（巴利原文）",
    tradition: "上座部佛教 · 律藏 · 犍度",
    canonRef: "SuttaCentral Pli Tv Kd 1–22",
    sourceUrl: "https://suttacentral.net/pli-tv-kd/pli/ms",
    pathPattern: /^root\/pli\/ms\/vinaya\/pli-tv-kd\/.+_root-pli-ms\.json$/,
  },
  {
    id: "PLI-TV-PVR",
    prefix: "pli-tv-pvr",
    slug: "pali-vinaya-parivara",
    workId: "gbcr:work:theravada-vinaya-parivara-pali",
    title: "Parivāra",
    titleZh: "上座部律藏附随（巴利原文）",
    tradition: "上座部佛教 · 律藏 · 附随",
    canonRef: "SuttaCentral Pli Tv Pvr",
    sourceUrl: "https://suttacentral.net/pli-tv-pvr/pli/ms",
    pathPattern: /^root\/pli\/ms\/vinaya\/pli-tv-pvr\/.+_root-pli-ms\.json$/,
  },
];

async function gitBytes(relativePath) {
  const { stdout } = await execFileAsync(
    "git",
    ["-C", sourceRepo, "show", `${sourceCommit}:${relativePath}`],
    { encoding: null, maxBuffer: 8 * 1024 * 1024 },
  );
  return stdout;
}

async function buildFromSource() {
  const { stdout: head } = await execFileAsync("git", ["-C", sourceRepo, "rev-parse", "HEAD"]);
  const { stdout: tree } = await execFileAsync("git", ["-C", sourceRepo, "rev-parse", "HEAD^{tree}"]);
  requireValue(head.trim() === sourceCommit, "SuttaCentral 固定提交不一致");
  requireValue(tree.trim() === sourceTree, "SuttaCentral 固定树不一致");
  const { stdout: policyHead } = await execFileAsync("git", ["-C", policyRepo, "rev-parse", "HEAD"]);
  const { stdout: policyTreeValue } = await execFileAsync("git", ["-C", policyRepo, "rev-parse", "HEAD^{tree}"]);
  requireValue(policyHead.trim() === policyCommit, "SuttaCentral 许可政策固定提交不一致");
  requireValue(policyTreeValue.trim() === policyTree, "SuttaCentral 许可政策固定树不一致");

  const { stdout: listed } = await execFileAsync(
    "git",
    ["-C", sourceRepo, "ls-tree", "-r", "--name-only", sourceCommit, "root/pli/ms/vinaya"],
    { maxBuffer: 2 * 1024 * 1024 },
  );
  const paths = listed.trim().split("\n").filter((path) => path.endsWith("_root-pli-ms.json"));
  requireValue(paths.length === 422, "巴利律藏固定 root 文件数漂移");
  for (const path of paths) {
    requireValue(workDefinitions.filter((work) => work.pathPattern.test(path)).length === 1, `${path} 未唯一归入律藏文本集合`);
  }
  const editionBytes = await gitBytes("_edition.json");
  const repositoryLicenseBytes = await gitBytes("LICENSE.md");
  const editions = JSON.parse(editionBytes.toString("utf8"));
  requireValue(editions.ms?.is_root === true && editions.ms?.language === "pli", "ms 巴利根本文本版本记录漂移");
  const { stdout: policyBytes } = await execFileAsync(
    "git",
    ["-C", policyRepo, "show", `${policyCommit}:${policyPath}`],
    { encoding: null, maxBuffer: 2 * 1024 * 1024 },
  );
  const policy = JSON.parse(policyBytes.toString("utf8"));
  requireValue(/original texts of Buddhism[\s\S]{0,1000}public domain/i.test(policy["licensing:24"]), "官方许可政策缺少原文公共领域声明");
  requireValue(/generative AI/i.test(policy["licensing:27"]), "官方许可政策缺少生成式 AI 使用请求");

  const records = [];
  const batchFiles = [];
  paths.sort((leftPath, rightPath) => {
    const leftWork = workDefinitions.findIndex((work) => work.pathPattern.test(leftPath));
    const rightWork = workDefinitions.findIndex((work) => work.pathPattern.test(rightPath));
    return leftWork - rightWork || vinayaSourceOrder(leftPath, rightPath);
  });
  for (const upstreamPath of paths) {
    const work = workDefinitions.find((candidate) => candidate.pathPattern.test(upstreamPath));
    const upstream = await gitBytes(upstreamPath);
    const parsed = JSON.parse(upstream.toString("utf8"));
    const entries = Object.entries(parsed);
    requireValue(entries.length > 0, `${upstreamPath} 没有段落`);
    requireValue(entries.every(([id, text]) => id.startsWith(work.prefix) && typeof text === "string"), `${upstreamPath} 段落结构无效`);
    const emptySegments = entries.filter(([, text]) => !text.trim()).length;
    const local = Buffer.concat([upstream, Buffer.from("\n")]);
    const localPath = `data/corpus/suttacentral/${upstreamPath}`;
    const recordId = upstreamPath.split("/").at(-1).replace("_root-pli-ms.json", "").toUpperCase();
    const common = {
      id: recordId,
      workId: work.workId,
      workGroupId: work.id,
      language: "pi-Latn",
      upstreamPath,
      upstreamGitBlobSha1: gitBlobSha1(upstream),
      upstreamBytes: upstream.length,
      upstreamSha256: sha256(upstream),
      localPath,
      localBytes: local.length,
      localSha256: sha256(local),
      firstSegmentId: entries[0][0],
      lastSegmentId: entries.at(-1)[0],
      sourceSegments: entries.length,
      emptySegments,
      segments: entries.length - emptySegments,
      rightsStatus: "public_domain_root_translation_license_excluded",
    };
    records.push({
      ...common,
      sourceEdition: "SuttaCentral Mahāsaṅgīti Pali root",
      approvedForFoxueReadingAndRetrieval: true,
      approvedForModelTraining: false,
    });
    batchFiles.push({
      ...common,
      part: batchFiles.filter((file) => file.workGroupId === work.id).length + 1,
      slug: work.slug,
      parser: "bilara_series_root_json",
      format: "application/json",
    });
    await mkdir(dirname(resolve(root, localPath)), { recursive: true });
    try {
      const existing = await readFile(resolve(root, localPath));
      requireValue(existing.equals(local), `${localPath} 已存在但内容不同，拒绝覆盖`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await writeFile(resolve(root, localPath), local, { flag: "wx" });
    }
  }

  const sourceBytes = records.reduce((sum, record) => sum + record.upstreamBytes, 0);
  const sourceSegments = records.reduce((sum, record) => sum + record.sourceSegments, 0);
  const stableSegments = records.reduce((sum, record) => sum + record.segments, 0);
  const omittedEmptySegments = records.reduce((sum, record) => sum + record.emptySegments, 0);
  requireValue(sourceBytes === 6710444, "巴利律藏上游字节数漂移");
  requireValue(sourceSegments === 71565 && stableSegments === 71557 && omittedEmptySegments === 8, "巴利律藏段落统计漂移");
  const recordsRaw = serialize(records);
  const audit = {
    schema: "https://foxue.ai/schemas/gbcr/suttacentral-vinaya-root-rights-audit-v0.1",
    version,
    capturedAt,
    status: "approved_public_domain_roots_no_translation_import",
    source: {
      repository: sourceRepository,
      commit: sourceCommit,
      tree: sourceTree,
      branchSemantics: "published",
      licensingUrl,
      licensingPolicySource: {
        repository: "suttacentral/suttacentral",
        commit: policyCommit,
        tree: policyTree,
        path: policyPath,
        gitBlobSha1: gitBlobSha1(policyBytes),
        sha256: sha256(policyBytes),
      },
      editionMetadata: { path: "_edition.json", sha256: sha256(editionBytes) },
      repositoryLicense: { path: "LICENSE.md", sha256: sha256(repositoryLicenseBytes) },
    },
    rightsDecision: {
      rootTexts: "public_domain_by_official_suttacentral_policy",
      thirdPartyTranslationsImported: false,
      attributionRequested: true,
      trainingUse: "prohibited_by_foxue_policy",
      allowedUses: ["human_reading", "research", "source_cited_search", "source_cited_retrieval"],
      excludedUses: ["generative_model_training", "translation_republication_without_item_license_review"],
      decisionNote: "官方许可页把巴利等佛教原语文本列为公共领域；foxue.ai 保留来源署名并遵守不用于生成式模型训练的内部政策。仓库 LICENSE.md 只覆盖 Bilara 译文 CC0，本批次不据此证明 root 权利，也未导入任何译文。",
    },
    summary: {
      filesAudited: records.length,
      filesApprovedForReadingAndRetrieval: records.length,
      filesApprovedForModelTraining: 0,
      representedWorks: workDefinitions.length,
      sourceBytes,
      stableSegments,
      sourceSegments,
      omittedEmptySegments,
      thirdPartyTranslationFilesImported: 0,
    },
    records,
    integrity: {
      inventorySha256: sha256(recordsRaw),
      sourceBodiesPublished: true,
      translationBodiesPublished: false,
      normalization: "append_single_lf",
    },
    warning: "422 个物理 root 文件合并为六个书级文本表达；不得将文件数当作作品数，更不得加入全球佛经 99% 的分母或分子。律藏属于佛典保存范围，但不是狭义佛经。",
  };
  const works = workDefinitions.map((work) => {
    const files = batchFiles.filter((file) => file.workGroupId === work.id);
    return {
      ...work,
      pathPattern: undefined,
      language: "pi-Latn",
      languageZh: "巴利语（罗马字母）",
      edition: "SuttaCentral Mahāsaṅgīti Pali root",
      sourceRecordCount: files.length,
      sourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
      sourceSegments: files.reduce((sum, file) => sum + file.sourceSegments, 0),
      stableSegments: files.reduce((sum, file) => sum + file.segments, 0),
      omittedEmptySegments: files.reduce((sum, file) => sum + file.emptySegments, 0),
      readingUnits: files.reduce((sum, file) => sum + Math.ceil(file.segments / 120), 0),
    };
  });
  const batch = {
    schema: "https://foxue.ai/schemas/corpus-source-batch-v0.5",
    version: batchVersion,
    publishedAt: capturedAt,
    source: {
      id: "suttacentral_bilara",
      name: "SuttaCentral Bilara Data",
      repository: sourceRepository,
      commit: sourceCommit,
      tree: sourceTree,
      branchSemantics: "published",
      homepage: "https://suttacentral.net/",
      licenseUrl: licensingUrl,
    },
    rightsDecision: audit.rightsDecision,
    rightsAudit: {
      file: `data/gbcr/suttacentral-vinaya-root-rights-audit-v${version}.json`,
      sha256: sha256(serialize(audit)),
      inventorySha256: audit.integrity.inventorySha256,
    },
    normalization: {
      operation: "append_single_lf",
      contentChange: "none",
      segmentIds: "preserved_verbatim",
      emptySegments: "eight_empty_upstream_values_omitted_from_reading_layer_and_recorded_verbatim",
    },
    collection: {
      id: "SC-PALI-VINAYA-ROOTS",
      titleZh: "SuttaCentral 上座部巴利律藏原文",
      workCount: works.length,
      expressionCount: works.length,
      sourceRecordCount: batchFiles.length,
      sourceBytes,
      stableSegments,
      sourceSegments,
      omittedEmptySegments,
      workCountingDecision: "422 个物理文件按上游六个律藏书级集合合并为六个表达；戒本、经分别、犍度与附随互不冒充同一作品。",
    },
    works,
    files: batchFiles,
  };
  return { audit, batch };
}

async function verifyLocal(audit, batch) {
  requireValue(audit.version === version && batch.version === batchVersion, "巴利律藏批次版本不一致");
  requireValue(audit.source.commit === sourceCommit && batch.source.commit === sourceCommit, "巴利律藏来源提交不一致");
  requireValue(audit.summary.filesAudited === 422 && batch.files.length === 422, "巴利律藏文件数不一致");
  requireValue(audit.summary.representedWorks === 6 && batch.works.length === 6, "巴利律藏作品数不一致");
  requireValue(audit.summary.sourceBytes === 6710444 && batch.collection.sourceBytes === 6710444, "巴利律藏字节数不一致");
  requireValue(audit.summary.sourceSegments === 71565 && audit.summary.stableSegments === 71557, "巴利律藏段落数不一致");
  requireValue(audit.summary.omittedEmptySegments === 8, "巴利律藏空段落数不一致");
  requireValue(audit.summary.filesApprovedForModelTraining === 0, "巴利律藏 root 不得批准模型训练");
  requireValue(audit.integrity.translationBodiesPublished === false, "第三方译文不得进入本批次");
  requireValue(batch.rightsAudit.sha256 === sha256(serialize(audit)), "巴利律藏权利账本哈希不一致");
  requireValue(audit.integrity.inventorySha256 === sha256(serialize(audit.records)), "巴利律藏库存哈希不一致");
  const auditByPath = new Map(audit.records.map((record) => [record.upstreamPath, record]));
  for (const file of batch.files) {
    const local = await readFile(resolve(root, file.localPath));
    requireValue(local.length === file.localBytes && sha256(local) === file.localSha256, `${file.id} 本地来源哈希不一致`);
    requireValue(local.at(-1) === 10, `${file.id} 缺少规范化 LF`);
    const upstream = local.subarray(0, -1);
    requireValue(upstream.length === file.upstreamBytes && sha256(upstream) === file.upstreamSha256, `${file.id} 上游内容无法还原`);
    requireValue(gitBlobSha1(upstream) === file.upstreamGitBlobSha1, `${file.id} Git blob 无法还原`);
    const entries = Object.entries(JSON.parse(upstream.toString("utf8")));
    const emptySegments = entries.filter(([, text]) => !text.trim()).length;
    requireValue(entries.length === file.sourceSegments && entries.length - emptySegments === file.segments, `${file.id} 段落统计不一致`);
    requireValue(entries[0]?.[0] === file.firstSegmentId && entries.at(-1)?.[0] === file.lastSegmentId, `${file.id} 首尾锚点不一致`);
    requireValue(auditByPath.get(file.upstreamPath)?.upstreamGitBlobSha1 === file.upstreamGitBlobSha1, `${file.id} 权利记录与批次不一致`);
  }
  requireValue(batch.files.reduce((sum, file) => sum + file.segments, 0) === batch.collection.stableSegments, "巴利律藏稳定段落合计不一致");
}

if (writeMode) {
  const { audit, batch } = await buildFromSource();
  await writeFile(auditPath, serialize(audit), "utf8");
  await writeFile(batchPath, serialize(batch), "utf8");
  await verifyLocal(audit, batch);
  console.log(`SuttaCentral 巴利律藏 root 权利批次已生成：422/422 份原文、6 个文本表达、${batch.collection.stableSegments} 个稳定段落；0 份译文、0 份模型训练授权。`);
} else {
  const audit = JSON.parse(await readFile(auditPath, "utf8"));
  const batch = JSON.parse(await readFile(batchPath, "utf8"));
  await verifyLocal(audit, batch);
  console.log(`SuttaCentral 巴利律藏 root 权利批次验证通过：422 份来源、6 个文本表达、${batch.collection.sourceBytes} 字节，未导入第三方译文。`);
}
