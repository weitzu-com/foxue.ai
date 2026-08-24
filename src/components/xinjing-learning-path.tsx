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
  Download,
  Lightbulb,
  RotateCcw,
  Share2,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import {
  xinjingFullTextHref,
  xinjingLearningDays,
  type XinjingLearningDay,
} from "@/data/xinjing-learning-path";
import { trackEvent } from "@/lib/analytics";

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

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(text)) {
    const candidate = `${line}${character}`;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function createCitationCard(day: XinjingLearningDay) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法生成引用卡");

  context.fillStyle = "#f4f0e6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#b9b09e";
  context.lineWidth = 2;
  context.strokeRect(54, 54, 972, 1242);

  context.fillStyle = "#9f392b";
  context.font = '700 28px ui-sans-serif, "PingFang SC", "Noto Sans CJK SC", sans-serif';
  context.fillText("FOXUE.AI · 回到原典", 92, 126);

  context.fillStyle = "#6c6a62";
  context.font = '500 25px ui-sans-serif, "PingFang SC", "Noto Sans CJK SC", sans-serif';
  context.textAlign = "right";
  context.fillText(`《心经》七日入门 · 第 ${day.id} 天`, 988, 126);
  context.textAlign = "left";

  context.strokeStyle = "#9f392b";
  context.beginPath();
  context.moveTo(92, 170);
  context.lineTo(988, 170);
  context.stroke();

  context.fillStyle = "#171b18";
  context.font = '600 42px ui-serif, "Songti SC", "Noto Serif CJK SC", serif';
  context.fillText(day.title, 92, 246);
  context.fillStyle = "#8a5a2b";
  context.font = '500 24px ui-sans-serif, "PingFang SC", sans-serif';
  context.fillText(day.focus, 92, 290);

  const quoteFontSize = day.reading.length > 92 ? 42 : day.reading.length > 60 ? 48 : 56;
  const quoteLineHeight = Math.round(quoteFontSize * 1.72);
  context.fillStyle = "#202822";
  context.font = `500 ${quoteFontSize}px ui-serif, "Songti SC", "Noto Serif CJK SC", serif`;
  const quoteLines = wrapCanvasText(context, `“${day.reading}”`, 840);
  quoteLines.forEach((line, index) => {
    context.fillText(line, 120, 405 + index * quoteLineHeight);
  });

  const sourceTop = Math.max(890, 405 + quoteLines.length * quoteLineHeight + 60);
  context.strokeStyle = "#c8c0b2";
  context.beginPath();
  context.moveTo(92, sourceTop);
  context.lineTo(988, sourceTop);
  context.stroke();

  context.fillStyle = "#171b18";
  context.font = '600 29px ui-serif, "Songti SC", serif';
  context.fillText("《般若波罗蜜多心经》", 92, sourceTop + 64);
  context.fillStyle = "#6c6a62";
  context.font = '500 23px ui-sans-serif, "PingFang SC", sans-serif';
  context.fillText("唐·玄奘译 · 大正藏 T0251", 92, sourceTop + 107);
  context.fillText(day.locator, 92, sourceTop + 150);

  context.fillStyle = "#9f392b";
  context.font = '700 24px ui-sans-serif, "PingFang SC", sans-serif';
  context.fillText("每一条解释，都能回到可核验出处", 92, 1220);
  context.fillStyle = "#6c6a62";
  context.font = '500 21px ui-sans-serif, "PingFang SC", sans-serif';
  context.fillText(`foxue.ai/xue/xinjing#day-${day.id}`, 92, 1260);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("引用卡生成失败"));
    }, "image/png");
  });
}

function citationShareUrl(day: XinjingLearningDay) {
  const url = new URL("/xue/xinjing", window.location.origin);
  url.hash = `day-${day.id}`;
  return url.toString();
}

function XinjingCitationShare({ day }: { day: XinjingLearningDay }) {
  const [feedback, setFeedback] = useState("");

  async function downloadCard() {
    try {
      const blob = await createCitationCard(day);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `foxue-xinjing-day-${day.id}-${day.segmentId}.png`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setFeedback("引用卡已下载，可直接用于社交平台分享。");
      trackEvent("citation_card_downloaded", {
        content_id: day.segmentId,
        step_number: day.id,
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "引用卡生成失败");
    }
  }

  async function copyCitation() {
    const text = `“${day.reading}”\n——《般若波罗蜜多心经》唐·玄奘译，${day.locator}\n${citationShareUrl(day)}`;
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("引文、出处与链接已复制。");
      trackEvent("citation_copied", {
        content_id: day.segmentId,
        step_number: day.id,
      });
    } catch {
      setFeedback("浏览器未允许复制，请使用下载引用卡。");
    }
  }

  async function shareCitation() {
    const url = citationShareUrl(day);
    const text = `“${day.reading}”——《般若波罗蜜多心经》，${day.locator}`;
    if (!navigator.share) {
      await copyCitation();
      return;
    }

    try {
      const blob = await createCitationCard(day);
      const file = new File([blob], `foxue-xinjing-day-${day.id}.png`, { type: "image/png" });
      const withFile = { title: `《心经》第 ${day.id} 天：${day.title}`, text, url, files: [file] };
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(withFile);
      } else {
        await navigator.share({ title: withFile.title, text, url });
      }
      setFeedback("分享面板已打开，出处链接会和引文一起带上。");
      trackEvent("citation_shared", {
        content_id: day.segmentId,
        step_number: day.id,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFeedback("暂时无法打开分享面板，可改用复制或下载。");
    }
  }

  return (
    <section className="path-share" aria-labelledby={`day-${day.id}-share`}>
      <div className="path-section-label">
        <span>传</span>
        <div>
          <small>SHARE</small>
          <h3 id={`day-${day.id}-share`}>把出处一起分享</h3>
        </div>
      </div>
      <div className="path-share__body">
        <div className="path-share__preview">
          <p>FOXUE.AI · 原典引用卡</p>
          <blockquote lang="zh-Hant">“{day.reading}”</blockquote>
          <div>
            <strong>《般若波罗蜜多心经》</strong>
            <span>唐·玄奘译 · {day.locator}</span>
          </div>
        </div>
        <div className="path-share__actions">
          <button type="button" onClick={shareCitation}>
            <Share2 aria-hidden="true" /> 分享引用卡
          </button>
          <button type="button" onClick={copyCitation}>
            <Copy aria-hidden="true" /> 复制引文与出处
          </button>
          <button type="button" onClick={downloadCard}>
            <Download aria-hidden="true" /> 下载 PNG
          </button>
        </div>
        <p className="path-share__feedback" role="status" aria-live="polite">
          {feedback || "分享内容包含原句、经号、稳定行段与本页入口。"}
        </p>
      </div>
    </section>
  );
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

  function goToDay(day: number) {
    setDayHash(day);
    saveProgress({ ...progress, activeDay: day });
  }

  function markDay(status: DayStatus) {
    const nextDay = Math.min(activeDay.id + 1, 7);
    setDayHash(nextDay);
    saveProgress({
      ...progress,
      activeDay: nextDay,
      statuses: { ...progress.statuses, [String(activeDay.id)]: status },
    });
    trackEvent("learning_step_updated", {
      content_id: activeDay.segmentId,
      step_number: activeDay.id,
      status,
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
            const statusLabel = status === "completed" ? "，已完成" : status === "skipped" ? "，已跳过" : "，未标记";
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
            进度不登录、不上传、不跨设备同步。
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

        <XinjingCitationShare day={activeDay} />

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
