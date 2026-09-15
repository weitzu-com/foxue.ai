"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, ExternalLink, ScrollText } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import styles from "./heart-sutra-comparison.module.css";

export type HeartSutraComparisonEdition = {
  slug: string;
  title: string;
  alternateTitle: string;
  canonRef: string;
  translator: string;
  language: string;
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  attributionNote?: string;
  bibliographicNote?: string;
  mainTextStartId: string;
  folioCount: number;
  segments: Array<{
    id: string;
    text: string;
    note?: string;
    sourceHref: string;
  }>;
};

const DEFAULT_LEFT = "xinjing";
const DEFAULT_RIGHT = "taisho-t0250";

function comparisonUrl(left: string, right: string) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ left, right }).toString();
  url.hash = "";
  return url;
}

function EditionPanel({
  edition,
  side,
}: {
  edition: HeartSutraComparisonEdition;
  side: "left" | "right";
}) {
  const titleId = `comparison-${side}-title`;

  return (
    <article
      className={styles.edition}
      aria-labelledby={titleId}
      data-comparison-edition={edition.slug}
      data-comparison-side={side}
    >
      <header className={styles.editionHeader}>
        <div className={styles.editionNumber} aria-hidden="true">
          {side === "left" ? "甲" : "乙"}
        </div>
        <div>
          <p>{edition.canonRef}</p>
          <h3 id={titleId}>{edition.title}</h3>
          <span>{edition.translator}</span>
        </div>
        <div className={styles.editionActions}>
          <a href={`#comparison-${side}-${edition.mainTextStartId}`}>跳到经文正文</a>
          <a href={`/jingzang/${edition.slug}`} data-analytics-event="comparison_source_opened">
            全本目录 <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </header>

      <dl className={styles.editionLedger}>
        <div><dt>文本状态</dt><dd>目录确认的同作品表达</dd></div>
        <div><dt>物理范围</dt><dd>{edition.folioCount} 个版页 · {edition.segments.length} 个稳定行段</dd></div>
        <div><dt>母版来源</dt><dd>{edition.sourceName}</dd></div>
      </dl>

      {(edition.attributionNote || edition.bibliographicNote) && (
        <details className={styles.editionBoundary}>
          <summary>查看版本与署名边界</summary>
          {edition.attributionNote && <p><strong>署名：</strong>{edition.attributionNote}</p>}
          {edition.bibliographicNote && <p><strong>书目：</strong>{edition.bibliographicNote}</p>}
        </details>
      )}

      <ol className={styles.lines} aria-label={`${edition.alternateTitle}原典行段`}>
        {edition.segments.map((segment, index) => (
          <li id={`comparison-${side}-${segment.id}`} key={segment.id}>
            <a
              className={styles.locator}
              href={segment.sourceHref}
              aria-label={`打开原典 ${segment.id}`}
              title={`回到 ${segment.id}`}
              data-analytics-event="comparison_segment_opened"
              data-analytics-content-id={segment.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <code>{segment.id}</code>
            </a>
            <p lang="zh-Hant">{segment.text}</p>
            {segment.note && <small>{segment.note}</small>}
          </li>
        ))}
      </ol>

      <footer className={styles.editionFooter}>
        <span>{edition.sourceLicense}</span>
        <a href={edition.sourceUrl} target="_blank" rel="noreferrer">
          核对来源站 <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </article>
  );
}

export function HeartSutraComparison({
  editions,
}: {
  editions: HeartSutraComparisonEdition[];
}) {
  const editionsBySlug = useMemo(
    () => new Map(editions.map((edition) => [edition.slug, edition])),
    [editions],
  );
  const [leftSlug, setLeftSlug] = useState(DEFAULT_LEFT);
  const [rightSlug, setRightSlug] = useState(DEFAULT_RIGHT);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedLeft = params.get("left");
    const requestedRight = params.get("right");
    if (
      requestedLeft
      && requestedRight
      && requestedLeft !== requestedRight
      && editionsBySlug.has(requestedLeft)
      && editionsBySlug.has(requestedRight)
    ) {
      const timeout = window.setTimeout(() => {
        setLeftSlug(requestedLeft);
        setRightSlug(requestedRight);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [editionsBySlug]);

  const left = editionsBySlug.get(leftSlug) ?? editions[0];
  const right = editionsBySlug.get(rightSlug) ?? editions[1];

  function setPair(nextLeft: string, nextRight: string, action: "select" | "swap") {
    setLeftSlug(nextLeft);
    setRightSlug(nextRight);
    setFeedback("");
    window.history.replaceState(null, "", comparisonUrl(nextLeft, nextRight));
    trackEvent("scripture_comparison_changed", {
      comparison_id: "heart-sutra-chinese-expressions",
      left_content_id: editionsBySlug.get(nextLeft)?.canonRef ?? nextLeft,
      right_content_id: editionsBySlug.get(nextRight)?.canonRef ?? nextRight,
      action,
    });
  }

  async function copyComparisonLink() {
    try {
      const url = comparisonUrl(left.slug, right.slug);
      await navigator.clipboard.writeText(url.toString());
      setFeedback("已复制当前两种译本的对读链接。链接只记录版本代号，不包含阅读内容。");
      trackEvent("scripture_comparison_link_copied", {
        comparison_id: "heart-sutra-chinese-expressions",
        left_content_id: left.canonRef,
        right_content_id: right.canonRef,
      });
    } catch {
      setFeedback("浏览器未允许复制；地址栏中的版本参数仍可直接分享。");
    }
  }

  return (
    <section className={styles.workbench} aria-labelledby="comparison-title" data-heart-sutra-comparison>
      <header className={styles.workbenchHeader}>
        <div>
          <p>异译对读台 · TEXTUAL COMPARISON</p>
          <h2 id="comparison-title">选两种表达，分别读完。</h2>
        </div>
        <p id="comparison-boundary">
          双栏只提供同屏阅读，不自动配对句子。行高、位置相近或共用词语，都不构成段落对应关系。
        </p>
      </header>

      <div className={styles.controls} aria-label="选择要并排阅读的文本表达">
        <label>
          <span>甲本</span>
          <select
            aria-label="甲本：左侧文本表达"
            aria-describedby="comparison-boundary"
            value={left.slug}
            onChange={(event) => setPair(event.target.value, right.slug, "select")}
          >
            {editions.map((edition) => (
              <option key={edition.slug} value={edition.slug} disabled={edition.slug === right.slug}>
                {edition.canonRef.replace("大正藏 ", "")} · {edition.translator}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.swap}
          onClick={() => setPair(right.slug, left.slug, "swap")}
          aria-label="交换甲本与乙本"
        >
          <ArrowLeftRight aria-hidden="true" />
          <span>交换</span>
        </button>

        <label>
          <span>乙本</span>
          <select
            aria-label="乙本：右侧文本表达"
            aria-describedby="comparison-boundary"
            value={right.slug}
            onChange={(event) => setPair(left.slug, event.target.value, "select")}
          >
            {editions.map((edition) => (
              <option key={edition.slug} value={edition.slug} disabled={edition.slug === left.slug}>
                {edition.canonRef.replace("大正藏 ", "")} · {edition.translator}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={styles.copy} onClick={copyComparisonLink}>
          {feedback.startsWith("已复制") ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          复制对读链接
        </button>
      </div>

      <div className={styles.readingKey}>
        <span><ScrollText aria-hidden="true" /> 点击行号回到该译本的原典上下文</span>
        <code>gbcr:work:prajnaparamita-hrdaya</code>
      </div>

      <p className={styles.witnessBoundary}>
        <strong>见证范围：</strong>行段数包含底本中的序、经题、责任题记、经文正文与附文；
        它说明保存范围，不用于比较译文长短。每栏的“跳到经文正文”只改变页内位置，不删改底本内容。
      </p>

      <p className={styles.feedback} role="status" aria-live="polite">{feedback}</p>

      <div className={styles.editionGrid} id="duidu-texts">
        <EditionPanel edition={left} side="left" />
        <EditionPanel edition={right} side="right" />
      </div>
    </section>
  );
}
