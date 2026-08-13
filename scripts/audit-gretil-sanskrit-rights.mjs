import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const version = "0.7.0";
const capturedAt = "2026-08-14";
const repository = "INDOLOGY/GRETIL-mirror";
const commit = "0baf718d8e450821eb0403c03aacc9a4a82316d7";
const tree = "b3f67ca1d814b5b20a33fd5a0d686ad1768703ee";
const outputPath = resolve(root, `data/gbcr/gretil-sanskrit-file-rights-audit-v${version}.json`);
const sourcePrefixes = {
  sanskritBuddhistLiterature: "gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/",
  sanskritBuddhistPhilosophy: "gretil.sub.uni-goettingen.de/gretil/1_sanskr/6_sastra/3_phil/buddh/",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const decodeTitle = (value) => value
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&quot;/gi, "\"")
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const evidencePatterns = {
  referencePurposesOnly: /THIS(?:\s+<a[^>]*>GRETIL<\/a>)?\s+TEXT FILE IS FOR REFERENCE PURPOSES ONLY!/i,
  copyrightTermsAsSource: /COPYRIGHT AND TERMS OF USAGE AS FOR SOURCE FILE\./i,
  dsbcPermissionStatement: /With kind permission of the Digital Sanskrit Buddhist Canon Project/i,
  namedInputAttribution: /(?:Text\s+)?Input by|Inputted by|Electronic text (?:prepared|entered) by/i,
  explicitCopyrightNotice: /(?:Copyright|©)\s*(?:\([cC]\))?\s*(?:19|20)\d{2}\s+by/i,
  explicitOpenLicense: /Creative Commons|CC\s*BY(?:[-\s](?:NC|ND|SA))*|CC0|public domain|GNU (?:Free Documentation|General Public)|Open Data Commons/i,
};

const classify = (evidence) => {
  if (evidence.dsbcPermissionStatement) return "dsbc_permission_reference_only";
  if (evidence.explicitCopyrightNotice) return "explicit_copyright_reference_only";
  return "source_terms_unspecified_reference_only";
};

const parseTree = (raw) => raw.split("\n")
  .filter(Boolean)
  .map((line) => {
    const match = line.match(/^\d+ blob ([0-9a-f]{40})\s+(\d+)\t(.+)$/);
    requireValue(match, `无法解析 GRETIL tree 记录：${line}`);
    return { blobSha1: match[1], bytes: Number(match[2]), path: match[3] };
  })
  .filter((entry) => entry.path.endsWith(".htm"))
  .filter((entry) => Object.values(sourcePrefixes).some((prefix) => entry.path.startsWith(prefix)))
  .sort((a, b) => a.path.localeCompare(b.path));

const buildAudit = async (sourceRepository) => {
  const [{ stdout: head }, { stdout: rootTree }, { stdout: treeRaw }] = await Promise.all([
    execFileAsync("git", ["-C", sourceRepository, "rev-parse", "HEAD"], { encoding: "utf8" }),
    execFileAsync("git", ["-C", sourceRepository, "rev-parse", `${commit}^{tree}`], { encoding: "utf8" }),
    execFileAsync("git", [
      "-C", sourceRepository, "ls-tree", "-r", "-l", commit, "--", ...Object.values(sourcePrefixes),
    ], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }),
  ]);
  requireValue(head.trim() === commit, "GRETIL 本地来源不在固定提交");
  requireValue(rootTree.trim() === tree, "GRETIL 根 tree 与固定证据不一致");

  const entries = parseTree(treeRaw);
  requireValue(entries.length === 417, "GRETIL 佛教梵文 HTML 文件数漂移");
  const records = await Promise.all(entries.map(async (entry) => {
    const bytes = await readFile(resolve(sourceRepository, entry.path));
    requireValue(bytes.length === entry.bytes, `${entry.path} 的字节数与 Git tree 不一致`);
    requireValue(gitBlobSha1(bytes) === entry.blobSha1, `${entry.path} 的 Git blob 不一致`);
    const text = bytes.toString("utf8");
    const title = decodeTitle(text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    requireValue(title, `${entry.path} 缺少 HTML title`);
    const evidence = Object.fromEntries(Object.entries(evidencePatterns).map(([id, pattern]) => [id, pattern.test(text)]));
    requireValue(evidence.copyrightTermsAsSource, `${entry.path} 缺少来源权利回指声明`);
    requireValue(evidence.referencePurposesOnly, `${entry.path} 缺少仅供参考声明`);
    requireValue(!evidence.explicitOpenLicense, `${entry.path} 检测到开放许可，必须人工复核规则后单独分类`);
    const markerIndex = text.search(evidencePatterns.copyrightTermsAsSource);
    const preamble = markerIndex >= 0 ? text.slice(0, markerIndex) : "";
    const group = Object.entries(sourcePrefixes).find(([, prefix]) => entry.path.startsWith(prefix))?.[0];
    requireValue(group, `${entry.path} 无法归入固定梵文目录`);
    const rightsClassification = classify(evidence);
    return {
      path: entry.path,
      group,
      title,
      sourceUrl: `https://github.com/${repository}/blob/${commit}/${entry.path}`,
      blobSha1: entry.blobSha1,
      bytes: entry.bytes,
      sha256: sha256(bytes),
      preambleSha256: sha256(preamble),
      evidence,
      rightsClassification,
      republicationApproved: false,
      foxueAction: "metadata_hash_and_external_link_only",
    };
  }));

  const count = (predicate) => records.filter(predicate).length;
  const classificationCounts = Object.fromEntries([
    "dsbc_permission_reference_only",
    "explicit_copyright_reference_only",
    "source_terms_unspecified_reference_only",
  ].map((id) => [id, count((record) => record.rightsClassification === id)]));
  const inventorySha256 = sha256(records.map((record) => [
    record.path,
    record.blobSha1,
    record.bytes,
    record.sha256,
    record.preambleSha256,
    record.rightsClassification,
    record.republicationApproved,
  ].join("\t")).join("\n"));

  return {
    schema: "https://foxue.ai/schemas/gbcr/file-rights-audit-v0.7",
    version,
    capturedAt,
    status: "file_level_audit_complete_republication_not_authorized",
    source: {
      repository,
      commit,
      tree,
      prefixes: sourcePrefixes,
    },
    policy: {
      defaultDeny: true,
      openAccessDoesNotImplyRepublicationPermission: true,
      dsbcPermissionToGretilDoesNotAuthorizeFoxue: true,
      sourceCopyrightTermsMustBeResolvedPerFile: true,
      fullTextMirrorAllowed: false,
      publishedFields: "path, title, fixed Git identity, byte/hash evidence, classification and external source link; no source body",
    },
    summary: {
      filesAudited: records.length,
      sourceBytes: records.reduce((sum, record) => sum + record.bytes, 0),
      filesMarkedReferenceOnly: count((record) => record.evidence.referencePurposesOnly),
      filesDeferringTermsToSource: count((record) => record.evidence.copyrightTermsAsSource),
      filesWithDsbcPermissionStatement: count((record) => record.evidence.dsbcPermissionStatement),
      filesWithNamedInputAttribution: count((record) => record.evidence.namedInputAttribution),
      filesWithExplicitCopyrightNotice: count((record) => record.evidence.explicitCopyrightNotice),
      filesWithExplicitOpenLicense: count((record) => record.evidence.explicitOpenLicense),
      filesApprovedForRepublication: count((record) => record.republicationApproved),
      filesRestrictedToMetadataAndExternalLink: count((record) => record.foxueAction === "metadata_hash_and_external_link_only"),
      classificationCounts,
      denominatorImpact: "none",
    },
    integrity: {
      inventorySha256,
      rawSourceBodiesPublished: false,
    },
    classifications: {
      dsbc_permission_reference_only: "文件说明 DSBC 曾许可 GRETIL 展示，但该许可不是授予 foxue.ai 的再发布许可。",
      explicit_copyright_reference_only: "文件含具名版权声明，且 GRETIL 仅供参考并回指来源条款。",
      source_terms_unspecified_reference_only: "文件没有可机器确认的开放许可；GRETIL 仅供参考并回指来源条款。",
    },
    warning: "逐文件完成识别不等于取得许可。417 份文件均只能发布事实性元数据、校验摘要和固定外链；在权利人或机构提供明确再发布授权前，0 份进入 foxue.ai 全文库。",
    records,
  };
};

const validateAudit = (audit) => {
  requireValue(audit.version === version && audit.capturedAt === capturedAt, "GRETIL 逐文件权利账本版本漂移");
  requireValue(audit.source?.repository === repository && audit.source?.commit === commit && audit.source?.tree === tree, "GRETIL 逐文件权利账本来源漂移");
  requireValue(audit.policy?.defaultDeny === true && audit.policy?.fullTextMirrorAllowed === false, "GRETIL 默认拒绝策略漂移");
  requireValue(audit.summary?.filesAudited === 417 && audit.records?.length === 417, "GRETIL 逐文件权利账本不完整");
  requireValue(audit.summary?.sourceBytes === 62432484, "GRETIL 逐文件权利账本字节数漂移");
  requireValue(audit.summary?.filesMarkedReferenceOnly === 417, "GRETIL 仅供参考标记计数漂移");
  requireValue(audit.summary?.filesDeferringTermsToSource === 417, "GRETIL 来源条款回指标记计数漂移");
  requireValue(audit.summary?.filesWithDsbcPermissionStatement === 179, "GRETIL 的 DSBC 展示许可记录数漂移");
  requireValue(audit.summary?.filesWithNamedInputAttribution === 398, "GRETIL 具名录入说明计数漂移");
  requireValue(audit.summary?.filesWithExplicitCopyrightNotice === 26, "GRETIL 明示版权记录数漂移");
  requireValue(audit.summary?.filesWithExplicitOpenLicense === 0, "GRETIL 出现未经裁决的开放许可记录");
  requireValue(audit.summary?.filesApprovedForRepublication === 0, "GRETIL 不得在未获授权时批准正文再发布");
  requireValue(audit.summary?.filesRestrictedToMetadataAndExternalLink === 417, "GRETIL 外链限定记录数漂移");
  requireValue(audit.summary?.classificationCounts?.dsbc_permission_reference_only === 179, "GRETIL DSBC 来源分类漂移");
  requireValue(audit.summary?.classificationCounts?.explicit_copyright_reference_only === 26, "GRETIL 明示版权分类漂移");
  requireValue(audit.summary?.classificationCounts?.source_terms_unspecified_reference_only === 212, "GRETIL 未明示许可分类漂移");
  requireValue(audit.summary?.denominatorImpact === "none", "GRETIL 权利审计不得改变全球作品分母");
  requireValue(new Set(audit.records.map((record) => record.path)).size === 417, "GRETIL 逐文件路径不唯一");
  requireValue(audit.records.every((record) => record.republicationApproved === false && record.foxueAction === "metadata_hash_and_external_link_only"), "GRETIL 逐文件再发布决定不一致");
  const expectedInventorySha256 = sha256(audit.records.map((record) => [
    record.path,
    record.blobSha1,
    record.bytes,
    record.sha256,
    record.preambleSha256,
    record.rightsClassification,
    record.republicationApproved,
  ].join("\t")).join("\n"));
  requireValue(audit.integrity?.inventorySha256 === expectedInventorySha256, "GRETIL 逐文件权利账本全集摘要不匹配");
  requireValue(audit.integrity?.rawSourceBodiesPublished === false, "GRETIL 权利账本不得复制来源正文");
};

if (process.argv.includes("--write")) {
  const sourceFlag = process.argv.indexOf("--source-repo");
  const sourceRepository = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : process.env.GRETIL_SOURCE_REPO;
  requireValue(sourceRepository, "--write 需要 --source-repo 或 GRETIL_SOURCE_REPO 指向固定 GRETIL Git 工作树");
  const audit = await buildAudit(resolve(sourceRepository));
  validateAudit(audit);
  await writeFile(outputPath, serialize(audit), "utf8");
  console.log("GRETIL 梵文逐文件权利账本已生成：417/417 已审计，0/417 获准镜像正文。");
} else if (process.argv.includes("--verify")) {
  const audit = JSON.parse(await readFile(outputPath, "utf8"));
  validateAudit(audit);
  console.log("GRETIL 梵文逐文件权利账本验证通过：179 份 DSBC 展示许可、26 份明示版权、212 份来源条款未明；全部仅发布元数据与外链。");
} else {
  throw new Error("请使用 --write --source-repo <固定 Git 工作树> 生成账本，或使用 --verify 离线验证");
}
