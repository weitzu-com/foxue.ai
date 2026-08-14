import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "0.1.0";
const capturedAt = "2026-08-14";
const paths = {
  queue: "data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json",
  registry: "data/gbcr/registry-v3.5.0.json",
  majjhima: "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
  samyutta: "data/corpus/suttacentral/sn-manifest-v1.0.0.json",
  cbeta: "data/corpus/cbeta/manifest-v2.4.0.json",
};
const outputPath = `data/gbcr/suttacentral-parallel-p0-evidence-packets-v${version}.json`;
const entries = await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => {
  const raw = await readFile(resolve(root, relativePath), "utf8");
  return [key, { relativePath, raw, document: JSON.parse(raw) }];
}));
const inputs = Object.fromEntries(entries);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const queue = inputs.queue.document;
const registry = inputs.registry.document;

requireValue(queue.version === "0.1.0", "汉巴裁决队列版本不匹配");
requireValue(registry.registry?.version === "3.5.0", "GBCR 登记册版本不匹配");

const registryWorkById = new Map(registry.works.map((work) => [work.id, work]));
const cbetaById = new Map(inputs.cbeta.document.files.map((file) => [file.id, file]));
const mnById = new Map(inputs.majjhima.document.files.map((file) => [file.id.toLowerCase(), file]));
const snById = new Map(inputs.samyutta.document.files.map((file) => [file.id.toLowerCase(), file]));

const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1] ?? null;
const plainText = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const binarySearchLastAtOrBefore = (entries, position) => {
  let low = 0;
  let high = entries.length - 1;
  let answer = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (entries[middle].position <= position) {
      answer = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return answer;
};

const buildCbetaInternalIndex = (xml, canonId) => {
  const readingSegments = parseCbetaReadingLines(xml, { canonId });
  const segmentsBySourceLine = new Map();
  for (const segment of readingSegments) {
    requireValue(!segmentsBySourceLine.has(segment.sourceLine), `${canonId} 页栏行号 ${segment.sourceLine} 不唯一`);
    segmentsBySourceLine.set(segment.sourceLine, segment);
  }

  const bodyStart = xml.indexOf("<body>");
  const bodyEnd = xml.indexOf("</body>");
  requireValue(bodyStart >= 0 && bodyEnd > bodyStart, `${canonId} 缺少 TEI body`);
  const lineBreaks = [];
  const suppressedElements = new Set(["note", "rdg"]);
  const tagPattern = /<(\/)?([\w:.-]+)\b[^>]*>/g;
  let suppressedDepth = 0;
  let tagMatch;
  tagPattern.lastIndex = bodyStart;
  while ((tagMatch = tagPattern.exec(xml)) !== null && tagMatch.index < bodyEnd) {
    const [tag, closing, name] = tagMatch;
    if (suppressedElements.has(name)) {
      if (closing) suppressedDepth -= 1;
      else if (!tag.endsWith("/>")) suppressedDepth += 1;
      requireValue(suppressedDepth >= 0, `${canonId} 校注层标签未闭合`);
    } else if (suppressedDepth === 0 && name === "lb" && !closing) {
      const sourceLine = attribute(tag, "n");
      if (sourceLine && segmentsBySourceLine.has(sourceLine)) {
        lineBreaks.push({ position: tagMatch.index, sourceLine });
      }
    }
  }
  requireValue(suppressedDepth === 0, `${canonId} 校注层标签未闭合`);
  requireValue(lineBreaks.length === readingSegments.length, `${canonId} 阅读层行段无法一一映射到 TEI 页栏行`);

  const chapterMarkers = [...xml.matchAll(/<cb:mulu\b[^>]*>[\s\S]*?<\/cb:mulu>/g)]
    .filter((match) => attribute(match[0], "type") === "品")
    .map((match) => ({
      position: match.index,
      number: Number(plainText(match[0]).match(/^\d+/)?.[0]),
      sourceN: attribute(match[0], "n"),
      label: plainText(match[0]),
    }));

  const divPattern = /<\/?cb:div\b[^>]*>/g;
  const stack = [];
  const discourseDivs = [];
  let divMatch;
  while ((divMatch = divPattern.exec(xml)) !== null) {
    const tag = divMatch[0];
    if (tag.startsWith("</")) {
      const open = stack.pop();
      requireValue(open, `${canonId} 出现无起始标签的 cb:div`);
      if (open.type === "jing") {
        const end = divPattern.lastIndex;
        const region = xml.slice(open.position, end);
        const muluMatch = [...region.matchAll(/<cb:mulu\b[^>]*>[\s\S]*?<\/cb:mulu>/g)]
          .find((match) => attribute(match[0], "type") === "經");
        requireValue(muluMatch, `${canonId} 经文 cb:div 缺少经号目录标记`);
        const muluLabel = plainText(muluMatch[0]);
        const discourseNumber = Number(attribute(muluMatch[0], "n") ?? muluLabel.match(/^\d+/)?.[0]);
        requireValue(Number.isSafeInteger(discourseNumber), `${canonId} 经号无法确定：${muluLabel}`);
        const chapterIndex = binarySearchLastAtOrBefore(chapterMarkers, open.position);
        const chapter = chapterIndex >= 0 ? chapterMarkers[chapterIndex] : null;
        const firstLineIndex = binarySearchLastAtOrBefore(lineBreaks, open.position);
        const lastLineIndex = binarySearchLastAtOrBefore(lineBreaks, end);
        requireValue(firstLineIndex >= 0 && lastLineIndex >= firstLineIndex, `${canonId} 经文首尾行无法确定`);
        const rangeLines = lineBreaks.slice(firstLineIndex, lastLineIndex + 1);
        const firstSegment = segmentsBySourceLine.get(rangeLines[0].sourceLine);
        const lastSegment = segmentsBySourceLine.get(rangeLines.at(-1).sourceLine);
        discourseDivs.push({
          discourseNumber,
          discourseLabel: muluLabel,
          chapterNumber: chapter?.number ?? null,
          chapterSourceN: chapter?.sourceN ?? null,
          chapterLabel: chapter?.label ?? null,
          startSegmentId: firstSegment.id,
          endSegmentId: lastSegment.id,
          firstSourceLine: firstSegment.sourceLine,
          lastSourceLine: lastSegment.sourceLine,
          stableSegments: rangeLines.length,
        });
      }
    } else if (!tag.endsWith("/>")) {
      stack.push({ position: divMatch.index, type: attribute(tag, "type") });
    }
  }
  requireValue(stack.length === 0, `${canonId} cb:div 结构未闭合`);
  return discourseDivs;
};

const cbetaSourceInputs = {};
const cbetaInternalIndexes = new Map();
for (const canonId of [...new Set(queue.items
  .filter((item) => item.priority === "p0_scope_caveat_or_counterevidence")
  .map((item) => item.chinese.cbetaId))]) {
  const source = cbetaById.get(canonId);
  requireValue(source, `找不到 ${canonId} 的 CBETA 受控资产`);
  const raw = await readFile(resolve(root, source.localPath), "utf8");
  requireValue(sha256(raw) === source.localSha256, `${canonId} 本地 TEI 哈希与清单不一致`);
  cbetaSourceInputs[canonId] = { file: source.localPath, sha256: source.localSha256 };
  cbetaInternalIndexes.set(canonId, buildCbetaInternalIndex(raw, canonId));
}

const resolveChineseInternalRange = (item) => {
  const reference = item.chinese.reference.toLowerCase();
  const entries = cbetaInternalIndexes.get(item.chinese.cbetaId) ?? [];
  let matches = [];
  let locator;
  const maMatch = reference.match(/^ma(\d+)$/);
  const saMatch = reference.match(/^sa(\d+)$/);
  const eaMatch = reference.match(/^ea(\d+)\.(\d+)$/);
  if (maMatch || saMatch) {
    const discourseNumber = Number((maMatch ?? saMatch)[1]);
    matches = entries.filter((entry) => entry.discourseNumber === discourseNumber);
    locator = { method: "cbeta_tei_jing_div_global_number", discourseNumber };
  } else if (eaMatch) {
    const chapterNumber = Number(eaMatch[1]);
    const discourseNumber = Number(eaMatch[2]);
    matches = entries.filter((entry) => (
      entry.chapterNumber === chapterNumber && entry.discourseNumber === discourseNumber
    ));
    locator = { method: "cbeta_tei_pin_number_plus_jing_number", chapterNumber, discourseNumber };
  } else {
    throw new Error(`暂不支持的 P0 汉译内部标识：${item.chinese.reference}`);
  }
  requireValue(matches.length === 1, `${item.chinese.reference} 应唯一命中一个 CBETA 经文结构，实际 ${matches.length}`);
  return { ...matches[0], locator };
};

const assetSummary = (asset) => ({
  id: asset.id,
  localPath: asset.localPath,
  upstreamPath: asset.upstreamPath,
  upstreamGitBlobSha1: asset.upstreamGitBlobSha1,
  upstreamBytes: asset.upstreamBytes,
  upstreamSha256: asset.upstreamSha256,
  localBytes: asset.localBytes,
  localSha256: asset.localSha256,
  firstSegmentId: asset.firstSegmentId ?? null,
  lastSegmentId: asset.lastSegmentId ?? null,
  segments: asset.segments ?? null,
});

const resolvePaliAsset = (reference) => {
  const baseReference = reference.split("#")[0];
  if (/^mn\d+$/.test(baseReference)) {
    const manifestEntry = mnById.get(baseReference);
    requireValue(manifestEntry, `找不到 ${reference} 的《中部》受控资产`);
    return {
      manifestEntry,
      assets: [assetSummary({ id: manifestEntry.id, ...manifestEntry })],
      requestedScope: reference.includes("#") ? reference.slice(reference.indexOf("#")) : "whole_standalone_sutta",
      scopeStatus: reference.includes("#")
        ? "upstream_fragment_scope_preserved_human_boundary_check_required"
        : "whole_standalone_sutta_source_controlled",
    };
  }

  const snMatch = baseReference.match(/^(sn\d+)\.(\d+)$/);
  requireValue(snMatch, `暂不支持的 P0 巴利标识：${reference}`);
  const manifestEntry = snById.get(snMatch[1]);
  requireValue(manifestEntry, `找不到 ${reference} 的《相应部》受控集合`);
  const sourcePart = manifestEntry.sourceParts?.find((part) => part.id.toLowerCase() === baseReference);
  requireValue(sourcePart, `找不到 ${reference} 的精确巴利来源分片`);
  return {
    manifestEntry,
    assets: [assetSummary(sourcePart)],
    requestedScope: baseReference,
    scopeStatus: "exact_sutta_source_part_controlled_within_registered_collection",
  };
};

const p0Items = queue.items.filter((item) => item.priority === "p0_scope_caveat_or_counterevidence");
const packets = p0Items.map((item) => {
  const paliSource = resolvePaliAsset(item.pali.reference);
  const chineseSource = cbetaById.get(item.chinese.cbetaId);
  requireValue(chineseSource, `找不到 ${item.chinese.cbetaId} 的 CBETA 受控资产`);
  const paliWork = registryWorkById.get(item.pali.workId);
  const chineseWork = registryWorkById.get(item.chinese.workId);
  requireValue(paliWork && chineseWork, `${item.evidenceEdgeId} 的登记作品缺失`);
  const paliExpression = paliWork.expressions.find((expression) => expression.localSlug === item.pali.localSlug);
  const chineseExpression = chineseWork.expressions.find((expression) => expression.localSlug === item.chinese.localSlug);
  requireValue(paliExpression && chineseExpression, `${item.evidenceEdgeId} 的登记表达缺失`);
  const chineseInternalRange = item.chinese.componentWithinRegisteredWork
    ? resolveChineseInternalRange(item)
    : null;

  return {
    id: `gbcr:p0-evidence-packet:${item.id.split(":").at(-1)}`,
    reviewQueueItemId: item.id,
    evidenceEdgeId: item.evidenceEdgeId,
    status: "machine_prepared_preadjudication_materials_not_human_review",
    warning: "本包只固定查证入口与现有反证，不建议裁决结论，不计入真人复核，也不得改变作品数、逐段对齐或全球分母。",
    sourceRelationship: {
      decisionClass: item.sourceDecisionClass,
      upstreamType: item.sourceType,
      resembling: item.resembling,
      upstreamRemark: item.upstreamRemark,
      upstreamRowNumbers: item.upstreamRowNumbers,
      evidenceSha256: item.evidenceSha256,
    },
    pali: {
      reference: item.pali.reference,
      title: item.pali.title,
      workId: item.pali.workId,
      expressionId: paliExpression.id,
      readerUrl: `https://foxue.ai/jingzang/${item.pali.localSlug}`,
      registeredStableSegments: paliExpression.stableSegments,
      requestedScope: paliSource.requestedScope,
      scopeStatus: paliSource.scopeStatus,
      controlledAssets: paliSource.assets,
    },
    chinese: {
      reference: item.chinese.reference,
      cbetaId: item.chinese.cbetaId,
      title: item.chinese.title,
      workId: item.chinese.workId,
      expressionId: chineseExpression.id,
      readerUrl: `https://foxue.ai/jingzang/${item.chinese.localSlug}`,
      registeredStableSegments: chineseExpression.stableSegments,
      requestedScope: item.chinese.reference,
      scopeStatus: chineseInternalRange
        ? "exact_internal_agama_tei_div_and_line_range_machine_located_pending_human_boundary_check"
        : "registered_standalone_chinese_expression",
      exactInternalRange: chineseInternalRange ? {
        ...chineseInternalRange,
        readerUrl: `https://foxue.ai/jingzang/${item.chinese.localSlug}#${chineseInternalRange.startSegmentId}`,
        boundaryStatus: "machine_located_from_cbeta_tei_structure_pending_human_check",
      } : null,
      controlledAssets: [assetSummary({ id: chineseSource.id, ...chineseSource })],
    },
    humanTasksStillRequired: [
      "人工核对机器从 CBETA TEI 目录结构提取的汉译内部经文首尾锚点；不得据此声称整部合集与巴利单经等同",
      "逐项核对两端开头、结尾、地点、人物、叙事框架、章节结构、教义次序与显著增删",
      "核对上游备注中引用的替代平行、反例、页码与现代研究，不把上游摘要当作已完成复核",
      "分别保存最强支持证据与最强反证，并说明底本、版本、范围和不确定性",
      "核对原文、转写、译文和研究引用的权利边界；受限正文不得进入证据包",
      "由两名具名真人独立提交复核；结论或范围不一致时交由第三位仲裁者",
    ],
    humanReviewProgress: {
      completedIndependentReviews: item.reviews.length,
      requiredIndependentReviews: item.requiredReviews,
      adjudicated: item.adjudication !== null,
      aiReviewCredits: 0,
    },
    automaticWorkMerge: false,
    automaticSegmentAlignment: false,
    denominatorImpact: "none",
  };
});

const summary = {
  packets: packets.length,
  packetsWithUpstreamRemarksOrCounterevidence: packets.filter((packet) => packet.sourceRelationship.upstreamRemark).length,
  exactPaliStandaloneOrSourcePartAssets: packets.filter((packet) => packet.pali.controlledAssets.length === 1).length,
  exactChineseInternalTeiRangesMachineLocated: packets.filter((packet) => packet.chinese.exactInternalRange).length,
  chineseInternalRangesPendingHumanBoundaryCheck: packets.filter((packet) => packet.chinese.exactInternalRange?.boundaryStatus === "machine_located_from_cbeta_tei_structure_pending_human_check").length,
  completedIndependentReviews: packets.reduce((sum, packet) => sum + packet.humanReviewProgress.completedIndependentReviews, 0),
  adjudicatedItems: packets.filter((packet) => packet.humanReviewProgress.adjudicated).length,
  automaticWorkMerges: 0,
  denominatorImpact: "none",
};

requireValue(summary.packets === 20, "P0 审前证据包数量漂移");
requireValue(summary.packetsWithUpstreamRemarksOrCounterevidence === 20, "P0 证据包必须全部保留上游备注或反证");
requireValue(summary.exactPaliStandaloneOrSourcePartAssets === 20, "P0 证据包必须全部连接精确巴利受控资产");
requireValue(summary.exactChineseInternalTeiRangesMachineLocated === 20, "P0 汉译内部范围必须全部由 CBETA TEI 结构唯一定位");
requireValue(summary.chineseInternalRangesPendingHumanBoundaryCheck === 20, "机器定位的 P0 汉译边界必须全部待真人核对");
requireValue(summary.completedIndependentReviews === 0 && summary.adjudicatedItems === 0, "机器审前材料不得伪造人工复核或裁决");
requireValue(new Set(packets.map((packet) => packet.evidenceEdgeId)).size === packets.length, "P0 审前证据包存在重复关系边");

const document = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1",
  version,
  capturedAt,
  status: "machine_prepared_p0_materials_pending_two_independent_human_reviews",
  warning: "20 份证据包都不是学术复核或裁决。它们只减少寻找来源的机械劳动；作品判断仍须两名独立真人与必要仲裁。",
  generatedFrom: Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, {
    file: input.relativePath,
    sha256: sha256(input.raw),
  }])),
  cbetaSourceInputs,
  summary,
  packets,
};

const outputRaw = `${JSON.stringify(document, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  requireValue(await readFile(resolve(root, outputPath), "utf8") === outputRaw, `${outputPath} 不可复现`);
  console.log(`汉巴 P0 审前证据包 v${version} 可复现：20 份机器材料，0 份人工复核，0 项自动归并。`);
} else {
  await writeFile(resolve(root, outputPath), outputRaw, "utf8");
  console.log(`汉巴 P0 审前证据包 v${version} 已生成：20 份机器材料，全部待双人独立复核。`);
}
