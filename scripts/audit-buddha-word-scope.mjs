import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const registryPath = "data/gbcr/registry-v6.16.0.json";
const dergeInventoryPath = "data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json";
const outputPath = "data/gbcr/buddha-word-scope-audit-v1.2.0.json";
const [registryBytes, dergeInventoryBytes] = await Promise.all([
  readFile(resolve(root, registryPath)),
  readFile(resolve(root, dergeInventoryPath)),
]);
const registry = JSON.parse(registryBytes.toString("utf8"));
const dergeInventory = JSON.parse(dergeInventoryBytes.toString("utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (registry.registry.version !== "6.16.0" || registry.works.length !== 3377) {
  throw new Error("GBCR v6.16 基线漂移");
}
if (dergeInventory.version !== "0.3.0" || dergeInventory.totals.topLevelCatalogRecords !== 1122) {
  throw new Error("德格甘珠尔目录基线漂移");
}

const sectionByDergeId = new Map();
for (const record of [...dergeInventory.records, ...dergeInventory.excludedCatalogRecords]) {
  if (sectionByDergeId.has(record.dergeCatalogId)) {
    throw new Error(`德格目录号重复：${record.dergeCatalogId}`);
  }
  sectionByDergeId.set(record.dergeCatalogId, record.sectionId);
}
if (sectionByDergeId.size !== 1122) throw new Error("德格 1,122 个顶层目录号未全部映射到部类");

const categoryDefinitions = {
  traditional_sutra_or_discourse_canon_member: {
    labelZh: "传统经藏／教说集成员",
    strictSutraScope: "included_candidate",
    explanation: "在固定汉文经藏或巴利经藏中作为经、教说集或经文传本登记；这里只确认传统目录位置，不声称历史上的逐字亲说。",
  },
  traditional_kangyur_sutra_section_member: {
    labelZh: "甘珠尔经部成员",
    strictSutraScope: "included_candidate",
    explanation: "位于固定德格甘珠尔的般若、华严、宝积或经部；这里只确认传统目录位置，不声称历史上的逐字亲说。",
  },
  provisional_sutra_witness: {
    labelZh: "经文传本候选",
    strictSutraScope: "included_candidate_requires_identity_review",
    explanation: "文本本身按经文传本登记，但跨语种作品身份尚未校定。",
  },
  esoteric_scripture_or_ritual_scope_boundary: {
    labelZh: "密续、陀罗尼或仪轨范围边界",
    strictSutraScope: "scope_policy_required",
    explanation: "属于传统正典或密教部类，但严格“经”分母是否纳入密续、陀罗尼和仪轨必须先公开范围政策并逐项复核。",
  },
  mixed_scriptural_collection_scope_boundary: {
    labelZh: "混合经籍集合范围边界",
    strictSutraScope: "scope_policy_required",
    explanation: "集合可能混合教说、偈颂、本生、义释或后期论辩文本，不能整集合自动计作佛陀逐字亲说。",
  },
  canonical_vinaya_not_strict_sutra: {
    labelZh: "律藏，不计入严格经藏分母",
    strictSutraScope: "excluded_from_strict_sutra_denominator",
    explanation: "属于佛教正典和平台全文范围，但计量单位是律藏，不是严格意义的经藏作品。",
  },
  canonical_abhidhamma_or_treatise_not_strict_sutra: {
    labelZh: "论藏或论书，不计入严格经藏分母",
    strictSutraScope: "excluded_from_strict_sutra_denominator",
    explanation: "属于佛教正典、论藏或论书，但本审计不把正典地位扩张为佛陀逐字亲说经文。",
  },
  commentary_history_or_reference_not_strict_sutra: {
    labelZh: "注疏、史传、目录或参照文献",
    strictSutraScope: "excluded_from_strict_sutra_denominator",
    explanation: "保留为佛教研究和传承文献，但不计入严格经藏作品分母。",
  },
  manuscript_or_suspected_text_scope_boundary: {
    labelZh: "古逸、残卷或疑似经范围边界",
    strictSutraScope: "scope_policy_and_item_review_required",
    explanation: "来源混合古逸、残卷、经疏和疑似经，必须逐项完成文类、责任和作品身份复核。",
  },
  cross_section_work_scope_boundary: {
    labelZh: "跨部类作品范围边界",
    strictSutraScope: "scope_policy_and_item_review_required",
    explanation: "同一候选作品连接到多个传统部类，不能只凭其中一个目录位置决定经藏归属。",
  },
  non_buddhist_reference_excluded: {
    labelZh: "非佛教参照文献",
    strictSutraScope: "excluded_non_buddhist_reference",
    explanation: "只为宗教史或目录语境保留，明确排除于佛教经典与佛陀教说分子。",
  },
};

function cbetaBucket(number) {
  if (number <= 847) return "traditional_sutra_or_discourse_canon_member";
  if (number <= 1420) return "esoteric_scripture_or_ritual_scope_boundary";
  if (number <= 1504) return "canonical_vinaya_not_strict_sutra";
  if (number <= 1692) return "canonical_abhidhamma_or_treatise_not_strict_sutra";
  if (number <= 2731) return "commentary_history_or_reference_not_strict_sutra";
  return "manuscript_or_suspected_text_scope_boundary";
}

function classifyCbeta(work) {
  if (work.buddhaWordStatus === "excluded_non_buddhist_reference") {
    return { category: "non_buddhist_reference_excluded", ruleId: "cbeta-explicit-non-buddhist" };
  }
  const ids = work.externalIds.cbeta ?? [];
  const numbers = ids.map((id) => /^T(\d{4})/i.exec(id)?.[1]).filter(Boolean).map(Number);
  if (numbers.length === 0) throw new Error(`${work.id} 是 CBETA 作品但没有可解析的 T 编号`);
  const categories = [...new Set(numbers.map(cbetaBucket))];
  if (categories.length !== 1) {
    return { category: "cross_section_work_scope_boundary", ruleId: "cbeta-cross-section", evidenceSections: categories };
  }
  return { category: categories[0], ruleId: `cbeta-taisho-range-${Math.min(...numbers)}-${Math.max(...numbers)}` };
}

function classifyDerge(work) {
  const ids = work.externalIds.derge ?? [];
  if (ids.length === 0) throw new Error(`${work.id} 是德格作品但没有 D 编号`);
  const sections = [...new Set(ids.map((id) => sectionByDergeId.get(id)))];
  if (sections.some((section) => !section)) throw new Error(`${work.id} 存在未映射的德格部类`);
  const categories = [...new Set(sections.map((section) => {
    if (section === "MW22084_S0001") return "canonical_vinaya_not_strict_sutra";
    if (/^MW22084_S000[2-9]$/.test(section) || section === "MW22084_S0010") {
      return "traditional_kangyur_sutra_section_member";
    }
    return "esoteric_scripture_or_ritual_scope_boundary";
  }))];
  if (categories.length !== 1) {
    return { category: "cross_section_work_scope_boundary", ruleId: "derge-cross-section", evidenceSections: sections };
  }
  return { category: categories[0], ruleId: `derge-section-${sections.join("+")}`, evidenceSections: sections };
}

function classifySuttaCentral(work) {
  if (work.workType === "canonical_sutta" || work.workType === "canonical_sutta_collection" || work.workType === "distinct_recension") {
    return { category: "traditional_sutra_or_discourse_canon_member", ruleId: `suttacentral-${work.workType}` };
  }
  if (work.workType === "provisional_cross_language_witness") {
    return { category: "provisional_sutra_witness", ruleId: "suttacentral-provisional-sutra-witness" };
  }
  if (work.id.startsWith("gbcr:work:theravada-") && /patimokkha|vibhanga|vinaya|parivara/.test(work.id)) {
    return { category: "canonical_vinaya_not_strict_sutra", ruleId: "suttacentral-theravada-vinaya" };
  }
  if (work.id.startsWith("gbcr:work:theravada-")) {
    return { category: "canonical_abhidhamma_or_treatise_not_strict_sutra", ruleId: "suttacentral-theravada-abhidhamma" };
  }
  if (work.id.startsWith("gbcr:work:khuddaka-nikaya-")) {
    return { category: "mixed_scriptural_collection_scope_boundary", ruleId: "suttacentral-khuddaka-mixed-collection" };
  }
  throw new Error(`${work.id} 的 SuttaCentral 范围规则未覆盖`);
}

const works = registry.works.map((work) => {
  const sources = [...new Set(work.expressions.map((expression) => expression.sourceSnapshotId))].sort();
  let result;
  if (sources.includes("cbeta_xml_p5")) result = classifyCbeta(work);
  else if (sources.includes("esukhia_derge_kangyur")) result = classifyDerge(work);
  else if (sources.includes("suttacentral_bilara")) result = classifySuttaCentral(work);
  else throw new Error(`${work.id} 没有范围审计规则支持的来源`);
  const definition = categoryDefinitions[result.category];
  if (!definition) throw new Error(`${work.id} 生成未知分类：${result.category}`);
  return {
    workId: work.id,
    title: work.canonicalTitleZh ?? work.canonicalTitle,
    sourceSnapshotIds: sources,
    externalIds: work.externalIds,
    fullSourceText: work.expressions.some((expression) => expression.fullSourceText),
    category: result.category,
    strictSutraScope: definition.strictSutraScope,
    ruleId: result.ruleId,
    ...(result.evidenceSections ? { evidenceSections: result.evidenceSections } : {}),
  };
});

const countBy = (values, key) => Object.fromEntries(
  [...new Set(values.map((value) => value[key]))]
    .sort()
    .map((item) => [item, values.filter((value) => value[key] === item).length]),
);
const strictCandidateWorks = works.filter((work) => work.strictSutraScope.startsWith("included_candidate"));
const summary = {
  registeredWorksAudited: works.length,
  registeredWorksUnclassified: 0,
  ruleClassifiedWorks: works.length,
  independentExpertApprovedWorks: 0,
  strictSutraCandidateWorks: strictCandidateWorks.length,
  strictSutraCandidateWorksWithFullSource: strictCandidateWorks.filter((work) => work.fullSourceText).length,
  categoryCounts: countBy(works, "category"),
  strictScopeDecisionCounts: countBy(works, "strictSutraScope"),
  globalDenominatorImpact: "none_until_scope_policy_identity_deduplication_and_independent_review",
};
if (summary.registeredWorksAudited !== 3377) throw new Error("作品范围审计没有覆盖全部 3,377 部登记作品");
if (new Set(works.map((work) => work.workId)).size !== works.length) throw new Error("作品范围审计出现重复作品");
const expectedCategoryCounts = {
  canonical_abhidhamma_or_treatise_not_strict_sutra: 167,
  canonical_vinaya_not_strict_sutra: 98,
  commentary_history_or_reference_not_strict_sutra: 496,
  cross_section_work_scope_boundary: 20,
  esoteric_scripture_or_ritual_scope_boundary: 1083,
  manuscript_or_suspected_text_scope_boundary: 192,
  mixed_scriptural_collection_scope_boundary: 19,
  non_buddhist_reference_excluded: 9,
  provisional_sutra_witness: 2,
  traditional_kangyur_sutra_section_member: 332,
  traditional_sutra_or_discourse_canon_member: 959,
};
const expectedDecisionCounts = {
  excluded_from_strict_sutra_denominator: 761,
  excluded_non_buddhist_reference: 9,
  included_candidate: 1291,
  included_candidate_requires_identity_review: 2,
  scope_policy_and_item_review_required: 212,
  scope_policy_required: 1102,
};
if (JSON.stringify(summary.categoryCounts) !== JSON.stringify(expectedCategoryCounts)) {
  throw new Error(`作品范围分类统计漂移：${JSON.stringify(summary.categoryCounts)}`);
}
if (JSON.stringify(summary.strictScopeDecisionCounts) !== JSON.stringify(expectedDecisionCounts)) {
  throw new Error(`严格经藏范围决定统计漂移：${JSON.stringify(summary.strictScopeDecisionCounts)}`);
}

const audit = {
  schema: "https://foxue.ai/schemas/gbcr/buddha-word-scope-audit-v0.1",
  version: "1.2.0",
  generatedAt: "2026-08-16",
  status: "complete_rule_classification_of_registered_works_global_denominator_not_publishable",
  inputs: {
    registry: { path: registryPath, sha256: sha256(registryBytes) },
    dergeInventory: { path: dergeInventoryPath, sha256: sha256(dergeInventoryBytes) },
  },
  policy: {
    targetTerm: "佛陀教说／佛经",
    strictOperationalScope: "传统经藏、经部、教说集和经文传本候选；律、论、注疏、史传与目录分开计量。密续、陀罗尼、仪轨、混合集与疑似经必须先通过公开范围政策和逐项复核。",
    traditionalCanonMembershipIsNotVerbatimAuthorship: true,
    physicalFilesAreNotWorks: true,
    expressionsAreNotWorks: true,
    automatedClassificationIsNotIndependentExpertApproval: true,
    unresolvedItemsCountAsUnknownNotZero: true,
    globalPercentagePublishable: false,
  },
  categoryDefinitions,
  summary,
  works,
};
const raw = jsonRaw(audit);

if (verifyMode) {
  if (await readFile(resolve(root, outputPath), "utf8") !== raw) throw new Error(`${outputPath} 不可复现`);
  console.log(`佛陀教说范围审计可复现：${works.length} 部登记作品全部分类，${summary.strictSutraCandidateWorks} 部进入严格经藏候选；全球分母仍不可发布。`);
} else {
  await writeFile(resolve(root, outputPath), raw);
  console.log(`佛陀教说范围审计已生成：${works.length} 部登记作品全部分类，0 部遗漏，0 部独立专家批准。`);
}
