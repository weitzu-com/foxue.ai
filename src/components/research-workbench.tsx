"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Check,
  Download,
  FileSearch,
  Fingerprint,
  ListChecks,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  QUESTION_CHANGE_EVENT,
  QUESTION_MODE_KEY,
  QUESTION_SESSION_KEY,
} from "@/lib/question-session";
import {
  buildResearchReadiness,
  formatResearchWorkspaceMarkdown,
  RESEARCH_WORKSPACE_CANONICAL_ORIGIN,
  researchEvidenceStatusLabels,
  researchWorkspaceFieldLimits,
  updateResearchAssessment,
  type ResearchEvidenceStatus,
  type ResearchWorkspace,
} from "@/lib/research-workspace";
import { studyNoteKindLabels } from "@/lib/study-notes";
import { useResearchWorkspace, saveResearchWorkspace } from "@/components/use-research-workspace";
import { useSavedPassages } from "@/components/use-saved-passages";
import { useStudyNotes } from "@/components/use-study-notes";
import styles from "./research-workbench.module.css";

const planSteps = [
  { number: "01", label: "定义问题", detail: "写成可以被证据支持或推翻的问题" },
  { number: "02", label: "限定范围", detail: "说明传统、语种、版本与排除条件" },
  { number: "03", label: "收集原典", detail: "从经卷选文，保留稳定段号与版本" },
  { number: "04", label: "判断关系", detail: "逐条标注支持、限定、反证或背景" },
] as const;

function subscribeToResearchQuestion(onStoreChange: () => void) {
  window.addEventListener(QUESTION_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(QUESTION_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readResearchQuestion() {
  if (window.sessionStorage.getItem(QUESTION_MODE_KEY) !== "research") return "";
  return window.sessionStorage.getItem(QUESTION_SESSION_KEY)?.trim() ?? "";
}

function readServerResearchQuestion() {
  return "";
}

function clearResearchQuestionSession() {
  if (window.sessionStorage.getItem(QUESTION_MODE_KEY) !== "research") return;
  window.sessionStorage.removeItem(QUESTION_SESSION_KEY);
  window.sessionStorage.removeItem(QUESTION_MODE_KEY);
  window.dispatchEvent(new Event(QUESTION_CHANGE_EVENT));
}

function downloadResearchReport(
  workspace: ResearchWorkspace,
  passages: ReturnType<typeof useSavedPassages>,
  notes: ReturnType<typeof useStudyNotes>,
) {
  const now = new Date();
  const markdown = formatResearchWorkspaceMarkdown(
    workspace,
    passages,
    notes,
    RESEARCH_WORKSPACE_CANONICAL_ORIGIN,
    now.toISOString(),
  );
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `foxue-ai-research-evidence-${now.toISOString().slice(0, 10)}.md`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function ResearchWorkbench() {
  const workspace = useResearchWorkspace();
  const passages = useSavedPassages();
  const notes = useStudyNotes();
  const incomingQuestion = useSyncExternalStore(
    subscribeToResearchQuestion,
    readResearchQuestion,
    readServerResearchQuestion,
  );
  const [feedback, setFeedback] = useState("");
  const readiness = useMemo(
    () => buildResearchReadiness(workspace, passages),
    [workspace, passages],
  );
  const assessments = useMemo(
    () => new Map(workspace.assessments.map((assessment) => [assessment.passageId, assessment])),
    [workspace.assessments],
  );
  const linkedNotes = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes],
  );

  useEffect(() => {
    if (!incomingQuestion || workspace.question.trim()) return;
    try {
      saveResearchWorkspace({
        ...workspace,
        question: incomingQuestion.slice(0, researchWorkspaceFieldLimits.question),
        updatedAt: new Date().toISOString(),
      });
      clearResearchQuestionSession();
    } catch {
      return;
    }
  }, [incomingQuestion, workspace]);

  function updateWorkspace(patch: Partial<ResearchWorkspace>) {
    try {
      saveResearchWorkspace({
        ...workspace,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setFeedback("浏览器未能保存这次修改，请先导出已有内容。");
    }
  }

  function assessPassage(
    passageId: string,
    patch: { status?: ResearchEvidenceStatus; reasoning?: string },
  ) {
    try {
      const next = updateResearchAssessment(
        workspace,
        passageId,
        patch,
        new Date().toISOString(),
      );
      saveResearchWorkspace(next);
      if (patch.status && patch.status !== "unreviewed") {
        trackEvent("research_evidence_assessed", {
          evidence_status: patch.status,
          evidence_count: passages.length,
        });
      }
    } catch {
      setFeedback("浏览器未能保存证据判断，请稍后重试。");
    }
  }

  function exportReport() {
    if (!workspace.question.trim() && passages.length === 0) return;
    downloadResearchReport(workspace, passages, notes);
    setFeedback(`已导出研究报告：${passages.length} 条原典证据，${readiness.assessedCount} 条已说明关系。`);
    trackEvent("research_report_exported", {
      evidence_count: passages.length,
      assessed_count: readiness.assessedCount,
      work_count: readiness.uniqueWorkCount,
      counter_evidence_count: readiness.counterEvidenceCount,
    });
  }

  function adoptIncomingQuestion() {
    try {
      saveResearchWorkspace({
        ...workspace,
        question: incomingQuestion.slice(0, researchWorkspaceFieldLimits.question),
        updatedAt: new Date().toISOString(),
      });
      clearResearchQuestionSession();
      setFeedback("首页问题已带入当前研究任务。");
    } catch {
      setFeedback("浏览器未能带入这个问题，请手动填写。");
    }
  }

  function resetWorkspace() {
    if (!window.confirm("清空当前研究问题、范围、暂定结论和证据判断？已收藏原典与研读笺不会删除。")) return;
    try {
      saveResearchWorkspace({
        question: "",
        scope: "",
        provisionalFinding: "",
        assessments: [],
        updatedAt: new Date().toISOString(),
      });
      clearResearchQuestionSession();
      setFeedback("研究任务已清空；已收藏原典与研读笺仍然保留。");
      trackEvent("research_workspace_cleared", { evidence_count: passages.length });
    } catch {
      setFeedback("浏览器未能清空研究任务，请稍后重试。");
    }
  }

  const stepCompletion = [
    readiness.hasQuestion,
    readiness.hasScope,
    readiness.evidenceCount > 0,
    readiness.allEvidenceAssessed,
  ];
  const canExport = readiness.hasQuestion || readiness.evidenceCount > 0;
  const hasDifferentIncomingQuestion = incomingQuestion
    && incomingQuestion !== workspace.question.trim();

  return (
    <section className={styles.workbench} aria-labelledby="research-workbench-title">
      <header className={styles.toolbar}>
        <div>
          <p>LOCAL RESEARCH TASK</p>
          <h2 id="research-workbench-title">研究证据工作台</h2>
          <span><ShieldCheck aria-hidden="true" /> 问题、判断与笔记只在当前浏览器</span>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" onClick={exportReport} disabled={!canExport}>
            <Download aria-hidden="true" /> 导出研究报告
          </button>
          {canExport && (
            <button type="button" className={styles.resetButton} onClick={resetWorkspace}>
              <RotateCcw aria-hidden="true" /> 清空任务
            </button>
          )}
        </div>
      </header>

      <section className={styles.plan} aria-labelledby="research-plan-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>RESEARCH PLAN · 预计 15–30 分钟完成首轮整理</p>
            <h3 id="research-plan-title">先说明怎样查，再形成结论。</h3>
          </div>
          <span>{stepCompletion.filter(Boolean).length} / {planSteps.length} 步已有材料</span>
        </div>
        <ol>
          {planSteps.map((step, index) => (
            <li key={step.number} data-complete={stepCompletion[index]}>
              <span>{stepCompletion[index] ? <Check aria-hidden="true" /> : step.number}</span>
              <div><strong>{step.label}</strong><small>{step.detail}</small></div>
            </li>
          ))}
        </ol>
      </section>

      {hasDifferentIncomingQuestion && (
        <aside className={styles.incomingQuestion}>
          <FileSearch aria-hidden="true" />
          <div>
            <strong>首页带来一个新的研究问题</strong>
            <p>{incomingQuestion}</p>
          </div>
          <button
            type="button"
            onClick={adoptIncomingQuestion}
          >
            带入当前任务
          </button>
        </aside>
      )}

      <div className={styles.briefGrid}>
        <label>
          <span>01 · 研究问题</span>
          <textarea
            value={workspace.question}
            onChange={(event) => updateWorkspace({ question: event.target.value })}
            maxLength={researchWorkspaceFieldLimits.question}
            placeholder="例如：不同汉译本怎样表达‘应无所住而生其心’的修行边界？"
          />
          <small>要能被原文支持、限定或推翻，不写成预设答案。</small>
        </label>
        <label>
          <span>02 · 来源范围与排除条件</span>
          <textarea
            value={workspace.scope}
            onChange={(event) => updateWorkspace({ scope: event.target.value })}
            maxLength={researchWorkspaceFieldLimits.scope}
            placeholder="说明传统、语种、版本、时间范围，以及暂不纳入哪些注疏或现代解释……"
          />
          <small>范围没有写出来，遗漏与越界就无法被发现。</small>
        </label>
        <label className={styles.findingField}>
          <span>03 · 暂定结论</span>
          <textarea
            value={workspace.provisionalFinding}
            onChange={(event) => updateWorkspace({ provisionalFinding: event.target.value })}
            maxLength={researchWorkspaceFieldLimits.provisionalFinding}
            placeholder="在证据充分前保持为空；形成判断后，也请保留不确定性与反证。"
          />
          <small>这是读者的研究判断，不会被标成经文或平台权威解释。</small>
        </label>
      </div>

      <section className={styles.matrix} aria-labelledby="evidence-matrix-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>CLAIM–EVIDENCE MATRIX</p>
            <h3 id="evidence-matrix-title">主张—证据矩阵</h3>
          </div>
          <dl>
            <div><dt>原典</dt><dd>{readiness.evidenceCount}</dd></div>
            <div><dt>已判断</dt><dd>{readiness.assessedCount}</dd></div>
            <div><dt>作品</dt><dd>{readiness.uniqueWorkCount}</dd></div>
            <div><dt>限定 / 反证</dt><dd>{readiness.counterEvidenceCount}</dd></div>
          </dl>
        </div>

        {passages.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpenText aria-hidden="true" />
            <div>
              <p>当前还没有原典证据</p>
              <h4>先去经藏选中一段正文，再点“收藏选文”。</h4>
              <span>稳定行段、版本和原典链接会自动来到这里；工作台不会把手写摘要冒充证据。</span>
            </div>
            <Link href="/jingzang" prefetch={false}>浏览经藏 <ArrowRight aria-hidden="true" /></Link>
          </div>
        ) : (
          <ol className={styles.evidenceList}>
            {passages.map((passage, index) => {
              const assessment = assessments.get(passage.id);
              const note = linkedNotes.get(passage.id);
              const status = assessment?.status ?? "unreviewed";
              return (
                <li key={passage.id}>
                  <article className={styles.evidenceCard} data-status={status}>
                    <header>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <p>{passage.locator}</p>
                        <h4>{passage.workTitle}</h4>
                        <small>{passage.passageLabel}</small>
                      </div>
                      <Link href={passage.sourceHref}>
                        核对原典 <ArrowRight aria-hidden="true" />
                      </Link>
                    </header>
                    <blockquote lang={passage.quoteLang}>{passage.quote}</blockquote>
                    <div className={styles.assessmentFields}>
                      <label>
                        <span>与研究主张的关系</span>
                        <select
                          aria-label={`${passage.workTitle}与研究主张的关系`}
                          value={status}
                          onChange={(event) => assessPassage(passage.id, {
                            status: event.target.value as ResearchEvidenceStatus,
                          })}
                        >
                          {(Object.keys(researchEvidenceStatusLabels) as ResearchEvidenceStatus[]).map((key) => (
                            <option key={key} value={key}>{researchEvidenceStatusLabels[key]}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>这条原文怎样支持、限制或反驳判断</span>
                        <textarea
                          aria-label={`${passage.workTitle}证据关系说明`}
                          value={assessment?.reasoning ?? ""}
                          onChange={(event) => assessPassage(passage.id, {
                            reasoning: event.target.value,
                          })}
                          maxLength={researchWorkspaceFieldLimits.reasoning}
                          placeholder="只说明原文能证明到哪一步，也写清它不能证明什么……"
                        />
                      </label>
                    </div>
                    {note && (
                      <aside className={styles.linkedNote}>
                        <Fingerprint aria-hidden="true" />
                        <div>
                          <strong>相关研读笺 · {studyNoteKindLabels[note.kind]}</strong>
                          <p>{note.body}</p>
                          <small>个人笔记，不计作原典证据。</small>
                        </div>
                      </aside>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <aside className={styles.methodAudit} aria-labelledby="method-audit-title">
        <div>
          <ListChecks aria-hidden="true" />
          <p>METHOD CHECK</p>
          <h3 id="method-audit-title">导出前，主动寻找自己的盲点。</h3>
        </div>
        <ul>
          <li data-complete={readiness.hasQuestion}>
            <Check aria-hidden="true" /> 研究问题已明确
          </li>
          <li data-complete={readiness.hasScope}>
            <Check aria-hidden="true" /> 来源范围与排除条件已声明
          </li>
          <li data-complete={readiness.allEvidenceAssessed}>
            <Check aria-hidden="true" /> 每条原典都已说明与主张的关系
          </li>
          <li data-complete={readiness.uniqueWorkCount >= 2}>
            <Check aria-hidden="true" /> 至少核对两部作品，避免单一摘句
          </li>
          <li data-complete={readiness.counterEvidenceCount > 0}>
            <Check aria-hidden="true" /> 已记录限定或反证，而非只收支持材料
          </li>
        </ul>
      </aside>

      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback || "所有输入自动保存在当前浏览器；导出报告会明确区分原典证据与读者判断。"}
      </p>
    </section>
  );
}
