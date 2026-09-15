"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import styles from "./page.module.css";

const endpoint = "https://canon.foxue.ai/search";
const examples = ["應無所住而生其心", "色即是空空即是色", "諸行無常是生滅法"] as const;
const languages = [
  ["all", "全部语种"],
  ["zh", "汉文"],
  ["bo", "藏文"],
  ["pi", "巴利文"],
  ["indic", "梵文／俗语"],
  ["en", "英文"],
  ["ja", "日文"],
] as const;

type Language = (typeof languages)[number][0];
type SearchResult = {
  documentId: number;
  title: string;
  canonRef: string;
  language: string;
  languageCode: string;
  folio: { key: string; label: string; juan: string };
  locator?: string;
  href: string;
  excerpt: {
    before: string;
    match: string;
    after: string;
    startsBeforeExcerpt: boolean;
    continuesAfterExcerpt: boolean;
  };
};
type SearchResponse = {
  query: { normalizedCodePoints: number; language: string };
  release: { searchReleaseId: string; corpusReleaseId: string };
  coverage: { expressions: number; documents: number; indexedDocuments: number };
  counts: {
    candidateDocuments: number;
    candidateOffset?: number;
    inspectedCandidates: number;
    nextCandidateOffset?: number;
    remainingCandidateDocuments?: number;
    results: number;
    truncated: boolean;
  };
  nextCursor?: string;
  results: SearchResult[];
};

function validLanguage(value: string): Language {
  return languages.some(([id]) => id === value) ? value as Language : "all";
}

export function CorpusExactSearch({
  initialQuery,
  initialLanguage,
}: {
  initialQuery: string;
  initialLanguage: string;
}) {
  const inputId = useId();
  const activeRequest = useRef<AbortController | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState<Language>(validLanguage(initialLanguage));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [continuationError, setContinuationError] = useState("");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; data: SearchResponse; searchedQuery: string; searchedLanguage: Language }
  >({ status: "idle" });

  useEffect(() => () => {
    const controller = activeRequest.current;
    activeRequest.current = null;
    controller?.abort();
  }, []);

  async function fetchResults(
    nextQuery: string,
    nextLanguage: Language,
    controller: AbortController,
    options: { append?: boolean; cursor?: string; replaceUrl?: boolean } = {},
  ) {
    const { append = false, cursor, replaceUrl = !append } = options;
    const cleanQuery = nextQuery.trim();
    const requestUrl = new URL(endpoint);
    requestUrl.searchParams.set("q", cleanQuery);
    if (nextLanguage !== "all") requestUrl.searchParams.set("language", nextLanguage);
    requestUrl.searchParams.set("limit", "10");
    if (cursor) requestUrl.searchParams.set("cursor", cursor);
    try {
      const response = await fetch(requestUrl, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      const body = await response.json() as SearchResponse | { message?: string };
      if (!response.ok) {
        throw new Error("message" in body && body.message ? body.message : "全文索引暂时不可用。");
      }
      if (activeRequest.current !== controller) return;
      const data = body as SearchResponse;
      setContinuationError("");
      if (append) {
        setState((current) => {
          if (current.status !== "success") return current;
          const seen = new Set(current.data.results.map((result) => `${result.documentId}:${result.locator ?? ""}`));
          const appendedResults = data.results.filter(
            (result) => !seen.has(`${result.documentId}:${result.locator ?? ""}`),
          );
          const results = [...current.data.results, ...appendedResults];
          return {
            ...current,
            data: {
              ...data,
              counts: {
                ...data.counts,
                candidateOffset: current.data.counts.candidateOffset ?? 0,
                inspectedCandidates:
                  current.data.counts.inspectedCandidates + data.counts.inspectedCandidates,
                results: results.length,
              },
              results,
            },
          };
        });
      } else {
        setState({
          status: "success",
          data,
          searchedQuery: cleanQuery,
          searchedLanguage: nextLanguage,
        });
      }
      if (replaceUrl) {
        const pageUrl = new URL(window.location.href);
        pageUrl.search = "";
        pageUrl.searchParams.set("q", cleanQuery);
        if (nextLanguage !== "all") pageUrl.searchParams.set("language", nextLanguage);
        window.history.replaceState(null, "", pageUrl);
      }
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      const message = error instanceof Error ? error.message : "全文索引暂时不可用。";
      if (append) setContinuationError(message);
      else setState({ status: "error", message });
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setIsLoadingMore(false);
      }
    }
  }

  function startSearch(nextQuery: string, nextLanguage: Language) {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoadingMore(false);
    setContinuationError("");
    setState({ status: "loading" });
    void fetchResults(nextQuery, nextLanguage, controller);
  }

  function loadMore() {
    if (state.status !== "success" || !state.data.nextCursor || isLoadingMore) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoadingMore(true);
    setContinuationError("");
    void fetchResults(state.searchedQuery, state.searchedLanguage, controller, {
      append: true,
      cursor: state.data.nextCursor,
      replaceUrl: false,
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSearch(query, language);
  }

  function selectExample(value: string) {
    setQuery(value);
    startSearch(value, language);
  }

  const verifiedCandidateCount = state.status === "success"
    ? state.data.counts.nextCandidateOffset ?? state.data.counts.inspectedCandidates
    : 0;

  return (
    <section className={styles.console} aria-labelledby="corpus-search-title">
      <div className={styles.consoleHeading}>
        <div>
          <p className="eyebrow">逐字检索台 · 01</p>
          <h2 id="corpus-search-title">检索经文正文</h2>
        </div>
        <p>至少输入 3 个有效字符，最多 80 个。查询会发送到只读边缘索引，不进入问经模型或账户画像。</p>
      </div>

      <form className={styles.searchForm} onSubmit={submit} role="search">
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor={inputId}>输入佛经原文短句</label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例如：應無所住而生其心"
          minLength={3}
          maxLength={120}
          required
          autoComplete="off"
        />
        <button disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? <LoaderCircle aria-hidden="true" className={styles.spinner} /> : null}
          {state.status === "loading" ? "检索中" : "查原文"}
        </button>
      </form>

      <div className={styles.searchControls}>
        <fieldset>
          <legend>按正文语种筛选</legend>
          {languages.map(([id, label]) => (
            <label key={id}>
              <input
                type="radio"
                name="corpus-search-language"
                value={id}
                checked={language === id}
                onChange={() => setLanguage(id)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div className={styles.examples}>
          <span>试一条</span>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => selectExample(example)}>{example}</button>
          ))}
        </div>
      </div>

      <div className={styles.status} aria-live="polite" aria-atomic="true">
        {state.status === "idle" ? <p>从一句熟悉的经文开始。</p> : null}
        {state.status === "loading" ? <p>正在定位候选版页，并逐页确认完整短句……</p> : null}
        {state.status === "error" ? (
          <p className={styles.error}><TriangleAlert aria-hidden="true" /> {state.message}</p>
        ) : null}
        {state.status === "success" ? (
          <p>
            “{state.searchedQuery}”已显示 <strong>{state.data.results.length}</strong> 个版页命中；
            已核验 {verifiedCandidateCount.toLocaleString("zh-CN")} / {state.data.counts.candidateDocuments.toLocaleString("zh-CN")} 个候选版页。
            索引覆盖 {state.data.coverage.expressions.toLocaleString("zh-CN")} 个文本表达、
            {state.data.coverage.documents.toLocaleString("zh-CN")} 个版页。
          </p>
        ) : null}
      </div>

      {state.status === "success" && state.data.results.length > 0 ? (
        <ol className={styles.results}>
          {state.data.results.map((result, index) => (
            <li key={`${result.documentId}-${result.locator ?? "folio"}`}>
              <article>
                <div className={styles.resultIndex}>{String(index + 1).padStart(2, "0")}</div>
                <div className={styles.resultBody}>
                  <div className={styles.resultTitle}>
                    <div>
                      <p>{result.language} · {result.canonRef}</p>
                      <h3>{result.title}</h3>
                    </div>
                    <span>{result.folio.label}{result.locator ? ` · ${result.locator}` : ""}</span>
                  </div>
                  <blockquote>
                    {result.excerpt.startsBeforeExcerpt ? "…" : ""}
                    {result.excerpt.before}<mark>{result.excerpt.match}</mark>{result.excerpt.after}
                    {result.excerpt.continuesAfterExcerpt ? "…" : ""}
                  </blockquote>
                  <Link
                    href={result.href}
                    prefetch={false}
                    data-analytics-event="scripture_opened"
                    data-analytics-location="corpus_exact_search"
                    data-analytics-content-id={result.canonRef}
                  >
                    <BookOpenText aria-hidden="true" /> 打开原典定位 <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : null}

      {state.status === "success" && state.data.results.length === 0 ? (
        <div className={styles.empty}>
          <strong>{state.data.counts.truncated ? "首批候选中没有确认命中" : "没有逐字命中"}</strong>
          <p>这不证明佛典中没有相近义理。可缩短原句、核对繁简与异体字，或改用经名目录寻找版本。</p>
          <Link href="/jingzang">改查经名与经号 <ArrowRight aria-hidden="true" /></Link>
        </div>
      ) : null}

      {state.status === "success" && state.data.nextCursor ? (
        <div className={styles.continuation}>
          <p>
            尚有 {(state.data.counts.remainingCandidateDocuments
              ?? Math.max(0, state.data.counts.candidateDocuments - verifiedCandidateCount))
              .toLocaleString("zh-CN")} 个候选待核验；每次最多回读 48 个版页。
          </p>
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            data-analytics-event="corpus_search_continued"
            data-analytics-location="corpus_exact_search"
            data-analytics-content-id={state.data.release.searchReleaseId}
          >
            {isLoadingMore ? <LoaderCircle aria-hidden="true" className={styles.spinner} /> : null}
            {isLoadingMore ? "继续核验中" : "继续核验下一批"}
          </button>
        </div>
      ) : null}

      {continuationError ? (
        <p className={styles.continuationError} role="alert">
          <TriangleAlert aria-hidden="true" /> {continuationError}
        </p>
      ) : null}

      {state.status === "success" && state.data.counts.truncated && !state.data.nextCursor ? (
        <p className={styles.truncated}>
          为控制边缘读取成本，本次只核验前 {state.data.counts.inspectedCandidates} 个候选版页；结果不是穷尽式书目结论。
        </p>
      ) : null}

      {state.status === "success" ? (
        <details className={styles.releaseDetails}>
          <summary>本次检索的可复核版本</summary>
          <code>{state.data.release.searchReleaseId}</code>
          <code>{state.data.release.corpusReleaseId}</code>
        </details>
      ) : null}
    </section>
  );
}
