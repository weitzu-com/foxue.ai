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
  X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { removeReadingEntry, setReadingPinned } from "@/lib/reading-shelf";
import {
  readReadingShelf,
  saveReadingShelf,
  useReadingShelf,
} from "@/components/use-reading-shelf";
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
  const now = useRelativeReadClock(entries.length > 0);
  const latest = entries[0];

  if (variant === "home") {
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

  const togglePinned = (id: string, pinned: boolean) => {
    saveReadingShelf(setReadingPinned(readReadingShelf(), id, pinned));
    trackEvent(pinned ? "reading_shelf_saved" : "reading_shelf_unsaved", { source_id: id });
  };

  const removeEntry = (id: string) => {
    saveReadingShelf(removeReadingEntry(readReadingShelf(), id));
    trackEvent("reading_shelf_entry_removed", { source_id: id });
  };

  return (
    <section className={styles.studyShelf} id="reading-shelf" aria-labelledby="reading-shelf-title">
      <header className={styles.shelfHeading}>
        <div>
          <p>我的书房 · LOCAL READING SHELF</p>
          <h2 id="reading-shelf-title">离开，不等于从头再来。</h2>
        </div>
        <p>
          最近读到的稳定原文位置与主动收藏都只保存在当前浏览器；不登录，不上传阅读轨迹。
        </p>
      </header>

      {entries.length === 0 ? (
        <div className={styles.emptyShelf}>
          <div aria-hidden="true"><LibraryBig /></div>
          <div>
            <h3>最近研读会留在这里</h3>
            <p>打开任意经卷页即可留下本地阅读位置；遇到想反复研读的页面，再将它存入书房。</p>
          </div>
          <Link href="/jingzang">
            去经藏选一部经 <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className={styles.shelfGrid} aria-live="polite">
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
                  onClick={() => togglePinned(entry.id, !entry.pinned)}
                >
                  {entry.pinned ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                  <span>{entry.pinned ? "取消收藏" : "收藏"}</span>
                </button>
                <button
                  type="button"
                  aria-label={`从书房移除 ${entry.workTitle}`}
                  onClick={() => removeEntry(entry.id)}
                >
                  <X aria-hidden="true" />
                  <span>移除</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <footer className={styles.shelfPrivacy}>
        <LockKeyhole aria-hidden="true" />
        <span>本地私密</span>
        <p>清除浏览器网站数据会一并移除这些记录；研读笺仍可在“我的研读笺”中另行导出。</p>
        <Link href="/xue/biji"><BookOpenText aria-hidden="true" /> 我的研读笺</Link>
      </footer>
    </section>
  );
}
