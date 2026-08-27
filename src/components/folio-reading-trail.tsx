"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Clock3, LibraryBig, LockKeyhole } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  readingResumeHref,
  readingResumeLocator,
  recordReadingLocation,
  recordReadingVisit,
  setReadingPinned,
  type ReadingShelfSeed,
} from "@/lib/reading-shelf";
import {
  readReadingShelf,
  saveReadingShelf,
  useReadingShelf,
} from "@/components/use-reading-shelf";
import styles from "./folio-reading-trail.module.css";

export function FolioReadingTrail({
  slug,
  folioKey,
  workTitle,
  passageLabel,
  quoteLang,
  languageLabel,
  children,
}: {
  slug: string;
  folioKey: string;
  workTitle: string;
  passageLabel: string;
  quoteLang: string;
  languageLabel: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastLocatorRef = useRef("");
  const entries = useReadingShelf();
  const id = `${slug}/${folioKey}`;
  const pageHref = `/jingzang/${slug}/${folioKey}`;
  const currentEntry = entries.find((entry) => entry.id === id);

  useEffect(() => {
    const seed: ReadingShelfSeed = {
      id,
      slug,
      folioKey,
      workTitle,
      passageLabel,
      quoteLang,
      languageLabel,
      pageHref,
    };
    saveReadingShelf(recordReadingVisit(readReadingShelf(), seed, new Date().toISOString()));

    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const anchors = [...root.querySelectorAll<HTMLElement>("[data-study-segment-id][id]")]
      .filter((anchor) => anchor.querySelector("[data-source-text-equivalent]"));
    const resumeLocator = readingResumeLocator(window.location.hash);
    if (resumeLocator) {
      const resumeTarget = anchors.find((anchor) => anchor.dataset.studySegmentId === resumeLocator);
      if (resumeTarget) {
        resumeTarget.dataset.readingResumeTarget = "true";
        resumeTarget.scrollIntoView({ block: "center" });
      }
    }
    let pendingWrite: number | undefined;

    const observer = new IntersectionObserver((observations) => {
      const visible = observations
        .filter((observation) => observation.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.22)
          - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.22));
      const anchor = visible[0]?.target as HTMLElement | undefined;
      const locator = anchor?.dataset.studySegmentId;
      const source = anchor?.querySelector<HTMLElement>("[data-source-text-equivalent]")?.textContent?.trim();
      if (!anchor || !locator || !source || locator === lastLocatorRef.current) return;

      lastLocatorRef.current = locator;
      window.clearTimeout(pendingWrite);
      pendingWrite = window.setTimeout(() => {
        saveReadingShelf(recordReadingLocation(
          readReadingShelf(),
          id,
          {
            locator,
            preview: source,
            resumeHref: readingResumeHref(pageHref, locator),
          },
          new Date().toISOString(),
        ));
      }, 650);
    }, {
      rootMargin: "-14% 0px -68% 0px",
      threshold: [0, 0.15, 0.5],
    });

    anchors.forEach((anchor) => observer.observe(anchor));
    return () => {
      observer.disconnect();
      window.clearTimeout(pendingWrite);
    };
  }, [folioKey, id, languageLabel, pageHref, passageLabel, quoteLang, slug, workTitle]);

  const togglePinned = () => {
    const freshEntries = readReadingShelf();
    const freshEntry = freshEntries.find((entry) => entry.id === id);
    const nextPinned = !freshEntry?.pinned;
    saveReadingShelf(setReadingPinned(freshEntries, id, nextPinned));
    trackEvent(nextPinned ? "reading_shelf_saved" : "reading_shelf_unsaved", {
      source_id: id,
      source_language: quoteLang,
    });
  };

  return (
    <div className={styles.trail} ref={rootRef}>
      <aside className={styles.trailBar} aria-label="本地阅读留痕">
        <Clock3 aria-hidden="true" />
        <div>
          <strong>本页会留在“最近研读”</strong>
          <span><LockKeyhole aria-hidden="true" /> 只存此浏览器，可从稳定原文位置接着读</span>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            aria-pressed={Boolean(currentEntry?.pinned)}
            onClick={togglePinned}
          >
            {currentEntry?.pinned
              ? <BookmarkCheck aria-hidden="true" />
              : <Bookmark aria-hidden="true" />}
            {currentEntry?.pinned ? "已存书房" : "存入书房"}
          </button>
          <Link href="/xue#reading-shelf">
            <LibraryBig aria-hidden="true" />
            查看书房
          </Link>
        </div>
      </aside>
      {children}
    </div>
  );
}
