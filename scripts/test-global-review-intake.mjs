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
  fetchCurrentGitHubIssueEvent,
  revalidateCandidateAgainstQueue,
  validateGlobalReviewIssueEvent,
  validateStoredCandidate,
} from "./global-review-intake.mjs";
import {
  arbitratorIsInstitutionallyIndependent,
  hasInstitutionallyIndependentDecisionPair,
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

const currentIssueEvent = eventFor();
const candidate = validateGlobalReviewIssueEvent(currentIssueEvent, queue, queueRaw);
assert.equal(candidate.queue.queueId, queue.items[0].queueId);
assert.equal(candidate.sourceIssue.author, "sutra-reviewer");
assert.equal(candidate.reviewerDeclarationDraft.naturalPersonDeclared, true);
assert.equal(candidate.reviewerDeclarationDraft.independentReviewDeclared, true);
assert.deepEqual(candidate.decisionsDraft.map((decision) => decision.lane), ["scope", "identity", "source_and_range"]);
assert.equal(candidate.governance.acceptedIntoLedger, false);
assert.equal(candidate.governance.countsAsIndependentHumanDecision, false);
assert.equal(candidate.governance.requiresLiveIssueRevalidationBeforeAcceptance, true);
assert.equal(candidate.integrity.candidateSha256, candidateSha256(candidate));
assert.equal(validateStoredCandidate(candidate), candidate);
assert.equal(revalidateCandidateAgainstQueue(candidate, queue, queueRaw, currentIssueEvent), candidate);

const fetchedLiveEvent = await fetchCurrentGitHubIssueEvent(candidate, async (url, options) => {
  assert.equal(url, "https://api.github.com/repos/weitzu-com/foxue.ai/issues/101");
  assert.equal(options.headers.Accept, "application/vnd.github+json");
  return { ok: true, status: 200, json: async () => currentIssueEvent.issue };
});
assert.deepEqual(fetchedLiveEvent, { action: "edited", repository: { full_name: "weitzu-com/foxue.ai" }, issue: currentIssueEvent.issue });
await assert.rejects(
  fetchCurrentGitHubIssueEvent(candidate, async () => ({ ok: false, status: 404 })),
  (error) => error instanceof ReviewIntakeError && error.code === "LIVE_ISSUE_FETCH_FAILED",
);
expectIntakeError(
  () => revalidateCandidateAgainstQueue(candidate, queue, queueRaw),
  "LIVE_ISSUE_REQUIRED",
);

const accepted = buildAcceptedLedger(candidate, ledger, {
  acceptedBy: "maintainer-one",
  acceptedAt: "2026-08-19T03:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
  liveIssueEvent: currentIssueEvent,
});
assert.equal(accepted.reviewerDeclarations.length, 1);
assert.equal(accepted.reviewerDeclarations[0].affiliations.length, 1);
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
  liveIssueEvent: eventFor({ number: 102, queueId: queue.items[1].queueId }),
});
assert.equal(acceptedAgain.reviewerDeclarations.length, 1, "同一 GitHub 自然人只保留一份复核者声明");
assert.equal(acceptedAgain.reviewerDeclarations[0].affiliations.length, 1, "机构未变时不重复追加机构版本");
assert.equal(acceptedAgain.decisions.length, 6);

const movedIssueEvent = eventFor({
  number: 103,
  queueId: queue.items[2].queueId,
  overrides: { "机构或独立身份": "佛教大学 B：访问学者" },
});
const movedCandidate = validateGlobalReviewIssueEvent(movedIssueEvent, queue, queueRaw);
const acceptedAfterMove = buildAcceptedLedger(movedCandidate, acceptedAgain, {
  acceptedBy: "maintainer-one",
  acceptedAt: "2026-08-19T05:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
  liveIssueEvent: movedIssueEvent,
});
assert.equal(acceptedAfterMove.reviewerDeclarations.length, 1);
assert.deepEqual(
  acceptedAfterMove.reviewerDeclarations[0].affiliations.map((entry) => entry.institution),
  ["独立研究者：中国上海", "佛教大学 B：访问学者"],
);
assert.ok(acceptedAfterMove.decisions.slice(-3).every((decision) => (
  decision.reviewerInstitution === "佛教大学 B：访问学者"
)));

expectIntakeError(() => buildAcceptedLedger(candidate, accepted, {
  acceptedBy: "maintainer-one",
  acceptedAt: "2026-08-19T04:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
  liveIssueEvent: currentIssueEvent,
}), "ISSUE_ALREADY_ACCEPTED");
expectIntakeError(() => buildAcceptedLedger(candidate, ledger, {
  acceptedBy: "sutra-reviewer",
  acceptedAt: "2026-08-19T03:00:00Z",
  reviewQueue: queue,
  reviewQueueBytes: queueRaw,
  liveIssueEvent: currentIssueEvent,
}), "SELF_ACCEPTANCE");

const tampered = structuredClone(candidate);
tampered.queue.titleZh = "被篡改";
expectIntakeError(() => validateStoredCandidate(tampered), "CANDIDATE_INTEGRITY");

const forgedWithFreshHash = structuredClone(candidate);
forgedWithFreshHash.queue.titleZh = "改写后重新计算哈希的伪造题名";
forgedWithFreshHash.integrity.candidateSha256 = candidateSha256(forgedWithFreshHash);
assert.equal(validateStoredCandidate(forgedWithFreshHash), forgedWithFreshHash);
expectIntakeError(
  () => revalidateCandidateAgainstQueue(forgedWithFreshHash, queue, queueRaw, currentIssueEvent),
  "CANDIDATE_REVALIDATION",
);

const supersededIssueEvent = structuredClone(currentIssueEvent);
supersededIssueEvent.issue.updated_at = "2026-08-19T02:10:00Z";
supersededIssueEvent.issue.body = issueBody(queue.items[0].queueId, {
  "利益冲突披露": "修订后披露：与来源项目存在未领取报酬的学术协作。",
});
expectIntakeError(
  () => revalidateCandidateAgainstQueue(candidate, queue, queueRaw, supersededIssueEvent),
  "CANDIDATE_REVALIDATION",
);
const metadataOnlyIssueEvent = structuredClone(currentIssueEvent);
metadataOnlyIssueEvent.issue.updated_at = "2026-08-19T02:15:00Z";
metadataOnlyIssueEvent.issue.author_association = "CONTRIBUTOR";
assert.equal(
  revalidateCandidateAgainstQueue(candidate, queue, queueRaw, metadataOnlyIssueEvent),
  candidate,
  "评论、标签或作者关系变化不得把未改正文的候选误判为旧修订",
);
const withdrawnIssueEvent = structuredClone(currentIssueEvent);
withdrawnIssueEvent.issue.state = "closed";
expectIntakeError(
  () => revalidateCandidateAgainstQueue(candidate, queue, queueRaw, withdrawnIssueEvent),
  "ISSUE_NOT_OPEN",
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

const institutionDecisions = [
  { reviewerId: "r1", reviewerInstitution: "佛教大学 A" },
  { reviewerId: "r2", reviewerInstitution: " 佛教大学   A " },
  { reviewerId: "r3", reviewerInstitution: "独立研究所 B" },
];
assert.equal(hasInstitutionallyIndependentDecisionPair(institutionDecisions.slice(0, 2)), false);
assert.equal(hasInstitutionallyIndependentDecisionPair([institutionDecisions[0], institutionDecisions[2]]), true);
assert.equal(arbitratorIsInstitutionallyIndependent("佛教大学 A", institutionDecisions.slice(0, 1)), false);
assert.equal(arbitratorIsInstitutionallyIndependent("独立研究所 B", institutionDecisions.slice(0, 2)), true);

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
    "--live-event", eventPath,
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

  const localEventWriteCli = spawnSync(process.execPath, [
    "scripts/global-review-intake.mjs",
    "accept-candidate",
    "--candidate", candidatePath,
    "--live-event", eventPath,
    "--accepted-by", "maintainer-one",
    "--accepted-at", "2026-08-19T03:00:00Z",
    "--write",
  ], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(localEventWriteCli.status, 1);
  assert.match(localEventWriteCli.stderr, /\[LIVE_EVENT_WRITE_UNSAFE\]/);
} finally {
  await rm(cliTemp, { recursive: true, force: true });
}

console.log("全球分母 Issue 摄取与人工验收边界通过：有效候选只生成草案；机器人、旧修订、撤回、篡改、缺证、自验收和同机构伪共识均被拒绝。");
