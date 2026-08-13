import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const version = "0.8.0";
const batchVersion = "1.3.0";
const capturedAt = "2026-08-14";
const sourceCommit = "eac6c24781dd1eefdc17dc2f787b54bf6fe31719";
const sourceTree = "949e4ec6b6636fe63d678c46894897ec4fad81e7";
const policyCommit = "b2cb0f91eed45e42c234e39ce17cdb87a2965167";
const policyTree = "7c10ea8556fedeb303af5099e5d09f822b7ebae9";
const policyPath = "client/localization/elements/licensing_en.json";
const auditPath = resolve(root, `data/gbcr/suttacentral-indic-root-rights-audit-v${version}.json`);
const batchPath = resolve(root, `data/corpus/suttacentral/indic-batch-v${batchVersion}.json`);
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

if (writeMode === verifyMode) {
  throw new Error("必须且只能指定 --write 或 --verify");
}
if (writeMode && (!sourceRepo || !policyRepo)) {
  throw new Error("写入模式必须提供 --source-repo 与 --policy-repo 两个固定 Git 工作树");
}

const workDefinitions = [
  {
    id: "SF36",
    sourceId: "sf36",
    slug: "sanskrit-mahavadanasutra",
    workId: "gbcr:work:mahavadanasutra-sanskrit-sf36",
    title: "Mahāvadānasūtra",
    titleZh: "大本经（梵文本）",
    language: "sa-Latn",
    languageZh: "梵语（拉丁转写）",
    tradition: "早期佛教 · 梵文阿含经",
    canonRef: "SuttaCentral SF 36",
    edition: "SuttaCentral Sanskrit root · SF 36",
    sourceUrl: "https://suttacentral.net/sf36/san",
    paths: ["root/san/sutta/sf/sf36_root-san.json"],
    summary: "保存《Mahāvadānasūtra》梵文见证及 Bilara 原生段落标识；与巴利 DN 14 的作品关系只列为待人工校勘候选。",
    relationDecision: "题名与内容显示其与巴利 Mahāpadānasutta（DN 14）存在平行关系，但本批次不据题名自动合并为同一作品。",
  },
  {
    id: "SF276",
    sourceId: "sf276",
    slug: "sanskrit-candrasutra",
    workId: "gbcr:work:candrasutra-sanskrit-sf276",
    title: "Candrasūtra",
    titleZh: "月经（梵文本）",
    language: "sa-Latn",
    languageZh: "梵语（拉丁转写）",
    tradition: "早期佛教 · 梵文阿含经",
    canonRef: "SuttaCentral SF 276",
    edition: "SuttaCentral Sanskrit root · SF 276",
    sourceUrl: "https://suttacentral.net/sf276/san",
    paths: ["root/san/sutta/sf/sf276_root-san.json"],
    summary: "保存《Candrasūtra》梵文见证及 Bilara 原生段落标识；不凭题名自动裁定其跨语种作品身份。",
    relationDecision: "可能存在其他语种平行经；在逐段证据和人工校勘完成前保持独立作品记录。",
  },
  {
    id: "PDHP",
    sourceId: "pdhp",
    slug: "patna-dharmapada",
    workId: "gbcr:work:patna-dharmapada-prakrit",
    textFamilyId: "gbcr:text-family:dhammapada",
    title: "Patna Dharmapada",
    titleZh: "巴特那法句经",
    language: "pra-Latn",
    languageZh: "俗语（拉丁转写）",
    tradition: "早期佛教 · 法句文本家族",
    canonRef: "SuttaCentral PDHP 1–414",
    edition: "Margaret Cone transcription · PTS / SuttaCentral edition",
    sourceUrl: "https://suttacentral.net/pdhp/pra/pts",
    paths: [],
    summary: "保存巴特那《法句经》414 偈的完整俗语见证及 Bilara 原生段落标识；与巴利、汉译法句本分别计作不同传承。",
    relationDecision: "与巴利 Dhammapada、汉译 T0210 同属法句文本家族；结构与内容不完全相同，不声明为同一作品的逐句翻译。",
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
    ["-C", sourceRepo, "ls-tree", "-r", "--name-only", sourceCommit, "root/san", "root/pra"],
    { maxBuffer: 2 * 1024 * 1024 },
  );
  const paths = listed.trim().split("\n").filter(Boolean);
  const sanskritPaths = paths.filter((path) => /^root\/san\/sutta\/sf\/sf(?:36|276)_root-san\.json$/.test(path));
  const prakritPaths = paths.filter((path) => /^root\/pra\/pts\/sutta\/pdhp\/pdhp\d+-\d+_root-pra-pts\.json$/.test(path));
  requireValue(sanskritPaths.length === 2, "梵文固定 root 文件数漂移");
  requireValue(prakritPaths.length === 22, "俗语固定 root 文件数漂移");
  prakritPaths.sort((a, b) => Number(a.match(/pdhp(\d+)-/)?.[1]) - Number(b.match(/pdhp(\d+)-/)?.[1]));
  workDefinitions.find((work) => work.id === "PDHP").paths = prakritPaths;

  const publicationBytes = await gitBytes("_publication.json");
  const editionBytes = await gitBytes("_edition.json");
  const repositoryLicenseBytes = await gitBytes("LICENSE.md");
  const publications = JSON.parse(publicationBytes.toString("utf8"));
  const editions = JSON.parse(editionBytes.toString("utf8"));
  requireValue(publications.scpub46?.root_lang_iso === "san", "scpub46 梵文出版记录缺失");
  requireValue(publications.scpub46?.license?.license_abbreviation === "CC0", "scpub46 译文许可漂移");
  requireValue(publications.scpub69?.root_lang_iso === "pra", "scpub69 俗语出版记录缺失");
  requireValue(publications.scpub69?.license?.license_abbreviation === "CC BY-SA 3.0", "scpub69 出版许可漂移");
  requireValue(publications.scpub69?.translation_description?.includes("consent of the Pali Text Society"), "scpub69 PTS 同意证据缺失");
  requireValue(editions.sf?.is_root === true && editions.sf?.language === "san", "sf 根本文本版本记录漂移");
  requireValue(editions.pts?.is_root === true && editions.pts?.language === "pra", "pts 根本文本版本记录漂移");

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
  for (const work of workDefinitions) {
    for (const [partIndex, upstreamPath] of work.paths.entries()) {
      const upstream = await gitBytes(upstreamPath);
      const parsed = JSON.parse(upstream.toString("utf8"));
      const entries = Object.entries(parsed);
      const emptyEditorialPlaceholderSegments = entries.filter(([, text]) =>
        /<reference>.*?<\/reference>\s*<root>\s*<\/root>/s.test(text)).length;
      requireValue(entries.length > 0, `${upstreamPath} 没有段落`);
      requireValue(entries.every(([id, text]) => id.startsWith(`${work.sourceId === "pdhp" ? "pdhp" : work.sourceId}`) && typeof text === "string" && text.trim()), `${upstreamPath} 段落结构无效`);
      const local = Buffer.concat([upstream, Buffer.from("\n")]);
      const localPath = `data/corpus/suttacentral/${upstreamPath}`;
      const recordId = upstreamPath.split("/").at(-1).replace(/_root-(?:san|pra-pts)\.json$/, "").toUpperCase();
      const publication = work.id === "PDHP" ? publications.scpub69 : publications.scpub46;
      const rightsStatus = work.id === "PDHP"
        ? "public_domain_root_with_cc_by_sa_3_0_publication_record"
        : "public_domain_root_translation_license_excluded";
      const common = {
        id: recordId,
        workId: work.workId,
        workGroupId: work.id,
        language: work.language,
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
        emptyEditorialPlaceholderSegments,
        segments: entries.length - emptyEditorialPlaceholderSegments,
        rightsStatus,
      };
      records.push({
        ...common,
        publicationNumber: publication.publication_number,
        publicationLicense: publication.license.license_abbreviation,
        publicationLicenseScope: work.id === "PDHP"
          ? "root_publication_record_with_pts_consent_evidence"
          : "translation_only_not_relied_on_for_root",
        sourceEdition: work.edition,
        approvedForFoxueReadingAndRetrieval: true,
        approvedForModelTraining: false,
      });
      batchFiles.push({
        ...common,
        part: partIndex + 1,
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
  }

  const sourceBytes = records.reduce((sum, record) => sum + record.upstreamBytes, 0);
  const stableSegments = records.reduce((sum, record) => sum + record.segments, 0);
  requireValue(records.length === 24, "印度语 root 权利记录数漂移");
  requireValue(sourceBytes === 216385, "印度语 root 上游字节数漂移");
  const recordsRaw = serialize(records);
  const audit = {
    schema: "https://foxue.ai/schemas/gbcr/suttacentral-indic-root-rights-audit-v0.1",
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
      publicationMetadata: { path: "_publication.json", sha256: sha256(publicationBytes) },
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
      decisionNote: "官方许可页把佛教原语文本列为公共领域；foxue.ai 仍保留来源署名并遵守不用于生成式模型训练的内部政策。梵文出版记录的 CC0 仅指译文，不用于证明根本文本权利；俗语出版记录另保存 PTS 同意复制与 CC BY-SA 3.0 证据。",
    },
    publicationEvidence: {
      sanskrit: {
        publicationNumber: "scpub46",
        rootLanguage: "san",
        recordedLicense: "CC0",
        licenseScopeDecision: "translation_only",
        importedTranslation: false,
      },
      prakrit: {
        publicationNumber: "scpub69",
        rootLanguage: "pra",
        recordedLicense: "CC BY-SA 3.0",
        ptsConsentRecorded: true,
        importedTranslation: false,
      },
    },
    summary: {
      filesAudited: records.length,
      filesApprovedForReadingAndRetrieval: records.length,
      filesApprovedForModelTraining: 0,
      sanskritRootFiles: records.filter((record) => record.language === "sa-Latn").length,
      prakritRootFiles: records.filter((record) => record.language === "pra-Latn").length,
      representedWorks: workDefinitions.length,
      sourceBytes,
      stableSegments,
      sourceSegments: records.reduce((sum, record) => sum + record.sourceSegments, 0),
      omittedEmptyEditorialPlaceholderSegments: records.reduce((sum, record) => sum + record.emptyEditorialPlaceholderSegments, 0),
      thirdPartyTranslationFilesImported: 0,
    },
    records,
    integrity: {
      inventorySha256: sha256(recordsRaw),
      sourceBodiesPublished: true,
      translationBodiesPublished: false,
      normalization: "append_single_lf",
    },
    warning: "24 个物理文件只代表三个受控文本表达；不得将文件数当作全球作品数。跨语种平行关系未经人工校勘，不自动合并。",
  };

  const batchWorks = workDefinitions.map((work) => {
    const files = batchFiles.filter((file) => file.workGroupId === work.id);
    return {
      id: work.id,
      sourceId: work.sourceId,
      slug: work.slug,
      workId: work.workId,
      ...(work.textFamilyId ? { textFamilyId: work.textFamilyId } : {}),
      title: work.title,
      titleZh: work.titleZh,
      language: work.language,
      languageZh: work.languageZh,
      tradition: work.tradition,
      canonRef: work.canonRef,
      edition: work.edition,
      sourceUrl: work.sourceUrl,
      summary: work.summary,
      relationDecision: work.relationDecision,
      sourceRecordCount: files.length,
      sourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
      stableSegments: files.reduce((sum, file) => sum + file.segments, 0),
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
      file: `data/gbcr/suttacentral-indic-root-rights-audit-v${version}.json`,
      sha256: sha256(serialize(audit)),
      inventorySha256: audit.integrity.inventorySha256,
    },
    normalization: {
      operation: "append_single_lf",
      contentChange: "none",
      segmentIds: "preserved_verbatim",
      displayOnlyEditorialMarkup: "supplied→方括号，unclear→疑读括号，i→保留文字；来源 JSON 不修改",
    },
    collection: {
      id: "SC-INDIC-ROOTS",
      titleZh: "SuttaCentral 梵文与俗语原文",
      workCount: batchWorks.length,
      expressionCount: batchWorks.length,
      sourceRecordCount: batchFiles.length,
      sourceBytes,
      stableSegments,
      sourceSegments: batchFiles.reduce((sum, file) => sum + file.sourceSegments, 0),
      omittedEmptyEditorialPlaceholderSegments: batchFiles.reduce((sum, file) => sum + file.emptyEditorialPlaceholderSegments, 0),
      workCountingDecision: "sf36、sf276 与 pdhp 分别登记为三个文本表达；pdhp 的 22 个物理分片合并为一个表达。跨语种平行关系不据题名自动合并。",
    },
    works: batchWorks,
    files: batchFiles,
  };
  return { audit, batch };
}

async function verifyLocal(audit, batch) {
  requireValue(audit.version === version, "印度语 root 权利账本版本不一致");
  requireValue(batch.version === batchVersion, "印度语 root 批次版本不一致");
  requireValue(audit.source.commit === sourceCommit && batch.source.commit === sourceCommit, "印度语 root 来源提交不一致");
  requireValue(audit.summary.filesAudited === 24 && batch.files.length === 24, "印度语 root 文件数不一致");
  requireValue(audit.summary.sanskritRootFiles === 2 && audit.summary.prakritRootFiles === 22, "印度语 root 语言分组不一致");
  requireValue(audit.summary.representedWorks === 3 && batch.works.length === 3, "印度语 root 作品数不一致");
  requireValue(audit.summary.sourceBytes === 216385 && batch.collection.sourceBytes === 216385, "印度语 root 字节数不一致");
  requireValue(audit.summary.filesApprovedForModelTraining === 0, "印度语 root 不得批准模型训练");
  requireValue(audit.integrity.translationBodiesPublished === false, "第三方译文不得进入本批次");
  requireValue(batch.rightsAudit.sha256 === sha256(serialize(audit)), "印度语 root 权利账本哈希不一致");
  requireValue(audit.integrity.inventorySha256 === sha256(serialize(audit.records)), "印度语 root 库存哈希不一致");
  const auditByPath = new Map(audit.records.map((record) => [record.upstreamPath, record]));
  for (const file of batch.files) {
    const local = await readFile(resolve(root, file.localPath));
    requireValue(local.length === file.localBytes && sha256(local) === file.localSha256, `${file.id} 本地来源哈希不一致`);
    requireValue(local.at(-1) === 10, `${file.id} 缺少规范化 LF`);
    const upstream = local.subarray(0, -1);
    requireValue(upstream.length === file.upstreamBytes, `${file.id} 上游字节无法还原`);
    requireValue(sha256(upstream) === file.upstreamSha256, `${file.id} 上游 SHA-256 无法还原`);
    requireValue(gitBlobSha1(upstream) === file.upstreamGitBlobSha1, `${file.id} Git blob 无法还原`);
    const parsed = JSON.parse(upstream.toString("utf8"));
    const entries = Object.entries(parsed);
    requireValue(entries.length === file.sourceSegments, `${file.id} 来源段落数不一致`);
    const emptyEditorialPlaceholderSegments = entries.filter(([, text]) =>
      /<reference>.*?<\/reference>\s*<root>\s*<\/root>/s.test(text)).length;
    requireValue(entries.length - emptyEditorialPlaceholderSegments === file.segments, `${file.id} 可读段落数不一致`);
    requireValue(entries[0]?.[0] === file.firstSegmentId && entries.at(-1)?.[0] === file.lastSegmentId, `${file.id} 首尾锚点不一致`);
    const audited = auditByPath.get(file.upstreamPath);
    requireValue(audited?.upstreamGitBlobSha1 === file.upstreamGitBlobSha1, `${file.id} 权利记录与批次不一致`);
  }
  requireValue(batch.files.reduce((sum, file) => sum + file.segments, 0) === batch.collection.stableSegments, "印度语 root 稳定段落合计不一致");
}

if (writeMode) {
  const { audit, batch } = await buildFromSource();
  await writeFile(auditPath, serialize(audit), "utf8");
  await writeFile(batchPath, serialize(batch), "utf8");
  await verifyLocal(audit, batch);
  console.log(`SuttaCentral 印度语 root 权利批次已生成：24/24 份原文获准阅读与有来源检索，3 个文本表达，${batch.collection.stableSegments} 个稳定段落；0 份译文、0 份模型训练授权。`);
} else {
  const audit = JSON.parse(await readFile(auditPath, "utf8"));
  const batch = JSON.parse(await readFile(batchPath, "utf8"));
  await verifyLocal(audit, batch);
  console.log(`SuttaCentral 印度语 root 权利批次验证通过：2 份梵文、22 份俗语，${batch.collection.sourceBytes} 字节，未导入第三方译文。`);
}
