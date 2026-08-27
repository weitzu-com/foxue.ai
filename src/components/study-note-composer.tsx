"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { BookMarked, Check, ChevronDown, ShieldCheck, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  studyNoteKindLabels,
  type StudyNote,
  type StudyNoteKind,
  type StudyNoteSeed,
} from "@/lib/study-notes";
import { saveStudyNotes, useStudyNotes } from "@/components/use-study-notes";
import styles from "./study-note-composer.module.css";

const prompts: Record<StudyNoteKind, string> = {
  practice: "这一段照见了我当下的什么？",
  understanding: "如果用自己的话复述，我会怎样说？",
  verify: "哪一点仍需回到上下文、注疏或其他版本求证？",
};

export function StudyNoteComposer({ seed }: { seed: StudyNoteSeed }) {
  const notes = useStudyNotes();
  const existing = notes.find((note) => note.id === seed.id);
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState<StudyNoteKind>(seed.defaultKind);
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState("");
  const reactId = useId();
  const panelId = `study-note-${reactId.replaceAll(":", "")}`;

  function openEditor() {
    setKind(existing?.kind ?? seed.defaultKind);
    setBody(existing?.body ?? "");
    setFeedback("");
    setIsOpen(true);
  }

  function closeEditor() {
    setIsOpen(false);
    setFeedback("");
  }

  function saveNote() {
    const cleanBody = body.trim();
    if (!cleanBody) {
      setFeedback("先写下一句，再保存。");
      return;
    }

    const now = new Date().toISOString();
    const note: StudyNote = {
      id: seed.id,
      workTitle: seed.workTitle,
      passageLabel: seed.passageLabel,
      locator: seed.locator,
      quote: seed.quote,
      quoteLang: seed.quoteLang,
      sourceHref: seed.sourceHref,
      studyHref: seed.studyHref,
      kind,
      body: cleanBody.slice(0, 2_000),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      saveStudyNotes([note, ...notes.filter((item) => item.id !== seed.id)]);
      setBody(note.body);
      setFeedback("已保存在这台设备，并带上原典坐标。");
      trackEvent("study_note_saved", {
        note_kind: kind,
        source_id: seed.id,
        is_update: Boolean(existing),
      });
    } catch {
      setFeedback("浏览器未能保存。可先复制文字，或检查是否禁用了本地存储。");
    }
  }

  if (!isOpen) {
    return (
      <div className={`${styles.composer} ${existing ? styles.saved : ""}`}>
        <button
          type="button"
          className={styles.openButton}
          aria-expanded="false"
          aria-controls={panelId}
          onClick={openEditor}
        >
          <span>
            {existing ? <Check aria-hidden="true" /> : <BookMarked aria-hidden="true" />}
            <span>
              <strong>{existing ? "已存研读笺" : "写研读笺"}</strong>
              <small>{existing ? `${studyNoteKindLabels[existing.kind]} · 可继续修改` : "自动带上原典与稳定段号"}</small>
            </span>
          </span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.composer} ${styles.open}`} id={panelId}>
      <div className={styles.heading}>
        <div>
          <BookMarked aria-hidden="true" />
          <span>
            <strong>{existing ? "修改研读笺" : "留一则研读笺"}</strong>
            <small>{seed.locator}</small>
          </span>
        </div>
        <button type="button" aria-label="收起研读笺" onClick={closeEditor}>
          <X aria-hidden="true" />
        </button>
      </div>

      <fieldset className={styles.kinds}>
        <legend>这则笔记属于哪一种研读？</legend>
        {(Object.keys(studyNoteKindLabels) as StudyNoteKind[]).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
          >
            <strong>{studyNoteKindLabels[value]}</strong>
            <span>{prompts[value]}</span>
          </button>
        ))}
      </fieldset>

      <label className={styles.editor}>
        <span>{prompts[kind]}</span>
        <textarea
          value={body}
          maxLength={2_000}
          rows={5}
          placeholder="写给未来回到这里的自己……"
          onChange={(event) => setBody(event.target.value)}
        />
        <small>{body.length} / 2000</small>
      </label>

      <div className={styles.actions}>
        <p>
          <ShieldCheck aria-hidden="true" /> 不登录、不上传，只保存在当前浏览器。
        </p>
        <div>
          {existing && <Link href="/xue/biji">查看全部研读笺</Link>}
          <button type="button" onClick={saveNote}>保存研读笺</button>
        </div>
      </div>
      <p className={styles.feedback} role="status" aria-live="polite">{feedback}</p>
    </div>
  );
}
