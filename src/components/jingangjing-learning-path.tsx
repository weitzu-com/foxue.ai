"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  Copy,
  FileSearch,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import { StudyNoteComposer } from "@/components/study-note-composer";
import { recordStudyPathProgress } from "@/components/use-study-path-activity";
import {
  jingangjingFullTextHref,
  jingangjingLearningDays,
  type JingangjingLearningDay,
} from "@/data/jingangjing-learning-path";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "foxue:jingangjing-seven-day-progress:v1";
const PROGRESS_EVENT = "foxue:jingangjing-seven-day-progress-change";
const EMPTY_SNAPSHOT = '{"version":1,"activeDay":1,"statuses":{}}';
let memorySnapshot = EMPTY_SNAPSHOT;
let localStorageAvailable = true;

type DayStatus = "completed" | "skipped";

type LearningProgress = {
  version: 1;
  activeDay: number;
  statuses: Record<string, DayStatus>;
};

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROGRESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROGRESS_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  if (!localStorageAvailable) return memorySnapshot;

  try {
    memorySnapshot = window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    localStorageAvailable = false;
  }
  return memorySnapshot;
}

function readServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

function parseProgress(snapshot: string): LearningProgress {
  try {
    const value = JSON.parse(snapshot) as Partial<LearningProgress>;
    const activeDay = Number(value.activeDay);
    const statuses = Object.fromEntries(
      Object.entries(value.statuses ?? {}).filter(
        ([key, status]) =>
          /^[1-7]$/.test(key) && (status === "completed" || status === "skipped"),
      ),
    ) as Record<string, DayStatus>;
    return {
      version: 1,
      activeDay: activeDay >= 1 && activeDay <= 7 ? activeDay : 1,
      statuses,
    };
  } catch {
    return JSON.parse(EMPTY_SNAPSHOT) as LearningProgress;
  }
}

function saveProgress(progress: LearningProgress) {
  memorySnapshot = JSON.stringify(progress);
  if (localStorageAvailable) {
    try {
      window.localStorage.setItem(STORAGE_KEY, memorySnapshot);
    } catch {
      localStorageAvailable = false;
    }
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

function clearProgress() {
  memorySnapshot = EMPTY_SNAPSHOT;
  if (localStorageAvailable) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      localStorageAvailable = false;
    }
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

function dayFromHash() {
  const match = window.location.hash.match(/^#day-([1-7])$/);
  return match ? Number(match[1]) : undefined;
}

function setDayHash(day: number) {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#day-${day}`,
  );
}

function citationText(day: JingangjingLearningDay) {
  const studyUrl = new URL(`/xue/jingangjing#day-${day.id}`, window.location.origin);
  const sourceUrl = new URL(day.href, window.location.origin);
  return [
    `“${day.reading}”`,
    `——《金刚般若波罗蜜经》后秦·鸠摩罗什译，${day.locator}`,
    `原典：${sourceUrl}`,
    `研读：${studyUrl}`,
  ].join("\n");
}

function CitationCopy({ day }: { day: JingangjingLearningDay }) {
  const [feedback, setFeedback] = useState("");

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citationText(day));
      setFeedback("引文、译者、稳定行段与链接已复制。");
      trackEvent("citation_copied", {
        content_id: day.segmentId,
        step_number: day.id,
        learning_path: "jingangjing",
      });
    } catch {
      setFeedback("浏览器未允许复制；可打开原典后使用经卷页的引用工具。");
    }
  }

  return (
    <div className="path-copy-citation">
      <button type="button" onClick={copyCitation}>
        <Copy aria-hidden="true" /> 复制引文与出处
      </button>
      <p role="status" aria-live="polite">
        {feedback || "复制内容包含原句、译者、T 经号、稳定行段与两个永久入口。"}
      </p>
    </div>
  );
}

export function JingangjingLearningPath() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  const progress = useMemo(() => parseProgress(snapshot), [snapshot]);
  const activeDay = jingangjingLearningDays[progress.activeDay - 1];
  const activeStatus = progress.statuses[String(activeDay.id)];
  const completedCount = Object.values(progress.statuses).filter(
    (status) => status === "completed",
  ).length;
  const skippedCount = Object.values(progress.statuses).filter(
    (status) => status === "skipped",
  ).length;
  const coveredCount = completedCount + skippedCount;

  useEffect(() => {
    recordStudyPathProgress("jingangjing", progress.activeDay, progress.statuses);
  }, [progress.activeDay, progress.statuses]);

  useEffect(() => {
    function applySharedDay() {
      const sharedDay = dayFromHash();
      if (!sharedDay) return;
      const current = parseProgress(readSnapshot());
      if (current.activeDay !== sharedDay) {
        saveProgress({ ...current, activeDay: sharedDay });
      }
    }

    applySharedDay();
    window.addEventListener("hashchange", applySharedDay);
    return () => window.removeEventListener("hashchange", applySharedDay);
  }, []);

  useEffect(() => {
    const sharedDay = dayFromHash();
    if (sharedDay !== activeDay.id) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`day-${sharedDay}`)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeDay.id]);

  function goToDay(day: number) {
    setDayHash(day);
    saveProgress({ ...progress, activeDay: day });
  }

  function markDay(status: DayStatus) {
    const nextDay = Math.min(activeDay.id + 1, 7);
    const nextStatuses = { ...progress.statuses, [String(activeDay.id)]: status };
    setDayHash(nextDay);
    saveProgress({
      ...progress,
      activeDay: nextDay,
      statuses: nextStatuses,
    });
    trackEvent("study_path_step_marked", {
      learning_path: "jingangjing",
      step_number: activeDay.id,
      step_status: status,
      covered_count: Object.keys(nextStatuses).length,
    });
  }

  function resetProgress() {
    if (!window.confirm("清除这台设备上的《金刚经》7 天研读进度？")) return;
    setDayHash(1);
    clearProgress();
  }

  return (
    <section
      className="xinjing-path jingangjing-path"
      aria-labelledby="jingangjing-path-title"
    >
      <h2 className="sr-only" id="jingangjing-path-title">
        《金刚经》7 天原典研读日程
      </h2>

      <aside className="path-rail">
        <div className="path-progress">
          <div className="path-progress__topline">
            <span>已走过</span>
            <strong>{coveredCount} / 7</strong>
          </div>
          <div
            className="path-progress__track"
            role="progressbar"
            aria-label="《金刚经》7 天研读进度"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={coveredCount}
          >
            <span style={{ width: `${(coveredCount / 7) * 100}%` }} />
          </div>
          <p>完成 {completedCount} · 跳过 {skippedCount}</p>
        </div>

        <ol className="path-day-list">
          {jingangjingLearningDays.map((day) => {
            const status = progress.statuses[String(day.id)];
            const statusLabel = status === "completed"
              ? "，已完成"
              : status === "skipped"
                ? "，已跳过"
                : "，未标记";
            return (
              <li key={day.id}>
                <button
                  type="button"
                  className={status ? `is-${status}` : undefined}
                  aria-current={day.id === activeDay.id ? "step" : undefined}
                  aria-label={`第 ${day.id} 天，${day.focus}，${day.title}${statusLabel}`}
                  onClick={() => goToDay(day.id)}
                >
                  <span className="path-day-list__mark" aria-hidden="true">
                    {status === "completed" ? (
                      <Check />
                    ) : status === "skipped" ? (
                      <SkipForward />
                    ) : (
                      <Circle />
                    )}
                  </span>
                  <span>
                    <small>第 {day.id} 天 · {day.focus}</small>
                    <strong>{day.title}</strong>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="path-local-note">
          <ShieldCheck aria-hidden="true" />
          <p>
            <strong>只存在这台设备</strong>
            进度与研读笺不登录、不上传。
          </p>
        </div>
        {coveredCount > 0 && (
          <button className="path-reset" type="button" onClick={resetProgress}>
            <RotateCcw aria-hidden="true" /> 清除本地进度
          </button>
        )}
      </aside>

      <article className="path-day-paper" id={`day-${activeDay.id}`} aria-live="polite">
        <span className="path-day-paper__watermark" aria-hidden="true">
          {activeDay.id}
        </span>
        <header className="path-day-paper__header">
          <div>
            <p>第 {activeDay.id} 天 · DAY {String(activeDay.id).padStart(2, "0")}</p>
            <h2>{activeDay.title}</h2>
          </div>
          <span className={`path-day-state${activeStatus ? ` is-${activeStatus}` : ""}`}>
            {activeStatus === "completed"
              ? "已完成"
              : activeStatus === "skipped"
                ? "已跳过 · 可补读"
                : "约 8 分钟"}
          </span>
        </header>

        <aside className="path-version-boundary" aria-label="当前底本与版本边界">
          <FileSearch aria-hidden="true" />
          <div>
            <strong>当前阅读底本：后秦·鸠摩罗什译 T0235</strong>
            <p>
              作品页另列同一文本家族的六种汉译与一份历史英译。它们可并读，
              但本页不宣称标题相同就能逐句、逐词自动对齐。
            </p>
            <Link href={jingangjingFullTextHref}>
              查看 7 种可读表达 <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <section className="path-reading" aria-labelledby={`day-${activeDay.id}-reading`}>
          <div className="path-section-label">
            <span>经</span>
            <div>
              <small>READ</small>
              <h3 id={`day-${activeDay.id}-reading`}>今日原句</h3>
            </div>
          </div>
          <blockquote lang="zh-Hant">“{activeDay.reading}”</blockquote>
          <Link className="path-citation" href={activeDay.href}>
            <span>
              <strong>回到原典版页</strong>
              <small>《金刚般若波罗蜜经》 · 后秦·鸠摩罗什译</small>
            </span>
            <span>
              {activeDay.locator} <ArrowUpRight aria-hidden="true" />
            </span>
          </Link>
          <CitationCopy day={activeDay} />
        </section>

        <section className="path-understanding" aria-labelledby={`day-${activeDay.id}-hint`}>
          <div className="path-section-label">
            <span>解</span>
            <div>
              <small>EDITORIAL</small>
              <h3 id={`day-${activeDay.id}-hint`}>入门提示</h3>
            </div>
          </div>
          <div className="path-hint-card">
            <Lightbulb aria-hidden="true" />
            <p>{activeDay.hint}</p>
            <span>编辑提示不是经文</span>
          </div>
        </section>

        <section className="path-research-cue" aria-labelledby={`day-${activeDay.id}-research`}>
          <div className="path-section-label">
            <span>核</span>
            <div>
              <small>VERIFY</small>
              <h3 id={`day-${activeDay.id}-research`}>核读边界</h3>
            </div>
          </div>
          <p>{activeDay.researchCue}</p>
        </section>

        <section className="path-pause" aria-labelledby={`day-${activeDay.id}-pause`}>
          <div className="path-section-label">
            <span>观</span>
            <div>
              <small>PAUSE</small>
              <h3 id={`day-${activeDay.id}-pause`}>停一分钟</h3>
            </div>
          </div>
          <p>{activeDay.pause}</p>
        </section>

        <StudyNoteComposer
          seed={{
            id: `jingangjing:${activeDay.segmentId}`,
            workTitle: "《金刚般若波罗蜜经》",
            passageLabel: `第 ${activeDay.id} 天 · ${activeDay.title}`,
            locator: activeDay.locator,
            quote: activeDay.reading,
            quoteLang: "zh-Hant",
            sourceHref: activeDay.href,
            studyHref: `/xue/jingangjing#day-${activeDay.id}`,
            defaultKind: activeDay.id === 4 || activeDay.id === 6 ? "verify" : "practice",
          }}
        />

        <footer className="path-day-actions">
          <div className="path-day-actions__nav">
            <button
              type="button"
              onClick={() => goToDay(Math.max(1, activeDay.id - 1))}
              disabled={activeDay.id === 1}
              aria-label="上一天"
            >
              <ArrowLeft aria-hidden="true" /> 上一天
            </button>
          </div>

          {!activeStatus ? (
            <div className="path-day-actions__main">
              <button className="path-skip-button" type="button" onClick={() => markDay("skipped")}>
                今天先跳过 <SkipForward aria-hidden="true" />
              </button>
              <button className="path-complete-button" type="button" onClick={() => markDay("completed")}>
                读完这一日 <Check aria-hidden="true" />
              </button>
            </div>
          ) : activeStatus === "skipped" ? (
            <button className="path-complete-button" type="button" onClick={() => markDay("completed")}>
              补读完成 <Check aria-hidden="true" />
            </button>
          ) : (
            <button
              className="path-complete-button"
              type="button"
              onClick={() => goToDay(activeDay.id === 7 ? 1 : activeDay.id + 1)}
            >
              {activeDay.id === 7 ? "回看第一天" : "继续下一天"} <ArrowRight aria-hidden="true" />
            </button>
          )}
        </footer>

        {coveredCount === 7 && (
          <div className="path-completion-note">
            <strong>七日已走完。</strong>
            <p>跳过的段落仍可补读；所有日程始终开放。</p>
          </div>
        )}

        <div className="path-full-text">
          <p>入门提示不代替原典、注疏、师承或学术校勘。</p>
          <Link href={jingangjingFullTextHref}>
            完整阅读《金刚经》 <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  );
}
