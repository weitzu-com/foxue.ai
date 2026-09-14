import type { SavedPassage } from "@/lib/saved-passages";
import { studyNoteKindLabels, type StudyNote } from "@/lib/study-notes";

export const RESEARCH_WORKSPACE_STORAGE_KEY = "foxue:research-workspace:v1";
export const RESEARCH_WORKSPACE_CHANGE_EVENT = "foxue:research-workspace-change";
export const EMPTY_RESEARCH_WORKSPACE_SNAPSHOT = JSON.stringify({
  version: 1,
  workspace: {
    question: "",
    scope: "",
    provisionalFinding: "",
    assessments: [],
    updatedAt: "",
  },
});
export const RESEARCH_WORKSPACE_CANONICAL_ORIGIN = "https://www.foxue.ai";

export const researchEvidenceStatusLabels = {
  unreviewed: "待判断",
  supports: "支持",
  qualifies: "限定",
  challenges: "反证",
  context: "背景",
  excluded: "不纳入",
} as const;

export type ResearchEvidenceStatus = keyof typeof researchEvidenceStatusLabels;

export type ResearchEvidenceAssessment = {
  passageId: string;
  status: ResearchEvidenceStatus;
  reasoning: string;
  updatedAt: string;
};

export type ResearchWorkspace = {
  question: string;
  scope: string;
  provisionalFinding: string;
  assessments: ResearchEvidenceAssessment[];
  updatedAt: string;
};

type ResearchWorkspaceStore = {
  version: 1;
  workspace: ResearchWorkspace;
};

const EMPTY_WORKSPACE: ResearchWorkspace = {
  question: "",
  scope: "",
  provisionalFinding: "",
  assessments: [],
  updatedAt: "",
};

const FIELD_LIMITS = {
  question: 500,
  scope: 1_500,
  provisionalFinding: 2_000,
  reasoning: 1_500,
} as const;

export const researchWorkspaceFieldLimits = FIELD_LIMITS;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isEvidenceStatus(value: unknown): value is ResearchEvidenceStatus {
  return isString(value) && Object.hasOwn(researchEvidenceStatusLabels, value);
}

function cleanText(value: unknown, maxLength: number) {
  return isString(value) ? value.slice(0, maxLength) : "";
}

function cleanAssessment(value: unknown): ResearchEvidenceAssessment | undefined {
  if (!value || typeof value !== "object") return undefined;
  const assessment = value as Partial<ResearchEvidenceAssessment>;
  if (!isString(assessment.passageId) || !isEvidenceStatus(assessment.status)) return undefined;

  const passageId = assessment.passageId.trim().slice(0, 180);
  if (!passageId) return undefined;

  return {
    passageId,
    status: assessment.status,
    reasoning: cleanText(assessment.reasoning, FIELD_LIMITS.reasoning),
    updatedAt: cleanText(assessment.updatedAt, 40),
  };
}

export function normalizeResearchWorkspace(value: Partial<ResearchWorkspace>): ResearchWorkspace {
  const uniqueAssessments = new Map<string, ResearchEvidenceAssessment>();
  if (Array.isArray(value.assessments)) {
    value.assessments.forEach((assessment) => {
      const cleaned = cleanAssessment(assessment);
      if (cleaned && !uniqueAssessments.has(cleaned.passageId)) {
        uniqueAssessments.set(cleaned.passageId, cleaned);
      }
    });
  }

  return {
    question: cleanText(value.question, FIELD_LIMITS.question),
    scope: cleanText(value.scope, FIELD_LIMITS.scope),
    provisionalFinding: cleanText(value.provisionalFinding, FIELD_LIMITS.provisionalFinding),
    assessments: [...uniqueAssessments.values()].slice(0, 500),
    updatedAt: cleanText(value.updatedAt, 40),
  };
}

export function parseResearchWorkspace(snapshot: string): ResearchWorkspace {
  try {
    const store = JSON.parse(snapshot) as Partial<ResearchWorkspaceStore>;
    if (store.version !== 1 || !store.workspace || typeof store.workspace !== "object") {
      return { ...EMPTY_WORKSPACE };
    }
    return normalizeResearchWorkspace(store.workspace);
  } catch {
    return { ...EMPTY_WORKSPACE };
  }
}

export function serializeResearchWorkspace(workspace: ResearchWorkspace) {
  return JSON.stringify({
    version: 1,
    workspace: normalizeResearchWorkspace(workspace),
  } satisfies ResearchWorkspaceStore);
}

export function updateResearchAssessment(
  workspace: ResearchWorkspace,
  passageId: string,
  patch: Partial<Pick<ResearchEvidenceAssessment, "status" | "reasoning">>,
  updatedAt: string,
) {
  const current = workspace.assessments.find((assessment) => assessment.passageId === passageId);
  const next = cleanAssessment({
    passageId,
    status: patch.status ?? current?.status ?? "unreviewed",
    reasoning: patch.reasoning ?? current?.reasoning ?? "",
    updatedAt,
  });
  if (!next) return workspace;

  return normalizeResearchWorkspace({
    ...workspace,
    assessments: [
      next,
      ...workspace.assessments.filter((assessment) => assessment.passageId !== passageId),
    ],
    updatedAt,
  });
}

export function buildResearchReadiness(workspace: ResearchWorkspace, passages: SavedPassage[]) {
  const activeAssessments = passages.map((passage) => (
    workspace.assessments.find((assessment) => assessment.passageId === passage.id)
  ));
  const assessedCount = activeAssessments.filter((assessment) => (
    assessment
    && assessment.status !== "unreviewed"
    && assessment.reasoning.trim().length > 0
  )).length;
  const counterEvidenceCount = activeAssessments.filter((assessment) => (
    assessment?.status === "qualifies" || assessment?.status === "challenges"
  )).length;

  return {
    hasQuestion: workspace.question.trim().length > 0,
    hasScope: workspace.scope.trim().length > 0,
    evidenceCount: passages.length,
    assessedCount,
    allEvidenceAssessed: passages.length > 0 && assessedCount === passages.length,
    uniqueWorkCount: new Set(passages.map((passage) => passage.workTitle)).size,
    counterEvidenceCount,
  };
}

function absoluteUrl(path: string, origin: string) {
  return new URL(path, origin).toString();
}

function markdownCell(value: string) {
  return value.trim().replace(/\|/gu, "\\|").replace(/\r?\n/gu, "<br>") || "—";
}

function quoteMarkdown(value: string) {
  return value.split("\n").map((line) => `> ${line}`).join("\n");
}

export function formatResearchWorkspaceMarkdown(
  workspace: ResearchWorkspace,
  passages: SavedPassage[],
  notes: StudyNote[],
  origin: string,
  exportedAt: string,
) {
  const assessments = new Map(
    workspace.assessments.map((assessment) => [assessment.passageId, assessment]),
  );
  const linkedNotes = new Map(notes.map((note) => [note.id, note]));
  const readiness = buildResearchReadiness(workspace, passages);
  const rows = passages.map((passage, index) => {
    const assessment = assessments.get(passage.id);
    const status = researchEvidenceStatusLabels[assessment?.status ?? "unreviewed"];
    return `| ${index + 1} | ${status} | ${markdownCell(assessment?.reasoning ?? "")} | ${markdownCell(passage.workTitle)} | ${markdownCell(passage.locator)} |`;
  });

  const evidenceSections = passages.flatMap((passage, index) => {
    const assessment = assessments.get(passage.id);
    const note = linkedNotes.get(passage.id);
    return [
      `### 证据 ${String(index + 1).padStart(2, "0")}｜${passage.workTitle}`,
      "",
      `- 证据关系：${researchEvidenceStatusLabels[assessment?.status ?? "unreviewed"]}`,
      `- 关系说明：${assessment?.reasoning.trim() || "尚未判断"}`,
      `- 稳定坐标：${passage.locator}`,
      `- 原典：${absoluteUrl(passage.sourceHref, origin)}`,
      `- 收藏时间：${passage.savedAt}`,
      "",
      quoteMarkdown(passage.quote),
      ...(note ? [
        "",
        `个人研读笺（${studyNoteKindLabels[note.kind]}，不是原典证据）：${note.body}`,
      ] : []),
      ...(index < passages.length - 1 ? ["", "---", ""] : []),
    ];
  });

  return [
    "# foxue.ai 研究证据报告",
    "",
    `导出时间：${exportedAt}`,
    "",
    "> 本报告由读者在本地整理。经文引文与稳定坐标属于证据层；研究问题、关系判断、暂定结论和个人笔记属于读者判断层，不代表 foxue.ai、原典或任何佛教传统的权威结论。",
    "",
    "## 研究任务",
    "",
    `- 研究问题：${workspace.question.trim() || "尚未填写"}`,
    `- 来源范围与排除条件：${workspace.scope.trim() || "尚未填写"}`,
    `- 暂定结论：${workspace.provisionalFinding.trim() || "尚未形成"}`,
    "",
    "## 方法检查",
    "",
    `- 已收集原典证据：${readiness.evidenceCount} 条，来自 ${readiness.uniqueWorkCount} 部作品`,
    `- 已说明证据关系：${readiness.assessedCount} / ${readiness.evidenceCount}`,
    `- 限定或反证：${readiness.counterEvidenceCount} 条`,
    `- 研究范围：${readiness.hasScope ? "已声明" : "未声明"}`,
    "",
    "## 主张—证据矩阵",
    "",
    "| # | 关系 | 对主张的作用／纳入理由 | 原典 | 稳定坐标 |",
    "|---:|---|---|---|---|",
    ...(rows.length > 0 ? rows : ["| — | 待判断 | 尚未收藏原典证据 | — | — |"]),
    "",
    "## 原典证据",
    "",
    ...(evidenceSections.length > 0 ? evidenceSections : ["尚未收藏原典证据。", ""]),
  ].join("\n");
}
