"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BookMarked, Check, Copy, Highlighter, ShieldCheck, X } from "lucide-react";
import { StudyNoteComposer } from "@/components/study-note-composer";
import { trackEvent } from "@/lib/analytics";
import {
  STUDY_NOTES_CANONICAL_ORIGIN,
  type StudyNoteSeed,
} from "@/lib/study-notes";
import styles from "./folio-study-selection.module.css";

const MAX_QUOTE_CHARACTERS = 1_200;

type ActiveStudySelection = {
  seed: StudyNoteSeed;
  segmentCount: number;
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function intersectsRange(range: Range, element: Element) {
  try {
    return range.intersectsNode(element);
  } catch {
    return false;
  }
}

function citationForSelection(selection: ActiveStudySelection) {
  const { seed } = selection;
  const accessedOn = new Date().toISOString().slice(0, 10);
  const sourceUrl = new URL(seed.sourceHref, STUDY_NOTES_CANONICAL_ORIGIN).toString();

  return [
    `${seed.workTitle} · ${seed.passageLabel}`,
    "",
    seed.quote,
    "",
    `稳定坐标：${seed.locator}`,
    `原典：${sourceUrl}`,
    `访问日期：${accessedOn}`,
  ].join("\n");
}

export function FolioStudySelection({
  children,
  slug,
  folioKey,
  workTitle,
  passageLabel,
  quoteLang,
}: {
  children: ReactNode;
  slug: string;
  folioKey: string;
  workTitle: string;
  passageLabel: string;
  quoteLang: string;
}) {
  const selectionRootRef = useRef<HTMLDivElement>(null);
  const [activeSelection, setActiveSelection] = useState<ActiveStudySelection | null>(null);
  const [warning, setWarning] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!activeSelection) return;
    const timeout = window.setTimeout(() => {
      trackEvent("folio_text_selected", {
        source_id: activeSelection.seed.id,
        segment_count: activeSelection.segmentCount,
        source_language: quoteLang,
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [activeSelection, quoteLang]);

  useEffect(() => {
    let animationFrame = 0;

    function readSelection() {
      const root = selectionRootRef.current;
      const selection = window.getSelection();
      if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (
        !selection.anchorNode
        || !selection.focusNode
        || !root.contains(selection.anchorNode)
        || !root.contains(selection.focusNode)
      ) {
        return;
      }

      const segmentIds: string[] = [];
      const seenIds = new Set<string>();
      const segmentElements = [...root.querySelectorAll<HTMLElement>("[data-study-segment-id]")];
      segmentElements.forEach((element) => {
        const segmentId = element.dataset.studySegmentId;
        if (!segmentId || seenIds.has(segmentId) || !intersectsRange(range, element)) return;
        seenIds.add(segmentId);
        segmentIds.push(segmentId);
      });
      if (segmentIds.length === 0) return;

      const sourceTexts = segmentIds.map((segmentId) => {
        const anchor = segmentElements.find((element) =>
          element.dataset.studySegmentId === segmentId
          && element.querySelector("[data-source-text-equivalent]"),
        );
        return anchor?.querySelector<HTMLElement>("[data-source-text-equivalent]")?.textContent?.trim() ?? "";
      }).filter(Boolean);
      if (sourceTexts.length === 0) return;

      const quote = sourceTexts.join("\n");
      if ([...quote].length > MAX_QUOTE_CHARACTERS) {
        setActiveSelection(null);
        setFeedback("");
        setWarning(`这次跨了 ${segmentIds.length} 个稳定行段，内容较长。请缩小选区后再写研读笺。`);
        return;
      }

      const firstId = segmentIds[0];
      const lastId = segmentIds.at(-1) ?? firstId;
      const locator = firstId === lastId ? firstId : `${firstId}–${lastId}`;
      const sourceHref = `/jingzang/${slug}/${folioKey}#${firstId}`;
      const id = `folio:${stableHash(`${slug}\u0000${folioKey}\u0000${firstId}\u0000${lastId}`)}`;

      setWarning("");
      setFeedback("");
      setActiveSelection({
        segmentCount: segmentIds.length,
        seed: {
          id,
          workTitle,
          passageLabel: `${passageLabel} · ${segmentIds.length} 个稳定行段`,
          locator,
          quote,
          quoteLang,
          sourceHref,
          studyHref: sourceHref,
          defaultKind: "understanding",
        },
      });
    }

    function scheduleRead() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(readSelection);
    }

    document.addEventListener("selectionchange", scheduleRead);
    return () => {
      document.removeEventListener("selectionchange", scheduleRead);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [folioKey, passageLabel, quoteLang, slug, workTitle]);

  function closeTools() {
    setActiveSelection(null);
    setWarning("");
    setFeedback("");
    window.getSelection()?.removeAllRanges();
  }

  async function copyCitation() {
    if (!activeSelection) return;
    try {
      await navigator.clipboard.writeText(citationForSelection(activeSelection));
      setFeedback("已复制原文、稳定坐标、链接与访问日期。");
      trackEvent("folio_citation_copied", {
        source_id: activeSelection.seed.id,
        segment_count: activeSelection.segmentCount,
      });
    } catch {
      setFeedback("浏览器未允许复制；可先写入研读笺，再从笔记页导出。");
    }
  }

  const dock = activeSelection ? (
    <aside className={styles.dock} role="region" aria-label="选中文本研读工具" data-folio-study-dock>
      <header className={styles.dockHeader}>
        <div>
          <Highlighter aria-hidden="true" />
          <span>
            <strong>已按完整稳定行段取文</strong>
            <small>{activeSelection.segmentCount} 个行段 · {activeSelection.seed.locator}</small>
          </span>
        </div>
        <button type="button" aria-label="关闭选文研读工具" onClick={closeTools}>
          <X aria-hidden="true" />
        </button>
      </header>

      <blockquote lang={activeSelection.seed.quoteLang}>{activeSelection.seed.quote}</blockquote>

      <div className={styles.quickActions}>
        <button type="button" onClick={copyCitation}>
          {feedback.startsWith("已复制") ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          复制引文
        </button>
        <Link href="/xue/biji"><BookMarked aria-hidden="true" /> 我的研读笺</Link>
        <span><ShieldCheck aria-hidden="true" /> 笔记不登录、不上传</span>
      </div>

      <StudyNoteComposer seed={activeSelection.seed} />
      <p className={styles.feedback} role="status" aria-live="polite">{feedback}</p>
    </aside>
  ) : warning ? (
    <aside className={`${styles.dock} ${styles.warningDock}`} role="status" aria-live="polite" data-folio-study-dock>
      <Highlighter aria-hidden="true" />
      <p><strong>请选得更聚焦一些</strong><span>{warning}</span></p>
      <button type="button" aria-label="关闭选文提示" onClick={closeTools}><X aria-hidden="true" /></button>
    </aside>
  ) : null;

  return (
    <div className={styles.studySurface}>
      <div className={styles.selectionHint}>
        <Highlighter aria-hidden="true" />
        <p>
          <strong>选一句，留下可回到原典的研读笺。</strong>
          <span>选中任意经文，即可按完整稳定行段写笔记或复制引用。</span>
        </p>
        <Link href="/xue/biji">我的研读笺</Link>
      </div>
      <div ref={selectionRootRef}>{children}</div>
      {dock && typeof document !== "undefined" ? createPortal(dock, document.body) : null}
    </div>
  );
}
