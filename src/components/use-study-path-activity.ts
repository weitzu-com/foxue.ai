"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { StudyPathId } from "@/data/study-path-registry";
import {
  EMPTY_STUDY_PATH_ACTIVITY_SNAPSHOT,
  parseStudyPathActivities,
  serializeStudyPathActivities,
  STUDY_PATH_ACTIVITY_CHANGE_EVENT,
  STUDY_PATH_ACTIVITY_STORAGE_KEY,
  type StudyPathDayStatus,
  upsertStudyPathActivity,
} from "@/lib/study-path-activity";

let memorySnapshot = EMPTY_STUDY_PATH_ACTIVITY_SNAPSHOT;
let localStorageAvailable = true;

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STUDY_PATH_ACTIVITY_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STUDY_PATH_ACTIVITY_CHANGE_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  if (!localStorageAvailable) return memorySnapshot;
  try {
    memorySnapshot = window.localStorage.getItem(STUDY_PATH_ACTIVITY_STORAGE_KEY)
      ?? EMPTY_STUDY_PATH_ACTIVITY_SNAPSHOT;
  } catch {
    localStorageAvailable = false;
  }
  return memorySnapshot;
}

function readServerSnapshot() {
  return EMPTY_STUDY_PATH_ACTIVITY_SNAPSHOT;
}

function saveSnapshot(snapshot: string) {
  memorySnapshot = snapshot;
  if (localStorageAvailable) {
    try {
      window.localStorage.setItem(STUDY_PATH_ACTIVITY_STORAGE_KEY, snapshot);
    } catch {
      localStorageAvailable = false;
    }
  }
  window.dispatchEvent(new Event(STUDY_PATH_ACTIVITY_CHANGE_EVENT));
}

export function useStudyPathActivities() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  return useMemo(() => parseStudyPathActivities(snapshot), [snapshot]);
}

export function recordStudyPathProgress(
  id: StudyPathId,
  activeDay: number,
  statuses: Record<string, StudyPathDayStatus>,
) {
  const next = upsertStudyPathActivity(
    parseStudyPathActivities(readSnapshot()),
    { id, activeDay, statuses },
    new Date().toISOString(),
  );
  saveSnapshot(serializeStudyPathActivities(next));
}
