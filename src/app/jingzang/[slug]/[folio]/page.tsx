import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookMarked, Link2 } from "lucide-react";
import { ReaderHashRedirect } from "@/components/reader-hash-redirect";
import { ReaderJuanSelect } from "@/components/reader-juan-select";
import { getSutra } from "@/data/sutras";
import {
  buildLegacyAliasMap,
  buildJuanNavigation,
  getSutraFolio,
  getSutraReading,
  type ReaderNavigationItem,
} from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";

type PageProps = { params: Promise<{ slug: string; folio: string }> };

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, folio: folioKey } = await params;
  const sutra = getSutra(slug);
  if (!sutra) return { title: "经典未找到" };
  const reading = await getSutraReading(sutra);
  const folio = await getSutraFolio(sutra, reading, folioKey);
  if (!folio) return { title: "版页未找到" };
  const chaptered = sutra.readerMode === "bilara-chapter";
  const bilara = chaptered || sutra.readerMode === "bilara-sutta";
  return {
    title: `${sutra.alternateTitle} · ${folio.item.label}`,
    description: chaptered
      ? `${sutra.title}第 ${Number(folio.item.juan)} 品，${folio.item.label} 巴利原文。`
      : bilara
        ? `${sutra.title}第 ${Number(folio.item.juan)} 阅读页，${folio.item.label} 巴利原文。`
      : `${sutra.title}卷 ${Number(folio.item.juan)}，大正藏 ${folio.item.label} 版页原文。`,
    alternates: { canonical: `/jingzang/${sutra.slug}/${folio.item.key}` },
  };
}

function FolioPager({
  slug,
  current,
  previous,
  next,
  position,
  bilara,
  chaptered,
}: {
  slug: string;
  current: ReaderNavigationItem;
  previous?: ReaderNavigationItem;
  next?: ReaderNavigationItem;
  position: "top" | "bottom";
  bilara: boolean;
  chaptered: boolean;
}) {
  const unit = chaptered ? "品" : bilara ? "阅读页" : "版页";
  return (
    <nav className={`reader-pager reader-pager--${position}`} aria-label={`经文${unit}导航`}>
      {previous ? (
        <Link href={folioHref(slug, previous.key)} rel="prev">
          <ArrowLeft aria-hidden="true" size={16} />
          <span>上一{unit}<small>{previous.label}</small></span>
        </Link>
      ) : (
        <span className="reader-pager__edge">{chaptered ? "品集之首" : bilara ? "全经之首" : "卷首"}</span>
      )}
      <div>
        <span>当前{unit}</span>
        <strong>{chaptered ? `第 ${Number(current.juan)} 品 · ${current.label}` : bilara ? `第 ${Number(current.juan)} 阅读页 · ${current.label}` : `卷 ${Number(current.juan)} · 大正藏 ${current.label}`}</strong>
      </div>
      {next ? (
        <Link href={folioHref(slug, next.key)} rel="next">
          <span>下一{unit}<small>{next.label}</small></span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      ) : (
        <span className="reader-pager__edge">{chaptered ? "品集之末" : bilara ? "全经之末" : "卷末"}</span>
      )}
    </nav>
  );
}

export default async function SutraFolioPage({ params }: PageProps) {
  const { slug, folio: folioKey } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();
  const reading = await getSutraReading(sutra);
  const folio = await getSutraFolio(sutra, reading, folioKey);
  if (!folio) notFound();
  const juanNavigation = buildJuanNavigation(reading.navigation);
  const currentJuanNavigation = folio.item.juan
    ? reading.navigation.filter((item) => item.juan === folio.item.juan)
    : reading.navigation;
  const useCompactJuanSelector = juanNavigation.length > 200;
  const currentJuanGroup = juanNavigation.find((group) => group.juan === folio.item.juan);
  const chaptered = sutra.readerMode === "bilara-chapter";
  const bilara = chaptered || sutra.readerMode === "bilara-sutta";
  const partialWitness = sutra.status.includes("见证 · 完整来源记录") || sutra.status === "残篇候选 · 完整来源记录";
  const partialHeading = sutra.status.replace(" · 完整来源记录", " · 完整来源分页");
  const groupUnit = chaptered ? "品" : bilara ? "阅读页" : "卷";

  return (
    <>
      <ReaderHashRedirect
        slug={sutra.slug}
        currentFolio={folio.item.key}
        aliases={buildLegacyAliasMap(reading.segments)}
      />

      <div className="reader-layout">
        <aside className="reader-toc">
          <p className="eyebrow">{chaptered ? "品目录" : bilara ? "阅读目录" : "版页目录"}</p>
          <Link className="reader-toc__index-link" href={`/jingzang/${sutra.slug}`}>
            <ArrowLeft aria-hidden="true" size={13} /> 返回经本目录
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
                        {chaptered ? `第 ${Number(group.juan)} 品` : bilara ? `第 ${Number(group.juan)} 阅读页` : `卷 ${Number(group.juan)}`} <span>{group.pages} {bilara ? "项" : "页"}</span>
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
                  {bilara ? item.label : (juanNavigation.length > 1 ? item.label : `卷 ${Number(item.juan)} · ${item.label}`)}
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
          />
          <div className="sutra-paper__notice">
            <BookMarked aria-hidden="true" />
            <p>
              <strong>{chaptered ? "完整巴利原文 · 分品阅读" : bilara ? "完整巴利原文 · 稳定分页" : partialWitness ? partialHeading : "完整原文 · 分页阅读"}</strong>　
              {chaptered
                ? `当前仅加载第 ${Number(folio.item.juan)} 品；保留 Bilara 原生段落标识，未加入未经审核的译文或跨本对齐。`
                : bilara
                  ? `当前仅加载第 ${Number(folio.item.juan)} 阅读页；保留 Bilara 原生段落标识，每页最多 120 段。`
                : partialWitness
                  ? `当前仅加载大正藏 ${folio.item.label} 版页；来源文件完整保存，但正文只作为节译、后分或残篇见证，不计作完整作品译本。`
                  : `当前仅加载大正藏 ${folio.item.label} 版页；异文与注释未混入正文，稳定行号可直接引用。`}
            </p>
          </div>
          {folio.segments.map((segment, index) => (
            <section className="sutra-segment" id={segment.id} key={segment.id}>
              {segment.legacyIds?.map((legacyId) => (
                <span className="legacy-anchor" id={legacyId} aria-hidden="true" key={legacyId} />
              ))}
              <div className="segment-number">{segment.sourceLine ?? String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="segment-text" lang={bilara ? "pi" : "zh-Hant"}>{segment.text}</p>
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
          />
        </article>

        <aside className="reader-meta">
          <p className="eyebrow">版本与权利</p>
          <dl>
            <div><dt>当前</dt><dd>{chaptered ? `第 ${Number(folio.item.juan)} 品 · ${folio.item.label}` : bilara ? `第 ${Number(folio.item.juan)} 阅读页 · ${folio.item.label}` : `卷 ${Number(folio.item.juan)} · 大正藏 ${folio.item.label}`}</dd></div>
            <div><dt>{bilara ? "目录" : "经号"}</dt><dd>{sutra.canonRef}</dd></div>
            <div><dt>语言</dt><dd>{sutra.language}</dd></div>
            <div><dt>{bilara ? "版本" : "译者"}</dt><dd>{sutra.translator}</dd></div>
            <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
            <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
            <div>
              <dt>{chaptered ? "本品" : "本页"}</dt>
              <dd>{bilara
                ? `${folio.segments.length} 段 · 全经 ${reading.segmentCount} 稳定段落`
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
        </aside>
      </div>
    </>
  );
}
