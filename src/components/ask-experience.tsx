"use client";

import { type FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ExternalLink, LockKeyhole, Network, Search, ShieldCheck, X } from "lucide-react";
import { EvidenceCard } from "@/components/evidence-card";
import { StatusPill } from "@/components/status-pill";
import { buildResearchResult } from "@/lib/research";
import {
  clearQuestionSourceContextFromSession,
  parseQuestionSourceContext,
  QUESTION_CHANGE_EVENT,
  QUESTION_MAX_LENGTH,
  QUESTION_SESSION_KEY,
  QUESTION_SOURCE_CONTEXT_KEY,
  saveQuestionToSession,
} from "@/lib/question-session";
import { trackEvent } from "@/lib/analytics";
import styles from "./ask-experience.module.css";

function subscribeToQuestion(onStoreChange: () => void) {
  window.addEventListener(QUESTION_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(QUESTION_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readSessionQuestion() {
  return window.sessionStorage.getItem(QUESTION_SESSION_KEY) ?? "";
}

function readServerQuestion() {
  return "";
}

function readSourceContextSnapshot() {
  return window.sessionStorage.getItem(QUESTION_SOURCE_CONTEXT_KEY) ?? "";
}

function readServerSourceContext() {
  return "";
}

export function AskExperience() {
  const storedQuestion = useSyncExternalStore(
    subscribeToQuestion,
    readSessionQuestion,
    readServerQuestion,
  );
  const sourceContextSnapshot = useSyncExternalStore(
    subscribeToQuestion,
    readSourceContextSnapshot,
    readServerSourceContext,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const inputValue = draft ?? storedQuestion;
  const activeQuestion = submitted ?? storedQuestion;
  const sourceContext = useMemo(
    () => parseQuestionSourceContext(sourceContextSnapshot),
    [sourceContextSnapshot],
  );
  const result = useMemo(
    () => buildResearchResult(activeQuestion, sourceContext),
    [activeQuestion, sourceContext],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = saveQuestionToSession(
      inputValue,
      sourceContext ? "passage" : undefined,
      { preserveSourceContext: Boolean(sourceContext) },
    );
    const nextResult = buildResearchResult(normalized, sourceContext);
    setDraft(normalized);
    setSubmitted(normalized);
    trackEvent("question_submitted", {
      entry_point: "ask",
      evidence_count: nextResult.evidence.length,
      input_length: normalized.length,
      result_status: nextResult.status,
    });
  }

  function clearSourceContext() {
    if (!sourceContext) return;
    trackEvent("passage_question_context_removed", {
      source_id: sourceContext.id,
      segment_count: sourceContext.segmentCount,
    });
    clearQuestionSourceContextFromSession();
  }

  return (
    <>
      {sourceContext && (
        <section
          className={styles.sourceContext}
          aria-labelledby="ask-source-context-title"
          data-question-source-context
        >
          <header className={styles.sourceContextHeader}>
            <div>
              <p><LockKeyhole aria-hidden="true" /> SOURCE LOCK · 当前标签页</p>
              <h2 id="ask-source-context-title">已锁定原典，不会暗中换经</h2>
            </div>
            <button type="button" onClick={clearSourceContext}>
              <X aria-hidden="true" /> 解除选段
            </button>
          </header>
          <blockquote lang={sourceContext.quoteLang}>{sourceContext.quote}</blockquote>
          <div className={styles.sourceContextMeta}>
            <dl>
              <div><dt>作品</dt><dd>{sourceContext.workTitle}</dd></div>
              <div><dt>责任者</dt><dd>{sourceContext.responsibility}</dd></div>
              <div><dt>稳定坐标</dt><dd>{sourceContext.locator}</dd></div>
              <div><dt>版本</dt><dd>{sourceContext.canonRef} · {sourceContext.sourceName}</dd></div>
            </dl>
            <Link
              href={sourceContext.sourceHref}
              prefetch={false}
              data-analytics-event="source_opened"
              data-analytics-location="passage_question_context"
              data-analytics-content-id={sourceContext.id}
              data-analytics-label={sourceContext.workTitle}
            >
              回到所选原文 <ExternalLink aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.sourceContextBoundary}>
            锁定只保证问题锚定到这段原文；解释仍须通过下方证据，超出审核范围时系统会停下。
          </p>
        </section>
      )}
      <form className="ask-search" onSubmit={handleSubmit}>
        <Search aria-hidden="true" size={19} />
        <label className="sr-only" htmlFor="ask-query">输入佛学问题</label>
        <input
          id="ask-query"
          value={inputValue}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={sourceContext ? "继续问这段的术语、上下文或含义……" : "输入经名、句子、术语或一个真实问题……"}
          autoComplete="off"
          maxLength={QUESTION_MAX_LENGTH}
        />
        <button type="submit">查找证据 <ArrowRight aria-hidden="true" size={17} /></button>
      </form>
      <p className="ask-privacy-note">
        <ShieldCheck aria-hidden="true" size={15} />
        {sourceContext
          ? "问题与所选原文只保存在当前浏览器标签页，不写入网址或发送给服务器。"
          : "可信原型在你的浏览器标签页内处理问题，不把问题写入网址或发送给服务器。"}
      </p>

      <div className="answer-layout">
        <article className="answer-sheet">
          <div className="answer-sheet__meta">
            <StatusPill status={result.status} />
            <span>回答范围：已登记汉译样本</span>
          </div>
          {result.query && <p className="answer-question">“{result.query}”</p>}
          <h2>{result.title}</h2>
          <div className="answer-prose">
            {result.answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className="answer-boundary">
            <span>范围与提醒</span>
            <p>{result.caution}</p>
          </div>
          <div className="answer-method">
            <BookOpenCheck aria-hidden="true" />
            <div>
              <strong>这不是“AI 佛陀”</strong>
              <p>系统只综合当前证据，不授记、不代替师承，也不把单一传统包装成唯一答案。</p>
            </div>
          </div>
          {result.concept && (
            <Link
              className="answer-concept-link"
              href={result.concept.href}
              onClick={() => trackEvent("concept_opened", {
                entry_point: "ask_result",
                concept: result.concept?.slug,
              })}
            >
              <Network aria-hidden="true" />
              <span>
                <small>继续分辨术语与传统边界</small>
                <strong>进入“{result.concept.title}”概念 Hub</strong>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </article>

        <aside className="evidence-panel" aria-labelledby="evidence-title">
          <div className="evidence-panel__heading">
            <div>
              <p className="eyebrow">EVIDENCE</p>
              <h2 id="evidence-title">证据</h2>
            </div>
            <span>{result.evidence.length} 项</span>
          </div>
          {result.evidence.length > 0 ? (
            <div className="evidence-list">
              {result.evidence.map((item, index) => (
                <EvidenceCard key={`${item.locator}-${index}`} evidence={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="empty-evidence">
              <span>未</span>
              <h3>没有足以支持结论的证据</h3>
              <p>请尝试更具体的经名、句子或术语，或先浏览当前经藏。</p>
              <Link href="/jingzang" prefetch={false}>浏览经藏 <ArrowRight aria-hidden="true" size={15} /></Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
