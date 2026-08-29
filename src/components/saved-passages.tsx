"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Clipboard,
  Download,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  formatSavedPassageMarkdown,
  formatSavedPassagesMarkdown,
  removeSavedPassage,
  SAVED_PASSAGES_CANONICAL_ORIGIN,
  type SavedPassage,
} from "@/lib/saved-passages";
import {
  saveSavedPassages,
  useSavedPassages,
} from "@/components/use-saved-passages";
import styles from "./saved-passages.module.css";

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function downloadMarkdown(passages: SavedPassage[]) {
  const now = new Date();
  const markdown = formatSavedPassagesMarkdown(
    passages,
    SAVED_PASSAGES_CANONICAL_ORIGIN,
    now.toISOString(),
  );
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `foxue-ai-saved-passages-${now.toISOString().slice(0, 10)}.md`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function SavedPassages() {
  const passages = useSavedPassages();
  const [feedback, setFeedback] = useState("");
  const sortedPassages = useMemo(
    () => [...passages].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [passages],
  );

  function exportPassages() {
    if (!passages.length) return;
    downloadMarkdown(passages);
    setFeedback(`已导出 ${passages.length} 则选文，文件包含原文快照、稳定坐标与核对链接。`);
    trackEvent("saved_passages_exported", { passage_count: passages.length });
  }

  async function copyPassage(passage: SavedPassage) {
    try {
      await navigator.clipboard.writeText(
        formatSavedPassageMarkdown(passage, SAVED_PASSAGES_CANONICAL_ORIGIN),
      );
      setFeedback(`已复制“${passage.workTitle} · ${passage.locator}”。`);
      trackEvent("saved_passage_copied", {
        source_id: passage.id,
        segment_count: passage.segmentIds.length,
      });
    } catch {
      setFeedback("浏览器未允许复制，可使用“导出全部选文”。");
    }
  }

  function deletePassage(passage: SavedPassage) {
    if (!window.confirm(`从本地选文移除“${passage.workTitle} · ${passage.locator}”？`)) return;
    try {
      saveSavedPassages(removeSavedPassage(passages, passage.id));
      setFeedback("选文已从这台设备移除；原典与研读笺不受影响。");
      trackEvent("saved_passage_removed", {
        source_id: passage.id,
        segment_count: passage.segmentIds.length,
      });
    } catch {
      setFeedback("浏览器未能移除这则选文，请稍后重试。");
    }
  }

  function clearAllPassages() {
    if (!window.confirm(`清除这台设备上的全部 ${passages.length} 则本地选文？此操作无法撤销。`)) return;
    try {
      saveSavedPassages([]);
      setFeedback("这台设备上的本地选文已全部清除。");
      trackEvent("saved_passages_cleared", { passage_count: passages.length });
    } catch {
      setFeedback("浏览器未能清除本地选文，请稍后重试。");
    }
  }

  return (
    <section className={styles.passages} id="saved-passages" aria-labelledby="saved-passages-title">
      <header className={styles.toolbar}>
        <div>
          <p>MY SAVED PASSAGES</p>
          <h2 id="saved-passages-title">我的选文</h2>
          <span>
            <ShieldCheck aria-hidden="true" /> {passages.length} 则，只在当前浏览器
          </span>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" onClick={exportPassages} disabled={!passages.length}>
            <Download aria-hidden="true" /> 导出全部选文
          </button>
          {passages.length > 0 && (
            <button type="button" className={styles.clearButton} onClick={clearAllPassages}>
              <Trash2 aria-hidden="true" /> 清除选文
            </button>
          )}
        </div>
      </header>

      {sortedPassages.length === 0 ? (
        <div className={styles.emptyState}>
          <Bookmark aria-hidden="true" />
          <div>
            <p>这里还没有选文</p>
            <h3>先收藏一句想再读的原典。</h3>
            <span>在任意经卷页选中经文，点击“收藏选文”；无需先写笔记。</span>
          </div>
          <Link href="/jingzang">从藏经中选一部原典</Link>
        </div>
      ) : (
        <ol className={styles.passageList}>
          {sortedPassages.map((passage, index) => (
            <li key={passage.id} className={styles.passageCard}>
              <article>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p>{passage.locator}</p>
                    <h3>{passage.workTitle}</h3>
                    <small>{passage.passageLabel} · 收藏于 {formatDate(passage.savedAt)}</small>
                  </div>
                </header>
                <blockquote lang={passage.quoteLang}>{passage.quote}</blockquote>
                <footer>
                  <Link href={passage.sourceHref}>
                    回到原典 <ArrowUpRight aria-hidden="true" />
                  </Link>
                  <div>
                    <button type="button" onClick={() => copyPassage(passage)}>
                      <Clipboard aria-hidden="true" /> 复制 Markdown
                    </button>
                    <button
                      type="button"
                      aria-label={`移除选文 ${passage.workTitle} ${passage.locator}`}
                      onClick={() => deletePassage(passage)}
                    >
                      <Trash2 aria-hidden="true" /> 移除
                    </button>
                  </div>
                </footer>
              </article>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback || "选文只保存在当前浏览器；换设备或清除网站数据前，请先导出备份。"}
      </p>
    </section>
  );
}
