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
import { useStudyPathActivityRecorder } from "@/components/use-study-path-activity";
import {
  fahuajingFullTextHref,
  fahuajingReadingGates,
  fahuajingSoothillHref,
  type FahuajingReadingGate,
} from "@/data/fahuajing-reading-path";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "foxue:fahuajing-seven-gate-progress:v1";
const PROGRESS_EVENT = "foxue:fahuajing-seven-gate-progress-change";
const EMPTY_SNAPSHOT = '{"version":1,"activeGate":1,"statuses":{}}';
let memorySnapshot = EMPTY_SNAPSHOT;
let localStorageAvailable = true;

type GateStatus = "completed" | "skipped";

type ReadingProgress = {
  version: 1;
  activeGate: number;
  statuses: Record<string, GateStatus>;
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

function parseProgress(snapshot: string): ReadingProgress {
  try {
    const value = JSON.parse(snapshot) as Partial<ReadingProgress>;
    const activeGate = Number(value.activeGate);
    const statuses = Object.fromEntries(
      Object.entries(value.statuses ?? {}).filter(
        ([key, status]) =>
          /^[1-7]$/.test(key) && (status === "completed" || status === "skipped"),
      ),
    ) as Record<string, GateStatus>;
    return {
      version: 1,
      activeGate: activeGate >= 1 && activeGate <= 7 ? activeGate : 1,
      statuses,
    };
  } catch {
    return JSON.parse(EMPTY_SNAPSHOT) as ReadingProgress;
  }
}

function saveProgress(progress: ReadingProgress) {
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

function gateFromHash() {
  const match = window.location.hash.match(/^#day-([1-7])$/);
  return match ? Number(match[1]) : undefined;
}

function setGateHash(gate: number) {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#day-${gate}`,
  );
}

function citationText(gate: FahuajingReadingGate) {
  const studyUrl = new URL(`/xue/fahuajing#day-${gate.id}`, window.location.origin);
  const sourceUrl = new URL(gate.href, window.location.origin);
  return [
    `“${gate.reading}”`,
    `——《妙法莲华经》姚秦·鸠摩罗什译，第 ${gate.chapter} 品 ${gate.chapterTitle}，${gate.locator}`,
    `原典：${sourceUrl}`,
    `研读：${studyUrl}`,
  ].join("\n");
}

function CitationCopy({ gate }: { gate: FahuajingReadingGate }) {
  const [feedback, setFeedback] = useState("");

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citationText(gate));
      setFeedback("引文、品名、译者、稳定行段与链接已复制。");
      trackEvent("citation_copied", {
        content_id: gate.segmentId,
        step_number: gate.id,
        learning_path: "fahuajing",
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
        {feedback || "复制内容包含原句、品名、译者、T 经号、稳定行段与两个永久入口。"}
      </p>
    </div>
  );
}

export function FahuajingReadingPath() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  const progress = useMemo(() => parseProgress(snapshot), [snapshot]);
  const activeGate = fahuajingReadingGates[progress.activeGate - 1];
  const activeStatus = progress.statuses[String(activeGate.id)];
  const completedCount = Object.values(progress.statuses).filter(
    (status) => status === "completed",
  ).length;
  const skippedCount = Object.values(progress.statuses).filter(
    (status) => status === "skipped",
  ).length;
  const coveredCount = completedCount + skippedCount;

  const clearStudyPathActivity = useStudyPathActivityRecorder(
    "fahuajing",
    progress.activeGate,
    progress.statuses,
  );

  useEffect(() => {
    function applySharedGate() {
      const sharedGate = gateFromHash();
      if (!sharedGate) return;
      const current = parseProgress(readSnapshot());
      if (current.activeGate !== sharedGate) {
        saveProgress({ ...current, activeGate: sharedGate });
      }
    }

    applySharedGate();
    window.addEventListener("hashchange", applySharedGate);
    return () => window.removeEventListener("hashchange", applySharedGate);
  }, []);

  useEffect(() => {
    const sharedGate = gateFromHash();
    if (sharedGate !== activeGate.id) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`day-${sharedGate}`)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeGate.id]);

  function goToGate(gate: number) {
    setGateHash(gate);
    saveProgress({ ...progress, activeGate: gate });
  }

  function markGate(status: GateStatus) {
    const nextGate = Math.min(activeGate.id + 1, 7);
    const nextStatuses = { ...progress.statuses, [String(activeGate.id)]: status };
    setGateHash(nextGate);
    saveProgress({
      ...progress,
      activeGate: nextGate,
      statuses: nextStatuses,
    });
    trackEvent("study_path_step_marked", {
      learning_path: "fahuajing",
      step_number: activeGate.id,
      step_status: status,
      covered_count: Object.keys(nextStatuses).length,
    });
  }

  function resetProgress() {
    if (!window.confirm("清除这台设备上的《法华经》七关研读进度？")) return;
    clearStudyPathActivity();
    setGateHash(1);
    clearProgress();
  }

  return (
    <section className="xinjing-path fahuajing-path" aria-labelledby="fahuajing-path-title">
      <h2 className="sr-only" id="fahuajing-path-title">
        《法华经》七个原典阅读关口
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
            aria-label="《法华经》七关研读进度"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={coveredCount}
          >
            <span style={{ width: `${(coveredCount / 7) * 100}%` }} />
          </div>
          <p>完成 {completedCount} · 暂过 {skippedCount}</p>
        </div>

        <ol className="path-day-list">
          {fahuajingReadingGates.map((gate) => {
            const status = progress.statuses[String(gate.id)];
            const statusLabel = status === "completed"
              ? "，已完成"
              : status === "skipped"
                ? "，已暂过"
                : "，未标记";
            return (
              <li key={gate.id}>
                <button
                  type="button"
                  className={status ? `is-${status}` : undefined}
                  aria-current={gate.id === activeGate.id ? "step" : undefined}
                  aria-label={`第 ${gate.id} 关，第 ${gate.chapter} 品 ${gate.chapterTitle}，${gate.title}${statusLabel}`}
                  onClick={() => goToGate(gate.id)}
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
                    <small>第 {gate.id} 关 · 第 {gate.chapter} 品</small>
                    <strong>{gate.title}</strong>
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

      <article className="path-day-paper" id={`day-${activeGate.id}`} aria-live="polite">
        <span className="path-day-paper__watermark" aria-hidden="true">
          {activeGate.chapter}
        </span>
        <header className="path-day-paper__header">
          <div>
            <p>第 {activeGate.id} 关 · 第 {activeGate.chapter} 品 {activeGate.chapterTitle}</p>
            <h2>{activeGate.title}</h2>
          </div>
          <span className={`path-day-state${activeStatus ? ` is-${activeStatus}` : ""}`}>
            {activeStatus === "completed"
              ? "已完成"
              : activeStatus === "skipped"
                ? "已暂过 · 可补读"
                : "约 12 分钟"}
          </span>
        </header>

        <aside className="path-version-boundary" aria-label="当前底本与版本边界">
          <FileSearch aria-hidden="true" />
          <div>
            <strong>当前阅读底本：姚秦·鸠摩罗什译 T0262</strong>
            <p>
              作品页另列 T0263、T0264 两种完整汉译与 T0265 节译见证。
              Soothill 1930 英译明确删节，本关只链接同品，不宣称逐句或逐词对应。
            </p>
            <div className="fahuajing-boundary-links">
              <Link href={fahuajingFullTextHref}>
                查看作品与全部表达 <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link href={activeGate.englishHref}>
                同品 Soothill 节译见证 <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>

        <section className="path-reading" aria-labelledby={`day-${activeGate.id}-reading`}>
          <div className="path-section-label">
            <span>经</span>
            <div>
              <small>READ</small>
              <h3 id={`day-${activeGate.id}-reading`}>本关原句</h3>
            </div>
          </div>
          <blockquote lang="zh-Hant">“{activeGate.reading}”</blockquote>
          <Link className="path-citation" href={activeGate.href}>
            <span>
              <strong>回到 T0262 原典版页</strong>
              <small>《妙法莲华经》 · 姚秦·鸠摩罗什译 · 第 {activeGate.chapter} 品</small>
            </span>
            <span>
              {activeGate.locator} <ArrowUpRight aria-hidden="true" />
            </span>
          </Link>
          <CitationCopy gate={activeGate} />
        </section>

        <section className="path-understanding" aria-labelledby={`day-${activeGate.id}-hint`}>
          <div className="path-section-label">
            <span>解</span>
            <div>
              <small>EDITORIAL</small>
              <h3 id={`day-${activeGate.id}-hint`}>入门路标</h3>
            </div>
          </div>
          <div className="path-hint-card">
            <Lightbulb aria-hidden="true" />
            <p>{activeGate.hint}</p>
            <span>编辑路标不是经文</span>
          </div>
        </section>

        <section className="path-research-cue" aria-labelledby={`day-${activeGate.id}-research`}>
          <div className="path-section-label">
            <span>核</span>
            <div>
              <small>VERIFY</small>
              <h3 id={`day-${activeGate.id}-research`}>校读边界</h3>
            </div>
          </div>
          <p>{activeGate.researchCue}</p>
        </section>

        <section className="path-pause" aria-labelledby={`day-${activeGate.id}-pause`}>
          <div className="path-section-label">
            <span>观</span>
            <div>
              <small>PAUSE</small>
              <h3 id={`day-${activeGate.id}-pause`}>停一分钟</h3>
            </div>
          </div>
          <p>{activeGate.pause}</p>
        </section>

        <StudyNoteComposer
          seed={{
            id: `fahuajing:${activeGate.segmentId}`,
            workTitle: "《妙法莲华经》",
            passageLabel: `第 ${activeGate.id} 关 · 第 ${activeGate.chapter} 品 ${activeGate.chapterTitle}`,
            locator: activeGate.locator,
            quote: activeGate.reading,
            quoteLang: "zh-Hant",
            sourceHref: activeGate.href,
            studyHref: `/xue/fahuajing#day-${activeGate.id}`,
            defaultKind: activeGate.id === 1 || activeGate.id === 6 ? "verify" : "practice",
          }}
        />

        <footer className="path-day-actions">
          <div className="path-day-actions__nav">
            <button
              type="button"
              onClick={() => goToGate(Math.max(1, activeGate.id - 1))}
              disabled={activeGate.id === 1}
              aria-label="上一关"
            >
              <ArrowLeft aria-hidden="true" /> 上一关
            </button>
          </div>

          {!activeStatus ? (
            <div className="path-day-actions__main">
              <button className="path-skip-button" type="button" onClick={() => markGate("skipped")}>
                这一关先暂过 <SkipForward aria-hidden="true" />
              </button>
              <button className="path-complete-button" type="button" onClick={() => markGate("completed")}>
                读完这一关 <Check aria-hidden="true" />
              </button>
            </div>
          ) : activeStatus === "skipped" ? (
            <button className="path-complete-button" type="button" onClick={() => markGate("completed")}>
              补读完成 <Check aria-hidden="true" />
            </button>
          ) : (
            <button
              className="path-complete-button"
              type="button"
              onClick={() => goToGate(activeGate.id === 7 ? 1 : activeGate.id + 1)}
            >
              {activeGate.id === 7 ? "回看第一关" : "继续下一关"} <ArrowRight aria-hidden="true" />
            </button>
          )}
        </footer>

        {coveredCount === 7 && (
          <div className="path-completion-note">
            <strong>七关已走完，二十八品仍在前方。</strong>
            <p>这是一张进入全经的路线图；暂过的关口可补读，完整原典始终开放。</p>
          </div>
        )}

        <div className="path-full-text">
          <p>七关不等于读完二十八品；路标不替代原典、注疏、师承或学术校勘。</p>
          <Link href={fahuajingSoothillHref}>
            查看 28 品英译节本边界 <ArrowUpRight aria-hidden="true" />
          </Link>
          <Link href={fahuajingFullTextHref}>
            完整阅读《法华经》 <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  );
}
