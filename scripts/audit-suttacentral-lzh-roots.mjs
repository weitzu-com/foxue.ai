import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const version = "1.1.0";
const batchVersion = "1.6.0";
const capturedAt = "2026-08-16";
const sourceCommit = "eac6c24781dd1eefdc17dc2f787b54bf6fe31719";
const sourceTree = "949e4ec6b6636fe63d678c46894897ec4fad81e7";
const policyCommit = "b2cb0f91eed45e42c234e39ce17cdb87a2965167";
const policyTree = "7c10ea8556fedeb303af5099e5d09f822b7ebae9";
const policyPath = "client/localization/elements/licensing_en.json";
const auditPath = resolve(root, `data/gbcr/suttacentral-lzh-root-rights-audit-v${version}.json`);
const batchPath = resolve(root, `data/corpus/suttacentral/lzh-batch-v${batchVersion}.json`);
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

if (writeMode === verifyMode) throw new Error("必须且只能指定 --write 或 --verify");
if (writeMode && (!sourceRepo || !policyRepo)) {
  throw new Error("写入模式必须提供 --source-repo 与 --policy-repo 两个固定 Git 工作树");
}

const workDefinitions = [
  {
    id: "LZH-MA",
    slug: "suttacentral-madhyama-agama-selection",
    workId: "gbcr:work:madhyama-agama-t0026",
    title: "中阿含經",
    titleZh: "中阿含经（SuttaCentral 局部见证）",
    tradition: "汉传佛教 · 阿含部",
    canonRef: "SuttaCentral MA · 对应大正藏 T0026 的选段",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/ma/lzh/sct",
    completeness: "complete_source_file_partial_work_witness",
    fullSourceText: false,
    pathPattern: /^root\/lzh\/sct\/sutta\/ma\/ma\d+_root-lzh-sct\.json$/,
    expectedFiles: 15,
    summary: "保存固定提交中 15 份《中阿含经》古汉译选段及原生段落标识；这是完整保存的局部来源见证，不冒充全经。",
    relationDecision: "复用既有 T0026 作品实体；SuttaCentral sct 数字见证与 CBETA 表达并列，不新增作品，不据选段推断全经完整。",
  },
  {
    id: "LZH-SA",
    slug: "suttacentral-samyukta-agama-selection",
    workId: "gbcr:work:samyukta-agama-t0099",
    title: "雜阿含經",
    titleZh: "杂阿含经（SuttaCentral 局部见证）",
    tradition: "汉传佛教 · 阿含部",
    canonRef: "SuttaCentral SA · 对应大正藏 T0099 的选段",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/sa/lzh/sct",
    completeness: "complete_source_file_partial_work_witness",
    fullSourceText: false,
    pathPattern: /^root\/lzh\/sct\/sutta\/sa\/[^/]+\/sa\d+_root-lzh-sct\.json$/,
    expectedFiles: 49,
    summary: "保存固定提交中 49 份《杂阿含经》古汉译选段及原生段落标识；这是完整保存的局部来源见证，不冒充全经。",
    relationDecision: "复用既有 T0099 作品实体；只登记固定 SuttaCentral 选段数字见证，不把文件数或平行关系转化为新增作品。",
  },
  {
    id: "LZH-EA",
    slug: "suttacentral-ekottarika-agama-selection",
    workId: "gbcr:work:ekottarika-agama-t0125",
    title: "增壹阿含經 19",
    titleZh: "增壹阿含经（SuttaCentral 局部见证）",
    tradition: "汉传佛教 · 阿含部",
    canonRef: "SuttaCentral EA 19.1 · 对应大正藏 T0125 的选段",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/ea19.1/lzh/sct",
    completeness: "complete_source_file_partial_work_witness",
    fullSourceText: false,
    pathPattern: /^root\/lzh\/sct\/sutta\/ea\/ea19\/ea19\.1_root-lzh-sct\.json$/,
    expectedFiles: 1,
    summary: "保存固定提交中的 EA 19.1 古汉译选段及原生段落标识；这是一个完整来源文件，不是完整《增壹阿含经》。",
    relationDecision: "复用既有 T0125 作品实体；单个选段只作局部数字见证，不外推为全经表达完整。",
  },
  {
    id: "LZH-T0765",
    slug: "suttacentral-benshi-jing-t0765",
    workId: "gbcr:work:taisho-t0765",
    title: "本事經卷第一",
    titleZh: "本事经（SuttaCentral 完整古汉译 root）",
    tradition: "汉传佛教 · 本缘部",
    canonRef: "SuttaCentral T765.1–140 · 大正藏 T0765",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/t765/lzh/sct",
    completeness: "complete_multi_source_expression",
    fullSourceText: true,
    pathPattern: /^root\/lzh\/sct\/sutta\/lzh-minor\/lzh-iti\/t765\.\d+_root-lzh-sct\.json$/,
    expectedFiles: 140,
    summary: "完整保存固定提交中的 140 份《本事经》古汉译 root 记录与原生段落标识，作为既有 T0765 作品的独立数字见证。",
    relationDecision: "复用既有 T0765 作品实体；SuttaCentral 与 CBETA 为同一汉译传统的不同数字见证，表达分别受控但作品不重复计数。",
  },
  {
    id: "LZH-T1536",
    slug: "suttacentral-t1536",
    workId: "gbcr:work:taisho-t1536",
    title: "阿毘達磨集異門足論",
    titleZh: "阿毗达磨集异门足论（SuttaCentral 完整古汉译 root）",
    tradition: "汉传佛教 · 毗昙部",
    canonRef: "SuttaCentral T1536.1–12 · 大正藏 T1536",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/t1536/lzh/sct",
    completeness: "complete_multi_source_expression",
    fullSourceText: true,
    pathPattern: /^root\/lzh\/sct\/abhidhamma\/sg\/t1536\.[0-9a-z]+_root-lzh-sct\.json$/,
    expectedFiles: 12,
    summary: "完整保存固定提交中的 12 份《阿毗达磨集异门足论》古汉译 root 记录与原生段落标识。",
    relationDecision: "复用既有 T1536 作品实体；不把数字分卷文件计为独立作品，也不把传统说者归属改写成佛陀逐字亲说。",
  },
  {
    id: "LZH-T1537",
    slug: "suttacentral-t1537",
    workId: "gbcr:work:taisho-t1537",
    title: "阿毘達磨法蘊足論",
    titleZh: "阿毗达磨法蕴足论（SuttaCentral 完整古汉译 root）",
    tradition: "汉传佛教 · 毗昙部",
    canonRef: "SuttaCentral T1537.1–21a · 大正藏 T1537",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/t1537/lzh/sct",
    completeness: "complete_multi_source_expression",
    fullSourceText: true,
    pathPattern: /^root\/lzh\/sct\/abhidhamma\/lzh-dk\/t1537\.[0-9a-z]+_root-lzh-sct\.json$/,
    expectedFiles: 22,
    summary: "完整保存固定提交中的 22 份《阿毗达磨法蕴足论》古汉译 root 记录与原生段落标识；一个空编辑占位符显式省略。",
    relationDecision: "复用既有 T1537 作品实体；保留传统作者归属冲突，不将数字分卷或 21a 补记录重复计为作品。",
  },
  {
    id: "LZH-T1548",
    slug: "suttacentral-t1548",
    workId: "gbcr:work:sariputrabhidharma",
    title: "舍利弗阿毘曇論",
    titleZh: "舍利弗阿毗昙论（SuttaCentral 完整古汉译 root）",
    tradition: "汉传佛教 · 毗昙部",
    canonRef: "SuttaCentral T1548.1–33 · 大正藏 T1548",
    edition: "SuttaCentral Classical Chinese root · sct edition",
    sourceUrl: "https://suttacentral.net/t1548/lzh/sct",
    completeness: "complete_multi_source_expression",
    fullSourceText: true,
    pathPattern: /^root\/lzh\/sct\/abhidhamma\/sag\/t1548\.[0-9a-z]+_root-lzh-sct\.json$/,
    expectedFiles: 33,
    summary: "完整保存固定提交中的 33 份《舍利弗阿毗昙论》古汉译 root 记录与原生段落标识。",
    relationDecision: "复用既有《舍利弗阿毗昙论》作品实体；传统题名归属、译者责任和数字见证分层记录，不新增作品。",
  },
];

const numericPathOrder = (left, right) => {
  const id = (path) => path.split("/").at(-1).match(/^([a-z]+)(\d+)(?:\.(\d+)([a-z]?))?/)?.slice(1) ?? [];
  const a = id(left);
  const b = id(right);
  return a[0].localeCompare(b[0]) || Number(a[1]) - Number(b[1]) || Number(a[2] ?? 0) - Number(b[2] ?? 0) || (a[3] ?? "").localeCompare(b[3] ?? "");
};

async function gitBytes(repository, commit, relativePath, maxBuffer = 8 * 1024 * 1024) {
  const { stdout } = await execFileAsync("git", ["-C", repository, "show", `${commit}:${relativePath}`], { encoding: null, maxBuffer });
  return stdout;
}

async function buildFromSource() {
  const { stdout: head } = await execFileAsync("git", ["-C", sourceRepo, "rev-parse", "HEAD"]);
  const { stdout: tree } = await execFileAsync("git", ["-C", sourceRepo, "rev-parse", "HEAD^{tree}"]);
  const { stdout: policyHead } = await execFileAsync("git", ["-C", policyRepo, "rev-parse", "HEAD"]);
  const { stdout: policyTreeValue } = await execFileAsync("git", ["-C", policyRepo, "rev-parse", "HEAD^{tree}"]);
  requireValue(head.trim() === sourceCommit && tree.trim() === sourceTree, "SuttaCentral 正文固定提交或树不一致");
  requireValue(policyHead.trim() === policyCommit && policyTreeValue.trim() === policyTree, "SuttaCentral 许可政策固定提交或树不一致");

  const { stdout: listed } = await execFileAsync("git", ["-C", sourceRepo, "ls-tree", "-r", "--name-only", sourceCommit, "root/lzh/sct"], { maxBuffer: 2 * 1024 * 1024 });
  const allPaths = listed.trim().split("\n").filter((path) => path.endsWith(".json"));
  requireValue(allPaths.length === 272, "古汉译 root 文件总数漂移");
  requireValue(allPaths.filter((path) => path.includes("/sutta/")).length === 205, "古汉译经藏文件数漂移");
  requireValue(allPaths.filter((path) => path.includes("/abhidhamma/")).length === 67, "古汉译论藏文件数漂移");

  const publicationBytes = await gitBytes(sourceRepo, sourceCommit, "_publication.json");
  const editionBytes = await gitBytes(sourceRepo, sourceCommit, "_edition.json");
  const repositoryLicenseBytes = await gitBytes(sourceRepo, sourceCommit, "LICENSE.md");
  const policyBytes = await gitBytes(policyRepo, policyCommit, policyPath, 2 * 1024 * 1024);
  const publications = JSON.parse(publicationBytes.toString("utf8"));
  const editions = JSON.parse(editionBytes.toString("utf8"));
  const policy = JSON.parse(policyBytes.toString("utf8"));
  const lzhPublications = Object.values(publications).filter((item) => item.root_lang_iso === "lzh");
  requireValue(editions.sct?.is_root === true && editions.sct?.language === "lzh", "sct 古汉译根本文本版本记录漂移");
  requireValue(lzhPublications.length === 8 && lzhPublications.every((item) => item.license?.license_abbreviation === "CC0"), "古汉译出版记录漂移");
  requireValue(/original texts of Buddhism[\s\S]{0,1000}public domain/i.test(policy["licensing:24"]), "官方许可政策缺少佛教原文公共领域声明");
  requireValue(/generative AI/i.test(policy["licensing:27"]), "官方许可政策缺少生成式 AI 使用请求");

  const records = [];
  const batchFiles = [];
  const batchWorks = [];
  const usedPaths = new Set();
  for (const work of workDefinitions) {
    const paths = allPaths.filter((path) => work.pathPattern.test(path)).sort(numericPathOrder);
    requireValue(paths.length === work.expectedFiles, `${work.id} 来源文件数漂移`);
    let stableSegments = 0;
    let sourceSegments = 0;
    let emptySegments = 0;
    let sourceBytes = 0;
    let readingUnits = 0;
    for (const [index, upstreamPath] of paths.entries()) {
      requireValue(!usedPaths.has(upstreamPath), `${upstreamPath} 被重复分组`);
      usedPaths.add(upstreamPath);
      const upstream = await gitBytes(sourceRepo, sourceCommit, upstreamPath);
      const entries = Object.entries(JSON.parse(upstream.toString("utf8")));
      requireValue(entries.length > 0 && entries.every(([id, text]) => /^[a-z][a-z0-9.-]*:\d+(?:[.-]\d+)*$/.test(id) && typeof text === "string"), `${upstreamPath} 段落结构无效`);
      const emptyEditorialPlaceholderSegments = entries.filter(([, text]) => !text.trim()).length;
      const segments = entries.length - emptyEditorialPlaceholderSegments;
      const local = Buffer.concat([upstream, Buffer.from("\n")]);
      const localPath = `data/corpus/suttacentral/${upstreamPath}`;
      const filename = upstreamPath.split("/").at(-1);
      const recordId = filename.replace("_root-lzh-sct.json", "").toUpperCase();
      const common = {
        id: recordId,
        workId: work.workId,
        workGroupId: work.id,
        language: "zh-Hant",
        upstreamPath,
        upstreamGitBlobSha1: gitBlobSha1(upstream),
        upstreamBytes: upstream.length,
        upstreamSha256: sha256(upstream),
        localPath,
        localBytes: local.length,
        localSha256: sha256(local),
        firstSegmentId: entries.find(([, text]) => text.trim())?.[0],
        lastSegmentId: entries.findLast(([, text]) => text.trim())?.[0],
        sourceSegments: entries.length,
        emptyEditorialPlaceholderSegments,
        segments,
        rightsStatus: "public_domain_root_by_official_suttacentral_policy",
      };
      records.push({
        ...common,
        sourceEdition: "sct",
        publicationMetadataStatus: "eight_lzh_cc0_records_preserved_not_relied_on_for_root_rights",
        approvedForFoxueReadingAndRetrieval: true,
        approvedForModelTraining: false,
      });
      batchFiles.push({ ...common, part: index + 1, slug: work.slug, parser: "bilara_series_root_json", format: "application/json" });
      await mkdir(dirname(resolve(root, localPath)), { recursive: true });
      try {
        const existing = await readFile(resolve(root, localPath));
        requireValue(existing.equals(local), `${localPath} 已存在但内容不同，拒绝覆盖`);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        await writeFile(resolve(root, localPath), local, { flag: "wx" });
      }
      sourceBytes += upstream.length;
      sourceSegments += entries.length;
      emptySegments += emptyEditorialPlaceholderSegments;
      stableSegments += segments;
      readingUnits += Math.ceil(segments / 120);
    }
    batchWorks.push({
      id: work.id,
      slug: work.slug,
      workId: work.workId,
      title: work.title,
      titleZh: work.titleZh,
      language: "zh-Hant",
      languageZh: "古汉语（繁体）",
      tradition: work.tradition,
      canonRef: work.canonRef,
      edition: work.edition,
      sourceUrl: work.sourceUrl,
      summary: work.summary,
      relationDecision: work.relationDecision,
      completeness: work.completeness,
      fullSourceText: work.fullSourceText,
      sourceRecordCount: paths.length,
      sourceBytes,
      sourceSegments,
      emptyEditorialPlaceholderSegments: emptySegments,
      stableSegments,
      readingUnits,
      parserOptions: { collectionTitle: work.titleZh, titleSuffixes: ["0.1"], omitEmptySegments: true },
    });
  }
  requireValue(usedPaths.size === allPaths.length, "存在未裁决的古汉译 root 文件");
  const sourceBytes = records.reduce((sum, item) => sum + item.upstreamBytes, 0);
  const stableSegments = records.reduce((sum, item) => sum + item.segments, 0);
  const sourceSegments = records.reduce((sum, item) => sum + item.sourceSegments, 0);
  const omitted = records.reduce((sum, item) => sum + item.emptyEditorialPlaceholderSegments, 0);
  requireValue(sourceBytes === 2922861 && stableSegments === 38644 && sourceSegments === 38646 && omitted === 2, "古汉译 root 内容统计漂移");

  const recordsRaw = serialize(records);
  const audit = {
    schema: "https://foxue.ai/schemas/gbcr/suttacentral-lzh-root-rights-audit-v0.1",
    version,
    capturedAt,
    status: "approved_public_domain_classical_chinese_roots_no_translation_import",
    source: {
      repository: "suttacentral/bilara-data",
      commit: sourceCommit,
      tree: sourceTree,
      branchSemantics: "published",
      licensingUrl: "https://suttacentral.net/licensing",
      licensingPolicySource: { repository: "suttacentral/suttacentral", commit: policyCommit, tree: policyTree, path: policyPath, gitBlobSha1: gitBlobSha1(policyBytes), sha256: sha256(policyBytes) },
      publicationMetadata: { path: "_publication.json", sha256: sha256(publicationBytes), classicalChineseRecords: 8, recordedLicenses: ["CC0"] },
      editionMetadata: { path: "_edition.json", sha256: sha256(editionBytes), editionId: "sct" },
      repositoryLicense: { path: "LICENSE.md", sha256: sha256(repositoryLicenseBytes) },
    },
    rightsDecision: {
      rootTexts: "public_domain_by_official_suttacentral_policy",
      thirdPartyTranslationsImported: false,
      publicationLicenseReliedOnForRootRights: false,
      attributionRequested: true,
      trainingUse: "prohibited_by_foxue_policy_and_suttacentral_request",
      allowedUses: ["human_reading", "research", "source_cited_search", "source_cited_retrieval"],
      excludedUses: ["generative_model_training", "unreviewed_translation_republication"],
      decisionNote: "官方许可政策明确把汉文等佛教原文列为公共领域；固定出版元数据中的汉文 CC0 记录只作辅助证据。本批次仅导入 root/lzh/sct 原文，不导入 translation/ 下的第三方译文。",
    },
    summary: {
      filesAudited: records.length,
      filesApprovedForReadingAndRetrieval: records.length,
      filesApprovedForModelTraining: 0,
      suttaRootFiles: records.filter((item) => item.upstreamPath.includes("/sutta/")).length,
      abhidhammaRootFiles: records.filter((item) => item.upstreamPath.includes("/abhidhamma/")).length,
      representedExistingWorks: workDefinitions.length,
      completeExpressions: workDefinitions.filter((item) => item.fullSourceText).length,
      partialWitnessGroups: workDefinitions.filter((item) => !item.fullSourceText).length,
      newWorksCreated: 0,
      sourceBytes,
      sourceSegments,
      stableSegments,
      omittedEmptyEditorialPlaceholderSegments: omitted,
      thirdPartyTranslationFilesImported: 0,
    },
    records,
    integrity: { inventorySha256: sha256(recordsRaw), sourceBodiesPublished: true, translationBodiesPublished: false, normalization: "append_single_lf" },
    warning: "272 个物理文件只组成七个既有作品的数字见证；不得把文件数当作作品数。MA、SA、EA 三组是局部见证；全球作品分母仍然未知。",
  };

  const batch = {
    schema: "https://foxue.ai/schemas/corpus-source-batch-v0.5",
    version: batchVersion,
    publishedAt: capturedAt,
    source: { id: "suttacentral_bilara", name: "SuttaCentral Bilara Data", repository: "suttacentral/bilara-data", commit: sourceCommit, tree: sourceTree, branchSemantics: "published", homepage: "https://suttacentral.net/", licenseUrl: "https://suttacentral.net/licensing" },
    rightsDecision: audit.rightsDecision,
    rightsAudit: { file: `data/gbcr/suttacentral-lzh-root-rights-audit-v${version}.json`, sha256: sha256(serialize(audit)), inventorySha256: audit.integrity.inventorySha256 },
    normalization: { operation: "append_single_lf", contentChange: "none", segmentIds: "preserved_verbatim", reversible: true },
    collection: { id: "suttacentral-lzh-roots", title: "SuttaCentral 古汉译 root 固定见证", language: "zh-Hant", workGroups: batchWorks.length, completeExpressions: 4, partialWitnessGroups: 3, newWorksCreated: 0, sourceRecordCount: records.length, sourceBytes, sourceSegments, stableSegments, omittedEmptyEditorialPlaceholderSegments: omitted, readingUnits: batchWorks.reduce((sum, item) => sum + item.readingUnits, 0) },
    works: batchWorks,
    files: batchFiles,
  };
  return { audit, batch };
}

if (writeMode) {
  const { audit, batch } = await buildFromSource();
  await Promise.all([writeFile(auditPath, serialize(audit)), writeFile(batchPath, serialize(batch))]);
  console.log(`SuttaCentral 古汉译 root 审计已写入：${audit.summary.filesAudited} 个文件、${audit.summary.stableSegments} 个稳定段落、0 个新增作品。`);
} else {
  const auditRaw = await readFile(auditPath, "utf8");
  const batchRaw = await readFile(batchPath, "utf8");
  const audit = JSON.parse(auditRaw);
  const batch = JSON.parse(batchRaw);
  requireValue(audit.version === version && batch.version === batchVersion, "古汉译审计或批次版本漂移");
  requireValue(audit.rightsDecision.thirdPartyTranslationsImported === false && audit.summary.filesApprovedForModelTraining === 0, "古汉译权利边界漂移");
  requireValue(audit.summary.filesAudited === 272 && audit.summary.stableSegments === 38644 && audit.summary.newWorksCreated === 0, "古汉译审计统计漂移");
  requireValue(batch.collection.completeExpressions === 4 && batch.collection.partialWitnessGroups === 3 && batch.collection.sourceBytes === 2922861, "古汉译批次完整性统计漂移");
  requireValue(batch.rightsAudit.sha256 === sha256(Buffer.from(auditRaw)), "古汉译批次引用的权利审计指纹漂移");
  requireValue(batch.files.every((item) => item.rightsStatus === "public_domain_root_by_official_suttacentral_policy" && item.localPath.startsWith("data/corpus/suttacentral/root/lzh/sct/")), "古汉译批次文件权利或路径漂移");
  for (const file of batch.files) {
    const local = await readFile(resolve(root, file.localPath));
    requireValue(local.length === file.localBytes && sha256(local) === file.localSha256 && local.at(-1) === 10, `${file.id} 本地文件漂移`);
    const upstream = local.subarray(0, -1);
    requireValue(upstream.length === file.upstreamBytes && sha256(upstream) === file.upstreamSha256 && gitBlobSha1(upstream) === file.upstreamGitBlobSha1, `${file.id} 无法还原固定上游 blob`);
  }
  console.log(`SuttaCentral 古汉译 root v${batchVersion} 可复现：272 个文件、7 个既有作品见证、38,644 个稳定段落；全球分母未知。`);
}
