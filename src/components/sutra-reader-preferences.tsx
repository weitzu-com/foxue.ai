"use client";

import { Hash, Languages, Type } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import styles from "./sutra-reading-sample.module.css";

const preferenceStorageKey = "foxue.reader.preferences.v1";
const preferenceChangeEvent = "foxue-reader-preferences";
const defaultPreferenceSnapshot = JSON.stringify({
  showPinyin: true,
  largeText: false,
  showLocators: false,
});
let memoryPreferenceSnapshot = defaultPreferenceSnapshot;

type ReaderPreferences = {
  showPinyin: boolean;
  largeText: boolean;
  showLocators: boolean;
};

function validatedPreferenceSnapshot(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (typeof parsed.showPinyin !== "boolean" || typeof parsed.largeText !== "boolean") return null;
    return JSON.stringify({
      showPinyin: parsed.showPinyin,
      largeText: parsed.largeText,
      showLocators: typeof parsed.showLocators === "boolean" ? parsed.showLocators : false,
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

function savePreferenceSnapshot(preferences: ReaderPreferences) {
  memoryPreferenceSnapshot = JSON.stringify(preferences);
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
  const { showPinyin, largeText, showLocators } = JSON.parse(preferenceSnapshot) as ReaderPreferences;

  return (
    <section
      className={`${styles.experience} ${showPinyin ? styles.pinyinOn : styles.pinyinOff} ${largeText ? styles.largeText : ""} ${showLocators ? styles.locatorsOn : ""}`}
      aria-label="经文阅读区"
      data-show-locators={showLocators}
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
              data-analytics-event="reader_preference_changed"
              data-analytics-content-id="pinyin"
              data-analytics-label={showPinyin ? "disable" : "enable"}
              data-analytics-location="scripture_reader_toolbar"
              onClick={() => savePreferenceSnapshot({
                showPinyin: !showPinyin,
                largeText,
                showLocators,
              })}
            >
              <Languages aria-hidden="true" size={16} />
              拼音
            </button>
          )}
          <button
            type="button"
            aria-label={largeText ? "使用标准字号" : "放大经文"}
            aria-pressed={largeText}
            data-analytics-event="reader_preference_changed"
            data-analytics-content-id="large_text"
            data-analytics-label={largeText ? "disable" : "enable"}
            data-analytics-location="scripture_reader_toolbar"
            onClick={() => savePreferenceSnapshot({
              showPinyin,
              largeText: !largeText,
              showLocators,
            })}
          >
            <Type aria-hidden="true" size={16} />
            大字
          </button>
          <button
            type="button"
            aria-label={showLocators ? "隐藏稳定坐标" : "显示稳定坐标"}
            aria-pressed={showLocators}
            data-analytics-event="reader_preference_changed"
            data-analytics-content-id="stable_locators"
            data-analytics-label={showLocators ? "disable" : "enable"}
            data-analytics-location="scripture_reader_toolbar"
            onClick={() => savePreferenceSnapshot({
              showPinyin,
              largeText,
              showLocators: !showLocators,
            })}
          >
            <Hash aria-hidden="true" size={16} />
            坐标
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
