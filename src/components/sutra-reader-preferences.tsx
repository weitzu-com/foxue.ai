"use client";

import { Languages, Type } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import styles from "./sutra-reading-sample.module.css";

const preferenceStorageKey = "foxue.reader.preferences.v1";
const preferenceChangeEvent = "foxue-reader-preferences";
const defaultPreferenceSnapshot = JSON.stringify({ showPinyin: true, largeText: false });
let memoryPreferenceSnapshot = defaultPreferenceSnapshot;

function validatedPreferenceSnapshot(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (typeof parsed.showPinyin !== "boolean" || typeof parsed.largeText !== "boolean") return null;
    return JSON.stringify({
      showPinyin: parsed.showPinyin,
      largeText: parsed.largeText,
    });
  } catch {
    return null;
  }
}

function readPreferenceSnapshot() {
  try {
    return validatedPreferenceSnapshot(window.localStorage.getItem(preferenceStorageKey))
      ?? memoryPreferenceSnapshot;
  } catch {
    return memoryPreferenceSnapshot;
  }
}

function subscribeToPreferences(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === preferenceStorageKey) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(preferenceChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(preferenceChangeEvent, onStoreChange);
  };
}

function savePreferenceSnapshot(showPinyin: boolean, largeText: boolean) {
  memoryPreferenceSnapshot = JSON.stringify({ showPinyin, largeText });
  try {
    window.localStorage.setItem(preferenceStorageKey, memoryPreferenceSnapshot);
  } catch {
    // Memory fallback keeps the controls functional when storage is unavailable.
  }
  window.dispatchEvent(new Event(preferenceChangeEvent));
}

export function SutraReaderPreferences({
  children,
  showPinyinControl,
}: {
  children: ReactNode;
  showPinyinControl: boolean;
}) {
  const preferenceSnapshot = useSyncExternalStore(
    subscribeToPreferences,
    readPreferenceSnapshot,
    () => defaultPreferenceSnapshot,
  );
  const { showPinyin, largeText } = JSON.parse(preferenceSnapshot) as {
    showPinyin: boolean;
    largeText: boolean;
  };

  return (
    <section
      className={`${styles.experience} ${showPinyin ? styles.pinyinOn : styles.pinyinOff} ${largeText ? styles.largeText : ""}`}
      aria-label="经文阅读区"
    >
      <div className={styles.toolbar} aria-label="阅读设置">
        <div className={styles.toolbarLabel}>
          <span>阅读设置</span>
          <small>设置会在阅读页间保留</small>
        </div>
        <div className={styles.toolbarActions} role="group" aria-label="经文显示选项">
          {showPinyinControl && (
            <button
              type="button"
              aria-label={showPinyin ? "隐藏拼音" : "显示拼音"}
              aria-pressed={showPinyin}
              onClick={() => savePreferenceSnapshot(!showPinyin, largeText)}
            >
              <Languages aria-hidden="true" size={16} />
              拼音
            </button>
          )}
          <button
            type="button"
            aria-label={largeText ? "使用标准字号" : "放大经文"}
            aria-pressed={largeText}
            onClick={() => savePreferenceSnapshot(showPinyin, !largeText)}
          >
            <Type aria-hidden="true" size={16} />
            大字
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
