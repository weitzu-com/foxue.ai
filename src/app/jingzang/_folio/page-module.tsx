import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookMarked, Link2 } from "lucide-react";
import { ReaderHashRedirect } from "@/components/reader-hash-redirect";
import { ReaderHeader } from "@/components/reader-header";
import { ReaderJuanSelect } from "@/components/reader-juan-select";
import { ParallelEvidencePanel } from "@/components/parallel-evidence-panel";
import { folioCollectionLabel, getSutra } from "@/data/sutras";
import {
  buildLegacyAliasMap,
  buildJuanNavigation,
  CorpusAssetMissingError,
  getSutraFolio,
  getSutraReading,
  type ReaderNavigationItem,
} from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";
import { absoluteUrl, buildPageJsonLd, buildPageMetadata, serializeJsonLd, siteOrigin } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ slug: string; folio: string }> };

export const revalidate = 86400;
export const dynamic = "force-static";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, folio: folioKey } = await params;
  const sutra = getSutra(slug);
  if (!sutra) return { title: "经典未找到" };
  try {
    const reading = await getSutraReading(sutra);
    const folio = await getSutraFolio(sutra, reading, folioKey);
    if (!folio) return { title: "版页未找到" };
    const chaptered = sutra.readerMode === "bilara-chapter";
    const bilara = chaptered || sutra.readerMode === "bilara-sutta";
    const derge = sutra.readerMode === "derge-folio";
    const sat = sutra.readerMode === "sat-folio";
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
          : sat
            ? `${sutra.title}第 ${Number(String(folio.item.label).replace(/^c/, ""))} 章，SAT 现代日译。`
          : `${sutra.title}卷 ${Number(folio.item.juan)}，${collection} ${folio.item.label} 版页原文。`;
    return buildPageMetadata({
      title: `${sutra.title} · ${folio.item.label}`,
      description,
      path: `/jingzang/${sutra.slug}/${folio.item.key}`,
    });
  } catch (error) {
    if (error instanceof CorpusAssetMissingError) return { title: "版页未找到" };
    throw error;
  }
}

function FolioPager({
  slug,
  current,
  previous,
  next,
  position,
  bilara,
  chaptered,
  derge,
  collection,
  partialWitness,
}: {
  slug: string;
  current: ReaderNavigationItem;
  previous?: ReaderNavigationItem;
  next?: ReaderNavigationItem;
  position: "top" | "bottom";
  bilara: boolean;
  chaptered: boolean;
  derge: boolean;
  collection: string;
  partialWitness: boolean;
}) {
  const unit = chaptered ? "品" : bilara ? "阅读页" : "版页";
  return (
    <nav className={`reader-pager reader-pager--${position}`} aria-label={`经文${unit}导航`}>
      {previous ? (
        <Link href={folioHref(slug, previous.key)} prefetch={false} rel="prev">
          <ArrowLeft aria-hidden="true" size={16} />
          <span>上一{unit}<small>{previous.label}</small></span>
        </Link>
      ) : (
        <span className="reader-pager__edge">{chaptered ? "品集之首" : bilara ? (partialWitness ? "见证之首" : "全经之首") : derge ? "本经之首" : "卷首"}</span>
      )}
      <div>
        <span>当前{unit}</span>
        <strong>{chaptered ? `第 ${Number(current.juan)} 品 · ${current.label}` : bilara ? `第 ${Number(current.juan)} 阅读页 · ${current.label}` : derge ? `第 ${Number(current.juan)} 函 · 德格 ${current.label}` : `卷 ${Number(current.juan)} · ${collection} ${current.label}`}</strong>
      </div>
      {next ? (
        <Link href={folioHref(slug, next.key)} prefetch={false} rel="next">
          <span>下一{unit}<small>{next.label}</small></span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      ) : (
        <span className="reader-pager__edge">{chaptered ? "品集之末" : bilara ? (partialWitness ? "见证之末" : "全经之末") : derge ? "本经之末" : "卷末"}</span>
      )}
    </nav>
  );
}

export default async function SutraFolioPage({ params }: PageProps) {
  const { slug, folio: folioKey } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();
  let reading;
  let folio;
  try {
    reading = await getSutraReading(sutra);
    folio = await getSutraFolio(sutra, reading, folioKey);
  } catch (error) {
    if (error instanceof CorpusAssetMissingError) notFound();
    throw error;
  }
  if (!folio) notFound();
  const juanNavigation = buildJuanNavigation(reading.navigation);
  const currentJuanNavigation = folio.item.juan
    ? reading.navigation.filter((item) => item.juan === folio.item.juan)
    : reading.navigation;
  const useCompactJuanSelector = juanNavigation.length > 200;
  const currentJuanGroup = juanNavigation.find((group) => group.juan === folio.item.juan);
  const chaptered = sutra.readerMode === "bilara-chapter";
  const bilara = chaptered || sutra.readerMode === "bilara-sutta";
  const derge = sutra.readerMode === "derge-folio";
  const sat = sutra.readerMode === "sat-folio";
  const collection = folioCollectionLabel(sutra);
  const partialWitness = sutra.status.includes("见证 · 完整来源记录") || sutra.status === "残篇候选 · 完整来源记录";
  const partialHeading = sutra.status.replace(" · 完整来源记录", " · 完整来源分页");
  const groupUnit = chaptered ? "品" : bilara ? "阅读页" : derge ? "函" : sat ? "章" : "卷";
  const originalLanguageLabel = sat
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
  const textLanguage = sat
    ? "ja"
    : derge
    ? "bo-Tibt"
    : sutra.language.startsWith("梵")
    ? "sa-Latn"
    : sutra.language.includes("俗语")
      ? "pra-Latn"
      : bilara
        ? sutra.language.includes("古汉") ? "zh-Hant" : "pi-Latn"
        : "zh-Hant";
  const bilaraCorpusUnit = /律藏|论藏|毗昙/.test(sutra.tradition) ? "全书" : "全经";
  const currentHeading = chaptered
    ? `第 ${Number(folio.item.juan)} 品 · ${folio.item.label}`
    : bilara
      ? `第 ${Number(folio.item.juan)} 阅读页 · ${folio.item.label}`
      : derge
        ? `第 ${Number(folio.item.juan)} 函 · 德格 ${folio.item.label}`
        : sat
          ? `第 ${Number(String(folio.item.label).replace(/^c/, ""))} 章 · SAT日譯`
        : `卷 ${Number(folio.item.juan)} · ${collection} ${folio.item.label}`;
  const description = chaptered
    ? `${sutra.title}第 ${Number(folio.item.juan)} 品，${folio.item.label} 巴利原文。`
    : bilara
      ? `${sutra.title}第 ${Number(folio.item.juan)} 阅读页，${folio.item.label} ${partialWitness ? "局部见证" : originalLanguageLabel}。`
      : derge
        ? `${sutra.title}第 ${Number(folio.item.juan)} 函，德格 ${folio.item.label} 版页藏文原文。`
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
        <aside className="reader-toc">
          <p className="eyebrow">{chaptered ? "品目录" : bilara ? "阅读目录" : derge ? "函页目录" : "版页目录"}</p>
          <Link className="reader-toc__index-link" href={`/jingzang/${sutra.slug}`} prefetch={false}>
            <ArrowLeft aria-hidden="true" size={13} /> 返回文本目录
          </Link>
          {juanNavigation.length > 1 && (
            <>
              <p className="reader-toc__section-label">{groupUnit}目录 · {juanNavigation.length} {groupUnit}</p>
              {useCompactJuanSelector ? (
                <ReaderJuanSelect
                  slug={sutra.slug}
                  currentKey={currentJuanGroup?.first.key}
                  items={juanNavigation.map((group) => ({
                    key: group.first.key,
                    juan: group.juan,
                    pages: group.pages,
                  }))}
                />
              ) : (
                <ol className="reader-toc__juan-list">
                  {juanNavigation.map((group) => (
                    <li key={group.juan}>
                      <Link
                        href={folioHref(sutra.slug, group.first.key)}
                        prefetch={false}
                        aria-current={group.juan === folio.item.juan ? "location" : undefined}
                      >
                        {chaptered ? `第 ${Number(group.juan)} 品` : bilara ? `第 ${Number(group.juan)} 阅读页` : derge ? `第 ${Number(group.juan)} 函` : `卷 ${Number(group.juan)}`} <span>{group.pages} {bilara ? "项" : "页"}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
          <p className="reader-toc__section-label">
            {chaptered
              ? `当前品 · ${folio.item.label}`
              : bilara
                ? `当前阅读页 · ${folio.item.label}`
              : derge
                ? `当前版页 · 德格 ${folio.item.label}`
              : (juanNavigation.length > 1 ? `本卷版页 · ${currentJuanNavigation.length} 页` : "版页目录")}
          </p>
          <ol className="reader-toc__page-list">
            {currentJuanNavigation.map((item, index) => (
              <li key={item.key}>
                <Link
                  href={folioHref(sutra.slug, item.key)}
                  prefetch={false}
                  aria-current={item.key === folio.item.key ? "page" : undefined}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {bilara ? item.label : derge ? `德格 ${item.label}` : (juanNavigation.length > 1 ? item.label : `卷 ${Number(item.juan)} · ${item.label}`)}
                </Link>
              </li>
            ))}
          </ol>
          <a className="source-outlink" href={sutra.sourceUrl} target="_blank" rel="noreferrer">
            打开来源母版 <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        </aside>

        <article className="sutra-paper sutra-paper--complete">
          <FolioPager
            slug={sutra.slug}
            current={folio.item}
            previous={folio.previous}
            next={folio.next}
            position="top"
            bilara={bilara}
            chaptered={chaptered}
            derge={derge}
            collection={collection}
            partialWitness={partialWitness}
          />
          <div className="sutra-paper__notice">
            <BookMarked aria-hidden="true" />
            <p>
              <strong>{chaptered ? "完整巴利原文 · 分品阅读" : bilara ? (partialWitness ? partialHeading : `完整${originalLanguageLabel} · 稳定分页`) : derge ? "完整藏文原文 · 德格版页" : partialWitness ? partialHeading : "完整原文 · 分页阅读"}</strong>　
              {chaptered
                ? `当前仅加载第 ${Number(folio.item.juan)} 品；保留 Bilara 原生段落标识，未加入未经审核的译文或跨本对齐。`
                : bilara
                  ? partialWitness
                    ? `当前仅加载第 ${Number(folio.item.juan)} 阅读页；固定提交中的已发布来源文件完整保存，但这里只是母作品的局部见证。`
                    : `当前仅加载第 ${Number(folio.item.juan)} 阅读页；保留 Bilara 原生段落标识，每页最多 120 段。`
                : derge
                  ? `当前仅加载第 ${Number(folio.item.juan)} 函德格 ${folio.item.label} 版页；藏文 NFD、目录标记与异常页序保留在来源切片中，重复版页行以稳定序号区分。`
                : partialWitness
                  ? `当前仅加载${collection} ${folio.item.label} 版页；来源文件完整保存，但正文只作为局部、节译、后分、短本或残篇见证，不冒充完整母作品或完整译本。`
                  : `当前仅加载${collection} ${folio.item.label} 版页；异文与注释未混入正文，稳定行号可直接引用。`}
            </p>
          </div>
          {folio.segments.map((segment, index) => (
            <section className="sutra-segment" id={segment.id} key={segment.id}>
              {segment.legacyIds?.map((legacyId) => (
                <span className="legacy-anchor" id={legacyId} aria-hidden="true" key={legacyId} />
              ))}
              <div className="segment-number">{segment.sourceLine ?? String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="segment-text" lang={textLanguage}>{segment.text}</p>
                {segment.note && <p className="segment-note"><span>边注</span>{segment.note}</p>}
                <a className="segment-anchor" href={`#${segment.id}`}>
                  <Link2 aria-hidden="true" size={13} /> {segment.id}
                </a>
              </div>
            </section>
          ))}
          <FolioPager
            slug={sutra.slug}
            current={folio.item}
            previous={folio.previous}
            next={folio.next}
            position="bottom"
            bilara={bilara}
            chaptered={chaptered}
            derge={derge}
            collection={collection}
            partialWitness={partialWitness}
          />
        </article>

        <aside className="reader-meta">
          <p className="eyebrow">版本与权利</p>
          <dl>
            <div><dt>当前</dt><dd>{chaptered ? `第 ${Number(folio.item.juan)} 品 · ${folio.item.label}` : bilara ? `第 ${Number(folio.item.juan)} 阅读页 · ${folio.item.label}` : derge ? `第 ${Number(folio.item.juan)} 函 · 德格 ${folio.item.label}` : `卷 ${Number(folio.item.juan)} · ${collection} ${folio.item.label}`}</dd></div>
            <div><dt>{bilara || derge ? "目录" : "经号"}</dt><dd>{sutra.canonRef}</dd></div>
            <div><dt>语言</dt><dd>{sutra.language}</dd></div>
            <div><dt>{bilara ? "版本" : derge ? "译责" : "译者"}</dt><dd>{sutra.translator}</dd></div>
            <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
            <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
            <div>
              <dt>{chaptered ? "本品" : "本页"}</dt>
              <dd>{bilara
                ? `${folio.segments.length} 段 · ${partialWitness ? "局部见证" : bilaraCorpusUnit} ${reading.segmentCount} 稳定段落`
                : `${folio.segments.length} 行 · 全经 ${reading.segmentCount} 稳定行段`}</dd>
            </div>
          </dl>
          <p className="reader-meta__caution">
            引用、研究或再分发前，请以来源网站最新授权说明为准。
          </p>
          {sutra.bibliographicNote ? (
            <p className="reader-meta__caution"><strong>书目关系边界：</strong>{sutra.bibliographicNote}</p>
          ) : null}
          {sutra.attributionNote ? (
            <p className="reader-meta__caution"><strong>归属边界：</strong>{sutra.attributionNote}</p>
          ) : null}
          <ParallelEvidencePanel slug={sutra.slug} />
        </aside>
      </div>
    </>
  );
}
