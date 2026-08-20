"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import { xinjingFullTextHref, xinjingLearningDays } from "@/data/xinjing-learning-path";

const STORAGE_KEY = "foxue:xinjing-seven-day-progress:v1";
const PROGRESS_EVENT = "foxue:xinjing-seven-day-progress-change";
const EMPTY_SNAPSHOT = '{"version":1,"activeDay":1,"statuses":{}}';

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
  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function XinjingLearningPath() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  const progress = useMemo(() => parseProgress(snapshot), [snapshot]);
  const activeDay = xinjingLearningDays[progress.activeDay - 1];
  const activeStatus = progress.statuses[String(activeDay.id)];
  const completedCount = Object.values(progress.statuses).filter(
    (status) => status === "completed",
  ).length;
  const skippedCount = Object.values(progress.statuses).filter(
    (status) => status === "skipped",
  ).length;
  const coveredCount = completedCount + skippedCount;

  function goToDay(day: number) {
    saveProgress({ ...progress, activeDay: day });
  }

  function markDay(status: DayStatus) {
    saveProgress({
      ...progress,
      activeDay: Math.min(activeDay.id + 1, 7),
      statuses: { ...progress.statuses, [String(activeDay.id)]: status },
    });
  }

  function resetProgress() {
    if (!window.confirm("清除这台设备上的《心经》7 天学习进度？")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }

  return (
    <section className="xinjing-path" aria-labelledby="xinjing-path-title">
      <h2 className="sr-only" id="xinjing-path-title">《心经》7 天学习日程</h2>

      <aside className="path-rail">
        <div className="path-progress">
          <div className="path-progress__topline">
            <span>已走过</span>
            <strong>{coveredCount} / 7</strong>
          </div>
          <div
            className="path-progress__track"
            role="progressbar"
            aria-label="7 天学习进度"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={coveredCount}
          >
            <span style={{ width: `${(coveredCount / 7) * 100}%` }} />
          </div>
          <p>完成 {completedCount} · 跳过 {skippedCount}</p>
        </div>

        <ol className="path-day-list">
          {xinjingLearningDays.map((day) => {
            const status = progress.statuses[String(day.id)];
            return (
              <li key={day.id}>
                <button
                  type="button"
                  className={status ? `is-${status}` : undefined}
                  aria-current={day.id === activeDay.id ? "step" : undefined}
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
            进度不登录、不上传、不跨设备同步。
          </p>
        </div>
        {coveredCount > 0 && (
          <button className="path-reset" type="button" onClick={resetProgress}>
            <RotateCcw aria-hidden="true" /> 清除本地进度
          </button>
        )}
      </aside>

      <article className="path-day-paper" aria-live="polite">
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
                : "约 5 分钟"}
          </span>
        </header>

        <section className="path-reading" aria-labelledby={`day-${activeDay.id}-reading`}>
          <div className="path-section-label">
            <span>经</span>
            <div>
              <small>READ</small>
              <h3 id={`day-${activeDay.id}-reading`}>今日阅读</h3>
            </div>
          </div>
          <blockquote lang="zh-Hant">“{activeDay.reading}”</blockquote>
          <Link className="path-citation" href={activeDay.href}>
            <span>
              <strong>回到原典</strong>
              <small>《般若波罗蜜多心经》 · 唐·玄奘译</small>
            </span>
            <span>
              {activeDay.locator} <ArrowUpRight aria-hidden="true" />
            </span>
          </Link>
        </section>

        <section className="path-understanding" aria-labelledby={`day-${activeDay.id}-hint`}>
          <div className="path-section-label">
            <span>解</span>
            <div>
              <small>NOTICE</small>
              <h3 id={`day-${activeDay.id}-hint`}>理解提示</h3>
            </div>
          </div>
          <div className="path-hint-card">
            <Lightbulb aria-hidden="true" />
            <p>{activeDay.hint}</p>
            <span>提示不是经文</span>
          </div>
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
            <strong>七天已走完。</strong>
            <p>跳过的日子仍可补读；学习路径不会锁住任何一天。</p>
          </div>
        )}

        <div className="path-full-text">
          <p>理解提示只是入门路标，不代替原典、注疏或师承。</p>
          <Link href={xinjingFullTextHref}>
            完整阅读《心经》 <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  );
}
