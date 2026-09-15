"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  FileSearch,
  NotebookPen,
  Route,
} from "lucide-react";
import { studyPathRegistry } from "@/data/study-path-registry";
import { useReadingShelf } from "@/components/use-reading-shelf";
import { useResearchWorkspace } from "@/components/use-research-workspace";
import { useSavedPassages } from "@/components/use-saved-passages";
import { useStudyNotes } from "@/components/use-study-notes";
import { useStudyPathActivities } from "@/components/use-study-path-activity";
import { buildResearchReadiness } from "@/lib/research-workspace";
import {
  studyPathCoveredCount,
  studyPathResumeDay,
} from "@/lib/study-path-activity";
import styles from "./study-room-overview.module.css";

export function StudyRoomOverview() {
  const readingEntries = useReadingShelf();
  const pathActivities = useStudyPathActivities();
  const passages = useSavedPassages();
  const notes = useStudyNotes();
  const workspace = useResearchWorkspace();
  const readiness = buildResearchReadiness(workspace, passages);
  const latestPath = pathActivities[0];
  const latestReading = readingEntries[0];
  const resumePath = latestPath && (
    !latestReading || latestPath.updatedAt >= latestReading.lastReadAt
  )
    ? latestPath
    : undefined;

  const nextStep = resumePath
    ? {
        href: `${studyPathRegistry[resumePath.id].href}#day-${studyPathResumeDay(resumePath)}`,
        eyebrow: `继续${studyPathRegistry[resumePath.id].journeyLabel}`,
        title: `${studyPathRegistry[resumePath.id].title} · 第 ${studyPathResumeDay(resumePath)} ${studyPathRegistry[resumePath.id].unitLabel}`,
        detail: `已标记 ${studyPathCoveredCount(resumePath)} / 7；不计算连续天数。`,
      }
    : latestReading
      ? {
          href: latestReading.resumeHref,
          eyebrow: "继续上次阅读",
          title: `${latestReading.workTitle} · ${latestReading.passageLabel}`,
          detail: latestReading.locator || "从本页开头继续。",
        }
      : {
          href: "/xue",
          eyebrow: "书房还是空的",
          title: "先选择一条有原典坐标的研读路径",
          detail: "打开经卷后，最近位置会自动留在当前浏览器。",
        };

  const ledgers = [
    {
      id: "reading",
      icon: Route,
      label: "续读",
      value: pathActivities.length + readingEntries.length,
      unit: "条线索",
      detail: `${pathActivities.length} 条研读路径 · ${readingEntries.length} 个经卷位置`,
      href: "#reading-shelf",
      action: "查看续读",
    },
    {
      id: "passages",
      icon: BookMarked,
      label: "选文",
      value: passages.length,
      unit: "则原典",
      detail: "保存引文快照、稳定坐标和原典链接",
      href: "#saved-passages",
      action: "查看选文",
    },
    {
      id: "notes",
      icon: NotebookPen,
      label: "研读笺",
      value: notes.length,
      unit: "则笔记",
      detail: "观照、理解与待求证问题和原文分层",
      href: "#notebook-title",
      action: "查看研读笺",
    },
    {
      id: "research",
      icon: FileSearch,
      label: "研究",
      value: readiness.assessedCount,
      unit: `/ ${readiness.evidenceCount} 已判断`,
      detail: readiness.hasQuestion
        ? `已有研究题目${readiness.hasScope ? "与来源范围" : "，来源范围待补"}`
        : "尚未建立本地研究问题",
      href: "/yanjiu",
      action: "进入证据矩阵",
    },
  ] as const;

  return (
    <section
      className={styles.overview}
      aria-labelledby="study-room-overview-title"
      data-study-room-overview
    >
      <header className={styles.heading}>
        <div>
          <p>本地资产总览 · LOCAL LEDGER</p>
          <h2 id="study-room-overview-title">只告诉你留下了什么，不读取你写了什么。</h2>
        </div>
        <span>以下数量在浏览器接管后从本机读取；服务器收到的页面对所有人相同。</span>
      </header>

      <div className={styles.ledgerGrid}>
        {ledgers.map((ledger, index) => {
          const Icon = ledger.icon;
          return (
            <article key={ledger.id} data-room-ledger={ledger.id}>
              <div className={styles.ledgerTopline}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" />
              </div>
              <p>{ledger.label}</p>
              <strong>{ledger.value}<small>{ledger.unit}</small></strong>
              <span>{ledger.detail}</span>
              <Link href={ledger.href}>{ledger.action} <ArrowRight aria-hidden="true" /></Link>
            </article>
          );
        })}
      </div>

      <aside className={styles.nextStep} aria-label="书房下一步">
        <div aria-hidden="true"><BookOpenText /></div>
        <div>
          <p>{nextStep.eyebrow}</p>
          <h3>{nextStep.title}</h3>
          <span>{nextStep.detail}</span>
        </div>
        <Link href={nextStep.href} prefetch={false} data-study-room-next>
          从这里接着读 <ArrowRight aria-hidden="true" />
        </Link>
      </aside>
    </section>
  );
}
