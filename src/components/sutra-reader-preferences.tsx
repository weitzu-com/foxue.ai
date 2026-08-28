"use client";

import { ChevronDown, ChevronUp, Hash, Languages, Search, Type, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { trackEvent } from "@/lib/analytics";
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

type PageSearchMatch = {
  segmentIds: string[];
  locator: string;
  scrollTarget: HTMLElement;
};

type PageSearchResult = {
  matches: PageSearchMatch[];
  total: number;
};

const maxStoredPageSearchMatches = 500;
const searchVariantCharacters: Record<string, string> = {
  应: "應",
  无: "無",
  为: "為",
  梦: "夢",
  电: "電",
  诸: "諸",
  恶: "惡",
  众: "眾",
  净: "淨",
  执: "執",
  着: "著",
  发: "發",
  说: "說",
  碍: "礙",
  挂: "罣",
  掛: "罣",
  观: "觀",
  见: "見",
  蕴: "蘊",
  异: "異",
  识: "識",
  复: "復",
  远: "遠",
  离: "離",
  颠: "顛",
  过: "過",
};

function normalizedSearchCharacters(value: string) {
  return [...value.normalize("NFKC")].flatMap((character) => {
    const normalized = (searchVariantCharacters[character] ?? character).toLowerCase();
    // Symbols such as □ are source evidence, so only punctuation and whitespace are ignorable.
    return /[\p{P}\s]/u.test(normalized) ? [] : [...normalized];
  });
}

function buildPageSearchResult(root: HTMLElement, query: string): PageSearchResult {
  const characters: string[] = [];
  const characterSegmentIndexes: number[] = [];
  const sourceSegments = Array.from(
    root.querySelectorAll<HTMLElement>("[data-study-segment-id] > [data-source-text-equivalent]"),
  ).flatMap((sourceText) => {
    const anchor = sourceText.parentElement;
    const segmentId = anchor?.dataset.studySegmentId;
    if (!anchor || !segmentId) return [];
    return [{ anchor, segmentId, text: sourceText.textContent ?? "" }];
  });

  sourceSegments.forEach((segment, segmentIndex) => {
    normalizedSearchCharacters(segment.text).forEach((character) => {
      characters.push(character);
      characterSegmentIndexes.push(segmentIndex);
    });
  });

  const queryCharacters = normalizedSearchCharacters(query);
  const matches: PageSearchMatch[] = [];
  let total = 0;

  for (let start = 0; start <= characters.length - queryCharacters.length;) {
    const isMatch = queryCharacters.every((character, queryIndex) => (
      characters[start + queryIndex] === character
    ));
    if (!isMatch) {
      start += 1;
      continue;
    }

    const end = start + queryCharacters.length - 1;
    const firstSegmentIndex = characterSegmentIndexes[start];
    const lastSegmentIndex = characterSegmentIndexes[end];
    const matchedSegments = sourceSegments.slice(firstSegmentIndex, lastSegmentIndex + 1);
    total += 1;
    if (matches.length < maxStoredPageSearchMatches && matchedSegments.length > 0) {
      const firstLocator = matchedSegments[0].segmentId;
      const lastLocator = matchedSegments.at(-1)?.segmentId ?? firstLocator;
      matches.push({
        segmentIds: matchedSegments.map((segment) => segment.segmentId),
        locator: firstLocator === lastLocator ? firstLocator : `${firstLocator} → ${lastLocator}`,
        scrollTarget: matchedSegments[0].anchor,
      });
    }
    start += queryCharacters.length;
  }

  return { matches, total };
}

function clearPageSearchDecorations(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(
    "[data-reader-search-match], [data-reader-search-current]",
  ).forEach((element) => {
    element.removeAttribute("data-reader-search-match");
    element.removeAttribute("data-reader-search-current");
  });
}

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
  const sectionRef = useRef<HTMLElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelId = useId();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<PageSearchResult | null>(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searchMessage, setSearchMessage] = useState("");

  const closeSearch = (restoreFocus = false) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResult(null);
    setActiveMatchIndex(0);
    setSearchMessage("");
    if (restoreFocus) window.requestAnimationFrame(() => searchToggleRef.current?.focus());
  };

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    clearPageSearchDecorations(root);

    const activeMatch = searchResult?.matches[activeMatchIndex];
    if (!activeMatch) return;
    const matchedIds = new Set(searchResult.matches.flatMap((match) => match.segmentIds));
    const currentIds = new Set(activeMatch.segmentIds);
    root.querySelectorAll<HTMLElement>("[data-study-segment-id]").forEach((element) => {
      const segmentId = element.dataset.studySegmentId;
      if (!segmentId) return;
      if (matchedIds.has(segmentId)) element.dataset.readerSearchMatch = "true";
      if (currentIds.has(segmentId)) element.dataset.readerSearchCurrent = "true";
    });
    activeMatch.scrollTarget.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });

    return () => clearPageSearchDecorations(root);
  }, [activeMatchIndex, searchResult]);

  const submitPageSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const root = sectionRef.current;
    const normalizedQuery = normalizedSearchCharacters(searchQuery);
    if (!root || normalizedQuery.length < 2) {
      setSearchResult(null);
      setSearchMessage("请至少输入两个文字或字母。标点与空格不计入长度。");
      return;
    }

    const result = buildPageSearchResult(root, searchQuery);
    setSearchResult(result);
    setActiveMatchIndex(0);
    setSearchMessage(result.total === 0 ? "当前页原文中没有找到这句话。" : "");
    trackEvent("reader_page_search_completed", {
      query_length: normalizedQuery.length,
      match_count: result.total,
      search_scope: "current_folio",
    });
  };

  const moveToMatch = (direction: -1 | 1) => {
    const matchCount = searchResult?.matches.length ?? 0;
    if (matchCount < 2) return;
    setActiveMatchIndex((current) => (current + direction + matchCount) % matchCount);
  };

  const activeMatch = searchResult?.matches[activeMatchIndex];
  const searchStatus = activeMatch
    ? `找到 ${searchResult?.total ?? 0} 处，当前第 ${activeMatchIndex + 1} 处 · ${activeMatch.locator}${(searchResult?.total ?? 0) > maxStoredPageSearchMatches ? "；仅导航前 500 处" : ""}`
    : searchMessage;

  return (
    <section
      ref={sectionRef}
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
          <button
            ref={searchToggleRef}
            type="button"
            aria-label={searchOpen ? "关闭本页查句" : "打开本页查句"}
            aria-expanded={searchOpen}
            aria-controls={searchPanelId}
            data-analytics-event="reader_page_search_toggled"
            data-analytics-content-id="current_folio"
            data-analytics-label={searchOpen ? "close" : "open"}
            data-analytics-location="scripture_reader_toolbar"
            onClick={() => {
              if (searchOpen) closeSearch();
              else setSearchOpen(true);
            }}
          >
            <Search aria-hidden="true" size={16} />
            查句
          </button>
        </div>
      </div>
      {searchOpen && (
        <form
          className={styles.pageSearch}
          id={searchPanelId}
          role="search"
          aria-label="在当前页原文中查句"
          onSubmit={submitPageSearch}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeSearch(true);
          }}
        >
          <div className={styles.pageSearchHeading}>
            <div>
              <label htmlFor={`${searchPanelId}-input`}>本页查句</label>
              <p>只查当前页原文，不上传输入内容；一句话跨行也能找到。</p>
            </div>
            <button type="button" aria-label="关闭本页查句" onClick={() => closeSearch(true)}>
              <X aria-hidden="true" size={17} />
            </button>
          </div>
          <div className={styles.pageSearchControls}>
            <input
              ref={searchInputRef}
              id={`${searchPanelId}-input`}
              type="search"
              value={searchQuery}
              maxLength={80}
              autoComplete="off"
              spellCheck={false}
              placeholder="例如：照见五蕴皆空"
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchResult(null);
                setActiveMatchIndex(0);
                setSearchMessage("");
              }}
            />
            <button className={styles.pageSearchSubmit} type="submit">
              <Search aria-hidden="true" size={16} />
              查找
            </button>
          </div>
          <div className={styles.pageSearchFooter}>
            <p role="status" aria-live="polite" aria-atomic="true">{searchStatus}</p>
            <div className={styles.pageSearchNavigation} aria-label="查句结果导航">
              <button
                type="button"
                aria-label="上一个查句结果"
                disabled={(searchResult?.matches.length ?? 0) < 2}
                onClick={() => moveToMatch(-1)}
              >
                <ChevronUp aria-hidden="true" size={16} />
                上一个
              </button>
              <button
                type="button"
                aria-label="下一个查句结果"
                disabled={(searchResult?.matches.length ?? 0) < 2}
                onClick={() => moveToMatch(1)}
              >
                <ChevronDown aria-hidden="true" size={16} />
                下一个
              </button>
              <button
                type="button"
                disabled={!searchQuery && !searchResult && !searchMessage}
                onClick={() => {
                  setSearchQuery("");
                  setSearchResult(null);
                  setActiveMatchIndex(0);
                  setSearchMessage("已清除本页查句结果。");
                  searchInputRef.current?.focus();
                }}
              >
                清除
              </button>
            </div>
          </div>
        </form>
      )}
      {children}
    </section>
  );
}
