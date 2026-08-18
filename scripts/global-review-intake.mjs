import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeInstitution } from "./global-review-consensus.mjs";

export const INTAKE_SCHEMA = "https://foxue.ai/schemas/gbcr/global-review-intake-candidate-v0.1";
export const INTAKE_VERSION = "0.1.0";
export const HUMAN_SOURCE_MARKER = "人工核验补充（必填）：";

const repositoryFullName = "weitzu-com/foxue.ai";
const defaultQueuePath = "data/gbcr/global-denominator-review-queue-v0.1.0.json";
const defaultLedgerPath = "data/gbcr/global-denominator-review-ledger-v0.1.0.json";
const ledgerSchema = "https://foxue.ai/schemas/gbcr/global-denominator-review-ledger-v0.1";
const allowedActions = new Set(["opened", "edited", "reopened"]);
const allowedScopeDecisions = new Set(["scope_uncertain", "include_strict_sutra", "exclude_strict_sutra"]);
const allowedIdentityDecisions = new Set(["identity_uncertain", "same_work", "distinct_work", "text_family_only", "not_applicable"]);
const allowedSourceDecisions = new Set(["source_uncertain", "source_supported", "source_rejected"]);

const fieldLabels = [
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
];

const requiredAttestationSnippets = [
  "负责的自然人",
  "在查看其他复核者的结论前独立完成",
  "相关语言、目录与版本证据的能力",
  "支持证据、反证、权利边界和利益冲突",
  "单份意见不会自动合并作品",
  "被公开长期保存",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

export class ReviewIntakeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReviewIntakeError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ReviewIntakeError(code, message);
}

function requireString(value, code, label, minimumLength = 1) {
  if (typeof value !== "string") fail(code, `${label} 必须是字符串`);
  const normalized = value.trim();
  if (!normalized || normalized === "_No response_" || normalized === "No response") {
    fail(code, `${label} 不能为空`);
  }
  if (Array.from(normalized).length < minimumLength) {
    fail(code, `${label} 至少需要 ${minimumLength} 个字符`);
  }
  return normalized;
}

function requireIsoTimestamp(value, code, label) {
  const normalized = requireString(value, code, label);
  if (!Number.isFinite(Date.parse(normalized))) fail(code, `${label} 不是有效 ISO 时间`);
  return normalized;
}

export function parseIssueFormBody(body) {
  const normalized = requireString(body, "BODY_EMPTY", "Issue 正文").replaceAll("\r\n", "\n");
  if (normalized.length > 200_000) fail("BODY_TOO_LARGE", "Issue 正文超过 200,000 字符上限");

  const headingLocations = [];
  for (const label of fieldLabels) {
    const needle = `### ${label}`;
    const matches = [];
    let offset = 0;
    while (offset < normalized.length) {
      const index = normalized.indexOf(needle, offset);
      if (index === -1) break;
      const lineStart = index === 0 || normalized[index - 1] === "\n";
      const lineEnd = index + needle.length === normalized.length || normalized[index + needle.length] === "\n";
      if (lineStart && lineEnd) matches.push(index);
      offset = index + needle.length;
    }
    if (matches.length !== 1) {
      fail("FIELD_CARDINALITY", `${label} 标题必须恰好出现一次，实际 ${matches.length} 次`);
    }
    headingLocations.push({ label, index: matches[0], needle });
  }

  const sorted = [...headingLocations].sort((a, b) => a.index - b.index);
  if (sorted.some((entry, index) => entry.label !== fieldLabels[index])) {
    fail("FIELD_ORDER", "Issue Form 字段顺序与受支持模板不一致");
  }

  return Object.fromEntries(sorted.map((entry, index) => {
    const valueStart = entry.index + entry.needle.length;
    const nextStart = sorted[index + 1]?.index ?? normalized.length;
    const value = normalized.slice(valueStart, nextStart).replace(/^\n+|\n+$/g, "").trim();
    return [entry.label, value];
  }));
}

function checkedAttestations(value) {
  return [...value.matchAll(/^-\s+\[[xX]\]\s+(.+)$/gm)].map((match) => match[1].trim());
}

function externalEvidenceUrls(values) {
  const urls = new Set();
  for (const value of values) {
    for (const match of value.matchAll(/https:\/\/[^\s<>()\]，。；]+/g)) {
      try {
        const url = new URL(match[0]);
        if (url.protocol === "https:") urls.add(url.toString());
      } catch {
        // A malformed URL is not evidence; the minimum-evidence gate below will reject if needed.
      }
    }
  }
  return [...urls].sort();
}

function candidatePayload(candidate) {
  const payload = structuredClone(candidate);
  delete payload.integrity;
  return payload;
}

export function candidateSha256(candidate) {
  return sha256(Buffer.from(jsonRaw(candidatePayload(candidate))));
}

export function validateGlobalReviewIssueEvent(event, reviewQueue, reviewQueueBytes = Buffer.from(jsonRaw(reviewQueue))) {
  if (!event || typeof event !== "object") fail("EVENT_INVALID", "GitHub 事件必须是对象");
  if (!allowedActions.has(event.action)) fail("ACTION_UNSUPPORTED", `不支持 Issue 动作：${event.action}`);
  if (event.repository?.full_name !== repositoryFullName) {
    fail("REPOSITORY_MISMATCH", `事件仓库必须是 ${repositoryFullName}`);
  }
  const issue = event.issue;
  if (!issue || typeof issue !== "object" || issue.pull_request) fail("ISSUE_INVALID", "事件不包含普通 Issue");
  if (!Number.isInteger(issue.number) || issue.number <= 0) fail("ISSUE_NUMBER_INVALID", "Issue 编号无效");
  if (issue.state !== "open") fail("ISSUE_NOT_OPEN", "只接收 open 状态的复核 Issue");
  const author = requireString(issue.user?.login, "AUTHOR_MISSING", "Issue 作者");
  if (issue.user?.type !== "User" || /\[bot\]$/i.test(author)) {
    fail("AUTHOR_NOT_HUMAN_ACCOUNT", "Issue 必须由 GitHub User 账户提交，Bot 不可进入真人复核候选");
  }
  const expectedIssueUrl = `https://github.com/${repositoryFullName}/issues/${issue.number}`;
  if (issue.html_url !== expectedIssueUrl) fail("ISSUE_URL_MISMATCH", "Issue URL 与仓库或编号不一致");
  const title = requireString(issue.title, "TITLE_MISSING", "Issue 标题");
  if (!title.startsWith("[全球分母复核]")) fail("TITLE_UNSUPPORTED", "Issue 标题不是全球分母复核表单");
  const createdAt = requireIsoTimestamp(issue.created_at, "CREATED_AT_INVALID", "Issue 创建时间");
  const updatedAt = requireIsoTimestamp(issue.updated_at, "UPDATED_AT_INVALID", "Issue 更新时间");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) fail("TIMESTAMP_ORDER", "Issue 更新时间早于创建时间");

  if (
    reviewQueue?.schema !== "https://foxue.ai/schemas/gbcr/global-denominator-review-queue-v0.1" ||
    reviewQueue?.version !== "0.1.0" ||
    !Array.isArray(reviewQueue.items)
  ) {
    fail("QUEUE_INVALID", "复核队列 schema 或版本不受支持");
  }
  const fields = parseIssueFormBody(issue.body);
  const queueId = requireString(fields["队列 ID"], "QUEUE_ID_MISSING", "队列 ID");
  const queueItem = reviewQueue.items.find((item) => item.queueId === queueId);
  if (!queueItem) fail("QUEUE_ID_UNKNOWN", `队列不存在 ${queueId}`);
  if (!title.includes(queueId)) fail("TITLE_QUEUE_MISMATCH", "Issue 标题必须包含正文中的完整 queueId");

  const reviewerIdentity = requireString(
    fields["复核者身份、语言能力与独立性"],
    "REVIEWER_IDENTITY_WEAK",
    "复核者身份、能力与独立性说明",
    30,
  );
  const institution = requireString(fields["机构或独立身份"], "INSTITUTION_MISSING", "机构或独立身份", 2);
  const sourceScope = requireString(fields["来源、底本与文本范围"], "SOURCE_SCOPE_WEAK", "来源、底本与文本范围", 30);
  if (sourceScope.includes(HUMAN_SOURCE_MARKER)) {
    const supplement = sourceScope.slice(sourceScope.lastIndexOf(HUMAN_SOURCE_MARKER) + HUMAN_SOURCE_MARKER.length).trim();
    requireString(supplement, "SOURCE_SCOPE_UNCHANGED", "人工核验补充", 20);
  }
  const scopeDecision = requireString(fields["严格佛经范围意见"], "SCOPE_DECISION_MISSING", "严格佛经范围意见");
  if (!allowedScopeDecisions.has(scopeDecision)) fail("SCOPE_DECISION_INVALID", `范围结论不受支持：${scopeDecision}`);
  const scopeReasoning = requireString(fields["范围证据与理由"], "SCOPE_REASONING_WEAK", "范围证据与理由", 30);
  const identityDecision = requireString(fields["作品身份意见"], "IDENTITY_DECISION_MISSING", "作品身份意见");
  if (!allowedIdentityDecisions.has(identityDecision)) fail("IDENTITY_DECISION_INVALID", `作品身份结论不受支持：${identityDecision}`);
  const identityReasoning = requireString(fields["作品身份比较"], "IDENTITY_REASONING_WEAK", "作品身份比较", 30);
  const sourceAndRangeDecision = requireString(fields["来源与范围核验意见"], "SOURCE_DECISION_MISSING", "来源与范围核验意见");
  if (!allowedSourceDecisions.has(sourceAndRangeDecision)) {
    fail("SOURCE_DECISION_INVALID", `来源与范围结论不受支持：${sourceAndRangeDecision}`);
  }
  const supportingEvidence = requireString(fields["最强支持证据"], "SUPPORTING_EVIDENCE_WEAK", "最强支持证据", 20);
  const counterEvidence = requireString(fields["最强反证与不确定性"], "COUNTEREVIDENCE_WEAK", "最强反证与不确定性", 20);
  const rightsBoundary = requireString(fields["权利与引用边界"], "RIGHTS_BOUNDARY_WEAK", "权利与引用边界", 10);
  const conflictOfInterest = requireString(fields["利益冲突披露"], "CONFLICT_MISSING", "利益冲突披露");
  const attestations = checkedAttestations(requireString(fields["复核声明"], "ATTESTATIONS_MISSING", "复核声明"));
  for (const snippet of requiredAttestationSnippets) {
    if (!attestations.some((value) => value.includes(snippet))) {
      fail("ATTESTATION_UNCHECKED", `缺少已勾选声明：${snippet}`);
    }
  }

  const evidenceUrls = externalEvidenceUrls([
    sourceScope,
    scopeReasoning,
    identityReasoning,
    supportingEvidence,
    counterEvidence,
  ]);
  if (evidenceUrls.length === 0) fail("EVIDENCE_URL_MISSING", "至少需要一个可公开核对的 HTTPS 外部证据链接");

  const bodySha256 = sha256(Buffer.from(issue.body));
  const signature = `github-issue:${issue.html_url}@sha256:${bodySha256}`;
  const baseCandidate = {
    schema: INTAKE_SCHEMA,
    version: INTAKE_VERSION,
    generatedAt: updatedAt,
    status: "valid_candidate_requires_maintainer_and_independent_human_verification",
    sourceIssue: {
      repository: repositoryFullName,
      number: issue.number,
      url: issue.html_url,
      author,
      authorType: issue.user.type,
      authorAssociation: issue.author_association ?? "NONE",
      createdAt,
      updatedAt,
      title,
      body: issue.body,
      bodySha256,
    },
    queue: {
      path: defaultQueuePath,
      sha256: sha256(reviewQueueBytes),
      queueId: queueItem.queueId,
      workId: queueItem.workId,
      titleZh: queueItem.titleZh,
      priority: queueItem.priority,
      sourceSnapshotIds: queueItem.sourceSnapshotIds,
      externalIds: queueItem.externalIds,
    },
    reviewerDeclarationDraft: {
      reviewerId: `github:${author.toLocaleLowerCase("en-US")}`,
      naturalPersonDeclared: true,
      aiSystemDeclaredFalse: true,
      independentReviewDeclared: true,
      identityAndCompetence: reviewerIdentity,
      institution,
      conflictOfInterest,
      signature,
    },
    decisionsDraft: [
      { lane: "scope", scopeDecision, rationale: scopeReasoning },
      { lane: "identity", identityDecision, rationale: identityReasoning },
      { lane: "source_and_range", sourceAndRangeDecision, rationale: `${sourceScope}\n\n${supportingEvidence}` },
    ],
    evidence: {
      sourceScope,
      supportingEvidence,
      counterEvidence,
      rightsBoundary,
      evidenceUrls,
    },
    attestations,
    governance: {
      acceptedIntoLedger: false,
      automaticLedgerMutation: false,
      countsAsIndependentHumanDecision: false,
      requiresMaintainerIdentityAndEvidenceReview: true,
      requiresSignedPullRequestHistory: true,
      singleSubmissionCannotChangeDenominator: true,
    },
  };
  return {
    ...baseCandidate,
    integrity: {
      algorithm: "sha256",
      candidateSha256: sha256(Buffer.from(jsonRaw(baseCandidate))),
    },
  };
}

export function validateStoredCandidate(candidate) {
  if (candidate?.schema !== INTAKE_SCHEMA || candidate?.version !== INTAKE_VERSION) {
    fail("CANDIDATE_VERSION", "复核候选 schema 或版本不受支持");
  }
  if (candidate.status !== "valid_candidate_requires_maintainer_and_independent_human_verification") {
    fail("CANDIDATE_STATUS", "复核候选状态不可进入人工验收");
  }
  const expectedSha = candidateSha256(candidate);
  if (candidate.integrity?.algorithm !== "sha256" || candidate.integrity?.candidateSha256 !== expectedSha) {
    fail("CANDIDATE_INTEGRITY", "复核候选内容哈希不匹配");
  }
  if (candidate.governance?.automaticLedgerMutation !== false || candidate.governance?.countsAsIndependentHumanDecision !== false) {
    fail("CANDIDATE_GOVERNANCE", "候选错误地宣称已进入真人账本");
  }
  return candidate;
}

export function revalidateCandidateAgainstQueue(candidateInput, reviewQueue, reviewQueueBytes = Buffer.from(jsonRaw(reviewQueue))) {
  const candidate = validateStoredCandidate(candidateInput);
  const issue = candidate.sourceIssue;
  const rebuilt = validateGlobalReviewIssueEvent({
    action: "edited",
    repository: { full_name: issue.repository },
    issue: {
      number: issue.number,
      state: "open",
      title: issue.title,
      body: issue.body,
      html_url: issue.url,
      created_at: issue.createdAt,
      updated_at: issue.updatedAt,
      author_association: issue.authorAssociation,
      user: { login: issue.author, type: issue.authorType },
    },
  }, reviewQueue, reviewQueueBytes);
  if (rebuilt.integrity.candidateSha256 !== candidate.integrity.candidateSha256) {
    fail(
      "CANDIDATE_REVALIDATION",
      "候选无法由保存的原始 Issue 与当前复核队列重新生成；拒绝进入账本",
    );
  }
  return candidate;
}

export function buildAcceptedLedger(
  candidateInput,
  ledgerInput,
  { acceptedBy, acceptedAt, reviewQueue, reviewQueueBytes },
) {
  const candidate = revalidateCandidateAgainstQueue(candidateInput, reviewQueue, reviewQueueBytes);
  const maintainer = requireString(acceptedBy, "ACCEPTOR_MISSING", "验收维护者 GitHub 用户名");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(maintainer)) {
    fail("ACCEPTOR_INVALID", "验收维护者 GitHub 用户名格式无效");
  }
  if (maintainer.toLocaleLowerCase("en-US") === candidate.sourceIssue.author.toLocaleLowerCase("en-US")) {
    fail("SELF_ACCEPTANCE", "提交者不得自行验收复核候选");
  }
  const acceptanceTime = requireIsoTimestamp(acceptedAt, "ACCEPTED_AT_INVALID", "验收时间");
  if (Date.parse(acceptanceTime) < Date.parse(candidate.sourceIssue.updatedAt)) {
    fail("ACCEPTANCE_BEFORE_SUBMISSION", "验收时间不得早于 Issue 最后更新时间");
  }
  if (
    ledgerInput?.schema !== ledgerSchema ||
    ledgerInput?.version !== "0.1.0" ||
    !Array.isArray(ledgerInput.reviewerDeclarations) ||
    !Array.isArray(ledgerInput.decisions) ||
    !Array.isArray(ledgerInput.arbitrations)
  ) {
    fail("LEDGER_INVALID", "全球分母复核账本格式不受支持");
  }

  const ledger = structuredClone(ledgerInput);
  const sourceIssueUrl = candidate.sourceIssue.url;
  if (ledger.decisions.some((decision) => decision.sourceIssueUrl === sourceIssueUrl)) {
    fail("ISSUE_ALREADY_ACCEPTED", `${sourceIssueUrl} 已进入复核账本`);
  }
  const draft = candidate.reviewerDeclarationDraft;
  const existingDeclaration = ledger.reviewerDeclarations.find((entry) => entry.reviewerId === draft.reviewerId);
  if (existingDeclaration) {
    if (normalizeInstitution(existingDeclaration.institution) !== normalizeInstitution(draft.institution)) {
      fail("REVIEWER_INSTITUTION_CONFLICT", `${draft.reviewerId} 的机构声明与既有账本冲突`);
    }
  } else {
    ledger.reviewerDeclarations.push({
      reviewerId: draft.reviewerId,
      naturalPerson: true,
      aiSystem: false,
      competence: [draft.identityAndCompetence],
      institution: draft.institution,
      conflictOfInterest: draft.conflictOfInterest,
      signature: draft.signature,
      sourceIssueUrl,
      verifiedBy: `github:${maintainer.toLocaleLowerCase("en-US")}`,
      verifiedAt: acceptanceTime,
    });
  }

  const commonDecision = {
    queueId: candidate.queue.queueId,
    reviewerId: draft.reviewerId,
    independent: true,
    submittedAt: candidate.sourceIssue.updatedAt,
    evidenceUrls: [...new Set([...candidate.evidence.evidenceUrls, sourceIssueUrl])].sort(),
    counterEvidence: candidate.evidence.counterEvidence,
    rightsBoundary: candidate.evidence.rightsBoundary,
    reviewerIdentityAndCompetence: draft.identityAndCompetence,
    reviewerInstitution: draft.institution,
    conflictOfInterest: draft.conflictOfInterest,
    sourceScope: candidate.evidence.sourceScope,
    supportingEvidence: candidate.evidence.supportingEvidence,
    sourceIssueUrl,
    submissionSha256: candidate.integrity.candidateSha256,
    acceptedBy: `github:${maintainer.toLocaleLowerCase("en-US")}`,
    acceptedAt: acceptanceTime,
  };
  for (const draftDecision of candidate.decisionsDraft) {
    const decisionId = `gdrd:issue-${candidate.sourceIssue.number}:${draftDecision.lane}:${candidate.sourceIssue.author.toLocaleLowerCase("en-US")}`;
    if (ledger.decisions.some((decision) => decision.decisionId === decisionId)) {
      fail("DECISION_DUPLICATE", `决定 ID 已存在：${decisionId}`);
    }
    ledger.decisions.push({ decisionId, ...commonDecision, ...draftDecision });
  }
  ledger.generatedAt = acceptanceTime.slice(0, 10);
  ledger.status = "open_for_independent_human_review";
  return ledger;
}

function argumentValue(args, name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) fail("ARGUMENT_MISSING", `${name} 缺少参数值`);
  return args[index + 1];
}

async function writeStepSummary(candidate) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  await appendFile(process.env.GITHUB_STEP_SUMMARY, [
    "## 全球分母复核 Issue 摄取通过",
    "",
    `- Issue：[#${candidate.sourceIssue.number}](${candidate.sourceIssue.url})`,
    `- 队列：\`${candidate.queue.queueId}\``,
    `- 作品：${candidate.queue.titleZh}`,
    `- 提交者：\`${candidate.sourceIssue.author}\``,
    `- 候选 SHA-256：\`${candidate.integrity.candidateSha256}\``,
    "- 状态：仅为待维护者核验候选；未写入账本，不计作真人决定。",
    "",
  ].join("\n"));
}

async function runCli() {
  const [command, ...args] = process.argv.slice(2);
  const root = process.cwd();
  if (command === "validate-issue") {
    const eventPath = argumentValue(args, "--event");
    if (!eventPath) fail("EVENT_PATH_MISSING", "validate-issue 必须提供 --event");
    const queuePath = argumentValue(args, "--queue", defaultQueuePath);
    const outputPath = argumentValue(args, "--output");
    const [eventRaw, queueRaw] = await Promise.all([
      readFile(resolve(root, eventPath)),
      readFile(resolve(root, queuePath)),
    ]);
    const candidate = validateGlobalReviewIssueEvent(
      JSON.parse(eventRaw.toString("utf8")),
      JSON.parse(queueRaw.toString("utf8")),
      queueRaw,
    );
    if (outputPath) {
      const absoluteOutput = resolve(root, outputPath);
      await mkdir(dirname(absoluteOutput), { recursive: true });
      await writeFile(absoluteOutput, jsonRaw(candidate));
    } else {
      process.stdout.write(jsonRaw(candidate));
    }
    await writeStepSummary(candidate);
    console.error(`复核 Issue #${candidate.sourceIssue.number} 摄取校验通过；候选未进入真人账本。`);
    return;
  }

  if (command === "accept-candidate") {
    const candidatePath = argumentValue(args, "--candidate");
    const acceptedBy = argumentValue(args, "--accepted-by");
    const acceptedAt = argumentValue(args, "--accepted-at");
    if (!candidatePath || !acceptedBy || !acceptedAt) {
      fail("ACCEPT_ARGUMENTS", "accept-candidate 必须提供 --candidate、--accepted-by、--accepted-at");
    }
    const ledgerPath = argumentValue(args, "--ledger", defaultLedgerPath);
    const queuePath = argumentValue(args, "--queue", defaultQueuePath);
    const [candidateRaw, ledgerRaw, queueRaw] = await Promise.all([
      readFile(resolve(root, candidatePath)),
      readFile(resolve(root, ledgerPath)),
      readFile(resolve(root, queuePath)),
    ]);
    const candidate = JSON.parse(candidateRaw.toString("utf8"));
    const updatedLedger = buildAcceptedLedger(candidate, JSON.parse(ledgerRaw.toString("utf8")), {
      acceptedBy,
      acceptedAt,
      reviewQueue: JSON.parse(queueRaw.toString("utf8")),
      reviewQueueBytes: queueRaw,
    });
    const archiveRelative = argumentValue(
      args,
      "--archive",
      `data/gbcr/review-submissions/github-issue-${candidate.sourceIssue.number}.json`,
    );
    if (!args.includes("--write")) {
      process.stdout.write(jsonRaw({ archivePath: archiveRelative, ledger: updatedLedger }));
      console.error("仅完成验收预演；未写入候选归档或账本。添加 --write 才会修改文件并重建治理数据。");
      return;
    }
    const ledgerAbsolute = resolve(root, ledgerPath);
    const archiveAbsolute = resolve(root, archiveRelative);
    const canonicalArchive = `data/gbcr/review-submissions/github-issue-${candidate.sourceIssue.number}.json`;
    if (
      ledgerAbsolute !== resolve(root, defaultLedgerPath) ||
      resolve(root, queuePath) !== resolve(root, defaultQueuePath) ||
      archiveAbsolute !== resolve(root, canonicalArchive)
    ) {
      fail("WRITE_TARGET_UNSAFE", "--write 只允许写入官方账本、当前官方队列与固定 Issue 归档路径");
    }
    if (existsSync(archiveAbsolute)) fail("ARCHIVE_EXISTS", `候选归档已存在：${archiveRelative}`);
    await mkdir(dirname(archiveAbsolute), { recursive: true });
    await writeFile(archiveAbsolute, candidateRaw);
    await writeFile(ledgerAbsolute, jsonRaw(updatedLedger));
    try {
      execFileSync(process.execPath, [resolve(root, "scripts/build-global-denominator-governance.mjs")], {
        cwd: root,
        stdio: "inherit",
      });
    } catch (error) {
      await writeFile(ledgerAbsolute, ledgerRaw);
      await unlink(archiveAbsolute);
      throw error;
    }
    console.error(`Issue #${candidate.sourceIssue.number} 已归档并写入账本；仍需第二名机构独立复核者。`);
    return;
  }

  fail("COMMAND_UNSUPPORTED", "用法：global-review-intake.mjs validate-issue|accept-candidate ...");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runCli().catch((error) => {
    const code = error instanceof ReviewIntakeError ? error.code : "UNEXPECTED";
    console.error(`[${code}] ${error.message}`);
    process.exitCode = 1;
  });
}
