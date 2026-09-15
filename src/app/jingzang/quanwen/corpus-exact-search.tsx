"use client";

import { useId, useState } from "react";
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
  counts: { candidateDocuments: number; inspectedCandidates: number; results: number; truncated: boolean };
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
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState<Language>(validLanguage(initialLanguage));
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; data: SearchResponse; searchedQuery: string }
  >({ status: "idle" });

  async function fetchResults(nextQuery: string, nextLanguage: Language, replaceUrl = true) {
    const cleanQuery = nextQuery.trim();
    const requestUrl = new URL(endpoint);
    requestUrl.searchParams.set("q", cleanQuery);
    if (nextLanguage !== "all") requestUrl.searchParams.set("language", nextLanguage);
    requestUrl.searchParams.set("limit", "10");
    try {
      const response = await fetch(requestUrl, { headers: { accept: "application/json" } });
      const body = await response.json() as SearchResponse | { message?: string };
      if (!response.ok) {
        throw new Error("message" in body && body.message ? body.message : "全文索引暂时不可用。");
      }
      setState({ status: "success", data: body as SearchResponse, searchedQuery: cleanQuery });
      if (replaceUrl) {
        const pageUrl = new URL(window.location.href);
        pageUrl.search = "";
        pageUrl.searchParams.set("q", cleanQuery);
        if (nextLanguage !== "all") pageUrl.searchParams.set("language", nextLanguage);
        window.history.replaceState(null, "", pageUrl);
      }
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "全文索引暂时不可用。",
      });
    }
  }

  function startSearch(nextQuery: string, nextLanguage: Language) {
    setState({ status: "loading" });
    void fetchResults(nextQuery, nextLanguage);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSearch(query, language);
  }

  function selectExample(value: string) {
    setQuery(value);
    startSearch(value, language);
  }

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
            “{state.searchedQuery}”确认 <strong>{state.data.results.length}</strong> 个版页命中；
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

      {state.status === "success" && state.data.counts.truncated ? (
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
