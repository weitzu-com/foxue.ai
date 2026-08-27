import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import {
  parseBilaraAnguttaraSources,
  parseBilaraDhammapadaSources,
  parseBilaraSamyuttaSources,
  parseBilaraSuttaSource,
} from "../src/lib/bilara-reading.mjs";

const root = process.cwd();
const version = "1.0.0";
const commit = "eac6c24781dd1eefdc17dc2f787b54bf6fe31719";
const repository = "suttacentral/bilara-data";
const verifyMode = process.argv.includes("--verify");
const execFileAsync = promisify(execFile);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

const publications = {
  dn: { number: "scpub2", collectionTitle: "Long Discourses" },
  mn: { number: "scpub3", collectionTitle: "Middle Discourses" },
  sn: { number: "scpub4", collectionTitle: "Linked Discourses" },
  an: { number: "scpub5", collectionTitle: "Numbered Discourses" },
  dhp: { number: "scpub7", collectionTitle: "Sayings of the Dhamma" },
};

const nikayaMeta = {
  dn: {
    id: "DN",
    titleZh: "长部",
    slugPrefix: "digha-nikaya",
    groupLabel: "经",
    parser: "bilara_single_root_json",
    expectedRecords: 34,
    expectedExpressions: 34,
  },
  mn: {
    id: "MN",
    titleZh: "中部",
    slugPrefix: "majjhima-nikaya",
    groupLabel: "经",
    parser: "bilara_single_root_json",
    expectedRecords: 152,
    expectedExpressions: 152,
  },
  sn: {
    id: "SN",
    titleZh: "相应部",
    slugPrefix: "samyutta-nikaya",
    groupLabel: "相应",
    parser: "bilara_collection_root_json",
    expectedRecords: 1819,
    expectedExpressions: 56,
  },
  an: {
    id: "AN",
    titleZh: "增支部",
    slugPrefix: "anguttara-nikaya",
    groupLabel: "集",
    parser: "bilara_collection_root_json",
    expectedRecords: 1408,
    expectedExpressions: 11,
  },
};

const batchPath = `data/corpus/suttacentral/sujato-en-batch-v${version}.json`;
const catalogPath = `data/corpus/suttacentral/sujato-en-catalog-v${version}.json`;
const manifestPath = `data/corpus/suttacentral/sujato-en-manifest-v${version}.json`;
const ledgerPath = `data/gbcr/suttacentral-sujato-en-ingest-v${version}.json`;
const rightsPath = `data/gbcr/suttacentral-sujato-en-rights-audit-v${version}.json`;

const curl = async (url, maxBuffer = 4 * 1024 * 1024) => {
  const { stdout } = await execFileAsync(
    "curl",
    ["-4", "-fsSL", "--retry", "4", "--retry-all-errors", "--connect-timeout", "15", "--max-time", "120", url],
    { encoding: null, maxBuffer },
  );
  return stdout;
};

const mapPool = async (items, concurrency, mapper) => {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
};

const paliBatches = {
  dn: JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/dn-batch-v0.8.0.json"), "utf8")),
  mn: JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/mn-batch-v0.9.0.json"), "utf8")),
  sn: JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/sn-batch-v1.0.0.json"), "utf8")),
  an: JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/an-batch-v1.1.0.json"), "utf8")),
  dhp: JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json"), "utf8")),
};

for (const [id, expected] of [["dn", 34], ["mn", 152], ["sn", 1819], ["an", 1408]]) {
  if (paliBatches[id].source.commit !== commit) throw new Error(`${id} 巴利批次提交与本切入固定提交不一致`);
  if (paliBatches[id].files.length !== expected) throw new Error(`${id} 巴利批次记录数漂移`);
}
if (paliBatches.dhp.source.commit !== commit || paliBatches.dhp.files.length !== 26) {
  throw new Error("法句巴利批次与本切入固定提交不一致");
}

const licenseBytes = await curl(`https://raw.githubusercontent.com/${repository}/${commit}/LICENSE.md`);
const publicationBytes = await curl(`https://raw.githubusercontent.com/${repository}/${commit}/_publication.json`);
const publication = JSON.parse(publicationBytes.toString("utf8"));
const requiredPubs = ["scpub2", "scpub3", "scpub4", "scpub5", "scpub7"];
for (const pubId of requiredPubs) {
  const pub = publication[pubId];
  if (
    !pub ||
    pub.author_uid !== "sujato" ||
    pub.translation_lang_iso !== "en" ||
    pub.is_published !== true ||
    pub.license?.license_abbreviation !== "CC0"
  ) {
    throw new Error(`${pubId} 不是已出版的 Sujato CC0 英文出版记录`);
  }
}
for (const refused of ["scpub8", "scpub1", "scpub6"]) {
  if (!publication[refused]) throw new Error(`缺少对照出版记录 ${refused}`);
}
if (!licenseBytes.toString("utf8").includes("Creative Commons Public Domain (CC0)")) {
  throw new Error("Bilara LICENSE.md 缺少 CC0 声明");
}

const candidates = [];
for (const nikaya of ["dn", "mn", "sn", "an"]) {
  for (const file of paliBatches[nikaya].files) {
    const upstreamPath = file.upstreamPath.replace(
      /^root\/pli\/ms\//,
      "translation/en/sujato/",
    ).replace(/_root-pli-ms\.json$/, "_translation-en-sujato.json");
    candidates.push({
      nikaya,
      pali: file,
      upstreamPath,
      localPath: `data/corpus/suttacentral/${upstreamPath}`,
    });
  }
}
for (const file of paliBatches.dhp.files) {
  const upstreamPath = file.upstreamPath.replace(
    /^root\/pli\/ms\//,
    "translation/en/sujato/",
  ).replace(/_root-pli-ms\.json$/, "_translation-en-sujato.json");
  candidates.push({
    nikaya: "dhp",
    pali: file,
    upstreamPath,
    localPath: `data/corpus/suttacentral/${upstreamPath}`,
  });
}
if (candidates.length !== 3439) throw new Error(`应对齐 3439 个已持有巴利记录，实际 ${candidates.length}`);

const fetched = await mapPool(candidates, verifyMode ? 8 : 12, async (candidate) => {
  let normalized;
  try {
    const existing = await readFile(resolve(root, candidate.localPath));
    if (existing.at(-1) !== 10) throw new Error(`${candidate.localPath} 缺少规范化换行`);
    normalized = existing;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    if (verifyMode) throw new Error(`${candidate.localPath} 缺失`);
    const url = `https://raw.githubusercontent.com/${repository}/${commit}/${candidate.upstreamPath}`;
    const upstreamBytes = await curl(url);
    normalized = Buffer.concat([upstreamBytes, Buffer.from("\n")]);
  }
  const upstream = normalized.subarray(0, -1);
  const parsed = JSON.parse(upstream.toString("utf8"));
  const keys = Object.keys(parsed);
  if (keys.length === 0) throw new Error(`${candidate.upstreamPath} 没有段落`);
  return {
    ...candidate,
    upstream,
    normalized,
    parsed,
    firstSegmentId: keys[0],
    lastSegmentId: keys.at(-1),
    sourceSegments: keys.length,
    emptySegmentIds: keys.filter((id) => typeof parsed[id] === "string" && !parsed[id].trim()),
  };
});

const batchFiles = fetched.map((file) => {
  const pali = file.pali;
  const nikaya = file.nikaya;
  const publication = publications[nikaya];
  const grouped = nikaya === "sn" || nikaya === "an";
  const id = nikaya === "dhp" ? `EN-${pali.id.toUpperCase()}` : `EN-${pali.id}`;
  return {
    id,
    suttaId: pali.suttaId ?? pali.id,
    groupId: grouped ? pali.groupId : nikaya === "dhp" ? "DHP" : pali.id,
    groupNumber: pali.groupNumber ?? null,
    representedSuttas: pali.representedSuttas ?? 1,
    slug: nikaya === "dhp"
      ? "suttacentral-en-dhp"
      : grouped
        ? `suttacentral-en-${nikaya}${pali.groupNumber}`
        : `suttacentral-en-${pali.suttaId}`,
    workId: nikaya === "dhp" ? "gbcr:work:dhammapada-pali" : pali.workId,
    attachToExistingWork: true,
    language: "en",
    parser: nikaya === "dhp"
      ? "bilara_root_json"
      : grouped
        ? "bilara_collection_root_json"
        : "bilara_single_root_json",
    format: "application/json",
    sourceRole: "sujato_english_translation_expression",
    publicationNumber: publication.number,
    titleEn: nikaya === "dhp"
      ? file.parsed[`dhp${pali.verseRange[0]}:0.3`]?.trim() ?? publication.collectionTitle
      : file.parsed[`${pali.suttaId}:0.2`]?.trim()
        || file.parsed[`${pali.suttaId}:0.3`]?.trim()
        || publication.collectionTitle,
    tradition: "上座部佛教",
    edition: "Bhikkhu Sujato, SuttaCentral / Bilara published snapshot",
    sourceUrl: nikaya === "dhp"
      ? "https://suttacentral.net/dhp/en/sujato"
      : `https://suttacentral.net/${pali.suttaId}/en/sujato`,
    localPath: file.localPath,
    upstreamPath: file.upstreamPath,
    upstreamGitBlobSha1: gitBlobSha1(file.upstream),
    upstreamBytes: file.upstream.length,
    upstreamSha256: sha256(file.upstream),
    localBytes: file.normalized.length,
    localSha256: sha256(file.normalized),
    firstSegmentId: file.firstSegmentId,
    lastSegmentId: file.lastSegmentId,
    sourceSegments: file.sourceSegments,
    emptySegmentIds: file.emptySegmentIds,
  };
});

if (!verifyMode) {
  await mapPool(fetched, 8, async (file) => {
    const destination = resolve(root, file.localPath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.normalized);
  });
} else {
  for (const file of fetched) {
    const local = await readFile(resolve(root, file.localPath));
    if (!local.equals(file.normalized)) throw new Error(`${file.localPath} 与固定上游规范化字节不一致`);
  }
}

function readingForGroup(nikaya, groupFiles) {
  const sources = groupFiles.map((file) => ({
    filename: file.localPath.split("/").at(-1),
    text: fetched.find((item) => item.localPath === file.localPath).upstream.toString("utf8"),
  }));
  if (nikaya === "dhp") return parseBilaraDhammapadaSources(sources);
  if (nikaya === "sn") return parseBilaraSamyuttaSources(sources);
  if (nikaya === "an") return parseBilaraAnguttaraSources(sources);
  if (groupFiles.length !== 1) throw new Error(`${nikaya} 单经分组异常`);
  return parseBilaraSuttaSource(sources[0]);
}

const filesByExpression = new Map();
for (const file of batchFiles) {
  const key = file.slug;
  const group = filesByExpression.get(key) ?? [];
  group.push(file);
  filesByExpression.set(key, group);
}

const catalogFiles = [];
for (const [slug, groupFiles] of filesByExpression) {
  const first = groupFiles[0];
  const nikaya = first.publicationNumber === "scpub7"
    ? "dhp"
    : first.suttaId.replace(/\d.*$/, "");
  const isGrouped = nikaya === "sn" || nikaya === "an";
  const reading = readingForGroup(nikaya, groupFiles);
  const pub = publications[nikaya];
  const meta = nikaya === "dhp"
    ? { id: "DHP", titleZh: "法句", groupLabel: "品", expectedExpressions: 1 }
    : nikayaMeta[nikaya];
  const title = nikaya === "dhp"
    ? "法句经（Sujato 英译）"
    : groupedTitle(nikaya, first, reading);
  const sourceParts = groupFiles.map((file, index) => ({
    part: index + 1,
    id: file.id,
    format: file.format,
    localPath: file.localPath,
    upstreamPath: file.upstreamPath,
    upstreamGitBlobSha1: file.upstreamGitBlobSha1,
    upstreamBytes: file.upstreamBytes,
    upstreamSha256: file.upstreamSha256,
    localBytes: file.localBytes,
    localSha256: file.localSha256,
    firstSegmentId: file.firstSegmentId,
    lastSegmentId: file.lastSegmentId,
    representedSuttas: file.representedSuttas,
    sourceSegments: file.sourceSegments,
    segments: groupFiles.length === 1
      ? reading.segments.length
      : undefined,
    ...(file.emptySegmentIds.length ? { emptySegmentIds: file.emptySegmentIds } : {}),
  }));
  catalogFiles.push({
    id: nikaya === "dhp" ? "EN-DHP" : isGrouped ? `EN-${first.groupId}` : first.id,
    slug,
    workId: first.workId,
    attachToExistingWork: true,
    sourceRole: "sujato_english_translation_expression",
    canonicalStatus: "pali_sutta_sujato_english_translation",
    buddhaWordStatus: "translation_not_verbatim_authorship_claim",
    language: "en",
    parser: first.parser,
    format: "application/json",
    completeness: "complete",
    publicationNumber: first.publicationNumber,
    ...(groupFiles.length === 1 && nikaya !== "dhp"
      ? {
          localPath: first.localPath,
          upstreamPath: first.upstreamPath,
          upstreamGitBlobSha1: first.upstreamGitBlobSha1,
          upstreamBytes: first.upstreamBytes,
          upstreamSha256: first.upstreamSha256,
          localBytes: first.localBytes,
          localSha256: first.localSha256,
          firstSegmentId: first.firstSegmentId,
          lastSegmentId: first.lastSegmentId,
        }
      : { sourceParts }),
    bibliographicRelations: [
      {
        type: "same_work_translation_group_verified",
        groupId: slug,
        label: `Sujato 英译／${title}`,
        evidence: `Bilara published ${commit} translation/en/sujato 对应已持有巴利作品 ${first.workId}；挂接既有作品，不新建作品。出版记录 ${first.publicationNumber} 为 CC0。`,
        externalIds: {
          suttacentral: [nikaya === "dhp" ? "dhp" : first.groupId?.toLowerCase() ?? first.suttaId],
        },
      },
    ],
    presentation: {
      title,
      alternateTitle: reading.title ?? pub.collectionTitle,
      tradition: "上座部佛教",
      language: "英文",
      canonRef: nikaya === "dhp"
        ? "SuttaCentral Dhp · Sujato EN"
        : `SuttaCentral ${first.groupId ?? first.id.replace(/^EN-/, "")} · Sujato EN`,
      translator: "Bhikkhu Sujato",
      summary: nikaya === "dhp"
        ? "Bhikkhu Sujato CC0 英译《法句经》。挂接已持有巴利法句，不另建作品。Bilara published 固定提交；保留原生段落标识；不用于生成式模型训练。"
        : `Bhikkhu Sujato CC0 英译巴利《${meta.titleZh}》。挂接已持有巴利作品，不另建作品。Bilara published 固定提交 ${commit}；保留原生段落标识；不用于生成式模型训练。`,
      sourceUrl: first.sourceUrl,
    },
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      sourceRecords: groupFiles.length,
      representedSuttas: groupFiles.reduce((sum, file) => sum + file.representedSuttas, 0),
      omittedEmptySegmentIds: reading.omittedEmptySegmentIds ?? [],
      anchors: [reading.segments[0].id, reading.segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

function groupedTitle(nikaya, first, reading) {
  const meta = nikayaMeta[nikaya];
  if (nikaya === "sn" || nikaya === "an") {
    return `${meta.titleZh}第 ${first.groupNumber} ${meta.groupLabel}（Sujato 英译）`;
  }
  const number = first.suttaId.replace(/^[a-z]+/, "");
  return `${meta.titleZh}第 ${number} 经（Sujato 英译）`;
}

catalogFiles.sort((left, right) => left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0);

const expectedExpressionCount = 34 + 152 + 56 + 11 + 1;
if (catalogFiles.length !== expectedExpressionCount) {
  throw new Error(`表达数应为 ${expectedExpressionCount}，实际 ${catalogFiles.length}`);
}
if (new Set(catalogFiles.map((file) => file.workId)).size !== expectedExpressionCount) {
  throw new Error("Sujato 英译必须一对一挂接已持有巴利作品");
}
if (catalogFiles.some((file) => !file.attachToExistingWork)) {
  throw new Error("Sujato 英译不得新建作品");
}

const rightsDecision = {
  status: "approved_cc0_sujato_bilara_translations_no_training",
  sourceTexts: "cc0_public_domain_dedication",
  translations: "cc0_by_publication_record",
  attributionRequested: true,
  trainingUse: "prohibited_by_suttacentral_and_foxue_policy",
  filesApprovedForModelTraining: 0,
  summary: "Bilara LICENSE.md 与 scpub2/3/4/5/7 出版记录将 Sujato 英译奉献为 CC0。foxue.ai 仅用于阅读、研究与有来源检索，不把这些文件标为训练许可。",
};

const batch = {
  schema: "https://foxue.ai/schemas/corpus-source-batch-v0.2",
  version,
  source: {
    id: "suttacentral_bilara_sujato_en",
    name: "SuttaCentral Bilara Sujato English",
    repository,
    commit,
    branchSemantics: "published",
    homepage: "https://suttacentral.net/",
    licenseUrl: "https://suttacentral.net/licensing",
    repositoryLicenseUrl: `https://github.com/${repository}/blob/${commit}/LICENSE.md`,
  },
  rightsDecision,
  normalization: {
    operation: "append_single_lf",
    contentChange: "none",
    segmentIds: "preserved_verbatim",
    editorialMarkup: "em_and_i_unwrapped_for_display",
    emptyTranslationSegments: "omitted_from_reading_kept_in_source_hash",
  },
  collection: {
    id: "SUJATO-EN",
    canonicalTitle: "Bhikkhu Sujato English Nikāya translations",
    titleZh: "Sujato 英译四部与法句",
    tradition: "上座部佛教",
    language: "en",
    recordCount: batchFiles.length,
    expressionCount: catalogFiles.length,
    newWorks: 0,
    attachedExistingWorks: catalogFiles.length,
    sourceBytes: batchFiles.reduce((sum, file) => sum + file.upstreamBytes, 0),
    stableSegments: catalogFiles.reduce((sum, file) => sum + file.verification.segments, 0),
    workCountingDecision: "254 existing Pali works; 3,439 physical translation records tracked separately",
  },
  files: batchFiles,
};

const catalog = {
  schema: "https://foxue.ai/schemas/suttacentral-sujato-en-catalog-v0.1",
  version,
  publishedAt: "2026-08-27",
  source: batch.source,
  rightsDecision,
  normalization: batch.normalization,
  collection: batch.collection,
  files: catalogFiles,
};

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.5",
  version,
  source: batch.source,
  rightsDecision,
  normalization: batch.normalization,
  collection: batch.collection,
  files: catalogFiles,
};

const ledger = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-sujato-en-ingest-v0.1",
  version,
  generatedAt: "2026-08-27",
  cut: "first_principles_sujato_cc0_english",
  ingest: {
    title: "Bhikkhu Sujato CC0 English Nikāya translations",
    translator: "Bhikkhu Sujato",
    source: "SuttaCentral / Bilara published snapshot",
    commit,
    publicationNumbers: requiredPubs,
    newWorks: 0,
    newExpressions: catalogFiles.length,
    completeTexts: catalogFiles.length,
    sourceRecords: batchFiles.length,
    attachedExistingWorks: catalogFiles.length,
    collections: {
      dn: { expressions: 34, sourceRecords: 34, publication: "scpub2" },
      mn: { expressions: 152, sourceRecords: 152, publication: "scpub3" },
      sn: { expressions: 56, sourceRecords: 1819, publication: "scpub4" },
      an: { expressions: 11, sourceRecords: 1408, publication: "scpub5" },
      dhp: { expressions: 1, sourceRecords: 26, publication: "scpub7", workId: "gbcr:work:dhammapada-pali" },
    },
    globalCoverage: null,
    dualHumanReview: 0,
    filesApprovedForModelTraining: 0,
    mapping: "Each Sujato file attaches to the already-registered Pali work of the same SuttaCentral uid. SN/AN stay grouped as 56+11 works. Dhp English attaches to gbcr:work:dhammapada-pali, the same work-family as the 1918 國譯法句經.",
    rights: {
      license: "CC0 1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      quotedFromLicenseMd: "All translations created in Bilara and supported by SuttaCentral are dedicated to the Public Domain by means of the Creative Commons Public Domain (CC0) license.",
      attribution: "Bhikkhu Sujato, SuttaCentral / Bilara published snapshot",
      training: "SuttaCentral asks that its data not be used for generative-model training. Display/retrieval on foxue.ai is allowed. filesApprovedForModelTraining remains 0.",
    },
  },
  refusals: [
    {
      id: "dsbc_sanskrit_body",
      result: "refused_not_license_clean",
      source: "https://www.dsbcproject.org/pages/usage-policy",
      quoted: [
        "These e-texts are provided for review, indexing and word search purposes only.",
        "Reproduction of DSBC contents without permission is prohibited.",
      ],
      note: "The 2026-08 report claimed DSBC is license-clean / direct ingest. That claim is false. University of the West holds rights in compilation, indexing, and transliteration. This cut does not ingest DSBC bodies.",
    },
    {
      id: "gretil_mirror",
      result: "already_zero_mirror_still_refused",
      note: "GRETIL remains 0-mirror in site GBCR. This cut does not start a GRETIL body ingest.",
    },
    {
      id: "brahmali_vinaya",
      result: "skipped_not_fosuo_jing_this_cut",
      publication: "scpub8",
      note: "Bhikkhu Brahmali Vinaya is 律, not 佛说经 this cut.",
    },
    {
      id: "legacy_suttacentral_mixed_license_translations",
      result: "skipped_not_cc0_sujato_publication",
      note: "Only Bilara translation/en/sujato files whose publication record is CC0 / sujato are ingested. Legacy SC translations with mixed licenses are not imported.",
    },
    {
      id: "sujato_kn_beyond_dhammapada",
      result: "ledgered_next_cut",
      note: "Held KN Sujato books beyond Dhp (iti, snp, ud, kp, cp) remain for a later cut. thag/thig are sujato-walton collaborations and stay out. ja is incomplete in this snapshot.",
    },
    {
      id: "dual_human_review",
      result: "left_zero",
      note: "Dual-human review stays 0/80. This cut is a code ingest, not a staffing change.",
    },
    {
      id: "global_coverage_claim",
      result: "left_null",
      note: "Do not claim 99.9%. Global coverage percent stays null.",
    },
  ],
  caveat: "本总帐只证明 254 份 Sujato CC0 英译被挂接为既有巴利作品的新表达。它不构成全球佛陀亲说覆盖率，也不批准把 SuttaCentral 文本用于生成式模型训练。",
};

const rightsAudit = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-sujato-en-rights-audit-v0.1",
  version,
  capturedAt: "2026-08-27",
  status: "approved_cc0_sujato_translations_no_training_import",
  source: {
    repository,
    commit,
    branchSemantics: "published",
    licensingUrl: "https://suttacentral.net/licensing",
    repositoryLicense: {
      path: "LICENSE.md",
      sha256: sha256(licenseBytes),
      quoted: "All translations created in Bilara and supported by SuttaCentral are dedicated to the Public Domain by means of the Creative Commons Public Domain (CC0) license.",
    },
    publicationMetadata: {
      path: "_publication.json",
      sha256: sha256(publicationBytes),
    },
  },
  rightsDecision,
  publicationEvidence: Object.fromEntries(requiredPubs.map((pubId) => {
    const pub = publication[pubId];
    return [pub.text_uid, {
      publicationNumber: pubId,
      authorUid: pub.author_uid,
      authorName: pub.author_name,
      translationLanguage: pub.translation_lang_iso,
      recordedLicense: pub.license.license_abbreviation,
      licenseUrl: pub.license.license_url,
      isPublished: pub.is_published,
      importedTranslation: true,
    }];
  })),
  summary: {
    filesAudited: batchFiles.length,
    filesApprovedForReadingAndRetrieval: batchFiles.length,
    filesApprovedForModelTraining: 0,
    expressions: catalogFiles.length,
    attachedExistingWorks: catalogFiles.length,
    newWorks: 0,
    thirdPartyNonSujatoTranslationFilesImported: 0,
    brahmaliVinayaFilesImported: 0,
    dsbcFilesImported: 0,
    gretilFilesMirrored: 0,
  },
};

const outputs = [
  [batchPath, jsonRaw(batch)],
  [catalogPath, jsonRaw(catalog)],
  [manifestPath, jsonRaw(manifest)],
  [ledgerPath, jsonRaw(ledger)],
  [rightsPath, jsonRaw(rightsAudit)],
];

if (verifyMode) {
  for (const [path, expected] of outputs) {
    if (await readFile(resolve(root, path), "utf8") !== expected) {
      throw new Error(`${path} 不可复现`);
    }
  }
  console.log(`Sujato CC0 英译可复现：${catalogFiles.length} 个表达、${batchFiles.length} 个物理记录、0 个新作品；训练许可 0。`);
} else {
  for (const [path, raw] of outputs) {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), raw);
  }
  console.log(`Sujato CC0 英译已写入：${catalogFiles.length} 个表达挂接 ${catalogFiles.length} 部既有巴利作品；${batchFiles.length} 个物理记录。`);
}
