import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const capturedAt = "2026-08-13";
const version = "0.3.0";
const instanceId = "MW22084";
const imageInstanceId = "W22084";
const outlineId = "O22084";
const instanceRevision = "f0b7bee5198d5ddf50dd6853765a8e966821a078";
const outlineRevision = "7925566c564577bfa97631ebfea355f0b7e11e25";
const ldsCodeRevision = "0cad5793279cca2516af64988a75326112587ea5";
const iiifCodeRevision = "3642a7ce06d66f4da694fe9973763112c850d910";
const reviewedTitleFallbacks = new Map([
  ["MW22084_0626", { value: "'brum bu'i nad zhi bar byed pa'i gzungs/", language: "bo-x-ewts", source: "http://purl.bdrc.io/resource/WA0RK0620" }],
  ["MW22084_0841A", { value: "rdo rje khros pa zhes sdang gcod pa/", language: "bo-x-ewts", source: "http://purl.bdrc.io/resource/WA0RK0651" }],
  ["MW22084_0865", { value: "'phags pa 'od dpag med mthong ba'i gzungs/", language: "bo-x-ewts", source: "http://purl.bdrc.io/resource/WA0RK0865" }],
  ["MW22084_1073", { value: "phyags bya ba'i gzungs/", language: "bo-x-ewts", source: "http://purl.bdrc.io/resource/WA0RK1073" }],
]);

const baseSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v0.2.1.json");
const inventoryPath = resolve(root, `data/gbcr/bdrc-derge-kangyur-inventory-v${version}.json`);
const rightsPath = resolve(root, `data/gbcr/84000-rights-policy-v${version}.json`);
const snapshotsPath = resolve(root, `data/gbcr/source-snapshots-v${version}.json`);

const endpoints = {
  imageInstance: `https://ldspdi.bdrc.io/resource/${imageInstanceId}.ttl`,
  instance: `https://ldspdi.bdrc.io/resource/${instanceId}.ttl`,
  outline: `https://ldspdi.bdrc.io/resource/${outlineId}.ttl`,
  outlineGraph: `https://ldspdi.bdrc.io/query/graph/Outline_for_w?R_RES=bdr:${instanceId}`,
  iiifCollection: `https://iiifpres.bdrc.io/collection/wio:bdr:${instanceId}::bdr:${imageInstanceId}`,
  terms84000: "https://84000.co/documents/terms-of-use",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const curl = async (url, { accept, post } = {}) => {
  const args = [
    "-L", "--fail", "--silent", "--show-error",
    "--retry", "4", "--retry-all-errors", "--retry-delay", "1",
    "--connect-timeout", "20", "--max-time", "180",
    "-A", "foxue.ai corpus registry snapshot/0.3",
  ];
  if (accept) args.push("-H", `Accept: ${accept}`);
  if (post) args.push("-H", "Content-Type: application/json", "-X", "POST", "-d", JSON.stringify(post));
  args.push(url);
  const { stdout } = await execFileAsync("curl", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
};

const readEvidenceCache = async (cacheDirectory) => {
  const files = {
    imageInstance: "bdrc-W22084.ttl",
    instance: "bdrc-MW22084.ttl",
    outline: "bdrc-O22084.ttl",
    outlineGraph: "bdrc-MW22084-outline-full.ttl",
    iiifCollection: "bdrc-MW22084-iiif.json",
    instanceCommit: "bdrc-MW22084-commit.json",
    outlineCommit: "bdrc-O22084-commit.json",
    terms84000: "84000-terms-2026-08-13.html",
  };
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([id, filename]) => [
    id,
    await readFile(resolve(cacheDirectory, filename), "utf8"),
  ])));
};

const fetchCommit = async (resourceId) => curl(
  "https://ldspdi.bdrc.io/query/table/getCommit",
  {
    post: {
      R_RES: `bdr:${resourceId}`,
      format: "json",
      pageSize: "50",
      pageNumber: "1",
    },
  },
);

const parseSubjectBlocks = (turtle) => {
  const blocks = new Map();
  const matcher = /(?:^|\n)bdr:([^\s]+)\s+([\s\S]*?)(?=\n\nbdr:|$)/g;
  for (const match of turtle.matchAll(matcher)) blocks.set(match[1], match[2]);
  return blocks;
};

const resourceValue = (body, predicate) =>
  body.match(new RegExp(`${predicate}\\s+bdr:([^\\s;,.]+)`))?.[1] ?? null;
const integerValue = (body, predicate) => {
  const value = body.match(new RegExp(`${predicate}\\s+(\\d+)`))?.[1];
  return value === undefined ? null : Number(value);
};
const literalValue = (body, predicate) => {
  const match = body.match(new RegExp(`${predicate}\\s+\"((?:[^\"\\\\]|\\\\.)*)\"(?:@([^\\s;]+))?`));
  if (!match) return { value: null, language: null };
  let value = match[1];
  try {
    value = JSON.parse(`"${value}"`);
  } catch {
    // Turtle and JSON share the escapes used by this fixed source. Preserve raw text if upstream adds another escape.
  }
  return { value, language: match[2] ?? null };
};
const resourceList = (body, predicate) => {
  const raw = body.match(new RegExp(`${predicate}\\s+([^;]+);`))?.[1] ?? "";
  return [...raw.matchAll(/bdr:([^\s,.]+)/g)].map((match) => match[1]);
};

const parseRevision = (raw, resourceId) => {
  const document = JSON.parse(raw);
  const revisions = document.results?.bindings?.map((entry) => entry.commit?.value).filter(Boolean) ?? [];
  requireValue(revisions.length === 1, `${resourceId} 上游修订号响应不唯一`);
  requireValue(/^[a-f0-9]{40}$/.test(revisions[0]), `${resourceId} 上游修订号无效`);
  return revisions[0];
};

const buildDocuments = async ({ live, cacheDirectory }) => {
  const baseSnapshots = JSON.parse(await readFile(baseSnapshotsPath, "utf8"));
  let source;

  if (live && cacheDirectory) {
    source = await readEvidenceCache(cacheDirectory);
  } else if (live) {
    const [imageInstance, instance, outline, outlineGraph, iiifCollection, instanceCommit, outlineCommit, terms84000] = await Promise.all([
      curl(endpoints.imageInstance, { accept: "text/turtle" }),
      curl(endpoints.instance, { accept: "text/turtle" }),
      curl(endpoints.outline, { accept: "text/turtle" }),
      curl(endpoints.outlineGraph, { accept: "text/turtle" }),
      curl(endpoints.iiifCollection, { accept: "application/json" }),
      fetchCommit(instanceId),
      fetchCommit(outlineId),
      curl(endpoints.terms84000),
    ]);
    source = { imageInstance, instance, outline, outlineGraph, iiifCollection, instanceCommit, outlineCommit, terms84000 };
  } else {
    const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
    const rights = JSON.parse(await readFile(rightsPath, "utf8"));
    const snapshots = JSON.parse(await readFile(snapshotsPath, "utf8"));
    return {
      inventory,
      rights,
      snapshots,
      inventoryRaw: serialize(inventory),
      rightsRaw: serialize(rights),
      snapshotsRaw: serialize(snapshots),
    };
  }

  requireValue(parseRevision(source.instanceCommit, instanceId) === instanceRevision, `${instanceId} 修订号已变化，须人工审阅后再刷新`);
  requireValue(parseRevision(source.outlineCommit, outlineId) === outlineRevision, `${outlineId} 修订号已变化，须人工审阅后再刷新`);

  const imageBlocks = parseSubjectBlocks(source.imageInstance);
  const instanceBlocks = parseSubjectBlocks(source.instance);
  const outlineBlocks = parseSubjectBlocks(source.outlineGraph);
  const imageBody = imageBlocks.get(imageInstanceId) ?? "";
  const instanceBody = instanceBlocks.get(instanceId) ?? "";
  const outlineBody = parseSubjectBlocks(source.outline).get(outlineId) ?? "";
  const iiif = JSON.parse(source.iiifCollection);

  requireValue(resourceValue(imageBody, "bdo:instanceReproductionOf") === instanceId, "BDRC 图像实例与书目实例不一致");
  requireValue(resourceValue(imageBody, "bdo:instanceOf") === "WA0BC001", "BDRC 图像实例不再属于预期甘珠尔作品");
  requireValue(integerValue(imageBody, "bdo:numberOfVolumes") === 103, "BDRC 图像实例卷数漂移");
  requireValue(resourceValue(instanceBody, "bdo:hasOutline") === outlineId, "BDRC 书目实例纲要标识漂移");
  requireValue(resourceValue(instanceBody, "bdo:instanceOf") === "WA0BC001", "BDRC 书目实例不再属于预期甘珠尔作品");
  requireValue(integerValue(instanceBody, "bdo:numberOfVolumes") === 103, "BDRC 书目实例卷数漂移");
  requireValue(resourceValue(outlineBody, "bdo:outlineOf") === instanceId, "BDRC 纲要与书目实例不一致");
  requireValue(iiif.license === "https://creativecommons.org/publicdomain/mark/1.0/", "BDRC IIIF 集合权利标记已变化");
  requireValue(iiif.collections?.length === 14, "BDRC IIIF 部类数量漂移");
  requireValue(iiif.manifests?.length === 103, "BDRC IIIF 卷清单数量漂移");

  const identifierValues = new Map();
  for (const [id, body] of outlineBlocks) {
    if (!/\ba\s+bdr:KaTenSiglaD\s*;/.test(body)) continue;
    const value = literalValue(body, "rdf:value").value;
    requireValue(value, `${id} 缺少德格目录号`);
    identifierValues.set(id, value);
  }

  const locations = new Map();
  for (const [id, body] of outlineBlocks) {
    if (!/\ba\s+bdo:ContentLocation\s*;/.test(body)) continue;
    const volume = integerValue(body, "bdo:contentLocationVolume");
    const endVolume = integerValue(body, "bdo:contentLocationEndVolume") ?? volume;
    locations.set(id, {
      volume,
      page: integerValue(body, "bdo:contentLocationPage"),
      line: integerValue(body, "bdo:contentLocationLine"),
      endVolume,
      endPage: integerValue(body, "bdo:contentLocationEndPage"),
      endLine: integerValue(body, "bdo:contentLocationEndLine"),
    });
  }

  const sections = iiif.collections.map((entry, index) => ({
    id: entry["@id"].match(/MW22084_S\d{4}/)?.[0],
    order: index + 1,
    titleEwts: entry.label?.["@value"],
    iiifCollectionUrl: entry["@id"],
    candidateExpressionRecords: 0,
  }));
  requireValue(sections.every((section) => section.id && section.titleEwts), "BDRC IIIF 部类缺少标识或标题");
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const volumeManifestByNumber = new Map(iiif.manifests.map((manifest, index) => [index + 1, manifest["@id"]]));

  const records = [];
  const excludedCatalogRecords = [];
  let allInstanceParts = 0;
  let nestedTextParts = 0;
  for (const [id, body] of outlineBlocks) {
    if (!/^MW22084_[A-Za-z0-9_]+$/.test(id) || !/\ba\s+bdo:Instance\s*;/.test(body)) continue;
    allInstanceParts += 1;
    const partOf = resourceValue(body, "bdo:partOf");
    if (partOf?.startsWith("MW22084_") && !/^MW22084_S\d{4}$/.test(partOf)) nestedTextParts += 1;
    if (!/^MW22084_S\d{4}$/.test(partOf ?? "")) continue;

    const abstractWorkId = resourceValue(body, "bdo:instanceOf");
    const locationId = resourceValue(body, "bdo:contentLocation");
    const treeIndex = literalValue(body, "bdo:partTreeIndex").value;
    const directTitle = literalValue(body, "skos:prefLabel");
    const titleFallback = reviewedTitleFallbacks.get(id);
    const title = directTitle.value ? directTitle : { value: titleFallback?.value ?? null, language: titleFallback?.language ?? null };
    const identifiers = resourceList(body, "bf:identifiedBy").map((identifier) => identifierValues.get(identifier)).filter(Boolean);
    const noteId = resourceValue(body, "bdo:note");
    const note = noteId ? literalValue(outlineBlocks.get(noteId) ?? "", "bdo:noteText").value : null;
    const location = locations.get(locationId);
    if (/not in parphud/i.test(note ?? "") || !treeIndex || !location?.volume || !location.page || !location.endPage) {
      requireValue(abstractWorkId && title.value && identifiers.length === 1, `${id} 排除项缺少作品、标题或德格目录号`);
      excludedCatalogRecords.push({
        expressionId: id,
        dergeCatalogId: identifiers[0],
        linkedAbstractWorkId: abstractWorkId,
        sectionId: partOf,
        titleEwts: title.value,
        exclusionReason: note ?? "BDRC 纲要未提供初印本可定位的树序或卷页位置",
        resourceUrl: `http://purl.bdrc.io/resource/${id}`,
      });
      continue;
    }
    requireValue(sectionById.has(partOf), `${id} 引用了未知部类 ${partOf}`);
    requireValue(abstractWorkId && treeIndex && title.value, `${id} 缺少作品、树序或标题`);
    requireValue(identifiers.length === 1, `${id} 顶层文本必须且只能有一个德格目录号`);
    requireValue(location?.volume && location.page && location.endPage, `${id} 缺少可导航的卷页位置`);
    const imageGroupId = volumeManifestByNumber.get(location.volume)?.match(/bdr:(I\d+)/)?.[1];
    requireValue(imageGroupId, `${id} 的第 ${location.volume} 卷缺少 IIIF 清单`);

    sectionById.get(partOf).candidateExpressionRecords += 1;
    records.push({
      expressionId: id,
      dergeCatalogId: identifiers[0],
      linkedAbstractWorkId: abstractWorkId,
      sectionId: partOf,
      treeIndex,
      titleEwts: title.value,
      language: title.language,
      titleSource: directTitle.value ? "bdrc_instance_pref_label" : titleFallback.source,
      location,
      resourceUrl: `http://purl.bdrc.io/resource/${id}`,
      iiifManifestUrl: `https://iiifpres.bdrc.io/wvo:bdr:${id}::bdr:${imageGroupId}/manifest`,
    });
  }

  records.sort((left, right) => left.treeIndex.localeCompare(right.treeIndex, "en", { numeric: true }));
  requireValue(allInstanceParts === 1207, "BDRC 纲要子实例数量漂移");
  requireValue(records.length + excludedCatalogRecords.length === 1122, "BDRC 德格甘珠尔顶层目录项数量漂移");
  requireValue(records.length === 1114, "BDRC 德格甘珠尔可定位顶层表达式数量漂移");
  requireValue(excludedCatalogRecords.length === 8, "BDRC 德格甘珠尔排除证据数量漂移");
  requireValue(nestedTextParts === 71, "BDRC 德格甘珠尔嵌套子文本数量漂移");
  requireValue(identifierValues.size === 1193, "BDRC 德格目录号数量漂移");
  requireValue(new Set(identifierValues.values()).size === 1193, "BDRC 德格目录号不唯一");
  requireValue(new Set(records.map((record) => record.expressionId)).size === records.length, "BDRC 顶层表达式标识重复");
  requireValue(new Set(records.map((record) => record.dergeCatalogId)).size === records.length, "BDRC 顶层德格目录号重复");
  requireValue(sections.reduce((sum, section) => sum + section.candidateExpressionRecords, 0) === records.length, "BDRC 部类计数不闭合");

  const evidence = {
    imageInstance: { url: endpoints.imageInstance, bytes: Buffer.byteLength(source.imageInstance), sha256: sha256(source.imageInstance) },
    instance: { url: endpoints.instance, bytes: Buffer.byteLength(source.instance), sha256: sha256(source.instance) },
    outline: { url: endpoints.outline, bytes: Buffer.byteLength(source.outline), sha256: sha256(source.outline) },
    outlineGraph: { url: endpoints.outlineGraph, bytes: Buffer.byteLength(source.outlineGraph), sha256: sha256(source.outlineGraph) },
    iiifCollection: { url: endpoints.iiifCollection, bytes: Buffer.byteLength(source.iiifCollection), sha256: sha256(source.iiifCollection) },
    instanceCommit: { bytes: Buffer.byteLength(source.instanceCommit), sha256: sha256(source.instanceCommit) },
    outlineCommit: { bytes: Buffer.byteLength(source.outlineCommit), sha256: sha256(source.outlineCommit) },
  };
  const candidateRecordIdSha256 = sha256(records.map((record) => record.expressionId).sort().join("\n"));
  const recordSetSha256 = sha256(records.map((record) => JSON.stringify(record)).join("\n"));
  const linkedAbstractWorkIds = new Set(records.map((record) => record.linkedAbstractWorkId));

  const inventory = {
    schema: "https://foxue.ai/schemas/gbcr/bdrc-derge-kangyur-inventory-v0.3",
    version,
    capturedAt,
    status: "fixed_edition_candidate_expression_inventory",
    source: {
      provider: "Buddhist Digital Resource Center",
      instanceId,
      imageInstanceId,
      outlineId,
      instanceRevision,
      outlineRevision,
      ldsCodeRevision,
      iiifCodeRevision,
      titleEwts: "bka' 'gyur (sde dge par phud)",
      titleZh: "德格甘珠尔初印本",
      volumes: 103,
      homepage: `https://library.bdrc.io/show/bdr:${instanceId}`,
    },
    definition: {
      recordUnit: "德格甘珠尔固定版本中直接隶属 14 个部类、类型为 PartTypeText 且具有初印本卷页位置的顶层文本表达式",
      inclusionRule: "BDRC O22084 已发布纲要中，bdo:partOf 指向 MW22084_S0001–S0014、具有初印本卷页位置且未标注 not in parphud 的 bdo:Instance",
      exclusionRule: "排除根实例、14 个部类节点、71 个嵌套子文本，以及 8 个无法定位到初印本的顶层目录项（其中 4 个被 BDRC 明确标注 not in parphud edition，另 4 个无树序与卷页位置）；所有排除项另行计数并保留证据。",
      denominatorCaveat: "1114 是单一固定版本中可定位的顶层文本表达式，不是跨版本去重作品数；BDRC 当前链接的抽象作品标识数量也尚未通过跨目录独立复核。",
    },
    rights: {
      iiifCollectionLicense: iiif.license,
      accessPolicyUrl: "https://www.bdrc.io/access-policies/",
      status: "public_domain_collection_metadata_only",
      decision: "本快照只保存事实性目录元数据与外部导航，不镜像图像；任何全文或图像入库仍须逐对象核对 BDRC 访问政策和清单权利标记。",
    },
    revisions: { instanceRevision, outlineRevision },
    evidence,
    totals: {
      rootAndPartInstanceNodes: allInstanceParts + 1,
      partInstanceNodes: allInstanceParts,
      sectionNodes: sections.length,
      topLevelCatalogRecords: records.length + excludedCatalogRecords.length,
      topLevelExpressionRecords: records.length,
      excludedCatalogOnlyRecords: excludedCatalogRecords.length,
      nestedTextPartRecords: nestedTextParts,
      dergeIdentifierRecords: identifierValues.size,
      uniqueDergeIdentifiers: new Set(identifierValues.values()).size,
      linkedAbstractWorkIds: linkedAbstractWorkIds.size,
      volumeManifests: iiif.manifests.length,
    },
    integrity: { candidateRecordIdSha256, recordSetSha256 },
    sections,
    excludedCatalogRecords,
    records,
  };
  const inventoryRaw = serialize(inventory);

  requireValue(source.terms84000.includes("CC BY-NC-ND 4.0"), "84000 条款未检出译文许可标识");
  requireValue(source.terms84000.includes("CC BY 4.0"), "84000 条款未检出元数据许可标识");
  requireValue(source.terms84000.includes("does not currently operate an open API"), "84000 条款未检出开放 API 边界");
  requireValue(source.terms84000.includes("requires a written agreement"), "84000 条款未检出书面协议要求");
  const rights = {
    schema: "https://foxue.ai/schemas/gbcr/source-rights-policy-v0.3",
    version,
    capturedAt,
    source: {
      provider: "84000: Translating the Words of the Buddha",
      url: endpoints.terms84000,
      documentDate: "2026-05-15",
      responseBytes: Buffer.byteLength(source.terms84000),
      responseSha256: sha256(source.terms84000),
    },
    policy: {
      publishedTranslations: { license: "CC BY-NC-ND 4.0", commercialUse: false, derivatives: false, attributionRequired: true },
      translationMetadata: { license: "CC BY 4.0", commercialUse: true, derivatives: true, attributionRequired: true },
      api: { open: false, writtenAgreementRequired: true },
    },
    foxueDecision: {
      metadataIngestion: "allowed_with_attribution_when_a_public_or_partner_feed_is_available",
      translationIngestion: "disabled_pending_item_level_scope_and_noncommercial_product_review",
      apiHarvesting: "disabled_without_written_agreement",
      publicDeepLinks: true,
    },
  };
  const rightsRaw = serialize(rights);

  const bdrcSource = {
    id: "bdrc_derge_kangyur",
    provider: "Buddhist Digital Resource Center",
    repository: "buda-base linked-data and IIIF public interfaces",
    instanceRevision,
    outlineRevision,
    candidateRecordCount: records.length,
    recordUnit: "fixed-edition top-level Tibetan text expression",
    inclusionRule: inventory.definition.inclusionRule,
    candidatePathSha256: candidateRecordIdSha256,
    recordSetSha256,
    inventoryFile: `data/gbcr/bdrc-derge-kangyur-inventory-v${version}.json`,
    inventorySha256: sha256(inventoryRaw),
    groups: Object.fromEntries(sections.map((section) => [section.id.replace("MW22084_", ""), section.candidateExpressionRecords])),
    metrics: inventory.totals,
    rights: inventory.rights,
    denominatorCaveat: inventory.definition.denominatorCaveat,
  };
  const snapshots = {
    ...baseSnapshots,
    schema: "https://foxue.ai/schemas/gbcr/source-snapshots-v0.3",
    version,
    capturedAt,
    status: "multi_tradition_candidate_record_inventory",
    warning: "候选来源记录、固定版本表达式与链接作品标识均不是跨传统去重后的作品数，不得直接用作全球覆盖率分母。",
    sources: [...baseSnapshots.sources, bdrcSource],
    rightsEvidence: [{
      id: "84000_rights_policy",
      file: `data/gbcr/84000-rights-policy-v${version}.json`,
      sha256: sha256(rightsRaw),
    }],
  };
  const snapshotsRaw = serialize(snapshots);
  return { inventory, rights, snapshots, inventoryRaw, rightsRaw, snapshotsRaw };
};

const validateFrozenDocuments = ({ inventory, rights, snapshots, inventoryRaw, rightsRaw }) => {
  requireValue(inventory.version === version && inventory.capturedAt === capturedAt, "BDRC 清单版本或日期不匹配");
  requireValue(inventory.revisions.instanceRevision === instanceRevision, "BDRC 书目实例修订号漂移");
  requireValue(inventory.revisions.outlineRevision === outlineRevision, "BDRC 纲要修订号漂移");
  requireValue(inventory.totals.topLevelCatalogRecords === 1122, "BDRC 顶层目录项计数漂移");
  requireValue(inventory.totals.topLevelExpressionRecords === 1114, "BDRC 可定位顶层表达式计数漂移");
  requireValue(inventory.totals.excludedCatalogOnlyRecords === 8, "BDRC 排除证据计数漂移");
  requireValue(inventory.totals.nestedTextPartRecords === 71, "BDRC 嵌套子文本计数漂移");
  requireValue(inventory.totals.dergeIdentifierRecords === 1193, "BDRC 德格目录号计数漂移");
  requireValue(Number.isInteger(inventory.totals.linkedAbstractWorkIds) && inventory.totals.linkedAbstractWorkIds > 0, "BDRC 链接抽象作品计数无效");
  requireValue(inventory.totals.volumeManifests === 103, "BDRC IIIF 卷数漂移");
  requireValue(inventory.sections.length === 14 && inventory.records.length === inventory.totals.topLevelExpressionRecords, "BDRC 清单结构不完整");
  requireValue(inventory.excludedCatalogRecords.length === inventory.totals.excludedCatalogOnlyRecords, "BDRC 排除证据不完整");
  requireValue(new Set(inventory.records.map((record) => record.expressionId)).size === inventory.records.length, "BDRC 表达式标识不唯一");
  requireValue(new Set(inventory.records.map((record) => record.dergeCatalogId)).size === inventory.records.length, "BDRC 顶层德格目录号不唯一");
  requireValue(
    sha256(inventory.records.map((record) => record.expressionId).sort().join("\n")) === inventory.integrity.candidateRecordIdSha256,
    "BDRC 表达式标识摘要不匹配",
  );
  requireValue(
    sha256(inventory.records.map((record) => JSON.stringify(record)).join("\n")) === inventory.integrity.recordSetSha256,
    "BDRC 表达式记录集摘要不匹配",
  );
  const bdrcSource = snapshots.sources.find((source) => source.id === "bdrc_derge_kangyur");
  requireValue(snapshots.version === version && snapshots.denominatorReady === false, "全球来源快照状态不匹配");
  requireValue(snapshots.sources.length === 3, "全球来源快照必须含 CBETA、SuttaCentral 与 BDRC 德格甘珠尔");
  requireValue(bdrcSource?.candidateRecordCount === inventory.records.length, "全球来源快照的 BDRC 计数不匹配");
  requireValue(bdrcSource?.inventorySha256 === sha256(inventoryRaw), "全球来源快照的 BDRC 清单摘要不匹配");
  requireValue(snapshots.rightsEvidence?.[0]?.sha256 === sha256(rightsRaw), "84000 权利证据摘要不匹配");
  requireValue(rights.policy.publishedTranslations.license === "CC BY-NC-ND 4.0", "84000 译文许可边界漂移");
  requireValue(rights.policy.translationMetadata.license === "CC BY 4.0", "84000 元数据许可边界漂移");
  requireValue(rights.policy.api.open === false && rights.policy.api.writtenAgreementRequired === true, "84000 API 边界漂移");
};

if (process.argv.includes("--write")) {
  const cacheFlagIndex = process.argv.indexOf("--from-cache");
  const cacheDirectory = cacheFlagIndex >= 0 ? process.argv[cacheFlagIndex + 1] : null;
  if (cacheFlagIndex >= 0) requireValue(cacheDirectory, "--from-cache 后必须提供证据目录");
  const documents = await buildDocuments({ live: true, cacheDirectory });
  validateFrozenDocuments(documents);
  await writeFile(inventoryPath, documents.inventoryRaw, "utf8");
  await writeFile(rightsPath, documents.rightsRaw, "utf8");
  await writeFile(snapshotsPath, documents.snapshotsRaw, "utf8");
  console.log("BDRC 德格甘珠尔来源快照已冻结：1114 个初印本顶层表达式、8 个目录补充项、71 个嵌套子文本、1193 个德格目录号、103 卷。");
} else if (process.argv.includes("--verify")) {
  const documents = await buildDocuments({ live: false });
  validateFrozenDocuments(documents);
  console.log("BDRC 德格甘珠尔来源快照验证通过：1114 个初印本顶层表达式；全球作品分母仍保持未知。");
} else {
  throw new Error("请使用 --write 获取并冻结官方来源，或使用 --verify 验证本地快照");
}
