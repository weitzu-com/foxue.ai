import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { parseBilaraSeriesSources } from "../src/lib/bilara-reading.mjs";

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

const bookMeta = {
  iti: {
    id: "ITI",
    titleZh: "如是语",
    workId: "gbcr:work:khuddaka-nikaya-iti-pali",
    publication: "scpub16",
    expectedRecords: 112,
  },
  snp: {
    id: "SNP",
    titleZh: "经集",
    workId: "gbcr:work:khuddaka-nikaya-snp-pali",
    publication: "scpub17",
    expectedRecords: 73,
  },
  ud: {
    id: "UD",
    titleZh: "自说",
    workId: "gbcr:work:khuddaka-nikaya-ud-pali",
    publication: "scpub18",
    expectedRecords: 80,
  },
  kp: {
    id: "KP",
    titleZh: "小诵",
    workId: "gbcr:work:khuddaka-nikaya-kp-pali",
    publication: "scpub19",
    expectedRecords: 9,
  },
  cp: {
    id: "CP",
    titleZh: "所行藏",
    workId: "gbcr:work:khuddaka-nikaya-cp-pali",
    publication: "scpub86",
    expectedRecords: 35,
  },
};
const attachedPrefixes = Object.keys(bookMeta);
const requiredPubs = attachedPrefixes.map((prefix) => bookMeta[prefix].publication);
const expectedSourceRecords = attachedPrefixes.reduce((sum, prefix) => sum + bookMeta[prefix].expectedRecords, 0);

const batchPath = `data/corpus/suttacentral/sujato-en-kn-batch-v${version}.json`;
const catalogPath = `data/corpus/suttacentral/sujato-en-kn-catalog-v${version}.json`;
const manifestPath = `data/corpus/suttacentral/sujato-en-kn-manifest-v${version}.json`;
const ledgerPath = `data/gbcr/suttacentral-sujato-en-kn-ingest-v${version}.json`;
const rightsPath = `data/gbcr/suttacentral-sujato-en-kn-rights-audit-v${version}.json`;

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

const knBatch = JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/kn-batch-v1.2.0.json"), "utf8"));
if (knBatch.source.commit !== commit) throw new Error("小部巴利批次提交与本切入固定提交不一致");

const paliFiles = knBatch.files.filter((file) => attachedPrefixes.includes(file.collectionId.toLowerCase()));
for (const prefix of attachedPrefixes) {
  const count = paliFiles.filter((file) => file.collectionId.toLowerCase() === prefix).length;
  if (count !== bookMeta[prefix].expectedRecords) {
    throw new Error(`${prefix} 已持有巴利记录应为 ${bookMeta[prefix].expectedRecords}，实际 ${count}`);
  }
  const workIds = new Set(paliFiles.filter((file) => file.collectionId.toLowerCase() === prefix).map((file) => file.workId));
  if (workIds.size !== 1 || !workIds.has(bookMeta[prefix].workId)) {
    throw new Error(`${prefix} 未一对一挂接已登记作品 ${bookMeta[prefix].workId}`);
  }
}
if (paliFiles.length !== expectedSourceRecords) {
  throw new Error(`应对齐 ${expectedSourceRecords} 个已持有小部记录，实际 ${paliFiles.length}`);
}

const licenseBytes = await curl(`https://raw.githubusercontent.com/${repository}/${commit}/LICENSE.md`);
const publicationBytes = await curl(`https://raw.githubusercontent.com/${repository}/${commit}/_publication.json`);
const publication = JSON.parse(publicationBytes.toString("utf8"));
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
for (const [refused, expectedAuthor] of [["scpub1", "sujato-walton"], ["scpub6", "sujato-walton"], ["scpub8", "brahmali"]]) {
  if (publication[refused]?.author_uid !== expectedAuthor) throw new Error(`缺少对照出版记录 ${refused}`);
}
if (!licenseBytes.toString("utf8").includes("Creative Commons Public Domain (CC0)")) {
  throw new Error("Bilara LICENSE.md 缺少 CC0 声明");
}

const candidates = paliFiles.map((file) => {
  const prefix = file.collectionId.toLowerCase();
  const upstreamPath = file.upstreamPath.replace(
    /^root\/pli\/ms\//,
    "translation/en/sujato/",
  ).replace(/_root-pli-ms\.json$/, "_translation-en-sujato.json");
  return {
    prefix,
    pali: file,
    upstreamPath,
    localPath: `data/corpus/suttacentral/${upstreamPath}`,
  };
});

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

const batchFiles = fetched.map((file) => {
  const prefix = file.prefix;
  const meta = bookMeta[prefix];
  const pub = publication[meta.publication];
  return {
    id: `EN-${file.pali.id}`,
    recordId: file.pali.recordId,
    collectionId: meta.id,
    slug: `suttacentral-en-${prefix}`,
    workId: meta.workId,
    attachToExistingWork: true,
    language: "en",
    parser: "bilara_series_root_json",
    format: "application/json",
    sourceRole: "sujato_english_translation_expression",
    publicationNumber: meta.publication,
    titleEn: pub.translation_title,
    tradition: "上座部佛教",
    edition: "Bhikkhu Sujato, SuttaCentral / Bilara published snapshot",
    sourceUrl: `https://suttacentral.net/${file.pali.recordId}/en/sujato`,
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

const filesByExpression = new Map();
for (const file of batchFiles) {
  const group = filesByExpression.get(file.slug) ?? [];
  group.push(file);
  filesByExpression.set(file.slug, group);
}

const catalogFiles = [];
for (const prefix of attachedPrefixes) {
  const slug = `suttacentral-en-${prefix}`;
  const groupFiles = filesByExpression.get(slug);
  if (!groupFiles || groupFiles.length !== bookMeta[prefix].expectedRecords) {
    throw new Error(`${prefix} 表达缺少已持有巴利记录`);
  }
  const meta = bookMeta[prefix];
  const pub = publication[meta.publication];
  const sources = groupFiles.map((file) => ({
    filename: file.localPath.split("/").at(-1),
    text: fetched.find((item) => item.localPath === file.localPath).upstream.toString("utf8"),
  }));
  const reading = parseBilaraSeriesSources(sources, {
    collectionPrefix: prefix,
    collectionTitle: pub.translation_title,
    omitEmptySegments: true,
  });
  const title = `${meta.titleZh}（Sujato 英译）`;
  catalogFiles.push({
    id: `EN-${meta.id}`,
    slug,
    workId: meta.workId,
    attachToExistingWork: true,
    sourceRole: "sujato_english_translation_expression",
    canonicalStatus: "pali_sutta_sujato_english_translation",
    buddhaWordStatus: "translation_not_verbatim_authorship_claim",
    language: "en",
    parser: "bilara_series_root_json",
    parserOptions: {
      collectionPrefix: prefix,
      collectionTitle: pub.translation_title,
      omitEmptySegments: true,
    },
    format: "application/json",
    completeness: "complete",
    publicationNumber: meta.publication,
    sourceParts: groupFiles.map((file, index) => ({
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
      sourceSegments: file.sourceSegments,
      ...(file.emptySegmentIds.length ? { emptySegmentIds: file.emptySegmentIds } : {}),
    })),
    bibliographicRelations: [
      {
        type: "same_work_translation_group_verified",
        groupId: slug,
        label: `Sujato 英译／${title}`,
        evidence: `Bilara published ${commit} translation/en/sujato 对应已持有巴利作品 ${meta.workId}；挂接既有作品，不新建作品。出版记录 ${meta.publication} 为 CC0。`,
        externalIds: {
          suttacentral: [prefix],
        },
      },
    ],
    presentation: {
      title,
      alternateTitle: reading.title ?? pub.translation_title,
      tradition: "上座部佛教",
      language: "英文",
      canonRef: `SuttaCentral ${meta.id} · Sujato EN`,
      translator: "Bhikkhu Sujato",
      summary: `Bhikkhu Sujato CC0 英译巴利《${meta.titleZh}》。挂接已持有巴利作品，不另建作品。Bilara published 固定提交 ${commit}；保留原生段落标识；不用于生成式模型训练。`,
      sourceUrl: `https://suttacentral.net/${prefix}/en/sujato`,
    },
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      sourceRecords: groupFiles.length,
      omittedEmptySegmentIds: reading.omittedEmptySegmentIds ?? [],
      anchors: [reading.segments[0].id, reading.segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

if (catalogFiles.length !== attachedPrefixes.length) {
  throw new Error(`表达数应为 ${attachedPrefixes.length}，实际 ${catalogFiles.length}`);
}
if (new Set(catalogFiles.map((file) => file.workId)).size !== attachedPrefixes.length) {
  throw new Error("Sujato 小部英译必须一对一挂接已持有巴利作品");
}
if (catalogFiles.some((file) => !file.attachToExistingWork)) {
  throw new Error("Sujato 小部英译不得新建作品");
}

const rightsDecision = {
  status: "approved_cc0_sujato_bilara_translations_no_training",
  sourceTexts: "cc0_public_domain_dedication",
  translations: "cc0_by_publication_record",
  attributionRequested: true,
  trainingUse: "prohibited_by_suttacentral_and_foxue_policy",
  filesApprovedForModelTraining: 0,
  summary: "Bilara LICENSE.md 与 scpub16/17/18/19/86 出版记录将 Sujato 小部英译奉献为 CC0。foxue.ai 仅用于阅读、研究与有来源检索，不把这些文件标为训练许可。",
};

const collections = Object.fromEntries(attachedPrefixes.map((prefix) => {
  const file = catalogFiles.find((item) => item.slug === `suttacentral-en-${prefix}`);
  return [prefix, {
    expressions: 1,
    sourceRecords: file.verification.sourceRecords,
    publication: bookMeta[prefix].publication,
    workId: bookMeta[prefix].workId,
    uid: prefix,
  }];
}));

const batch = {
  schema: "https://foxue.ai/schemas/corpus-source-batch-v0.2",
  version,
  source: {
    id: "suttacentral_bilara_sujato_en_kn",
    name: "SuttaCentral Bilara Sujato English Khuddaka",
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
    id: "SUJATO-EN-KN",
    canonicalTitle: "Bhikkhu Sujato English Khuddaka translations",
    titleZh: "Sujato 英译已持有小部五书",
    tradition: "上座部佛教",
    language: "en",
    recordCount: batchFiles.length,
    expressionCount: catalogFiles.length,
    newWorks: 0,
    attachedExistingWorks: catalogFiles.length,
    sourceBytes: batchFiles.reduce((sum, file) => sum + file.upstreamBytes, 0),
    stableSegments: catalogFiles.reduce((sum, file) => sum + file.verification.segments, 0),
    workCountingDecision: "5 existing Pali KN book-level works; physical translation records tracked separately",
  },
  files: batchFiles,
};

const catalog = {
  schema: "https://foxue.ai/schemas/suttacentral-sujato-en-kn-catalog-v0.1",
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
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-sujato-en-kn-ingest-v0.1",
  version,
  generatedAt: "2026-08-27",
  cut: "first_principles_sujato_cc0_english_held_kn",
  pin: {
    repository,
    commit,
    note: "Same Bilara published snapshot as #79. Still valid for scpub16/17/18/19/86 on 2026-08-27.",
  },
  ingest: {
    title: "Bhikkhu Sujato CC0 English held Khuddaka translations",
    translator: "Bhikkhu Sujato",
    source: "SuttaCentral / Bilara published snapshot",
    commit,
    publicationNumbers: requiredPubs,
    newWorks: 0,
    newExpressions: catalogFiles.length,
    completeTexts: catalogFiles.length,
    sourceRecords: batchFiles.length,
    attachedExistingWorks: catalogFiles.length,
    attachedUids: attachedPrefixes,
    collections,
    globalCoverage: null,
    dualHumanReview: 0,
    filesApprovedForModelTraining: 0,
    mapping: "Each held KN book attaches one Sujato EN expression to the already-registered book-level Pali work. No new Works. Slugs follow /jingzang/suttacentral-en-{uid}.",
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
      result: "still_refused_not_license_clean",
      source: "https://www.dsbcproject.org/pages/usage-policy",
      quoted: [
        "These e-texts are provided for review, indexing and word search purposes only.",
        "Reproduction of DSBC contents without permission is prohibited.",
      ],
      note: "DSBC remains refused. This cut does not ingest DSBC bodies.",
    },
    {
      id: "gretil_mirror",
      result: "already_zero_mirror_still_refused",
      note: "GRETIL remains 0-mirror. This cut does not start a GRETIL body ingest.",
    },
    {
      id: "sujato_walton_theragatha_therigatha",
      result: "skipped_sujato_walton_collaboration",
      publications: ["scpub1", "scpub6"],
      uids: ["thag", "thig"],
      note: "thag/thig stay out. They are sujato-walton collaborations, not sole-author Sujato publications.",
    },
    {
      id: "brahmali_vinaya",
      result: "skipped_not_fosuo_jing_this_cut",
      publication: "scpub8",
      note: "Bhikkhu Brahmali Vinaya is 律, not 佛说经 this cut.",
    },
    {
      id: "sujato_patimokkha",
      result: "skipped_vinaya_not_this_cut",
      publications: ["scpub79", "scpub80"],
      note: "Sujato patimokkha publications are 律, unpublished in this snapshot, and out of this cut.",
    },
    {
      id: "legacy_suttacentral_mixed_license_translations",
      result: "skipped_not_cc0_sujato_publication",
      note: "Only Bilara translation/en/sujato files whose publication record is CC0 / sujato are ingested.",
    },
    {
      id: "other_held_kn_books",
      result: "skipped_not_in_this_cut",
      uids: ["ja", "bv", "cnd", "mil", "mnd", "ne", "pe", "ps", "pv", "tha-ap", "thi-ap", "vv"],
      note: "Other held KN Pali books are not in the Sujato sole-author CC0 publication set for this cut. ja remains incomplete in this snapshot.",
    },
    {
      id: "sabbamitta_or_non_en_non_sujato",
      result: "skipped_out_of_scope",
      note: "No Sabbamitta or any non-en / non-sujato translation is imported.",
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
  caveat: "本总帐只证明已持有小部五书（iti/snp/ud/kp/cp）的 Sujato CC0 英译被挂接为既有巴利作品的新表达。它不构成全球佛陀亲说覆盖率，也不批准把 SuttaCentral 文本用于生成式模型训练。",
};

const rightsAudit = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-sujato-en-kn-rights-audit-v0.1",
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
  skippedPublicationEvidence: {
    thag: { publicationNumber: "scpub1", authorUid: publication.scpub1.author_uid, importedTranslation: false },
    thig: { publicationNumber: "scpub6", authorUid: publication.scpub6.author_uid, importedTranslation: false },
  },
  summary: {
    filesAudited: batchFiles.length,
    filesApprovedForReadingAndRetrieval: batchFiles.length,
    filesApprovedForModelTraining: 0,
    expressions: catalogFiles.length,
    attachedExistingWorks: catalogFiles.length,
    newWorks: 0,
    thirdPartyNonSujatoTranslationFilesImported: 0,
    sujatoWaltonFilesImported: 0,
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
  console.log(`Sujato 小部 CC0 英译可复现：${catalogFiles.length} 个表达、${batchFiles.length} 个物理记录、0 个新作品；训练许可 0。`);
} else {
  for (const [path, raw] of outputs) {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), raw);
  }
  console.log(`Sujato 小部 CC0 英译已写入：${catalogFiles.length} 个表达挂接 ${catalogFiles.length} 部既有巴利作品；${batchFiles.length} 个物理记录。`);
}
