"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  EMPTY_STUDY_NOTES_SNAPSHOT,
  parseStudyNotes,
  serializeStudyNotes,
  STUDY_NOTES_CHANGE_EVENT,
  STUDY_NOTES_STORAGE_KEY,
  type StudyNote,
} from "@/lib/study-notes";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STUDY_NOTES_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STUDY_NOTES_CHANGE_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  try {
    return window.localStorage.getItem(STUDY_NOTES_STORAGE_KEY) ?? EMPTY_STUDY_NOTES_SNAPSHOT;
  } catch {
    return EMPTY_STUDY_NOTES_SNAPSHOT;
  }
}

function readServerSnapshot() {
  return EMPTY_STUDY_NOTES_SNAPSHOT;
}

export function useStudyNotes() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  return useMemo(() => parseStudyNotes(snapshot), [snapshot]);
}

export function saveStudyNotes(notes: StudyNote[]) {
  window.localStorage.setItem(STUDY_NOTES_STORAGE_KEY, serializeStudyNotes(notes));
  window.dispatchEvent(new Event(STUDY_NOTES_CHANGE_EVENT));
}
