"use client";

import { type KeyboardEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  Compass,
  Copy,
  Fingerprint,
  Quote,
} from "lucide-react";
import { dailyScripturePassages } from "@/data/daily-scripture";
import { trackEvent } from "@/lib/analytics";
import styles from "./daily-scripture.module.css";

const DAY_IN_MS = 86_400_000;
const SHANGHAI_OFFSET_IN_MS = 8 * 60 * 60 * 1000;
const SERVER_DAY_KEY = 0;

type ReadingLens = "quiet" | "context" | "verify";

const readingLenses = [
  { id: "quiet", label: "静读", icon: Compass },
  { id: "context", label: "理解", icon: BookOpenText },
  { id: "verify", label: "核对", icon: Fingerprint },
] as const;

function getShanghaiDayKey() {
  return Math.floor((Date.now() + SHANGHAI_OFFSET_IN_MS) / DAY_IN_MS);
}

function getServerDayKey() {
  return SERVER_DAY_KEY;
}

function subscribeToShanghaiDay(onStoreChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  function scheduleNextMidnight() {
    const now = Date.now();
    const nextMidnight = (getShanghaiDayKey() + 1) * DAY_IN_MS - SHANGHAI_OFFSET_IN_MS;
    const delay = Math.min(Math.max(nextMidnight - now + 100, 100), 2_147_483_647);
    timer = setTimeout(() => {
      onStoreChange();
      if (!cancelled) scheduleNextMidnight();
    }, delay);
  }

  scheduleNextMidnight();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

function wrapIndex(index: number) {
  const count = dailyScripturePassages.length;
  return ((index % count) + count) % count;
}

function formatShanghaiDate(dayKey: number) {
  if (dayKey === SERVER_DAY_KEY) return "每天一段 · 上海日期轮换";

  const shanghaiNoon = dayKey * DAY_IN_MS - SHANGHAI_OFFSET_IN_MS + 12 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(shanghaiNoon));
}

function shanghaiDateTime(dayKey: number) {
  if (dayKey === SERVER_DAY_KEY) return undefined;
  return new Date(dayKey * DAY_IN_MS).toISOString().slice(0, 10);
}

export function DailyScripture({ className }: { className?: string }) {
  const dayKey = useSyncExternalStore(
    subscribeToShanghaiDay,
    getShanghaiDayKey,
    getServerDayKey,
  );
  const [offset, setOffset] = useState(0);
  const [lens, setLens] = useState<ReadingLens>("quiet");
  const [copyFeedback, setCopyFeedback] = useState("");
  const activeIndex = wrapIndex(dayKey + offset);
  const passage = dailyScripturePassages[activeIndex];
  const lensCopy = lens === "quiet"
    ? passage.quietPrompt
    : lens === "context"
      ? passage.context
      : passage.verification;
  const lensHeading = lens === "quiet"
    ? "停一分钟 · 编辑练习"
    : lens === "context"
      ? "理解提示 · 编辑说明"
      : "原典核对 · 版本边界";

  function browse(delta: number) {
    setOffset((current) => current + delta);
    setCopyFeedback("");
  }

  function moveLens(event: KeyboardEvent<HTMLButtonElement>, currentLens: ReadingLens) {
    const currentIndex = readingLenses.findIndex((item) => item.id === currentLens);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % readingLenses.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + readingLenses.length) % readingLenses.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = readingLenses.length - 1;
    else return;

    event.preventDefault();
    const nextLens = readingLenses[nextIndex].id;
    setLens(nextLens);
    document.getElementById(`daily-lens-${nextLens}`)?.focus();
  }

  async function copyCitation() {
    const sourceUrl = new URL(passage.sourceHref, window.location.origin);
    const citation = [
      `“${passage.quote}”`,
      `——${passage.workTitle}，${passage.witness}，${passage.locator}`,
      sourceUrl.toString(),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(citation);
      setCopyFeedback("引文、版本、稳定行段与原典链接已复制。");
      trackEvent("citation_copied", {
        content_id: passage.locator,
        entry_point: "home_daily_scripture",
      });
    } catch {
      setCopyFeedback("浏览器未允许复制；可先打开原典，再使用经卷页的引用工具。");
    }
  }

  return (
    <aside
      className={`${styles.daily}${className ? ` ${className}` : ""}`}
      aria-labelledby="daily-scripture-title"
    >
      <div className={styles.rail} aria-hidden="true">
        <span>今</span><span>日</span><span>原</span><span>典</span>
      </div>

      <div className={styles.paper}>
        <header className={styles.topline}>
          <div>
            <span>DAILY SOURCE · {passage.collection}</span>
            <strong id="daily-scripture-title">今日原典</strong>
          </div>
          <time dateTime={shanghaiDateTime(dayKey)}>{formatShanghaiDate(dayKey)}</time>
        </header>

        <div className={styles.passageNav}>
          <span aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {dailyScripturePassages.length}
            <span className="sr-only">，当前为{passage.workTitle}，{passage.locator}</span>
          </span>
          <div>
            <button type="button" onClick={() => browse(-1)} aria-label="查看上一段原典">
              <ArrowLeft aria-hidden="true" />
            </button>
            <button type="button" onClick={() => browse(1)} aria-label="查看下一段原典">
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <Quote className={styles.quoteMark} aria-hidden="true" />
        <blockquote lang={passage.lang}>“{passage.quote}”</blockquote>

        <div className={styles.lenses} role="tablist" aria-label="选择阅读方式">
          {readingLenses.map((item) => {
            const Icon = item.icon;
            const selected = lens === item.id;
            return (
              <button
                key={item.id}
                id={`daily-lens-${item.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="daily-lens-panel"
                tabIndex={selected ? 0 : -1}
                className={selected ? styles.activeLens : undefined}
                onClick={() => setLens(item.id)}
                onKeyDown={(event) => moveLens(event, item.id)}
              >
                <Icon aria-hidden="true" /> {item.label}
              </button>
            );
          })}
        </div>

        <section
          id="daily-lens-panel"
          className={styles.lensPanel}
          role="tabpanel"
          aria-live="polite"
          aria-labelledby={`daily-lens-${lens}`}
        >
          <span>{lensHeading}</span>
          <p>{lensCopy}</p>
          <small>{lens === "quiet" ? "练习不是经文，也不代替师承。" : "编辑辅助层不是经典原文。"}</small>
        </section>

        <footer className={styles.citation}>
          <div className={styles.sourceIdentity}>
            <strong>{passage.workTitle}</strong>
            <span>{passage.witness}</span>
            <code>{passage.locator}</code>
          </div>
          <div className={styles.actions}>
            <Link
              className={styles.sourceAction}
              href={passage.sourceHref}
              data-analytics-event="source_opened"
              data-analytics-content-id={passage.locator}
              data-analytics-location="home_daily_scripture"
              data-analytics-label={passage.workTitle}
            >
              打开原典 <ArrowRight aria-hidden="true" />
            </Link>
            <button type="button" onClick={copyCitation}>
              {copyFeedback.startsWith("引文") ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              复制引文
            </button>
          </div>
          <Link className={styles.studyAction} href={passage.studyHref}>
            {passage.studyLabel} <ArrowRight aria-hidden="true" />
          </Link>
          <p className={styles.feedback} role="status" aria-live="polite">
            {copyFeedback || "原文、编辑提示与核对说明分层呈现。"}
          </p>
        </footer>
      </div>
    </aside>
  );
}
