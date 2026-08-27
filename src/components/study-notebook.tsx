"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clipboard,
  Download,
  FileText,
  NotebookPen,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  formatStudyNotebookMarkdown,
  formatStudyNoteMarkdown,
  studyNoteKindLabels,
  STUDY_NOTES_CANONICAL_ORIGIN,
  type StudyNote,
  type StudyNoteKind,
} from "@/lib/study-notes";
import { saveStudyNotes, useStudyNotes } from "@/components/use-study-notes";
import styles from "./study-notebook.module.css";

type NoteFilter = "all" | StudyNoteKind;

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function downloadMarkdown(notes: StudyNote[]) {
  const now = new Date();
  const markdown = formatStudyNotebookMarkdown(notes, STUDY_NOTES_CANONICAL_ORIGIN, now.toISOString());
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `foxue-ai-study-notes-${now.toISOString().slice(0, 10)}.md`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function StudyNotebook() {
  const notes = useStudyNotes();
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [feedback, setFeedback] = useState("");
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes],
  );
  const visibleNotes = filter === "all"
    ? sortedNotes
    : sortedNotes.filter((note) => note.kind === filter);
  const counts = useMemo(() => ({
    practice: notes.filter((note) => note.kind === "practice").length,
    understanding: notes.filter((note) => note.kind === "understanding").length,
    verify: notes.filter((note) => note.kind === "verify").length,
  }), [notes]);

  function exportNotes() {
    if (!notes.length) return;
    downloadMarkdown(notes);
    setFeedback(`已导出 ${notes.length} 则研读笺，文件包含引文、坐标与原典链接。`);
    trackEvent("study_notes_exported", { note_count: notes.length });
  }

  async function copyNote(note: StudyNote) {
    try {
      await navigator.clipboard.writeText(
        formatStudyNoteMarkdown(note, STUDY_NOTES_CANONICAL_ORIGIN),
      );
      setFeedback(`已复制“${note.workTitle} · ${note.passageLabel}”。`);
      trackEvent("study_note_copied", { note_kind: note.kind, source_id: note.id });
    } catch {
      setFeedback("浏览器未允许复制，可使用“导出全部 Markdown”。");
    }
  }

  function deleteNote(note: StudyNote) {
    if (!window.confirm(`删除“${note.workTitle} · ${note.passageLabel}”这则本地研读笺？`)) return;
    try {
      saveStudyNotes(notes.filter((item) => item.id !== note.id));
      setFeedback("研读笺已从这台设备删除。");
      trackEvent("study_note_deleted", { note_kind: note.kind, source_id: note.id });
    } catch {
      setFeedback("浏览器未能删除这则研读笺，请稍后重试。");
    }
  }

  function clearAllNotes() {
    if (!window.confirm(`清除这台设备上的全部 ${notes.length} 则研读笺？此操作无法撤销。`)) return;
    try {
      saveStudyNotes([]);
      setFeedback("这台设备上的研读笺已全部清除。");
      trackEvent("study_notes_cleared", { note_count: notes.length });
    } catch {
      setFeedback("浏览器未能清除研读笺，请稍后重试。");
    }
  }

  return (
    <section className={styles.notebook} aria-labelledby="notebook-title">
      <header className={styles.toolbar}>
        <div>
          <p>MY LOCAL NOTEBOOK</p>
          <h2 id="notebook-title">我的研读笺</h2>
          <span>
            <ShieldCheck aria-hidden="true" /> {notes.length} 则，只在当前浏览器
          </span>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" onClick={exportNotes} disabled={!notes.length}>
            <Download aria-hidden="true" /> 导出全部 Markdown
          </button>
          {notes.length > 0 && (
            <button type="button" className={styles.clearButton} onClick={clearAllNotes}>
              <Trash2 aria-hidden="true" /> 清除全部
            </button>
          )}
        </div>
      </header>

      {notes.length === 0 ? (
        <div className={styles.emptyState}>
          <div aria-hidden="true"><NotebookPen /></div>
          <p>这里还没有研读笺</p>
          <h3>先在一段经文旁，留下第一句自己的话。</h3>
          <span>
            写下观照、理解或待求证问题时，系统会把当时的引文、稳定段号和原典链接一起保存。
          </span>
          <div>
            <Link href="/jingzang">从藏经中选一部原典</Link>
            <Link href="/xue/xinjing">从《心经》七日路径开始</Link>
          </div>
        </div>
      ) : (
        <>
          <nav className={styles.filters} aria-label="按研读方式筛选">
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              全部 <span>{notes.length}</span>
            </button>
            {(Object.keys(studyNoteKindLabels) as StudyNoteKind[]).map((kind) => (
              <button
                type="button"
                key={kind}
                aria-pressed={filter === kind}
                onClick={() => setFilter(kind)}
              >
                {studyNoteKindLabels[kind]} <span>{counts[kind]}</span>
              </button>
            ))}
          </nav>

          {visibleNotes.length > 0 ? (
            <ol className={styles.noteList}>
              {visibleNotes.map((note, index) => (
                <li key={note.id} className={styles.noteCard}>
                  <article>
                    <header>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <p>{studyNoteKindLabels[note.kind]} · {note.locator}</p>
                        <h3>{note.workTitle}</h3>
                        <small>{note.passageLabel} · {formatDate(note.updatedAt)}</small>
                      </div>
                    </header>
                    <blockquote lang={note.quoteLang}>{note.quote}</blockquote>
                    <div className={styles.noteBody}>
                      <FileText aria-hidden="true" />
                      <p>{note.body}</p>
                    </div>
                    <footer>
                      <div>
                        <Link href={note.sourceHref}>
                          核对原典 <ArrowUpRight aria-hidden="true" />
                        </Link>
                        <Link href={note.studyHref}>回到研读现场</Link>
                      </div>
                      <div>
                        <button type="button" onClick={() => copyNote(note)}>
                          <Clipboard aria-hidden="true" /> 复制 Markdown
                        </button>
                        <button type="button" aria-label={`删除 ${note.workTitle} ${note.passageLabel}`} onClick={() => deleteNote(note)}>
                          <Trash2 aria-hidden="true" /> 删除
                        </button>
                      </div>
                    </footer>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.filterEmpty}>当前没有“{studyNoteKindLabels[filter as StudyNoteKind]}”研读笺。</div>
          )}
        </>
      )}

      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback || "导出文件可长期保存；清除浏览器数据前，请先下载备份。"}
      </p>
    </section>
  );
}
