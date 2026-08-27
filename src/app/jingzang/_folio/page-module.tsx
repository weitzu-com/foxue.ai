import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookMarked } from "lucide-react";
import { ReaderHashRedirect } from "@/components/reader-hash-redirect";
import { ReaderHeader } from "@/components/reader-header";
import { ParallelEvidencePanel } from "@/components/parallel-evidence-panel";
import { SutraReadingSample } from "@/components/sutra-reading-sample";
import { getReadingFolioEdition } from "@/data/sutra-reading-editions";
import { folioCollectionLabel, getSutra, type Sutra } from "@/data/sutras";
import {
  buildLegacyAliasMap,
  buildJuanNavigation,
  CorpusAssetMissingError,
  getSutraFolio,
  getSutraReading,
  type ReaderNavigationItem,
} from "@/lib/corpus-reading";
import { getParallelEvidence } from "@/lib/parallel-evidence";
import { folioHref } from "@/lib/reader-routes";
import { absoluteUrl, buildPageJsonLd, buildPageMetadata, serializeJsonLd, siteOrigin } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ slug: string; folio: string }> };

export const revalidate = 86400;
export const dynamic = "force-static";

function buildPendingFolioMetadata(sutra: Sutra, item: ReaderNavigationItem) {
  return buildPageMetadata({
    title: `${sutra.title} · ${item.label}`,
    description: `${sutra.title}的稳定入口 ${item.label} 已登记，正文边缘资产仍在同步；版本、来源与引用网址保持不变。`,
    path: `/jingzang/${sutra.slug}/${item.key}`,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, folio: folioKey } = await params;
  const sutra = getSutra(slug);
  if (!sutra) return { title: "经典未找到" };
  let pendingMetadata: Metadata | undefined;
  try {
    const reading = await getSutraReading(sutra);
    const navigationItem = reading.navigation.find((item) => item.key === folioKey);
    if (!navigationItem) return { title: "版页未找到" };
    pendingMetadata = buildPendingFolioMetadata(sutra, navigationItem);
    const folio = await getSutraFolio(sutra, reading, folioKey);
    if (!folio) return pendingMetadata;
    const chaptered = sutra.readerMode === "bilara-chapter";
    const bilara = chaptered || sutra.readerMode === "bilara-sutta";
    const derge = sutra.readerMode === "derge-folio";
    const sat = sutra.readerMode === "sat-folio";
    const kokuyaku = sutra.readerMode === "kokuyaku-folio";
    const englishTranslation = sutra.readerMode === "english-translation-folio";
    const collection = folioCollectionLabel(sutra);
    const partialWitness = sutra.status.includes("见证 · 完整来源记录") || sutra.status === "残篇候选 · 完整来源记录";
    const originalLanguageLabel = derge
      ? "藏文原文"
      : sutra.language.includes("古汉")
        ? "古汉译原文"
        : sutra.language.startsWith("梵")
          ? "梵文原文"
          : sutra.language.includes("俗语")
            ? "俗语原文"
            : "巴利原文";
    const description = chaptered
      ? `${sutra.title}第 ${Number(folio.item.juan)} 品，${folio.item.label} 巴利原文。`
      : bilara
        ? `${sutra.title}第 ${Number(folio.item.juan)} 阅读页，${folio.item.label} ${partialWitness ? "局部见证" : originalLanguageLabel}。`
        : derge
          ? `${sutra.title}第 ${Number(folio.item.juan)} 函，德格 ${folio.item.label} 版页藏文原文。`
          : kokuyaku
            ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 品，1918 年文语国译。`
          : englishTranslation
            ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 品，1881 年 Max Müller 公版英译。`
          : sat
            ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 章，SAT 现代日译。`
          : `${sutra.title}卷 ${Number(folio.item.juan)}，${collection} ${folio.item.label} 版页原文。`;
    return buildPageMetadata({
      title: `${sutra.title} · ${folio.item.label}`,
      description,
      path: `/jingzang/${sutra.slug}/${folio.item.key}`,
    });
  } catch (error) {
    if (error instanceof CorpusAssetMissingError) {
      return pendingMetadata ?? { title: "正文资产待同步" };
    }
    throw error;
  }
}

function FolioPager({
  slug,
  previous,
  next,
  position,
  unit,
  currentLabel,
  scopeLabel,
}: {
  slug: string;
  previous?: ReaderNavigationItem;
  next?: ReaderNavigationItem;
  position: "top" | "bottom";
  unit: string;
  currentLabel: string;
  scopeLabel: string;
}) {
  return (
    <nav className={`reader-pager reader-pager--${position}`} aria-label={`经文${unit}导航`}>
      {previous ? (
        <Link href={folioHref(slug, previous.key)} prefetch={false} rel="prev">
          <ArrowLeft aria-hidden="true" size={16} />
          <span>上一{unit}<small>{previous.label}</small></span>
        </Link>
      ) : (
        <span className="reader-pager__edge">{scopeLabel}之首</span>
      )}
      <div>
        <span>当前{unit}</span>
        <strong>{currentLabel}</strong>
      </div>
      {next ? (
        <Link href={folioHref(slug, next.key)} prefetch={false} rel="next">
          <span>下一{unit}<small>{next.label}</small></span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      ) : (
        <span className="reader-pager__edge">{scopeLabel}之末</span>
      )}
    </nav>
  );
}

function CorpusAssetUnavailable({
  sutra,
  item,
  segmentCount,
}: {
  sutra: Sutra;
  item: ReaderNavigationItem;
  segmentCount: number;
}) {
  return (
    <div className="reader-index-layout">
      <section className="reader-index-lead">
        <BookMarked aria-hidden="true" />
        <p className="eyebrow">稳定入口已登记 · SOURCE ASSET PENDING</p>
        <h1>目录已就绪，正文资产仍在同步。</h1>
        <p>
          《{sutra.alternateTitle}》的版本、来源、稳定段落与当前页 {item.label} 已经进入全量登记册；
          但承载正文的不可变边缘对象尚未完成播种。这里不会用样本文本冒充全文，也不会把暂时缺失误报成不存在。
        </p>
        <dl className="reader-index-stats">
          <div><dt>文本表达</dt><dd>{sutra.canonRef}</dd></div>
          <div><dt>登记行段</dt><dd>{segmentCount}</dd></div>
        </dl>
        <a className="button-primary" href={sutra.sourceUrl} target="_blank" rel="noreferrer">
          在权威来源阅读 <ArrowUpRight aria-hidden="true" size={16} />
        </a>
        <Link className="source-outlink" href={`/jingzang/${sutra.slug}`}>
          <ArrowLeft aria-hidden="true" size={14} /> 返回文本目录
        </Link>
      </section>

      <aside className="reader-meta reader-index-meta">
        <p className="eyebrow">版本与来源边界</p>
        <dl>
          <div><dt>当前入口</dt><dd>{item.label}</dd></div>
          <div><dt>语言</dt><dd>{sutra.language}</dd></div>
          <div><dt>责任者</dt><dd>{sutra.translator}</dd></div>
          <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
          <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
          <div><dt>状态</dt><dd>目录可用 · 正文边缘资产待播种</dd></div>
        </dl>
        <p className="reader-meta__caution">
          来源恢复后，同一稳定网址会直接显示正文，无需更换引用链接。
        </p>
      </aside>
    </div>
  );
}

export default async function SutraFolioPage({ params }: PageProps) {
  const { slug, folio: folioKey } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();
  const reading = await getSutraReading(sutra);
  const navigationItem = reading.navigation.find((item) => item.key === folioKey);
  if (!navigationItem) notFound();
  const folio = await getSutraFolio(sutra, reading, folioKey);
  if (!folio) {
    return (
      <CorpusAssetUnavailable
        sutra={sutra}
        item={navigationItem}
        segmentCount={reading.segmentCount}
      />
    );
  }
  const juanNavigation = buildJuanNavigation(reading.navigation);
  const currentJuanNavigation = folio.item.juan
    ? reading.navigation.filter((item) => item.juan === folio.item.juan)
    : reading.navigation;
  const chaptered = sutra.readerMode === "bilara-chapter";
  const bilara = chaptered || sutra.readerMode === "bilara-sutta";
  const derge = sutra.readerMode === "derge-folio";
  const sat = sutra.readerMode === "sat-folio";
  const kokuyaku = sutra.readerMode === "kokuyaku-folio";
  const englishTranslation = sutra.readerMode === "english-translation-folio";
  const translationChapter = sat || kokuyaku || englishTranslation;
  const collection = folioCollectionLabel(sutra);
  const partialWitness = sutra.status.includes("见证 · 完整来源记录") || sutra.status === "残篇候选 · 完整来源记录";
  const partialHeading = sutra.status.replace(" · 完整来源记录", " · 完整来源分页");
  const groupUnit = chaptered ? "品" : bilara ? "阅读页" : derge ? "函" : translationChapter ? "章" : "卷";
  const originalLanguageLabel = kokuyaku
    ? "文语国译"
    : englishTranslation
    ? "公版英译"
    : sat
    ? "现代日译"
    : derge
    ? "藏文原文"
    : sutra.language.includes("古汉")
      ? "古汉译原文"
    : sutra.language.startsWith("梵")
    ? "梵文原文"
    : sutra.language.includes("俗语")
      ? "俗语原文"
      : "巴利原文";
  const textLanguage = sat || kokuyaku
    ? "ja"
    : englishTranslation
    ? "en"
    : derge
    ? "bo-Tibt"
    : sutra.language.startsWith("梵")
    ? "sa-Latn"
    : sutra.language.includes("俗语")
      ? "pra-Latn"
      : bilara
        ? sutra.language.includes("古汉") ? "zh-Hant" : "pi-Latn"
        : "zh-Hant";
  const currentHeading = chaptered
    ? `第 ${Number(folio.item.juan)} 品 · ${folio.item.label}`
    : bilara
      ? `第 ${Number(folio.item.juan)} 阅读页 · ${folio.item.label}`
      : derge
        ? `第 ${Number(folio.item.juan)} 函 · 德格 ${folio.item.label}`
        : kokuyaku
          ? `第 ${Number(String(folio.item.label).replace(/^c/, ""))} 品 · 國譯`
        : englishTranslation
          ? `第 ${Number(String(folio.item.label).replace(/^c/, ""))} 品 · 英譯`
        : sat
          ? `第 ${Number(String(folio.item.label).replace(/^c/, ""))} 章 · SAT日譯`
        : `卷 ${Number(folio.item.juan)} · ${collection} ${folio.item.label}`;
  const readingEdition = getReadingFolioEdition({
    slug: sutra.slug,
    folioKey: folio.item.key,
    title: sutra.title,
    alternateTitle: sutra.alternateTitle,
    translator: sutra.translator,
    language: sutra.language,
    folioLabel: folio.item.label,
    segments: folio.segments,
    hasNext: Boolean(folio.next),
    readerMode: sutra.readerMode,
  });
  const pageUnit = chaptered
    ? "品"
    : bilara
      ? "阅读页"
      : kokuyaku
        ? "品"
        : englishTranslation
          ? "品"
        : sat
          ? "章"
          : "版页";
  const readerScopeLabel = chaptered
    ? "品集"
    : bilara
      ? partialWitness ? "见证" : "全经"
      : derge
        ? "藏文本"
        : kokuyaku
          ? "国译"
          : englishTranslation
            ? "英译"
          : sat
            ? "日译"
            : "全经";
  const corpusScopeLabel = bilara
    ? partialWitness
      ? "局部见证"
      : /律藏|论藏|毗昙/.test(sutra.tradition)
        ? "全书"
        : "全经"
    : "全经";
  const readingStatusLabel = chaptered
    ? "完整巴利原文 · 分品阅读"
    : bilara
      ? partialWitness
        ? partialHeading
        : `完整${originalLanguageLabel} · 稳定分页`
      : derge
        ? "完整藏文原文 · 德格版页"
        : englishTranslation
          ? "完整公版英译 · 分品阅读"
        : partialWitness
          ? partialHeading
          : "完整原文 · 分页阅读";
  const currentJuanIndex = Math.max(
    0,
    juanNavigation.findIndex((group) => group.juan === folio.item.juan),
  );
  const useNearbyDirectory = juanNavigation.length > 48;
  const nearbyDirectoryStart = Math.max(
    0,
    Math.min(currentJuanIndex - 4, juanNavigation.length - 9),
  );
  const directoryJuanNavigation = useNearbyDirectory
    ? juanNavigation.slice(nearbyDirectoryStart, nearbyDirectoryStart + 9)
    : juanNavigation;
  const description = chaptered
    ? `${sutra.title}第 ${Number(folio.item.juan)} 品，${folio.item.label} 巴利原文。`
    : bilara
      ? `${sutra.title}第 ${Number(folio.item.juan)} 阅读页，${folio.item.label} ${partialWitness ? "局部见证" : originalLanguageLabel}。`
      : derge
        ? `${sutra.title}第 ${Number(folio.item.juan)} 函，德格 ${folio.item.label} 版页藏文原文。`
        : kokuyaku
          ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 品，1918 年文语国译。`
        : englishTranslation
          ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 品，1881 年 Max Müller 公版英译。`
        : sat
          ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 章，SAT 现代日译。`
        : `${sutra.title}卷 ${Number(folio.item.juan)}，${collection} ${folio.item.label} 版页原文。`;
  const url = absoluteUrl(`/jingzang/${sutra.slug}/${folio.item.key}`);
  const workUrl = absoluteUrl(`/jingzang/${sutra.slug}`);
  const pageJsonLdBase = buildPageJsonLd({
    path: `/jingzang/${sutra.slug}/${folio.item.key}`,
    title: `${sutra.title} · ${folio.item.label}`,
    description,
    breadcrumb: [
      { name: "首页", path: "/" },
      { name: "经藏目录", path: "/jingzang" },
      { name: sutra.alternateTitle, path: `/jingzang/${sutra.slug}` },
      { name: currentHeading, path: `/jingzang/${sutra.slug}/${folio.item.key}` },
    ],
    about: [sutra.canonRef, sutra.tradition, currentHeading],
    mainEntityId: `${url}#folio`,
  });
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
      {
        "@type": "DigitalDocument",
        "@id": `${url}#folio`,
        url,
        name: `${sutra.title} · ${currentHeading}`,
        description,
        inLanguage: textLanguage,
        isPartOf: { "@id": `${workUrl}#work` },
        publisher: { "@id": `${siteOrigin}/#organization` },
        identifier: folio.item.id,
        isBasedOn: sutra.sourceUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <ReaderHeader sutra={sutra} currentLabel={currentHeading} />
      <ReaderHashRedirect
        slug={sutra.slug}
        currentFolio={folio.item.key}
        aliases={buildLegacyAliasMap(reading.segments)}
        segmentFolios={reading.segmentFolios}
        segmentFolioRanges={reading.segmentFolioRanges}
      />

      <div className="reader-layout">
        <SutraReadingSample
          folioLabel={folio.item.label}
          edition={readingEdition}
          segments={folio.segments}
          sourceName={sutra.sourceName}
          sourceUrl={sutra.sourceUrl}
          sourceLicense={sutra.sourceLicense}
          canonRef={sutra.canonRef}
          totalSegmentCount={reading.segmentCount}
          corpusScopeLabel={corpusScopeLabel}
          readingStatusLabel={readingStatusLabel}
          scopeNote={partialWitness
            ? "来源文件完整保存，但正文只作为局部、节译、后分、短本或残篇见证，不冒充完整母作品或完整译本。"
            : undefined}
          bibliographicNote={sutra.bibliographicNote}
          attributionNote={sutra.attributionNote}
          parallelEvidence={getParallelEvidence(sutra.slug) ? <ParallelEvidencePanel slug={sutra.slug} /> : undefined}
          directory={{
            indexHref: `/jingzang/${sutra.slug}`,
            indexLabel: `返回文本目录：《${sutra.alternateTitle}》`,
            summaryLabel: juanNavigation.length > 1
              ? `${groupUnit}目录 · ${juanNavigation.length} ${groupUnit}`
              : undefined,
            title: chaptered
              ? "分品目录"
              : bilara
                ? "阅读目录"
                : derge
                  ? "函页目录"
                  : kokuyaku
                    ? "国译品次"
                    : sat
                      ? "日译章节"
                      : "卷页目录",
            currentLabel: currentHeading,
            groupsLabel: useNearbyDirectory ? `附近${groupUnit}目` : `全经${groupUnit}目`,
            pagesLabel: chaptered
              ? "当前品阅读页"
              : bilara
                ? "当前阅读页"
                : derge
                  ? "当前函版页"
                  : kokuyaku
                    ? "当前品"
                    : sat
                      ? "当前章"
                      : "当前卷版页",
            groupsNote: useNearbyDirectory
              ? `为保持页面轻快，仅显示当前附近 9 ${groupUnit}；全文共 ${juanNavigation.length} ${groupUnit}，完整目录请返回文本目录。`
              : undefined,
            groups: directoryJuanNavigation.map((group) => ({
              key: group.juan ?? group.first.key,
              href: folioHref(sutra.slug, group.first.key),
              label: chaptered
                ? `第 ${Number(group.juan)} 品`
                : bilara
                  ? `第 ${Number(group.juan)} 阅读页`
                  : derge
                    ? `第 ${Number(group.juan)} 函`
                    : kokuyaku
                      ? `第 ${Number(group.juan)} 品`
                      : sat
                        ? `第 ${Number(group.juan)} 章`
                        : `卷 ${Number(group.juan)}`,
              meta: `${group.pages} ${bilara ? "项" : "页"}`,
              current: group.juan === folio.item.juan,
            })),
            pages: currentJuanNavigation.map((item, index) => ({
              key: item.key,
              href: folioHref(sutra.slug, item.key),
              label: chaptered
                ? `本品 ${String(index + 1).padStart(2, "0")}`
                : bilara
                  ? `第 ${Number(item.juan)} 阅读页`
                  : derge
                    ? `德格 ${item.label}`
                    : kokuyaku
                      ? `第 ${Number(item.juan)} 品`
                      : sat
                        ? `第 ${Number(item.juan)} 章`
                        : `第 ${String(index + 1).padStart(2, "0")} 页`,
              meta: item.label,
              current: item.key === folio.item.key,
            })),
          }}
          topNavigation={(
            <FolioPager
              slug={sutra.slug}
              previous={folio.previous}
              next={folio.next}
              position="top"
              unit={pageUnit}
              currentLabel={currentHeading}
              scopeLabel={readerScopeLabel}
            />
          )}
          bottomNavigation={(
            <FolioPager
              slug={sutra.slug}
              previous={folio.previous}
              next={folio.next}
              position="bottom"
              unit={pageUnit}
              currentLabel={currentHeading}
              scopeLabel={readerScopeLabel}
            />
          )}
        />
      </div>
    </>
  );
}
