"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  QUESTION_CHANGE_EVENT,
  QUESTION_MAX_LENGTH,
  QUESTION_MODE_KEY,
  QUESTION_SESSION_KEY,
  saveQuestionToSession,
} from "@/lib/question-session";
import { buildQuoteVerification } from "@/lib/quote-verification";
import styles from "./page.module.css";

const examples = [
  "色即是空，空即是色",
  "无所住而生心",
  "前世五百次的回眸，才换来今生的擦肩而过",
];

function subscribeToQuestion(onStoreChange: () => void) {
  window.addEventListener(QUESTION_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(QUESTION_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readQuoteFromSession() {
  if (window.sessionStorage.getItem(QUESTION_MODE_KEY) !== "quote") return "";
  return window.sessionStorage.getItem(QUESTION_SESSION_KEY) ?? "";
}

function readServerQuote() {
  return "";
}

export function QuoteVerifier() {
  const storedQuote = useSyncExternalStore(
    subscribeToQuestion,
    readQuoteFromSession,
    readServerQuote,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const inputValue = draft ?? storedQuote;
  const activeQuote = submitted ?? storedQuote;
  const result = buildQuoteVerification(activeQuote);

  function verify(value: string) {
    const normalized = saveQuestionToSession(value, "quote");
    setDraft(normalized);
    setSubmitted(normalized);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    verify(inputValue);
  }

  return (
    <section className={styles.verifier} aria-labelledby="verifier-title">
      <div className={styles.verifierHeading}>
        <div>
          <p className={styles.eyebrow}>QUOTE CHECK · 本地核对</p>
          <h2 id="verifier-title">把流行说法放到证据桌上。</h2>
        </div>
        <p>
          输入内容只保存在当前浏览器标签页，不写入网址，也不发送到服务器。
          首批核验表含 5 个已逐字复核条目。
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="quote-query">输入要核对的佛学说法</label>
        <input
          id="quote-query"
          value={inputValue}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="粘贴一句常见佛学说法……"
          autoComplete="off"
          maxLength={QUESTION_MAX_LENGTH}
        />
        <button type="submit">核对原句 <ArrowRight aria-hidden="true" /></button>
      </form>
      <div className={styles.formMeta}>
        <span><ShieldCheck aria-hidden="true" /> 标签页内处理</span>
        <div>
          <span>试一试</span>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => verify(example)}>
              {example}
            </button>
          ))}
        </div>
      </div>

      {result ? (
        <div className={styles.resultGrid} aria-live="polite">
          <article className={styles.verdict} data-status={result.status}>
            <div className={styles.verdictStatus}>
              {result.status === "原句可核验" ? (
                <CircleCheck aria-hidden="true" />
              ) : (
                <CircleAlert aria-hidden="true" />
              )}
              <span>{result.status}</span>
            </div>
            <p className={styles.inputQuote}>“{result.query}”</p>
            <h3>{result.heading}</h3>
            <p className={styles.summary}>{result.summary}</p>
            {result.matchNote && (
              <div className={styles.matchNote}>
                <strong>文字差异</strong>
                <p>{result.matchNote}</p>
              </div>
            )}
            <dl className={styles.boundaries}>
              <div>
                <dt>现在可以怎样说</dt>
                <dd>{result.canConclude}</dd>
              </div>
              <div>
                <dt>不能越过的边界</dt>
                <dd>{result.cannotConclude}</dd>
              </div>
            </dl>
          </article>

          {result.evidence ? (
            <aside className={styles.evidence} aria-label="原典证据">
              <div className={styles.evidenceTopline}>
                <span>原典证据 · 01</span>
                <BookOpenCheck aria-hidden="true" />
              </div>
              <blockquote>{result.evidence.quote}</blockquote>
              <div className={styles.context}>
                <span>前后文片段</span>
                <p>{result.evidence.context}</p>
              </div>
              <div className={styles.citation}>
                <div>
                  <strong>{result.evidence.title}</strong>
                  <span>{result.evidence.attribution} · {result.evidence.canonId}</span>
                  <code>{result.evidence.locator}</code>
                </div>
                <Link href={result.evidence.href}>
                  打开原句 <ExternalLink aria-hidden="true" />
                </Link>
              </div>
            </aside>
          ) : (
            <aside className={`${styles.evidence} ${styles.emptyEvidence}`} aria-label="证据不足后的下一步">
              <div className={styles.evidenceTopline}>
                <span>STOP · 不补写出处</span>
                <CircleAlert aria-hidden="true" />
              </div>
              <div className={styles.emptyMark}>未</div>
              <h3>不要先把它标成“佛说”。</h3>
              <p>
                可以缩短为最有辨识度的 6–20 个字再试，或进入经藏继续核对经名、译者与上下文。
              </p>
              <div className={styles.emptyLinks}>
                <Link href="/jingzang" prefetch={false}>浏览经藏 <ArrowRight aria-hidden="true" /></Link>
                <Link href="/wenjing">改问佛学含义 <ArrowRight aria-hidden="true" /></Link>
              </div>
            </aside>
          )}
        </div>
      ) : (
        <div className={styles.waiting}>
          <span>待</span>
          <div>
            <h3>先输入原句，再下判断。</h3>
            <p>繁简与常见标点差异会被忽略；缩写、转述与无法核验会分别标明。</p>
          </div>
        </div>
      )}
    </section>
  );
}
