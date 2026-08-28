"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Check,
  Circle,
  Copy,
  FileSearch,
  Layers3,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { StudyNoteComposer } from "@/components/study-note-composer";
import { recordStudyPathProgress } from "@/components/use-study-path-activity";
import {
  amituojingFullTextHref,
  amituojingLearningDays,
  xuanzangAmituojingHref,
  type AmituojingLearningDay,
} from "@/data/amituojing-learning-path";
import { trackEvent } from "@/lib/analytics";
import styles from "./amituojing-learning-path.module.css";

const STORAGE_KEY = "foxue:amituojing-seven-day-progress:v1";
const PROGRESS_EVENT = "foxue:amituojing-seven-day-progress-change";
const EMPTY_SNAPSHOT = '{"version":1,"activeDay":1,"statuses":{}}';
let memorySnapshot = EMPTY_SNAPSHOT;
let localStorageAvailable = true;

type DayStatus = "completed" | "skipped";
type Lens = "practice" | "context" | "version";
type LearningProgress = {
  version: 1;
  activeDay: number;
  statuses: Record<string, DayStatus>;
};

const lenses = [
  { id: "practice", label: "修持", eyebrow: "PRACTICE", title: "停一分钟", icon: Sparkles },
  { id: "context", label: "理解", eyebrow: "CONTEXT", title: "放回经文", icon: BookOpenText },
  { id: "version", label: "校读", eyebrow: "COMPARE", title: "保留译本差异", icon: Layers3 },
] as const;

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

function citationText(day: AmituojingLearningDay) {
  const sourceUrl = new URL(day.href, window.location.origin);
  const studyUrl = new URL(`/xue/amituojing#day-${day.id}`, window.location.origin);
  return [
    `“${day.reading}”`,
    `——《佛说阿弥陀经》姚秦·鸠摩罗什译，${day.locator}`,
    `原典：${sourceUrl}`,
    `研读：${studyUrl}`,
  ].join("\n");
}

function CitationCopy({ day }: { day: AmituojingLearningDay }) {
  const [feedback, setFeedback] = useState("");

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citationText(day));
      setFeedback("引文、译者、稳定行段与链接已复制。");
      trackEvent("citation_copied", {
        content_id: day.segmentId,
        step_number: day.id,
        learning_path: "amituojing",
      });
    } catch {
      setFeedback("浏览器未允许复制；可打开原典后使用经卷页引用工具。");
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

export function AmituojingLearningPath() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  const progress = useMemo(() => parseProgress(snapshot), [snapshot]);
  const activeDay = amituojingLearningDays[progress.activeDay - 1];
  const activeStatus = progress.statuses[String(activeDay.id)];
  const [activeLens, setActiveLens] = useState<Lens>("practice");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const completedCount = Object.values(progress.statuses).filter(
    (status) => status === "completed",
  ).length;
  const skippedCount = Object.values(progress.statuses).filter(
    (status) => status === "skipped",
  ).length;
  const coveredCount = completedCount + skippedCount;

  useEffect(() => {
    recordStudyPathProgress("amituojing", progress.activeDay, progress.statuses);
  }, [progress.activeDay, progress.statuses]);

  useEffect(() => {
    function applySharedDay() {
      const sharedDay = dayFromHash();
      if (!sharedDay) return;
      const current = parseProgress(readSnapshot());
      if (current.activeDay !== sharedDay) {
        setActiveLens("practice");
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
    setActiveLens("practice");
    setDayHash(day);
    saveProgress({ ...progress, activeDay: day });
  }

  function markDay(status: DayStatus) {
    const nextDay = Math.min(activeDay.id + 1, 7);
    const nextStatuses = { ...progress.statuses, [String(activeDay.id)]: status };
    setActiveLens("practice");
    setDayHash(nextDay);
    saveProgress({
      ...progress,
      activeDay: nextDay,
      statuses: nextStatuses,
    });
    trackEvent("study_path_step_marked", {
      learning_path: "amituojing",
      step_number: activeDay.id,
      step_status: status,
      covered_count: Object.keys(nextStatuses).length,
    });
  }

  function resetProgress() {
    if (!window.confirm("清除这台设备上的《佛说阿弥陀经》7 天研读进度？")) return;
    setActiveLens("practice");
    setDayHash(1);
    clearProgress();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = index;
    if (event.key === "ArrowRight") target = (index + 1) % lenses.length;
    else if (event.key === "ArrowLeft") target = (index - 1 + lenses.length) % lenses.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = lenses.length - 1;
    else return;
    event.preventDefault();
    setActiveLens(lenses[target].id);
    tabRefs.current[target]?.focus();
  }

  const currentLens = lenses.find((lens) => lens.id === activeLens) ?? lenses[0];
  const CurrentLensIcon = currentLens.icon;

  return (
    <section
      className={`xinjing-path ${styles.path}`}
      aria-labelledby="amituojing-path-title"
    >
      <h2 className="sr-only" id="amituojing-path-title">
        《佛说阿弥陀经》7 天原典研读日程
      </h2>

      <aside className="path-rail">
        <div className={`path-progress ${styles.progress}`}>
          <div className="path-progress__topline">
            <span>已走过</span>
            <strong>{coveredCount} / 7</strong>
          </div>
          <div
            className="path-progress__track"
            role="progressbar"
            aria-label="《佛说阿弥陀经》7 天研读进度"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={coveredCount}
          >
            <span style={{ width: `${(coveredCount / 7) * 100}%` }} />
          </div>
          <p>完成 {completedCount} · 跳过 {skippedCount}</p>
        </div>

        <ol className={`path-day-list ${styles.dayList}`}>
          {amituojingLearningDays.map((day) => {
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
                    {status === "completed" ? <Check /> : status === "skipped" ? <SkipForward /> : <Circle />}
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
          <p><strong>只存在这台设备</strong>进度与研读笺不登录、不上传。</p>
        </div>
        {coveredCount > 0 && (
          <button className="path-reset" type="button" onClick={resetProgress}>
            <RotateCcw aria-hidden="true" /> 清除本地进度
          </button>
        )}
      </aside>

      <article className={`path-day-paper ${styles.paper}`} id={`day-${activeDay.id}`}>
        <span className={`path-day-paper__watermark ${styles.watermark}`} aria-hidden="true">
          {activeDay.id}
        </span>
        <header className="path-day-paper__header">
          <div>
            <p>第 {activeDay.id} 天 · DAY {String(activeDay.id).padStart(2, "0")}</p>
            <h2>{activeDay.title}</h2>
          </div>
          <span className={`path-day-state${activeStatus ? ` is-${activeStatus}` : ""}`}>
            {activeStatus === "completed" ? "已完成" : activeStatus === "skipped" ? "已跳过 · 可补读" : "约 8 分钟"}
          </span>
        </header>

        <aside className={`path-version-boundary ${styles.sourceBoundary}`} aria-label="当前底本与版本边界">
          <FileSearch aria-hidden="true" />
          <div>
            <strong>当前阅读底本：姚秦·鸠摩罗什译 T0366</strong>
            <p>“校读”只打开玄奘译 T0367 的相关段落；相关不等于逐句、逐词对应。</p>
            <Link href={amituojingFullTextHref}>
              查看作品与三种文本表达 <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <section className="path-reading" aria-labelledby={`day-${activeDay.id}-reading`}>
          <div className="path-section-label">
            <span>经</span>
            <div><small>READ</small><h3 id={`day-${activeDay.id}-reading`}>今日原句</h3></div>
          </div>
          <blockquote lang="zh-Hant">“{activeDay.reading}”</blockquote>
          <Link className="path-citation" href={activeDay.href}>
            <span>
              <strong>回到鸠摩罗什译原典版页</strong>
              <small>《佛说阿弥陀经》 · 姚秦·鸠摩罗什译</small>
            </span>
            <span>{activeDay.locator} <ArrowUpRight aria-hidden="true" /></span>
          </Link>
          <CitationCopy day={activeDay} />
        </section>

        <section className={styles.lensSection} aria-labelledby={`day-${activeDay.id}-lens-title`}>
          <div className={styles.tabs} role="tablist" aria-label="选择研读方式">
            {lenses.map((lens, index) => (
              <button
                key={lens.id}
                ref={(node) => { tabRefs.current[index] = node; }}
                type="button"
                role="tab"
                id={`day-${activeDay.id}-tab-${lens.id}`}
                aria-selected={activeLens === lens.id}
                aria-controls={`day-${activeDay.id}-panel-${lens.id}`}
                tabIndex={activeLens === lens.id ? 0 : -1}
                onClick={() => setActiveLens(lens.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <lens.icon aria-hidden="true" />
                <span><small>{lens.eyebrow}</small><strong>{lens.label}</strong></span>
              </button>
            ))}
          </div>

          <div
            className={styles.lensPanel}
            role="tabpanel"
            id={`day-${activeDay.id}-panel-${activeLens}`}
            aria-labelledby={`day-${activeDay.id}-tab-${activeLens}`}
          >
            <div className={styles.lensHeading}>
              <CurrentLensIcon aria-hidden="true" />
              <div><small>{currentLens.eyebrow} · 编辑辅助层</small><h3 id={`day-${activeDay.id}-lens-title`}>{currentLens.title}</h3></div>
            </div>
            {activeLens === "practice" && (
              <>
                <p>{activeDay.practice}</p>
                <span className={styles.boundaryLabel}>练习不是经文，也不代替师承。</span>
              </>
            )}
            {activeLens === "context" && (
              <>
                <p>{activeDay.context}</p>
                <span className={styles.boundaryLabel}>理解提示由 foxue.ai 编辑组整理，尚无外部具名佛学审校。</span>
              </>
            )}
            {activeLens === "version" && (
              <>
                <p>{activeDay.versionNote}</p>
                <div className={styles.parallelLink}>
                  <span><strong>相关译本</strong><small>唐·玄奘译《称赞净土佛摄受经》</small></span>
                  <Link href={activeDay.parallelHref}>
                    {activeDay.parallelLocator} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <StudyNoteComposer
          seed={{
            id: `amituojing:${activeDay.segmentId}`,
            workTitle: "《佛说阿弥陀经》",
            passageLabel: `第 ${activeDay.id} 天 · ${activeDay.title}`,
            locator: activeDay.locator,
            quote: activeDay.reading,
            quoteLang: "zh-Hant",
            sourceHref: activeDay.href,
            studyHref: `/xue/amituojing#day-${activeDay.id}`,
            defaultKind: activeDay.id === 4 || activeDay.id === 6 ? "verify" : "practice",
          }}
        />

        <footer className="path-day-actions">
          <div className="path-day-actions__nav">
            <button type="button" onClick={() => goToDay(Math.max(1, activeDay.id - 1))} disabled={activeDay.id === 1} aria-label="上一天">
              <ArrowLeft aria-hidden="true" /> 上一天
            </button>
          </div>
          {!activeStatus ? (
            <div className="path-day-actions__main">
              <button className="path-skip-button" type="button" onClick={() => markDay("skipped")}>今天先跳过 <SkipForward aria-hidden="true" /></button>
              <button className="path-complete-button" type="button" onClick={() => markDay("completed")}>读完这一日 <Check aria-hidden="true" /></button>
            </div>
          ) : activeStatus === "skipped" ? (
            <button className="path-complete-button" type="button" onClick={() => markDay("completed")}>补读完成 <Check aria-hidden="true" /></button>
          ) : (
            <button className="path-complete-button" type="button" onClick={() => goToDay(activeDay.id === 7 ? 1 : activeDay.id + 1)}>
              {activeDay.id === 7 ? "回看第一天" : "继续下一天"} <ArrowRight aria-hidden="true" />
            </button>
          )}
        </footer>

        {coveredCount === 7 && (
          <div className="path-completion-note"><strong>七日已走完。</strong><p>跳过的段落仍可补读；所有日程始终开放。</p></div>
        )}
        <div className="path-full-text">
          <p>编辑辅助层不代替原典、注疏、师承或学术校勘。</p>
          <span className={styles.fullTextLinks}>
            <Link href={amituojingFullTextHref}>完整阅读 T0366 <ArrowUpRight aria-hidden="true" /></Link>
            <Link href={xuanzangAmituojingHref}>完整阅读 T0367 <ArrowUpRight aria-hidden="true" /></Link>
          </span>
        </div>
      </article>
    </section>
  );
}
