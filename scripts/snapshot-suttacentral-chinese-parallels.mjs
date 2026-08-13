import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const version = "0.7.0";
const capturedAt = "2026-08-14";
const repository = "suttacentral/relationship_edges";
const commit = "80b2a63d8442517c1f8be90c4b597088eb855852";
const tree = "fdd28b1cbde84787d737784457d5f66c324d1bfd";
const csvPath = "relationships_refactored.csv";
const csvBytes = 45_633_043;
const csvRows = 421_159;
const csvSha256 = "8481c812e38d2318a0bf70e9d7ea2320f2fe003e47d121f639966ac107736c80";
const registryPath = "data/gbcr/registry-v3.3.0.json";
const outputPath = `data/gbcr/suttacentral-chinese-parallels-v${version}.json`;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchRaw = async (relativePath) => {
  const url = `https://raw.githubusercontent.com/${repository}/${commit}/${relativePath}`;
  const { stdout } = await execFileAsync("curl", [
    "-fsSL",
    "--retry", "4",
    "--retry-all-errors",
    "--retry-delay", "1",
    "--connect-timeout", "15",
    "--max-time", "180",
    url,
  ], {
    encoding: "buffer",
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
};

function* parseCsv(text) {
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
      yield row;
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
    yield row;
  }
}

const normalizeReference = (value) => value.trim().toLowerCase();
const baseReference = (value) => normalizeReference(value).split("#", 1)[0];
const isBoundaryPrefix = (value, prefix) =>
  value === prefix || value.startsWith(`${prefix}.`) || value.startsWith(`${prefix}-`)
    || (prefix.length <= 4 && value.startsWith(prefix) && /^\d/.test(value[prefix.length] ?? ""));

const registryRaw = await readFile(resolve(root, registryPath), "utf8");
const registry = JSON.parse(registryRaw);
requireValue(registry.registry?.version === "3.3.0", "GBCR 登记册版本不匹配");

const paliExact = new Map();
const paliCollections = [];
const cbetaWorks = new Map();
for (const work of registry.works) {
  const expressions = work.expressions ?? [];
  const paliExpression = expressions.find((expression) => expression.language === "pi-Latn");
  if (paliExpression) {
    for (const id of work.externalIds?.suttacentral ?? []) {
      paliExact.set(normalizeReference(id), {
        work,
        component: false,
        matchedBy: "exact_suttacentral_identifier",
      });
    }
    for (const id of work.externalIds?.suttacentralSourceRecords ?? []) {
      paliExact.set(normalizeReference(id), {
        work,
        component: true,
        matchedBy: "source_record_within_registered_collection",
      });
    }
    for (const id of work.externalIds?.suttacentralCollection ?? []) {
      paliCollections.push([normalizeReference(id), work]);
    }
  }
  for (const id of work.externalIds?.cbeta ?? []) {
    if (/^T\d{4}$/.test(id)) cbetaWorks.set(id, work);
  }
}
paliCollections.sort(([left], [right]) => right.length - left.length || left.localeCompare(right));

const resolvePali = (reference) => {
  const base = baseReference(reference);
  const exact = paliExact.get(base);
  if (exact) return exact;
  const collection = paliCollections.find(([prefix]) => isBoundaryPrefix(base, prefix));
  return collection
    ? { work: collection[1], component: base !== collection[0], matchedBy: "contained_by_registered_collection" }
    : null;
};

const agamaCollections = [
  [/^da\d+(?:\.\d+)?$/, "T0001", "Dīrgha Āgama 内部经号"],
  [/^ma\d+(?:\.\d+)?$/, "T0026", "Madhyama Āgama 内部经号"],
  [/^sa\d+(?:\.\d+)?$/, "T0099", "Saṃyukta Āgama 内部经号"],
  [/^sa-2\.\d+(?:\.\d+)?$/, "T0100", "别译杂阿含内部经号"],
  [/^sa-3\.\d+(?:\.\d+)?$/, "T0101", "杂阿含别本内部经号"],
  [/^ea\d+(?:\.\d+)?$/, "T0125", "Ekottarika Āgama 内部经号"],
];

const resolveChinese = (reference) => {
  const base = baseReference(reference);
  const direct = base.match(/^t(\d{1,4})(?:\.\d+)?$/);
  if (direct) {
    const cbetaId = `T${direct[1].padStart(4, "0")}`;
    const work = cbetaWorks.get(cbetaId);
    return work ? {
      work,
      cbetaId,
      component: base !== `t${Number(direct[1])}`,
      matchedBy: "direct_taisho_identifier",
    } : null;
  }
  for (const [pattern, cbetaId, matchedBy] of agamaCollections) {
    if (!pattern.test(base)) continue;
    const work = cbetaWorks.get(cbetaId);
    return work ? { work, cbetaId, component: true, matchedBy } : null;
  }
  return null;
};

const classify = ({ type, resembling, pali, chinese, paliReference, chineseReference }) => {
  if (type === "mention") return "citation_or_mention_only";
  if (resembling) return "resembling_or_partial_parallel";
  if (pali.component || chinese.component || paliReference.includes("#") || chineseReference.includes("#")) {
    return "component_parallel_within_registered_work";
  }
  return "full_parallel_without_automatic_work_merge";
};

const [csv, license] = await Promise.all([fetchRaw(csvPath), fetchRaw("LICENSE")]);
requireValue(csv.length === csvBytes, "SuttaCentral relationships CSV 字节数漂移");
requireValue(sha256(csv) === csvSha256, "SuttaCentral relationships CSV SHA-256 漂移");
requireValue(license.toString("utf8").includes("MIT License"), "SuttaCentral relationships MIT 许可声明缺失");

const rows = parseCsv(csv.toString("utf8"));
const header = ["_from", "_to", "from", "to", "number", "remark", "resembling", "type"];

let rowCount = 0;
let relevantDirectedRows = 0;
const deduplicated = new Map();
for (const row of rows) {
  rowCount += 1;
  requireValue(row.length === header.length, `关系表第 ${rowCount} 行字段数异常`);
  const record = Object.fromEntries(header.map((key, index) => [key, row[index]]));
  const from = normalizeReference(record.from);
  const to = normalizeReference(record.to);
  const fromPali = resolvePali(from);
  const toPali = resolvePali(to);
  const fromChinese = resolveChinese(from);
  const toChinese = resolveChinese(to);
  const orientation = fromPali && toChinese
    ? { pali: fromPali, chinese: toChinese, paliReference: from, chineseReference: to }
    : toPali && fromChinese
      ? { pali: toPali, chinese: fromChinese, paliReference: to, chineseReference: from }
      : null;
  if (!orientation) continue;
  relevantDirectedRows += 1;
  const resembling = record.resembling.toLowerCase() === "true";
  const key = [
    orientation.paliReference,
    orientation.chineseReference,
    record.type,
    resembling,
    record.remark,
  ].join("\t");
  const existing = deduplicated.get(key);
  if (existing) {
    existing.upstreamDirections += 1;
    existing.upstreamRowNumbers.push(rowCount);
    continue;
  }
  deduplicated.set(key, {
    id: `gbcr:parallel:${sha256(key).slice(0, 16)}`,
    decisionClass: classify({ ...orientation, type: record.type, resembling }),
    upstreamType: record.type,
    resembling,
    remark: record.remark || null,
    pali: {
      reference: orientation.paliReference,
      workId: orientation.pali.work.id,
      title: orientation.pali.work.canonicalTitleZh ?? orientation.pali.work.canonicalTitle,
      localSlug: orientation.pali.work.expressions.find((expression) => expression.language === "pi-Latn")?.localSlug ?? null,
      componentWithinRegisteredWork: orientation.pali.component || orientation.paliReference.includes("#"),
      matchedBy: orientation.pali.matchedBy,
    },
    chinese: {
      reference: orientation.chineseReference,
      cbetaId: orientation.chinese.cbetaId,
      workId: orientation.chinese.work.id,
      title: orientation.chinese.work.canonicalTitle,
      localSlug: orientation.chinese.work.expressions[0]?.localSlug ?? null,
      componentWithinRegisteredWork: orientation.chinese.component || orientation.chineseReference.includes("#"),
      matchedBy: orientation.chinese.matchedBy,
    },
    upstreamDirections: 1,
    upstreamRowNumbers: [rowCount],
    evidenceSha256: sha256([record.from, record.to, record.number, record.remark, record.resembling, record.type].join("\t")),
    decisionBoundary: "这是 SuttaCentral 固定关系表中的平行证据；不自动断言同一作品、逐段等同、译文对应或全球分母归并。",
  });
}

requireValue(rowCount === csvRows, "SuttaCentral relationships CSV 行数漂移");
const parallels = [...deduplicated.values()].sort((left, right) =>
  left.pali.reference.localeCompare(right.pali.reference, "en", { numeric: true })
    || left.chinese.reference.localeCompare(right.chinese.reference, "en", { numeric: true })
    || left.decisionClass.localeCompare(right.decisionClass),
);
const countBy = (selector) => Object.fromEntries([...parallels.reduce((map, item) => {
  const key = selector(item);
  map.set(key, (map.get(key) ?? 0) + 1);
  return map;
}, new Map())].sort(([left], [right]) => left.localeCompare(right)));
const unique = (values) => new Set(values).size;

const summary = {
  upstreamRows: rowCount,
  relevantDirectedRows,
  deduplicatedParallelEdges: parallels.length,
  duplicateDirectionsRemoved: relevantDirectedRows - parallels.length,
  decisionClasses: countBy((item) => item.decisionClass),
  upstreamTypes: countBy((item) => item.upstreamType),
  resemblingEdges: parallels.filter((item) => item.resembling).length,
  edgesWithRemarks: parallels.filter((item) => item.remark).length,
  paliWorksReferenced: unique(parallels.map((item) => item.pali.workId)),
  chineseWorksReferenced: unique(parallels.map((item) => item.chinese.workId)),
  directTaishoWorksReferenced: unique(parallels.filter((item) => item.chinese.matchedBy === "direct_taisho_identifier").map((item) => item.chinese.workId)),
  agamaContainerWorksReferenced: unique(parallels.filter((item) => item.chinese.matchedBy !== "direct_taisho_identifier").map((item) => item.chinese.workId)),
  denominatorImpact: "none",
};
requireValue(summary.relevantDirectedRows === 10_596, "SuttaCentral 汉巴相关有向关系数漂移");
requireValue(summary.deduplicatedParallelEdges === 5_161, "SuttaCentral 汉巴去重关系边数漂移");
requireValue(summary.duplicateDirectionsRemoved === 5_435, "SuttaCentral 汉巴反向重复关系数漂移");
requireValue(summary.decisionClasses.full_parallel_without_automatic_work_merge === 60, "SuttaCentral 汉巴整经关系数漂移");
requireValue(summary.decisionClasses.component_parallel_within_registered_work === 3_345, "SuttaCentral 汉巴组件关系数漂移");
requireValue(summary.decisionClasses.resembling_or_partial_parallel === 1_130, "SuttaCentral 汉巴近似关系数漂移");
requireValue(summary.decisionClasses.citation_or_mention_only === 626, "SuttaCentral 汉巴引用关系数漂移");
requireValue(summary.upstreamTypes.full === 4_535 && summary.upstreamTypes.mention === 626, "SuttaCentral 上游关系类型数漂移");
requireValue(summary.resemblingEdges === 1_239 && summary.edgesWithRemarks === 20, "SuttaCentral 近似或备注证据数漂移");
requireValue(summary.paliWorksReferenced === 246 && summary.chineseWorksReferenced === 147, "SuttaCentral 汉巴关系覆盖作品数漂移");
requireValue(summary.directTaishoWorksReferenced === 141 && summary.agamaContainerWorksReferenced === 6, "SuttaCentral 汉译标识映射数漂移");

const document = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-chinese-parallels-v0.7",
  version,
  capturedAt,
  status: "fixed_upstream_parallel_evidence_without_automatic_work_merge",
  warning: "平行边数量不是去重作品数，也不是全球佛典分母。整经、组件、近似和提及关系必须分层解释。",
  policy: {
    automaticWorkMerge: false,
    segmentEquivalenceAsserted: false,
    translationEquivalenceAsserted: false,
    directionalDuplicatesCollapsed: true,
    mentionsSeparated: true,
    resemblingSeparated: true,
    aggregateContainerBoundaryPreserved: true,
  },
  source: {
    repository,
    commit,
    tree,
    file: csvPath,
    bytes: csv.length,
    rows: rowCount,
    headerPresent: false,
    columnsAssignedFromUpstreamAnalysisCode: header,
    sha256: sha256(csv),
    license: "MIT",
    licenseFile: "LICENSE",
    licenseSha256: sha256(license),
    sourceUrl: `https://github.com/${repository}/blob/${commit}/${csvPath}`,
  },
  registry: {
    file: registryPath,
    version: registry.registry.version,
    sha256: sha256(registryRaw),
  },
  summary,
  integrity: {
    parallelSetSha256: sha256(parallels.map((item) => [
      item.pali.reference,
      item.chinese.reference,
      item.decisionClass,
      item.upstreamType,
      item.resembling,
      item.remark ?? "",
      item.evidenceSha256,
    ].join("\t")).join("\n")),
  },
  parallels,
};
const raw = serialize(document);

if (process.argv.includes("--verify")) {
  requireValue(await readFile(resolve(root, outputPath), "utf8") === raw, `${outputPath} 不可复现`);
  console.log(`SuttaCentral 汉巴平行证据 v${version} 可复现：${summary.deduplicatedParallelEdges} 条去重关系边，引用 ${summary.paliWorksReferenced} 个巴利作品与 ${summary.chineseWorksReferenced} 个汉译作品；全球分母未改变。`);
} else if (process.argv.includes("--write")) {
  await writeFile(resolve(root, outputPath), raw, "utf8");
  console.log(`SuttaCentral 汉巴平行证据 v${version} 已生成：${summary.deduplicatedParallelEdges} 条去重关系边。`);
} else {
  process.stdout.write(raw);
}
