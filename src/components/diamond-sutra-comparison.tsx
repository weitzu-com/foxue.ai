"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  ScrollText,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import styles from "./diamond-sutra-comparison.module.css";

export type DiamondSutraPassageSegment = {
  id: string;
  text: string;
  sourceHref: string;
};

export type DiamondSutraComparisonEdition = {
  slug: string;
  title: string;
  alternateTitle: string;
  canonRef: string;
  translator: string;
  language: string;
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  status: string;
  attributionNote?: string;
  bibliographicNote?: string;
  folioCount: number;
  segmentCount: number;
  passages: Record<string, DiamondSutraPassageSegment[]>;
};

export type DiamondSutraComparisonLocus = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  question: string;
  readingNote: string;
};

const DEFAULT_LEFT = "jingangjing";
const DEFAULT_RIGHT = "taisho-t0239";
const DEFAULT_LOCUS = "question";

function comparisonUrl(left: string, right: string, locus: string) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ left, right, locus }).toString();
  url.hash = "";
  return url;
}

function shortEditionLabel(edition: DiamondSutraComparisonEdition) {
  if (edition.slug === "gutenberg-en-diamond-gemmell") return "Gemmell 1912 · English";
  return `${edition.canonRef.replace("大正藏 ", "")} · ${edition.translator}`;
}

function sourceLineLabel(segmentId: string) {
  const label = segmentId.split(".").at(-1) ?? segmentId;
  return label.startsWith("s000000") ? label.slice(-4, -2) : label;
}

function EditionExcerpt({
  edition,
  locus,
  side,
}: {
  edition: DiamondSutraComparisonEdition;
  locus: DiamondSutraComparisonLocus;
  side: "left" | "right";
}) {
  const segments = edition.passages[locus.id] ?? [];
  const titleId = `diamond-${side}-title`;
  const language = edition.language === "English" ? "en" : "zh-Hant";

  return (
    <article
      className={styles.edition}
      aria-labelledby={titleId}
      data-comparison-edition={edition.slug}
      data-comparison-side={side}
      data-passage-locus={locus.id}
    >
      <header className={styles.editionHeader}>
        <div className={styles.sideMark} aria-hidden="true">{side === "left" ? "甲" : "乙"}</div>
        <div className={styles.editionIdentity}>
          <p><span>{edition.language}</span>{edition.canonRef}</p>
          <h3 id={titleId}>{edition.title}</h3>
          <small>{edition.translator}</small>
        </div>
        <a
          className={styles.fullTextLink}
          href={`/jingzang/${edition.slug}`}
          data-analytics-event="comparison_source_opened"
          data-analytics-content-id={edition.canonRef}
        >
          全本 <ExternalLink aria-hidden="true" />
        </a>
      </header>

      <div className={styles.excerptMeta}>
        <span>{locus.number} / {locus.eyebrow}</span>
        <span>{segments.length} 个原典行段</span>
      </div>

      <ol className={styles.lines} aria-label={`${edition.alternateTitle}：${locus.title}`} lang={language}>
        {segments.map((segment) => (
          <li key={segment.id}>
            <a
              href={segment.sourceHref}
              className={styles.locator}
              aria-label={`打开原典 ${segment.id}`}
              title={`回到 ${segment.id}`}
              data-analytics-event="comparison_segment_opened"
              data-analytics-content-id={segment.id}
            >
              <span>{sourceLineLabel(segment.id)}</span>
              <ScrollText aria-hidden="true" />
            </a>
            <p>{segment.text}</p>
          </li>
        ))}
      </ol>

      <footer className={styles.editionFooter}>
        <dl>
          <div><dt>完整见证</dt><dd>{edition.folioCount} 页组 · {edition.segmentCount} 行段</dd></div>
          <div><dt>读取状态</dt><dd>{edition.status}</dd></div>
        </dl>
        {(edition.attributionNote || edition.bibliographicNote) && (
          <details>
            <summary>版本与署名边界</summary>
            {edition.attributionNote && <p><strong>署名：</strong>{edition.attributionNote}</p>}
            {edition.bibliographicNote && <p><strong>书目：</strong>{edition.bibliographicNote}</p>}
          </details>
        )}
        <div className={styles.sourceLine}>
          <span>{edition.sourceLicense}</span>
          <a href={edition.sourceUrl} target="_blank" rel="noreferrer">
            {edition.sourceName} <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </footer>
    </article>
  );
}

export function DiamondSutraComparison({
  editions,
  loci,
}: {
  editions: DiamondSutraComparisonEdition[];
  loci: DiamondSutraComparisonLocus[];
}) {
  const editionsBySlug = useMemo(
    () => new Map(editions.map((edition) => [edition.slug, edition])),
    [editions],
  );
  const lociById = useMemo(() => new Map(loci.map((locus) => [locus.id, locus])), [loci]);
  const [leftSlug, setLeftSlug] = useState(DEFAULT_LEFT);
  const [rightSlug, setRightSlug] = useState(DEFAULT_RIGHT);
  const [locusId, setLocusId] = useState(DEFAULT_LOCUS);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedLeft = params.get("left");
    const requestedRight = params.get("right");
    const requestedLocus = params.get("locus");
    if (
      requestedLeft
      && requestedRight
      && requestedLeft !== requestedRight
      && editionsBySlug.has(requestedLeft)
      && editionsBySlug.has(requestedRight)
      && requestedLocus
      && lociById.has(requestedLocus)
    ) {
      const timeout = window.setTimeout(() => {
        setLeftSlug(requestedLeft);
        setRightSlug(requestedRight);
        setLocusId(requestedLocus);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [editionsBySlug, lociById]);

  const left = editionsBySlug.get(leftSlug) ?? editions[0];
  const right = editionsBySlug.get(rightSlug) ?? editions[1];
  const locus = lociById.get(locusId) ?? loci[0];
  const locusIndex = loci.findIndex((item) => item.id === locus.id);

  function updateUrl(nextLeft: string, nextRight: string, nextLocus: string) {
    window.history.replaceState(null, "", comparisonUrl(nextLeft, nextRight, nextLocus));
  }

  function setPair(nextLeft: string, nextRight: string, action: "select" | "swap") {
    if (nextLeft === nextRight) return;
    setLeftSlug(nextLeft);
    setRightSlug(nextRight);
    setFeedback("");
    updateUrl(nextLeft, nextRight, locus.id);
    trackEvent("scripture_comparison_changed", {
      comparison_id: "diamond-sutra-reading-loci",
      left_content_id: editionsBySlug.get(nextLeft)?.canonRef ?? nextLeft,
      right_content_id: editionsBySlug.get(nextRight)?.canonRef ?? nextRight,
      locus_id: locus.id,
      action,
    });
  }

  function chooseLocus(nextLocusId: string) {
    const nextLocus = lociById.get(nextLocusId);
    if (!nextLocus) return;
    setLocusId(nextLocusId);
    setFeedback("");
    updateUrl(left.slug, right.slug, nextLocusId);
    trackEvent("scripture_comparison_locus_opened", {
      comparison_id: "diamond-sutra-reading-loci",
      left_content_id: left.canonRef,
      right_content_id: right.canonRef,
      locus_id: nextLocusId,
    });
  }

  async function copyComparisonLink() {
    try {
      const url = comparisonUrl(left.slug, right.slug, locus.id);
      await navigator.clipboard.writeText(url.toString());
      setFeedback("已复制当前版本与阅读关口；链接不包含经文或个人笔记。");
      trackEvent("scripture_comparison_link_copied", {
        comparison_id: "diamond-sutra-reading-loci",
        left_content_id: left.canonRef,
        right_content_id: right.canonRef,
        locus_id: locus.id,
      });
    } catch {
      setFeedback("浏览器未允许复制；地址栏中的版本与关口参数仍可直接分享。");
    }
  }

  return (
    <section className={styles.workbench} aria-labelledby="diamond-comparison-title" data-diamond-sutra-comparison>
      <header className={styles.workbenchHeader}>
        <div>
          <p>主题对读台 · PASSAGE CONCORDANCE</p>
          <h2 id="diamond-comparison-title">先选问题，<br />再看诸译如何展开。</h2>
        </div>
        <p id="diamond-comparison-boundary">
          每个关口只是经文导航窗口：证明这些话分别出现在哪里，不证明左右行段逐句等值，也不替代完整上下文。
        </p>
      </header>

      <div className={styles.controls} aria-label="选择两个文本表达">
        <label>
          <span>甲本</span>
          <select
            aria-label="甲本：左侧文本表达"
            aria-describedby="diamond-comparison-boundary"
            value={left.slug}
            onChange={(event) => setPair(event.target.value, right.slug, "select")}
          >
            {editions.map((edition) => (
              <option key={edition.slug} value={edition.slug} disabled={edition.slug === right.slug}>
                {shortEditionLabel(edition)}
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
        </button>

        <label>
          <span>乙本</span>
          <select
            aria-label="乙本：右侧文本表达"
            aria-describedby="diamond-comparison-boundary"
            value={right.slug}
            onChange={(event) => setPair(left.slug, event.target.value, "select")}
          >
            {editions.map((edition) => (
              <option key={edition.slug} value={edition.slug} disabled={edition.slug === left.slug}>
                {shortEditionLabel(edition)}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={styles.copy} onClick={copyComparisonLink}>
          {feedback.startsWith("已复制") ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          复制此关口
        </button>
      </div>

      <div className={styles.identityLine}>
        <span><Fingerprint aria-hidden="true" /> 同一作品的七种文本表达</span>
        <code>gbcr:work:vajracchedika-prajnaparamita</code>
      </div>

      <nav className={styles.locusRail} aria-label="七个关键阅读关口">
        {loci.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => chooseLocus(item.id)}
            aria-current={item.id === locus.id ? "step" : undefined}
          >
            <span>{item.number}</span>
            <strong>{item.title}</strong>
            <small>{item.eyebrow}</small>
          </button>
        ))}
      </nav>

      <section className={styles.locusIntro} aria-labelledby="active-locus-title">
        <div className={styles.locusNumber} aria-hidden="true">{locus.number}</div>
        <div>
          <p>{locus.eyebrow}</p>
          <h3 id="active-locus-title">{locus.title}</h3>
        </div>
        <blockquote>{locus.question}</blockquote>
        <p className={styles.readingNote}>{locus.readingNote}</p>
      </section>

      <p className={styles.feedback} role="status" aria-live="polite">{feedback}</p>

      <div className={styles.editionGrid}>
        <EditionExcerpt edition={left} locus={locus} side="left" />
        <div className={styles.notEqual} aria-hidden="true"><span>≠</span><small>未逐句对齐</small></div>
        <EditionExcerpt edition={right} locus={locus} side="right" />
      </div>

      <footer className={styles.locusFooter}>
        <button
          type="button"
          onClick={() => chooseLocus(loci[Math.max(0, locusIndex - 1)].id)}
          disabled={locusIndex === 0}
        >
          <ArrowLeft aria-hidden="true" /> 上一关口
        </button>
        <span>{locusIndex + 1} / {loci.length}</span>
        <button
          type="button"
          onClick={() => chooseLocus(loci[Math.min(loci.length - 1, locusIndex + 1)].id)}
          disabled={locusIndex === loci.length - 1}
        >
          下一关口 <ArrowRight aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
