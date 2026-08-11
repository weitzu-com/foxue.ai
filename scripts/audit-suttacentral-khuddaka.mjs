import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const version = "1.2.0";
const expectedCommit = "eac6c24781dd1eefdc17dc2f787b54bf6fe31719";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-suttacentral-khuddaka.mjs --source-dir=/固定提交的/bilara-data");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const bookDefinitions = {
  bv: { id: "BV", titlePali: "Buddhavaṁsa", titleZh: "佛种姓", records: 29, bytes: 194838, segments: 4408, readingUnits: 49, scopeNoteZh: "记述过去佛与释迦牟尼佛授记传统的偈颂文本。" },
  cnd: { id: "CND", titlePali: "Cūḷaniddesa", titleZh: "小义释", records: 23, bytes: 760787, segments: 8849, readingUnits: 85, scopeNoteZh: "对《经集》部分偈颂的义释文本，不自动标作佛陀亲说。" },
  cp: { id: "CP", titlePali: "Cariyāpiṭaka", titleZh: "所行藏", records: 35, bytes: 75260, segments: 1699, readingUnits: 36, scopeNoteZh: "以偈颂叙述菩萨圆满诸波罗蜜的行传。" },
  dhp: { id: "DHP", titlePali: "Dhammapada", titleZh: "法句", records: 26, bytes: 99950, segments: 2234, readingUnits: 27, reused: true, scopeNoteZh: "已在 v0.7 作为一部作品、一个完整文本表达登记。" },
  iti: { id: "ITI", titlePali: "Itivuttaka", titleZh: "如是语", records: 112, bytes: 181424, segments: 2961, readingUnits: 112, scopeNoteZh: "以“世尊如是说”传承的短篇经文与偈颂。" },
  ja: { id: "JA", titlePali: "Jātaka", titleZh: "本生", records: 547, bytes: 1503084, segments: 30965, readingUnits: 680, scopeNoteZh: "固定根文本主要保存本生偈与结构，不等同于后世完整故事注释。" },
  kp: { id: "KP", titlePali: "Khuddakapāṭha", titleZh: "小诵", records: 9, bytes: 17885, segments: 368, readingUnits: 9, scopeNoteZh: "九篇供诵习与修持使用的短篇文本。" },
  mil: { id: "MIL", titlePali: "Milindapañha", titleZh: "弥兰王问", records: 248, bytes: 956998, segments: 8021, readingUnits: 256, scopeNoteZh: "弥兰王与那先比丘的问答集，属于后期论辩文本，不标作佛陀亲说。" },
  mnd: { id: "MND", titlePali: "Mahāniddesa", titleZh: "大义释", records: 16, bytes: 1086142, segments: 12291, readingUnits: 111, scopeNoteZh: "对《经集》义品的义释文本，不自动标作佛陀亲说。" },
  ne: { id: "NE", titlePali: "Netti", titleZh: "导论", records: 37, bytes: 386320, segments: 4372, readingUnits: 61, scopeNoteZh: "解释与组织佛法教说的方法论文本；不同传承的正典地位不一。" },
  pe: { id: "PE", titlePali: "Peṭakopadesa", titleZh: "藏释", records: 9, bytes: 428731, segments: 4655, readingUnits: 43, scopeNoteZh: "用于解释经教的方法论文本；不同传承的正典地位不一。" },
  ps: { id: "PS", titlePali: "Paṭisambhidāmagga", titleZh: "无碍解道", records: 31, bytes: 1213183, segments: 14489, readingUnits: 136, scopeNoteZh: "以分析体例阐释修道与无碍解的经典文本。" },
  pv: { id: "PV", titlePali: "Petavatthu", titleZh: "饿鬼事", records: 51, bytes: 173733, segments: 3626, readingUnits: 60, scopeNoteZh: "以偈颂叙述饿鬼业果与布施回向的文本。" },
  snp: { id: "SNP", titlePali: "Sutta Nipāta", titleZh: "经集", records: 73, bytes: 323169, segments: 5765, readingUnits: 90, scopeNoteZh: "汇集古老偈颂与短篇教说的经文集。" },
  "tha-ap": { id: "THA-AP", titlePali: "Therāpadāna", titleZh: "长老譬喻", records: 563, bytes: 1442464, segments: 28881, readingUnits: 626, scopeNoteZh: "长老过去行愿与证悟因缘的偈颂传记集。" },
  thag: { id: "THAG", titlePali: "Theragāthā", titleZh: "长老偈", records: 264, bytes: 333273, segments: 6919, readingUnits: 275, scopeNoteZh: "早期长老表达修行与解脱体验的偈颂集。" },
  "thi-ap": { id: "THI-AP", titlePali: "Therīapadāna", titleZh: "长老尼譬喻", records: 40, bytes: 273608, segments: 5597, readingUnits: 67, scopeNoteZh: "长老尼过去行愿与证悟因缘的偈颂传记集。" },
  thig: { id: "THIG", titlePali: "Therīgāthā", titleZh: "长老尼偈", records: 73, bytes: 122187, segments: 2466, readingUnits: 78, scopeNoteZh: "早期长老尼表达修行与解脱体验的偈颂集。" },
  ud: { id: "UD", titlePali: "Udāna", titleZh: "自说", records: 80, bytes: 260459, segments: 2681, readingUnits: 80, scopeNoteZh: "八品八十篇以因缘与世尊感兴语组成的经文。" },
  vv: { id: "VV", titlePali: "Vimānavatthu", titleZh: "天宫事", records: 85, bytes: 220053, segments: 4554, readingUnits: 92, scopeNoteZh: "以偈颂叙述善业果报与天界宫殿的文本。" },
};
const sourceTemplate = JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/an-batch-v1.1.0.json"), "utf8"));
const dhammapadaBatch = JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json"), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const compareNatural = (left, right) => {
  const leftParts = left.match(/\d+|\D+/g) ?? [];
  const rightParts = right.match(/\d+|\D+/g) ?? [];
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    if (leftParts[index] === undefined) return -1;
    if (rightParts[index] === undefined) return 1;
    const leftNumber = /^\d+$/.test(leftParts[index]) ? Number(leftParts[index]) : null;
    const rightNumber = /^\d+$/.test(rightParts[index]) ? Number(rightParts[index]) : null;
    const difference = leftNumber !== null && rightNumber !== null
      ? leftNumber - rightNumber
      : leftParts[index].localeCompare(rightParts[index], "en");
    if (difference !== 0) return difference;
  }
  return 0;
};

const treeOutput = execFileSync(
  "git",
  ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", "root/pli/ms/sutta/kn"],
  { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
);
const candidates = treeOutput.split("\0").filter(Boolean).map((line) => {
  const match = line.match(/^\d+ blob ([a-f0-9]{40})\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`无法解析上游 Git tree：${line}`);
  return { sha: match[1], size: Number(match[2]), path: match[3] };
}).filter((entry) => entry.path.endsWith("_root-pli-ms.json"))
  .sort((left, right) => compareNatural(left.path, right.path));
if (candidates.length !== 2351) throw new Error(`《小部》固定目录应有 2,351 个 root 记录，实际为 ${candidates.length}`);

const files = [];
const books = [];
for (const [prefix, definition] of Object.entries(bookDefinitions)) {
  const bookCandidates = candidates.filter((entry) => entry.path.startsWith(`root/pli/ms/sutta/kn/${prefix}/`));
  if (bookCandidates.length !== definition.records) throw new Error(`${definition.id} 来源记录数漂移`);
  let bookBytes = 0;
  let bookSegments = 0;
  let bookUnits = 0;
  for (const candidate of bookCandidates) {
    const upstream = await readFile(resolve(sourceRoot, candidate.path));
    if (upstream.length !== candidate.size || gitBlobSha1(upstream) !== candidate.sha || upstream.at(-1) === 10) {
      throw new Error(`${candidate.path} 固定 Git 对象、字节数或换行假设不一致`);
    }
    const parsed = JSON.parse(upstream.toString("utf8"));
    const entries = Object.entries(parsed);
    if (entries.length === 0 || entries.some(([, text]) => typeof text !== "string" || !text.trim())) {
      throw new Error(`${candidate.path} 含空白或无效正文`);
    }
    bookBytes += upstream.length;
    bookSegments += entries.length;
    if (definition.reused) {
      const existing = dhammapadaBatch.files.find((file) => file.upstreamPath === candidate.path);
      if (!existing || existing.upstreamGitBlobSha1 !== candidate.sha || existing.upstreamSha256 !== sha256(upstream)) {
        throw new Error(`${candidate.path} 与既有《法句》固定批次不一致`);
      }
      continue;
    }
    const filename = candidate.path.split("/").at(-1);
    const recordId = filename.replace("_root-pli-ms.json", "");
    const escapedRecordId = recordId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const segmentPattern = new RegExp(`^${escapedRecordId}:(\\d+(?:[.-]\\d+)*)$`);
    if (entries.some(([id]) => !segmentPattern.test(id))) throw new Error(`${candidate.path} 含无效原生段落标识`);
    const recordTitlePali = ["0.4", "0.3", "0.2", "0.1"]
      .map((suffix) => parsed[`${recordId}:${suffix}`]?.trim())
      .find((title) => title && title !== "~");
    if (!recordTitlePali) throw new Error(`${candidate.path} 缺少可读标题`);
    const readingUnits = Math.ceil(entries.length / 120);
    bookUnits += readingUnits;
    const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
    const localPath = `data/corpus/suttacentral/${candidate.path}`;
    const destination = resolve(root, localPath);
    await mkdir(dirname(destination), { recursive: true });
    try {
      const existing = await readFile(destination);
      if (!existing.equals(normalized)) throw new Error(`${localPath} 已存在但内容不同`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await writeFile(destination, normalized, { flag: "wx" });
    }
    files.push({
      id: recordId.toUpperCase(),
      recordId,
      collectionId: definition.id,
      slug: `khuddaka-nikaya-${prefix}`,
      workId: `gbcr:work:khuddaka-nikaya-${prefix}-pali`,
      language: "pi-Latn",
      parser: "bilara_series_root_json",
      format: "application/json",
      titleZh: definition.titleZh,
      titlePali: definition.titlePali,
      recordTitlePali,
      scopeNoteZh: definition.scopeNoteZh,
      tradition: "上座部佛教",
      edition: "Mahāsaṅgīti Tipiṭaka Buddhavasse 2500",
      sourceUrl: `https://suttacentral.net/${recordId}/pli/ms`,
      localPath,
      upstreamPath: candidate.path,
      upstreamGitBlobSha1: candidate.sha,
      upstreamBytes: upstream.length,
      upstreamSha256: sha256(upstream),
      localBytes: normalized.length,
      localSha256: sha256(normalized),
      firstSegmentId: entries[0][0],
      lastSegmentId: entries.at(-1)[0],
      segments: entries.length,
      readingUnits,
    });
  }
  if (bookBytes !== definition.bytes || bookSegments !== definition.segments) {
    throw new Error(`${definition.id} 固定字节数或段落数漂移`);
  }
  if (!definition.reused && bookUnits !== definition.readingUnits) throw new Error(`${definition.id} 阅读单元数漂移`);
  books.push({
    id: definition.id,
    prefix,
    titlePali: definition.titlePali,
    titleZh: definition.titleZh,
    scopeNoteZh: definition.scopeNoteZh,
    recordCount: definition.records,
    sourceBytes: definition.bytes,
    stableSegments: definition.segments,
    readingUnits: definition.readingUnits,
    reusedFromVersion: definition.reused ? "0.7.0" : null,
  });
}

const batch = {
  schema: "https://foxue.ai/schemas/corpus-source-batch-v0.3",
  version,
  source: sourceTemplate.source,
  rightsDecision: sourceTemplate.rightsDecision,
  normalization: sourceTemplate.normalization,
  collection: {
    id: "KN",
    canonicalTitle: "Khuddaka Nikāya",
    titleZh: "小部",
    tradition: "上座部佛教",
    language: "pi-Latn",
    bookCount: books.length,
    newBookCount: books.filter((book) => !book.reusedFromVersion).length,
    recordCount: candidates.length,
    newRecordCount: files.length,
    sourceBytes: books.reduce((sum, book) => sum + book.sourceBytes, 0),
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    stableSegments: books.reduce((sum, book) => sum + book.stableSegments, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.segments, 0),
    readingUnits: books.reduce((sum, book) => sum + book.readingUnits, 0),
    newReadingUnits: files.reduce((sum, file) => sum + file.readingUnits, 0),
    workCountingDecision: "20 个书级文本集合分别登记；2,351 个物理 root 记录与作品数分开统计。《法句》沿用既有作品，其余新增 19 个书级作品；不同体裁与不同传承的正典地位不被抹平。",
  },
  books,
  files,
};
if (
  batch.collection.sourceBytes !== 10053548 || batch.collection.newSourceBytes !== 9953598 ||
  batch.collection.stableSegments !== 155801 || batch.collection.newStableSegments !== 153567 ||
  batch.collection.readingUnits !== 2973 || batch.collection.newReadingUnits !== 2946
) throw new Error("《小部》总量审计结果漂移");
await writeFile(
  resolve(root, `data/corpus/suttacentral/kn-batch-v${version}.json`),
  `${JSON.stringify(batch, null, 2)}\n`,
  "utf8",
);
console.log(`《小部》审计完成：20 书、2,351 个来源记录；新增 19 书、${files.length} 个记录、${batch.collection.newStableSegments} 个稳定段落。`);
