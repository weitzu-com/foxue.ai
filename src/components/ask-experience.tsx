"use client";

import { type FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Search, ShieldCheck } from "lucide-react";
import { EvidenceCard } from "@/components/evidence-card";
import { StatusPill } from "@/components/status-pill";
import { buildResearchResult } from "@/lib/research";
import {
  QUESTION_CHANGE_EVENT,
  QUESTION_MAX_LENGTH,
  QUESTION_SESSION_KEY,
  saveQuestionToSession,
} from "@/lib/question-session";
import { trackEvent } from "@/lib/analytics";

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

export function AskExperience() {
  const storedQuestion = useSyncExternalStore(
    subscribeToQuestion,
    readSessionQuestion,
    readServerQuestion,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const inputValue = draft ?? storedQuestion;
  const activeQuestion = submitted ?? storedQuestion;
  const result = useMemo(() => buildResearchResult(activeQuestion), [activeQuestion]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = saveQuestionToSession(inputValue);
    const nextResult = buildResearchResult(normalized);
    setDraft(normalized);
    setSubmitted(normalized);
    trackEvent("question_submitted", {
      entry_point: "ask",
      evidence_count: nextResult.evidence.length,
      input_length: normalized.length,
      result_status: nextResult.status,
    });
  }

  return (
    <>
      <form className="ask-search" onSubmit={handleSubmit}>
        <Search aria-hidden="true" size={19} />
        <label className="sr-only" htmlFor="ask-query">输入佛学问题</label>
        <input
          id="ask-query"
          value={inputValue}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="输入经名、句子、术语或一个真实问题……"
          autoComplete="off"
          maxLength={QUESTION_MAX_LENGTH}
        />
        <button type="submit">查找证据 <ArrowRight aria-hidden="true" size={17} /></button>
      </form>
      <p className="ask-privacy-note">
        <ShieldCheck aria-hidden="true" size={15} />
        可信原型在你的浏览器标签页内处理问题，不把问题写入网址或发送给服务器。
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
              <Link href="/jingzang">浏览经藏 <ArrowRight aria-hidden="true" size={15} /></Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
