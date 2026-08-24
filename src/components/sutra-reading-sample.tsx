import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookMarked, BookOpenText, ChevronDown, Languages } from "lucide-react";
import type { SutraSegment } from "@/data/sutras";
import {
  getReadingSegmentRole,
  type ReadingFolioEdition,
} from "@/data/sutra-reading-editions";
import { SutraReaderPreferences } from "@/components/sutra-reader-preferences";
import { pinyinForBuddhistText } from "@/lib/buddhist-pinyin.mjs";
import styles from "./sutra-reading-sample.module.css";

type InlinePiece = {
  key: string;
  text: string;
  segment?: SutraSegment;
};

type SpecialBlock = { key: string; kind: "heading" | "byline" | "colophon"; pieces: InlinePiece[] };
type ReadingBlock = SpecialBlock | { key: string; kind: "paragraph"; sentences: InlinePiece[][] };
type ReadingDirectoryItem = {
  key: string;
  href: string;
  label: string;
  meta: string;
  current: boolean;
};

type ReadingDirectory = {
  indexHref: string;
  indexLabel: string;
  title: string;
  currentLabel: string;
  groupsLabel: string;
  pagesLabel: string;
  groupsNote?: string;
  groups: ReadingDirectoryItem[];
  pages: ReadingDirectoryItem[];
};

const sentenceEnding = /[。！？；」』]$/u;

function displayTextForSegment(segment: SutraSegment, edition: ReadingFolioEdition) {
  return edition.textOverrides?.[segment.sourceLine ?? ""] ?? segment.text;
}

function splitSegmentIntoPieces(segment: SutraSegment, edition: ReadingFolioEdition) {
  const displayText = displayTextForSegment(segment, edition);
  const chunks = displayText.match(/.*?[。！？；」』]|.+$/gu) ?? [displayText];
  return chunks.map((text, index): InlinePiece => ({
    key: `${segment.id}-${index}`,
    text,
    segment: index === 0 ? segment : undefined,
  }));
}

function buildReadingBlocks(segments: SutraSegment[], edition: ReadingFolioEdition) {
  const blocks: ReadingBlock[] = [];
  let currentSentence: InlinePiece[] = [];
  let currentParagraph: InlinePiece[][] = [];
  let paragraphCharacters = 0;

  const flushParagraph = () => {
    if (currentSentence.length > 0) {
      currentParagraph.push(currentSentence);
      currentSentence = [];
    }
    if (currentParagraph.length > 0) {
      blocks.push({
        key: `paragraph-${blocks.length}`,
        kind: "paragraph",
        sentences: currentParagraph,
      });
    }
    currentParagraph = [];
    paragraphCharacters = 0;
  };

  for (const segment of segments) {
    const role = getReadingSegmentRole(edition, segment);
    if (role === "registration") continue;

    if (role === "heading" || role === "byline" || role === "colophon") {
      flushParagraph();
      const piece: InlinePiece = {
        key: segment.id,
        text: displayTextForSegment(segment, edition),
        segment,
      };
      const previousBlock = blocks.at(-1);
      if (previousBlock?.kind === role) previousBlock.pieces.push(piece);
      else blocks.push({ key: `${role}-${segment.id}`, kind: role, pieces: [piece] } satisfies SpecialBlock);
      continue;
    }

    if (edition.annotationMode === "plain") {
      const piece: InlinePiece = {
        key: segment.id,
        text: displayTextForSegment(segment, edition),
        segment,
      };
      currentParagraph.push([piece]);
      paragraphCharacters += [...piece.text].length;
      if (currentParagraph.length >= 3 || paragraphCharacters >= 360) flushParagraph();
      continue;
    }

    for (const piece of splitSegmentIntoPieces(segment, edition)) {
      currentSentence.push(piece);
      paragraphCharacters += [...piece.text].length;
      if (!sentenceEnding.test(piece.text)) continue;

      currentParagraph.push(currentSentence);
      currentSentence = [];
      if (currentParagraph.length >= 2 || paragraphCharacters >= 88) flushParagraph();
    }
  }

  flushParagraph();
  return blocks;
}

function PinyinText({ text, idPrefix }: { text: string; idPrefix: string }) {
  const syllables = pinyinForBuddhistText(text);

  return syllables.map((syllable, index) => (
    syllable.isZh ? (
      <ruby className={styles.ruby} key={`${idPrefix}-${index}`}>
        <span>{syllable.origin}</span>
        <rt aria-hidden="true">{syllable.result}</rt>
      </ruby>
    ) : (
      <span className={styles.punctuation} key={`${idPrefix}-${index}`}>
        {syllable.origin}
      </span>
    )
  ));
}

function SourceAnchor({ segment, children }: { segment: SutraSegment; children: ReactNode }) {
  return (
    <>
      {segment.legacyIds?.map((legacyId) => (
        <span className={styles.legacyAnchor} id={legacyId} aria-hidden="true" key={legacyId} />
      ))}
      <span
        className={styles.sourceAnchor}
        id={segment.id}
        data-line={segment.sourceLine?.slice(-2)}
      >
        <span className={styles.sourceTextEquivalent} aria-hidden="true">{segment.text}</span>
        {children}
      </span>
    </>
  );
}

function ReadingPiece({
  piece,
  annotationMode,
}: {
  piece: InlinePiece;
  annotationMode: ReadingFolioEdition["annotationMode"];
}) {
  const content = annotationMode === "pinyin"
    ? <PinyinText text={piece.text} idPrefix={piece.key} />
    : <span className={styles.plainText}>{piece.text}</span>;

  if (!piece.segment) return content;

  return (
    <>
      <SourceAnchor segment={piece.segment}>{content}</SourceAnchor>
      {piece.segment.note && (
        <span className={styles.segmentNote}>
          <span>边注</span>
          {piece.segment.note}
        </span>
      )}
    </>
  );
}

function ReadingDirectoryPanel({ directory }: { directory: ReadingDirectory }) {
  return (
    <details className={styles.readingDirectory}>
      <summary>
        <span className={styles.directoryTitle}>
          <BookMarked aria-hidden="true" size={18} />
          {directory.title}
        </span>
        <span className={styles.directoryCurrent}>
          {directory.currentLabel}
          <ChevronDown aria-hidden="true" size={17} />
        </span>
      </summary>
      <div className={styles.directoryContent}>
        {directory.groups.length > 1 && (
          <nav aria-label={directory.groupsLabel}>
            <p>{directory.groupsLabel}</p>
            <div className={styles.directoryGrid}>
              {directory.groups.map((item) => (
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={item.current ? "location" : undefined}
                  key={item.key}
                >
                  <span>{item.label}</span>
                  <small>{item.meta}</small>
                </Link>
              ))}
            </div>
            {directory.groupsNote && <small className={styles.directoryNote}>{directory.groupsNote}</small>}
          </nav>
        )}
        <nav aria-label={directory.pagesLabel}>
          <p>{directory.pagesLabel}</p>
          <div className={styles.directoryGrid}>
            {directory.pages.map((item) => (
              <Link
                href={item.href}
                prefetch={false}
                aria-current={item.current ? "page" : undefined}
                key={item.key}
              >
                <span>{item.label}</span>
                <small>{item.meta}</small>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </details>
  );
}

export function SutraReadingSample({
  folioLabel,
  edition,
  segments,
  sourceName,
  sourceUrl,
  sourceLicense,
  canonRef,
  totalSegmentCount,
  corpusScopeLabel,
  readingStatusLabel,
  bibliographicNote,
  attributionNote,
  parallelEvidence,
  directory,
  topNavigation,
  bottomNavigation,
}: {
  folioLabel: string;
  edition: ReadingFolioEdition;
  segments: SutraSegment[];
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  canonRef: string;
  totalSegmentCount: number;
  corpusScopeLabel: string;
  readingStatusLabel: string;
  bibliographicNote?: string;
  attributionNote?: string;
  parallelEvidence?: ReactNode;
  directory: ReadingDirectory;
  topNavigation: ReactNode;
  bottomNavigation: ReactNode;
}) {
  const blocks = buildReadingBlocks(segments, edition);
  const registration = segments.find(
    (segment) => getReadingSegmentRole(edition, segment) === "registration",
  )?.text;
  const visibleSegmentCount = segments.filter(
    (segment) => getReadingSegmentRole(edition, segment) !== "registration",
  ).length;
  const titleLength = [...edition.documentTitle].length;
  const titleScale = titleLength > 18
    ? "very-long"
    : titleLength > 10
      ? "long"
      : "standard";
  const isPinyin = edition.annotationMode === "pinyin";
  const isCbeta = edition.sourceKind === "cbeta";
  const isDerge = edition.sourceKind === "derge";
  const isSat = edition.sourceKind === "sat";
  const isKokuyaku = edition.sourceKind === "wikisource";
  const segmentUnit = isCbeta || isDerge || isSat || isKokuyaku ? "行" : "段";
  const stableSegmentUnit = isCbeta || isDerge || isSat || isKokuyaku ? "行段" : "段落";
  const textLanguageLabel = isPinyin
    ? "汉文"
    : isDerge
      ? "藏文"
      : isSat || isKokuyaku
        ? "日文"
        : edition.contentLanguage === "sa-Latn"
          ? "梵文"
          : edition.contentLanguage === "pra-Latn"
            ? "俗语"
            : "巴利文";
  const folioLabelTitle = isCbeta
    ? "藏经版页"
    : isDerge
      ? "德格版页"
      : isSat || isKokuyaku
        ? "当前章节"
        : "当前阅读页";
  const plainNotice = isDerge
    ? {
        title: "忠实保留藏文原典。",
        body: "藏文 Unicode NFD、德格版页次序与稳定行号保持不变；不加入机器译文。",
      }
    : isSat
      ? {
          title: "忠实保留现代日译。",
          body: "SAT 章节次序、译者署名与 CC BY 4.0 来源边界保持不变。",
        }
      : isKokuyaku
        ? {
            title: "忠实保留文语国译。",
            body: "1918 年国译品次、责任署名与公有领域来源边界保持不变。",
          }
      : edition.contentLanguage === "sa-Latn"
        ? {
            title: "忠实保留梵文原典。",
            body: "拉丁转写、原生次序与稳定段落标识保持不变；不加入机器译文。",
          }
        : edition.contentLanguage === "pra-Latn"
          ? {
              title: "忠实保留俗语原典。",
              body: "拉丁转写、原生次序与稳定段落标识保持不变；不加入机器译文。",
            }
          : {
              title: "忠实保留巴利原典。",
              body: "Bilara 段落标识与原生次序保持不变；不加入机器译文或未经审核的跨本对齐。",
            };
  const sourceIntegrityNote = isCbeta
    ? "本页仅重组显示层；正文底本、藏经页栏行号与旧链接均未改动，重复题签仅在显示层合并。"
    : isDerge
      ? "本页仅重组显示层；藏文 NFD、德格木刻版页与稳定行号均未改动。"
      : isSat
        ? "本页仅重组显示层；SAT 现代日译、章节次序、译者署名与稳定行号均未改动。"
        : isKokuyaku
          ? "本页仅重组显示层；1918 年文语国译、品次、责任署名与稳定行号均未改动。"
        : "本页仅重组显示层；原文、原生次序与 Bilara 段落标识均未改动。";

  return (
    <article
      className={styles.paper}
      data-reading-sample
      data-annotation-mode={edition.annotationMode}
    >
      <div className={styles.topNavigation}>{topNavigation}</div>
      <header className={styles.masthead}>
        <Link
          className={styles.mastheadBackLink}
          href={directory.indexHref}
          prefetch={false}
        >
          <ArrowLeft aria-hidden="true" size={15} />
          {directory.indexLabel}
        </Link>
        <div className={styles.mastheadLead}>
          <div>
            <div className={styles.mastheadKicker}>
              <span>{edition.workLabel}</span>
              <span>{edition.editionLabel}</span>
              <span>{readingStatusLabel}</span>
            </div>
            <h2 data-title-scale={titleScale}>{edition.documentTitle}</h2>
            <p>{edition.description}</p>
          </div>
          {edition.primaryAction && (
            <Link className={styles.primaryAction} href={edition.primaryAction.href}>
              <span>
                <strong>{edition.primaryAction.label}</strong>
                <small>{edition.primaryAction.meta}</small>
              </span>
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          )}
        </div>
        <dl className={styles.readingFacts}>
          <div><dt>本页内容</dt><dd>{edition.documentKind}</dd></div>
          <div><dt>{folioLabelTitle}</dt><dd>{folioLabel}</dd></div>
          <div><dt>可引用原文</dt><dd>{visibleSegmentCount} {segmentUnit}</dd></div>
          <div><dt>全文规模</dt><dd>{corpusScopeLabel} {totalSegmentCount} 稳定{stableSegmentUnit}</dd></div>
          <div><dt>正文语种</dt><dd>{textLanguageLabel}</dd></div>
          <div><dt>权利</dt><dd>{sourceLicense}</dd></div>
        </dl>
      </header>

      <ReadingDirectoryPanel directory={directory} />

      <SutraReaderPreferences showPinyinControl={isPinyin}>
        <div className={styles.pinyinNotice} id="pinyin-reading-note">
          {isPinyin
            ? <Languages aria-hidden="true" size={18} />
            : <BookOpenText aria-hidden="true" size={18} />}
          {isPinyin ? (
            <p><strong>拼音用于辅助诵读。</strong>全库汉文经书已启用佛教词表基础校音；音译词与多音字仍需逐部人工终审。</p>
          ) : (
            <p><strong>{plainNotice.title}</strong>{plainNotice.body}</p>
          )}
        </div>

        <div
          className={styles.readingBody}
          data-corpus-content="sutra-segment"
          lang={edition.contentLanguage}
          aria-describedby="pinyin-reading-note"
        >
          {blocks.map((block) => {
            if (block.kind === "paragraph") {
              return (
                <p className={`${styles.readingParagraph} sutra-segment`} key={block.key}>
                  {block.sentences.map((sentence, sentenceIndex) => (
                    <span className={styles.sentence} key={`${block.key}-${sentenceIndex}`}>
                      {sentence.map((piece) => (
                        <ReadingPiece piece={piece} annotationMode={edition.annotationMode} key={piece.key} />
                      ))}
                    </span>
                  ))}
                </p>
              );
            }
            if (block.kind === "heading") {
              return (
                <h2 className={`${styles.sectionHeading} sutra-segment`} key={block.key}>
                  {block.pieces.map((piece) => (
                    <span className={styles.headingLine} key={piece.key}>
                      <ReadingPiece piece={piece} annotationMode={edition.annotationMode} />
                    </span>
                  ))}
                </h2>
              );
            }
            if (block.kind === "colophon") {
              return (
                <p className={`${styles.colophon} sutra-segment`} key={block.key}>
                  {block.pieces.map((piece) => (
                    <ReadingPiece piece={piece} annotationMode={edition.annotationMode} key={piece.key} />
                  ))}
                </p>
              );
            }
            return (
              <p className={`${styles.byline} sutra-segment`} key={block.key}>
                {block.pieces.map((piece) => (
                  <ReadingPiece piece={piece} annotationMode={edition.annotationMode} key={piece.key} />
                ))}
              </p>
            );
          })}
          <div className={styles.closingMark} aria-hidden="true">{edition.closingMark}</div>
        </div>
      </SutraReaderPreferences>

      <details className={styles.sourceDetails}>
        <summary>
          <span><BookOpenText aria-hidden="true" size={18} /> 版本与引用信息</span>
          <ChevronDown aria-hidden="true" size={17} />
        </summary>
        <div>
          <p>
            母版来自 <a href={sourceUrl} target="_blank" rel="noreferrer">{sourceName}</a>。
            {sourceIntegrityNote}
            权利说明：{sourceLicense}。
          </p>
          <dl>
            <div><dt>责任者</dt><dd>{edition.responsibility}</dd></div>
            <div><dt>{isCbeta ? "经号" : "目录"}</dt><dd>{registration ?? canonRef}</dd></div>
            <div><dt>{folioLabelTitle}</dt><dd>{folioLabel}</dd></div>
            <div>
              <dt>{isPinyin ? "拼音" : "显示"}</dt>
              <dd>{isPinyin ? "自动生成·佛教词表校正·待人工终审" : `${plainNotice.title.replace("。", "")}·未添加机器译文`}</dd>
            </div>
          </dl>
        </div>
      </details>
      {(bibliographicNote || attributionNote || parallelEvidence) && (
        <section className={styles.researchContext} aria-label="书目、归属与跨传统证据">
          {(bibliographicNote || attributionNote) && (
            <div className={styles.contextNotes}>
              <p className={styles.contextEyebrow}>研究边界</p>
              {bibliographicNote && (
                <p><strong>书目关系边界：</strong>{bibliographicNote}</p>
              )}
              {attributionNote && (
                <p><strong>归属边界：</strong>{attributionNote}</p>
              )}
            </div>
          )}
          {parallelEvidence}
        </section>
      )}
      <div className={styles.bottomNavigation}>{bottomNavigation}</div>
    </article>
  );
}
