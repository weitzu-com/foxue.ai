import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  HUMAN_SOURCE_MARKER,
  ReviewIntakeError,
  buildAcceptedLedger,
  candidateSha256,
  revalidateCandidateAgainstQueue,
  validateGlobalReviewIssueEvent,
  validateStoredCandidate,
} from "./global-review-intake.mjs";
import {
  arbitratorIsInstitutionallyIndependent,
  hasInstitutionallyIndependentPair,
} from "./global-review-consensus.mjs";

const queueRaw = await readFile("data/gbcr/global-denominator-review-queue-v0.1.0.json");
const queue = JSON.parse(queueRaw.toString("utf8"));
const ledger = JSON.parse(await readFile("data/gbcr/global-denominator-review-ledger-v0.1.0.json", "utf8"));
const issueTemplate = await readFile(".github/ISSUE_TEMPLATE/global-denominator-review.yml", "utf8");
const templateFieldLabels = [...issueTemplate.matchAll(/^      label: (.+)$/gm)].map((match) => match[1]);
assert.deepEqual(templateFieldLabels, [
  "队列 ID",
  "机构或独立身份",
  "复核者身份、语言能力与独立性",
  "来源、底本与文本范围",
  "严格佛经范围意见",
  "范围证据与理由",
  "作品身份意见",
  "作品身份比较",
  "来源与范围核验意见",
  "最强支持证据",
  "最强反证与不确定性",
  "权利与引用边界",
  "利益冲突披露",
  "复核声明",
], "Issue Form 字段及顺序必须与摄取协议保持一致");

const attestations = [
  "我是对本意见负责的自然人；AI 未代替我署名或作出最终判断。",
  "我在查看其他复核者的结论前独立完成本次判断。",
  "我具备或已如实说明核对相关语言、目录与版本证据的能力。",
  "我记录了支持证据、反证、权利边界和利益冲突。",
  "我理解单份意见不会自动合并作品、排除候选或改变全球分母。",
  "我同意意见、修订、署名和仲裁记录被公开长期保存，以便复核与纠错。",
];

function issueBody(queueId, overrides = {}) {
  const values = {
    "队列 ID": queueId,
    "机构或独立身份": "独立研究者：中国上海",
    "复核者身份、语言能力与独立性": "张三，能够直接阅读梵文与汉文目录，具有佛教文献目录学研究经历，并在提交前未查看其他复核结论。",
    "来源、底本与文本范围": [
      `任务：${queueId}`,
      "来源快照：suttacentral_bilara",
      "外部证据：https://suttacentral.net/sf276",
      HUMAN_SOURCE_MARKER,
      "已逐项核对完整梵文底本、首尾范围和目录标识，未把局部引文误作整部作品。",
    ].join("\n"),
    "严格佛经范围意见": "include_strict_sutra",
    "范围证据与理由": "传统目录与原文自称均把该文本归入经类；已核对首尾和内容结构，当前证据支持纳入严格佛经候选。",
    "作品身份意见": "identity_uncertain",
    "作品身份比较": "已比较题名、首尾、结构和已知平行本，但现有目录连接不足以证明与另一记录为同一作品，因此保持身份未决。",
    "来源与范围核验意见": "source_supported",
    "最强支持证据": "SuttaCentral 公开原文与稳定标识可核对：https://suttacentral.net/sf276",
    "最强反证与不确定性": "尚未找到第二份完整写本，跨语言作品身份仍可能变化，因此不主张自动归并。",
    "权利与引用边界": "仅引用公开元数据、短定位信息与允许访问的原文链接，不复制受限制长篇内容。",
    "利益冲突披露": "无已知利益冲突。",
    "复核声明": attestations.map((value) => `- [X] ${value}`).join("\n"),
    ...overrides,
  };
  return Object.entries(values).map(([label, value]) => `### ${label}\n\n${value}`).join("\n\n");
}

function eventFor({ number = 101, author = "sutra-reviewer", userType = "User", queueId = queue.items[0].queueId, overrides = {} } = {}) {
  return {
    action: "opened",
    repository: { full_name: "weitzu-com/foxue.ai" },
    issue: {
      number,
      state: "open",
      title: `[全球分母复核] ${queueId}`,
      body: issueBody(queueId, overrides),
      html_url: `https://github.com/weitzu-com/foxue.ai/issues/${number}`,
      created_at: "2026-08-19T02:00:00Z",
      updated_at: "2026-08-19T02:05:00Z",
      author_association: "NONE",
      user: { login: author, type: userType },
    },
  };
}

function expectIntakeError(callback, code) {
  assert.throws(callback, (error) => error instanceof ReviewIntakeError && error.code === code);
}

const candidate = validateGlobalReviewIssueEvent(eventFor(), queue, queueRaw);
assert.equal(candidate.queue.queueId, queue.items[0].queueId);
assert.equal(candidate.sourceIssue.author, "sutra-reviewer");
assert.equal(candidate.reviewerDeclarationDraft.naturalPersonDeclared, true);
assert.equal(candidate.reviewerDeclarationDraft.independentReviewDeclared, true);
assert.deepEqual(candidate.decisionsDraft.map((decision) => decision.lane), ["scope", "identity", "source_and_range"]);
assert.equal(candidate.governance.acceptedIntoLedger, false);
assert.equal(candidate.governance.countsAsIndependentHumanDecision, false);
assert.equal(candidate.integrity.candidateSha256, candidateSha256(candidate));
assert.equal(validateStoredCandidate(candidate), candidate);
assert.equal(revalidateCandidateAgainstQueue(candidate, queue, queueRaw), candidate);

const accepted = buildAcceptedLedger(candidate, ledger, {
  acceptedBy: "maintainer-one",
  acceptedAt: "2026-08-19T03:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
});
assert.equal(accepted.reviewerDeclarations.length, 1);
assert.equal(accepted.decisions.length, 3);
assert.deepEqual(accepted.decisions.map((decision) => decision.lane), ["scope", "identity", "source_and_range"]);
assert.ok(accepted.decisions.every((decision) => decision.independent === true));
assert.ok(accepted.decisions.every((decision) => decision.sourceIssueUrl === candidate.sourceIssue.url));
assert.ok(accepted.decisions.every((decision) => decision.evidenceUrls.includes(candidate.sourceIssue.url)));
assert.ok(accepted.decisions.every((decision) => decision.reviewerInstitution === "独立研究者：中国上海"));
assert.ok(accepted.decisions.every((decision) => decision.sourceScope.includes(HUMAN_SOURCE_MARKER)));
assert.equal(accepted.summary.decisions, 0, "摘要只能由治理构建器重算，验收器不得自行宣称进度");

const secondCandidate = validateGlobalReviewIssueEvent(eventFor({
  number: 102,
  queueId: queue.items[1].queueId,
}), queue, queueRaw);
const acceptedAgain = buildAcceptedLedger(secondCandidate, accepted, {
  acceptedBy: "maintainer-one",
  acceptedAt: "2026-08-19T04:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
});
assert.equal(acceptedAgain.reviewerDeclarations.length, 1, "同一 GitHub 自然人只保留一份复核者声明");
assert.equal(acceptedAgain.decisions.length, 6);

expectIntakeError(() => buildAcceptedLedger(candidate, accepted, {
  acceptedBy: "maintainer-one",
  acceptedAt: "2026-08-19T04:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
}), "ISSUE_ALREADY_ACCEPTED");
expectIntakeError(() => buildAcceptedLedger(candidate, ledger, {
  acceptedBy: "sutra-reviewer",
  acceptedAt: "2026-08-19T03:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
}), "SELF_ACCEPTANCE");

const tampered = structuredClone(candidate);
tampered.queue.titleZh = "被篡改";
expectIntakeError(() => validateStoredCandidate(tampered), "CANDIDATE_INTEGRITY");

const forgedWithFreshHash = structuredClone(candidate);
forgedWithFreshHash.queue.titleZh = "改写后重新计算哈希的伪造题名";
forgedWithFreshHash.integrity.candidateSha256 = candidateSha256(forgedWithFreshHash);
assert.equal(validateStoredCandidate(forgedWithFreshHash), forgedWithFreshHash);
expectIntakeError(
  () => revalidateCandidateAgainstQueue(forgedWithFreshHash, queue, queueRaw),
  "CANDIDATE_REVALIDATION",
);

expectIntakeError(() => validateGlobalReviewIssueEvent(eventFor({ userType: "Bot", author: "review-bot[bot]" }), queue, queueRaw), "AUTHOR_NOT_HUMAN_ACCOUNT");
expectIntakeError(() => validateGlobalReviewIssueEvent(eventFor({ queueId: "gdrq:not-a-real-work" }), queue, queueRaw), "QUEUE_ID_UNKNOWN");
expectIntakeError(() => validateGlobalReviewIssueEvent(eventFor({
  overrides: {
    "来源、底本与文本范围": `机器预填内容 https://example.org/source\n${HUMAN_SOURCE_MARKER}`,
  },
}), queue, queueRaw), "SOURCE_SCOPE_UNCHANGED");
expectIntakeError(() => validateGlobalReviewIssueEvent(eventFor({
  overrides: {
    "复核声明": attestations.slice(1).map((value) => `- [X] ${value}`).join("\n"),
  },
}), queue, queueRaw), "ATTESTATION_UNCHECKED");

const declarations = new Map([
  ["r1", { institution: "佛教大学 A" }],
  ["r2", { institution: " 佛教大学   A " }],
  ["r3", { institution: "独立研究所 B" }],
]);
assert.equal(hasInstitutionallyIndependentPair(new Set(["r1", "r2"]), declarations), false);
assert.equal(hasInstitutionallyIndependentPair(new Set(["r1", "r3"]), declarations), true);
assert.equal(arbitratorIsInstitutionallyIndependent("r2", ["r1"], declarations), false);
assert.equal(arbitratorIsInstitutionallyIndependent("r3", ["r1", "r2"], declarations), true);

const cliTemp = await mkdtemp(join(tmpdir(), "foxue-global-review-intake-"));
try {
  const eventPath = join(cliTemp, "event.json");
  const candidatePath = join(cliTemp, "candidate.json");
  const ledgerPath = resolve("data/gbcr/global-denominator-review-ledger-v0.1.0.json");
  await writeFile(eventPath, `${JSON.stringify(eventFor(), null, 2)}\n`);
  const validateCli = spawnSync(process.execPath, [
    "scripts/global-review-intake.mjs",
    "validate-issue",
    "--event", eventPath,
    "--queue", resolve("data/gbcr/global-denominator-review-queue-v0.1.0.json"),
    "--output", candidatePath,
  ], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(validateCli.status, 0, validateCli.stderr);
  const cliCandidate = JSON.parse(await readFile(candidatePath, "utf8"));
  assert.equal(cliCandidate.integrity.candidateSha256, candidate.integrity.candidateSha256);

  const acceptCli = spawnSync(process.execPath, [
    "scripts/global-review-intake.mjs",
    "accept-candidate",
    "--candidate", candidatePath,
    "--ledger", ledgerPath,
    "--queue", resolve("data/gbcr/global-denominator-review-queue-v0.1.0.json"),
    "--accepted-by", "maintainer-one",
    "--accepted-at", "2026-08-19T03:00:00Z",
  ], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(acceptCli.status, 0, acceptCli.stderr);
  const dryRun = JSON.parse(acceptCli.stdout);
  assert.equal(dryRun.ledger.decisions.length, 3);
  assert.equal(dryRun.archivePath, "data/gbcr/review-submissions/github-issue-101.json");
  assert.equal(existsSync(dryRun.archivePath), false);

  const unsafeLedgerPath = join(cliTemp, "unsafe-ledger.json");
  await writeFile(unsafeLedgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  const unsafeWriteCli = spawnSync(process.execPath, [
    "scripts/global-review-intake.mjs",
    "accept-candidate",
    "--candidate", candidatePath,
    "--ledger", unsafeLedgerPath,
    "--accepted-by", "maintainer-one",
    "--accepted-at", "2026-08-19T03:00:00Z",
    "--write",
  ], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(unsafeWriteCli.status, 1);
  assert.match(unsafeWriteCli.stderr, /\[WRITE_TARGET_UNSAFE\]/);
  assert.deepEqual(JSON.parse(await readFile(unsafeLedgerPath, "utf8")), ledger);
} finally {
  await rm(cliTemp, { recursive: true, force: true });
}

console.log("全球分母 Issue 摄取与人工验收边界通过：有效候选只生成草案；机器人、篡改、缺证、未独立和同机构伪共识均被拒绝。");
