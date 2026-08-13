import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.5.0";
const generatedAt = "2026-08-13";
const inputs = {
  cbetaRegistry: "data/gbcr/registry-cbeta-v2.4.0.json",
  dergeInventory: "data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json",
  rights84000: "data/gbcr/84000-rights-policy-v0.3.0.json",
};
const outputPath = resolve(root, `data/gbcr/cross-catalog-alignments-v${version}.json`);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const entries = await Promise.all(Object.entries(inputs).map(async ([id, relativePath]) => {
  const raw = await readFile(resolve(root, relativePath), "utf8");
  return [id, relativePath, raw];
}));
const rawById = Object.fromEntries(entries.map(([id, , raw]) => [id, raw]));
const cbetaRegistry = JSON.parse(rawById.cbetaRegistry);
const dergeInventory = JSON.parse(rawById.dergeInventory);
const rights84000 = JSON.parse(rawById.rights84000);

requireValue(cbetaRegistry.registry?.version === "2.4.0", "CBETA 登记册版本不匹配");
requireValue(dergeInventory.version === "0.3.0", "BDRC 德格快照版本不匹配");
requireValue(rights84000.policy?.api?.open === false, "84000 API 权利边界缺失");

const grouped = new Map();
for (const work of cbetaRegistry.works) {
  for (const relation of work.bibliographicRelations ?? []) {
    if (!relation.externalIds?.toh?.length) continue;
    const existing = grouped.get(relation.groupId) ?? {
      groupId: relation.groupId,
      relationType: relation.type,
      label: relation.label,
      evidence: relation.evidence,
      workIds: new Set(),
      cbetaIds: new Set(),
      tohIds: new Set(),
    };
    requireValue(existing.relationType === relation.type, `${relation.groupId} 关系类型不一致`);
    requireValue(existing.label === relation.label, `${relation.groupId} 标签不一致`);
    requireValue(existing.evidence === relation.evidence, `${relation.groupId} 证据说明不一致`);
    existing.workIds.add(work.id);
    for (const id of relation.externalIds.cbeta ?? []) existing.cbetaIds.add(id);
    for (const id of relation.externalIds.toh) existing.tohIds.add(id.toLowerCase());
    grouped.set(relation.groupId, existing);
  }
}

const dergeByCatalogId = new Map(dergeInventory.records.map((record) => [record.dergeCatalogId, record]));
const parseToh = (tohId) => {
  const match = tohId.match(/^toh(\d+)(?:-(\d+))?$/);
  requireValue(match, `不支持的 Toh 标识：${tohId}`);
  return {
    tohId,
    baseTohId: `toh${match[1]}`,
    baseNumber: Number(match[1]),
    componentNumber: match[2] ? Number(match[2]) : null,
  };
};
const classify = (relationType) =>
  relationType.includes("candidate") || relationType.includes("unresolved")
    ? "candidate_requires_manual_review"
    : "curated_relation_identifier_join";

const alignments = [...grouped.values()]
  .sort((a, b) => a.groupId.localeCompare(b.groupId))
  .map((group) => {
    const dergeMatches = [...group.tohIds]
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
      .map((tohId) => {
        const parsed = parseToh(tohId);
        const dergeCatalogId = `D${parsed.baseNumber}`;
        const record = dergeByCatalogId.get(dergeCatalogId);
        requireValue(record, `${tohId} 没有匹配到 ${dergeCatalogId}`);
        return {
          ...parsed,
          dergeCatalogId,
          dergeExpressionId: record.expressionId,
          linkedAbstractWorkId: record.linkedAbstractWorkId,
          titleEwts: record.titleEwts,
          resourceUrl: record.resourceUrl,
          iiifManifestUrl: record.iiifManifestUrl,
          mappingBasis: parsed.componentNumber === null
            ? "Toh 基础编号与德格目录 D 编号相同"
            : "Toh 章节后缀保留为组件范围，基础编号与德格目录 D 编号相同",
        };
      });
    return {
      id: `gbcr:alignment:${group.groupId}`,
      groupId: group.groupId,
      status: classify(group.relationType),
      relationType: group.relationType,
      label: group.label,
      evidence: group.evidence,
      gbcrWorkIds: [...group.workIds].sort(),
      externalIds: {
        cbeta: [...group.cbetaIds].sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
        toh: [...group.tohIds].sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
      },
      dergeMatches,
      decisionBoundary: "连接既有人工整理关系组、84000 Toh 引用与固定德格表达式；不自动合并 Work，不生成章节或段落等同关系。",
    };
  });

const unique = (values) => new Set(values).size;
const allMatches = alignments.flatMap((alignment) => alignment.dergeMatches);
const summary = {
  curatedRelationGroups: alignments.length,
  curatedRelationGroupsWithIdentifierJoin: alignments.filter((item) => item.status === "curated_relation_identifier_join").length,
  relationGroupsRequiringManualReview: alignments.filter((item) => item.status === "candidate_requires_manual_review").length,
  gbcrWorksReferenced: unique(alignments.flatMap((item) => item.gbcrWorkIds)),
  cbetaCitationIdentifiers: unique(alignments.flatMap((item) => item.externalIds.cbeta)),
  tohCitationIdentifiers: unique(alignments.flatMap((item) => item.externalIds.toh)),
  uniqueTohBaseIdentifiers: unique(allMatches.map((item) => item.baseTohId)),
  matchedDergeExpressions: unique(allMatches.map((item) => item.dergeExpressionId)),
  matchedBdrcAbstractWorkIds: unique(allMatches.map((item) => item.linkedAbstractWorkId)),
  unmatchedTohBaseIdentifiers: 0,
  denominatorImpact: "none",
};

requireValue(summary.curatedRelationGroups === 29, "跨目录关系组计数漂移");
requireValue(summary.curatedRelationGroupsWithIdentifierJoin === 23, "已整理关系组计数漂移");
requireValue(summary.relationGroupsRequiringManualReview === 6, "待人工复核关系组计数漂移");
requireValue(summary.gbcrWorksReferenced === 57, "跨目录引用作品计数漂移");
requireValue(summary.cbetaCitationIdentifiers === 92, "CBETA 引用标识计数漂移");
requireValue(summary.tohCitationIdentifiers === 31, "Toh 引用标识计数漂移");
requireValue(summary.uniqueTohBaseIdentifiers === 29, "Toh 基础标识计数漂移");
requireValue(summary.matchedDergeExpressions === 29, "德格表达式匹配计数漂移");
requireValue(summary.matchedBdrcAbstractWorkIds === 29, "BDRC 抽象作品标识计数漂移");
requireValue(summary.denominatorImpact === "none", "候选对齐不得改变全球分母");

const document = {
  schema: "https://foxue.ai/schemas/gbcr/cross-catalog-alignments-v0.5",
  version,
  generatedAt,
  status: "curated_identifier_links_without_automatic_work_merge",
  warning: "本账本只覆盖登记册中已有 Toh 证据的关系组。29/29 匹配率不能外推为藏文、汉文或全球佛典覆盖率。",
  policy: {
    workExpressionWitnessSeparated: true,
    automaticWorkMerge: false,
    segmentEquivalenceAsserted: false,
    componentSuffixPreserved: true,
    mappingRule: "解析 toh{N} 或 toh{N}-{component}；只把基础编号 N 连接到固定德格清单的 D{N}，组件后缀不冒充独立德格作品。",
    reviewRule: "候选或未决关系必须人工复核；已整理关系也只发布标识连接，不据此重算全球作品分母。",
  },
  sources: entries.map(([id, relativePath, raw]) => ({ id, file: relativePath, sha256: sha256(raw) })),
  summary,
  integrity: {
    alignmentSetSha256: sha256(alignments.map((item) => [
      item.groupId,
      item.relationType,
      item.gbcrWorkIds.join("|"),
      item.externalIds.toh.join("|"),
      item.dergeMatches.map((match) => `${match.dergeCatalogId}:${match.dergeExpressionId}:${match.linkedAbstractWorkId}`).join("|"),
    ].join("\t")).join("\n")),
  },
  alignments,
};
const raw = serialize(document);

if (process.argv.includes("--verify")) {
  requireValue(await readFile(outputPath, "utf8") === raw, `cross-catalog-alignments-v${version}.json 不可复现`);
  console.log("跨目录对齐账本 v0.5.0 可复现：29 个关系组、57 个站内作品、29 个固定德格表达式；全球分母未改变。");
} else {
  await writeFile(outputPath, raw, "utf8");
  console.log("跨目录对齐账本 v0.5.0 已生成：Toh—德格—CBETA 标识连接已冻结，不自动合并作品。");
}
