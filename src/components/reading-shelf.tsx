"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpenText,
  Clock3,
  LibraryBig,
  LockKeyhole,
  Route,
  X,
} from "lucide-react";
import { studyPathRegistry } from "@/data/study-path-registry";
import { trackEvent } from "@/lib/analytics";
import { removeReadingEntry, setReadingPinned } from "@/lib/reading-shelf";
import {
  studyPathCoveredCount,
  studyPathResumeDay,
  type StudyPathActivityEntry,
} from "@/lib/study-path-activity";
import {
  readReadingShelf,
  saveReadingShelf,
  useReadingShelf,
} from "@/components/use-reading-shelf";
import { useStudyPathActivities } from "@/components/use-study-path-activity";
import styles from "./reading-shelf.module.css";

function relativeReadTime(isoDate: string, now: number) {
  const elapsed = Math.max(0, now - Date.parse(isoDate));
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "刚刚读过";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" })
    .format(new Date(isoDate));
}

function useRelativeReadClock(active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [active]);

  return now;
}

export function ReadingShelf({ variant = "study" }: { variant?: "study" | "home" }) {
  const entries = useReadingShelf();
  const pathActivities = useStudyPathActivities();
  const now = useRelativeReadClock(entries.length > 0 || pathActivities.length > 0);
  const [feedback, setFeedback] = useState("");
  const latest = entries[0];
  const latestPath = pathActivities[0];

  const trackPathResume = (entry: StudyPathActivityEntry, entryPoint: "home" | "study") => {
    trackEvent("study_path_resumed", {
      entry_point: entryPoint,
      learning_path: entry.id,
      step_number: studyPathResumeDay(entry),
      covered_count: studyPathCoveredCount(entry),
    });
  };

  if (variant === "home") {
    if (!latest && !latestPath) return null;
    const resumePath = latestPath && (!latest || latestPath.updatedAt >= latest.lastReadAt)
      ? latestPath
      : undefined;

    if (resumePath) {
      const definition = studyPathRegistry[resumePath.id];
      const coveredCount = studyPathCoveredCount(resumePath);
      const resumeDay = studyPathResumeDay(resumePath);
      const completed = coveredCount >= 7;
      return (
        <section
          className={`${styles.homeResume} ${styles.homePathResume}`}
          aria-labelledby="home-path-resume-title"
          data-study-path-resume={resumePath.id}
        >
          <div className={styles.homeResumeMark} aria-hidden="true">
            <Route />
            <span>续</span>
          </div>
          <div className={styles.homeResumeCopy}>
            <p>继续七日路径 · {relativeReadTime(resumePath.updatedAt, now)}</p>
            <h2 id="home-path-resume-title">
              {definition.title} · {completed ? "七日已走完" : `第 ${resumeDay} 天`}
            </h2>
            <span>
              {completed
                ? "七日均已标记；可从第一天重读，不设置连续天数或排名。"
                : `已标记 ${coveredCount} / 7 · 不计连续天数，什么时候回来都可以。`}
            </span>
          </div>
          <div className={styles.homeResumeActions}>
            <Link
              href={`${definition.href}#day-${resumeDay}`}
              onNavigate={() => trackPathResume(resumePath, "home")}
            >
              {completed ? "回看第一天" : `继续第 ${resumeDay} 天`} <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/xue">查看全部研读路径</Link>
          </div>
        </section>
      );
    }

    if (!latest) return null;
    return (
      <section className={styles.homeResume} aria-labelledby="home-resume-title">
        <div className={styles.homeResumeMark} aria-hidden="true">
          <Clock3 />
          <span>续</span>
        </div>
        <div className={styles.homeResumeCopy}>
          <p>继续研读 · {relativeReadTime(latest.lastReadAt, now)}</p>
          <h2 id="home-resume-title">{latest.workTitle} · {latest.passageLabel}</h2>
          <span>
            {latest.locator ? `${latest.languageLabel} · ${latest.locator}` : `${latest.languageLabel} · 从本页继续`}
          </span>
        </div>
        <div className={styles.homeResumeActions}>
          <Link href={latest.resumeHref} prefetch={false}>
            回到上次读到的地方 <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/xue#reading-shelf">打开我的书房</Link>
        </div>
      </section>
    );
  }

  const togglePinned = (id: string, pinned: boolean, workTitle: string) => {
    saveReadingShelf(setReadingPinned(readReadingShelf(), id, pinned));
    setFeedback(pinned ? `已收藏 ${workTitle}` : `已取消收藏 ${workTitle}`);
  };

  const removeEntry = (id: string, workTitle: string) => {
    saveReadingShelf(removeReadingEntry(readReadingShelf(), id));
    setFeedback(`已从书房移除 ${workTitle}`);
  };

  return (
    <section className={styles.studyShelf} id="reading-shelf" aria-labelledby="reading-shelf-title">
      <header className={styles.shelfHeading}>
        <div>
          <p>我的书房 · LOCAL READING SHELF</p>
          <h2 id="reading-shelf-title">离开，不等于从头再来。</h2>
        </div>
        <p>
          七日路径的下一步、最近读到的稳定原文位置与主动收藏都只保存在当前浏览器；不登录，不上传阅读轨迹。
        </p>
      </header>

      {pathActivities.length > 0 && (
        <div className={styles.pathActivitySection} aria-labelledby="path-activity-title">
          <div className={styles.pathActivityIntro}>
            <div>
              <p>七日路径 · 接着走</p>
              <h3 id="path-activity-title">不追连续天数，只保留下一步。</h3>
            </div>
            <span>完成与跳过都可回看；更新时间仅用于把最近路径排在前面。</span>
          </div>
          <div className={styles.pathActivityGrid}>
            {pathActivities.map((entry) => {
              const definition = studyPathRegistry[entry.id];
              const coveredCount = studyPathCoveredCount(entry);
              const resumeDay = studyPathResumeDay(entry);
              const completed = coveredCount >= 7;
              return (
                <article
                  className={styles.pathActivityCard}
                  data-path-tone={definition.tone}
                  data-study-path-card={entry.id}
                  key={entry.id}
                >
                  <div className={styles.pathActivityTopline}>
                    <span><Route aria-hidden="true" /> {completed ? "七日已走完" : "继续路径"}</span>
                    <span>{relativeReadTime(entry.updatedAt, now)}</span>
                  </div>
                  <h4>{definition.title}</h4>
                  <p>
                    {completed
                      ? "七日均已标记；现在可以带着新的问题重读。"
                      : `下一步：第 ${resumeDay} 天 · 已标记 ${coveredCount} / 7`}
                  </p>
                  <div
                    className={styles.pathActivityTrack}
                    role="progressbar"
                    aria-label={`${definition.shortTitle}七日研读进度`}
                    aria-valuemin={0}
                    aria-valuemax={7}
                    aria-valuenow={coveredCount}
                  >
                    <span style={{ width: `${(coveredCount / 7) * 100}%` }} />
                  </div>
                  <Link
                    href={`${definition.href}#day-${resumeDay}`}
                    onNavigate={() => trackPathResume(entry, "study")}
                  >
                    {completed ? "回看第一天" : `继续第 ${resumeDay} 天`} <ArrowRight aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className={styles.emptyShelf}>
          <div aria-hidden="true"><LibraryBig /></div>
          <div>
            <h3>
              {pathActivities.length > 0 ? "经卷中的稳定位置也会留在这里" : "最近研读会留在这里"}
            </h3>
            <p>打开任意经卷页即可留下本地阅读位置；遇到想反复研读的页面，再将它存入书房。</p>
          </div>
          <Link href="/jingzang">
            去经藏选一部经 <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className={styles.shelfGrid}>
          {entries.map((entry, index) => (
            <article className={index === 0 ? styles.primaryEntry : styles.shelfEntry} key={entry.id}>
              <div className={styles.entryTopline}>
                <span>
                  {entry.pinned ? <BookmarkCheck aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                  {entry.pinned ? "已收藏" : index === 0 ? "接着读" : "最近研读"}
                </span>
                <span>{entry.languageLabel} · {relativeReadTime(entry.lastReadAt, now)}</span>
              </div>
              <div className={styles.entryCopy}>
                <h3>{entry.workTitle}</h3>
                <p>{entry.passageLabel}</p>
                {entry.preview && <blockquote lang={entry.quoteLang}>{entry.preview}</blockquote>}
                <small>{entry.locator || "本页开头"}</small>
              </div>
              <div className={styles.entryActions}>
                <Link href={entry.resumeHref} prefetch={false}>
                  {entry.locator ? "回到原文位置" : "继续本页"} <ArrowRight aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  aria-label={entry.pinned ? `取消收藏 ${entry.workTitle}` : `收藏 ${entry.workTitle}`}
                  aria-pressed={entry.pinned}
                  onClick={() => togglePinned(entry.id, !entry.pinned, entry.workTitle)}
                >
                  {entry.pinned ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                  <span>{entry.pinned ? "取消收藏" : "收藏"}</span>
                </button>
                <button
                  type="button"
                  aria-label={`从书房移除 ${entry.workTitle}`}
                  onClick={() => removeEntry(entry.id, entry.workTitle)}
                >
                  <X aria-hidden="true" />
                  <span>移除</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {feedback}
      </p>

      <footer className={styles.shelfPrivacy}>
        <LockKeyhole aria-hidden="true" />
        <span>本地私密</span>
        <p>清除浏览器网站数据会一并移除这些记录；研读笺仍可在“我的研读笺”中另行导出。</p>
        <Link href="/xue/biji"><BookOpenText aria-hidden="true" /> 我的研读笺</Link>
      </footer>
    </section>
  );
}
