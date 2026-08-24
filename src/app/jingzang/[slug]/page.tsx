import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, Layers3 } from "lucide-react";
import { ReaderHashRedirect } from "@/components/reader-hash-redirect";
import { ReaderHeader } from "@/components/reader-header";
import { ReaderJuanSelect } from "@/components/reader-juan-select";
import { ParallelEvidencePanel } from "@/components/parallel-evidence-panel";
import { folioCollectionLabel, getSutra, isChineseLibraryLanguage } from "@/data/sutras";
import {
  buildCatalogJuanNavigation,
  buildCatalogLegacyAliasMap,
  getSutraCatalogView,
  getWorkCatalogLedger,
} from "@/lib/corpus-folio-index";
import { loadWorkCatalogShardForTrace } from "@/lib/corpus-work-catalog-nft.generated";
import { folioHref } from "@/lib/reader-routes";
import { absoluteUrl, buildPageJsonLd, serializeJsonLd, siteOrigin } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";

export default async function SutraIndexPage({ params }: PageProps) {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();
  const shardId = getWorkCatalogLedger().slugToShard[slug];
  if (Number.isSafeInteger(shardId)) await loadWorkCatalogShardForTrace(shardId);
  const catalog = await getSutraCatalogView(sutra.slug);
  if (!catalog) notFound();
  const reading = {
    navigation: catalog.navigation,
    segmentCount: catalog.segmentCount,
    segments: sutra.segments,
  };
  const firstFolio = reading.navigation[0];
  const juanNavigation = buildCatalogJuanNavigation(reading.navigation);
  const multiJuan = juanNavigation.length > 1;
  const useCompactJuanSelector = juanNavigation.length > 200;
  const chaptered = sutra.readerMode === "bilara-chapter";
  const bilara = chaptered || sutra.readerMode === "bilara-sutta";
  const derge = sutra.readerMode === "derge-folio";
  const sat = sutra.readerMode === "sat-folio";
  const partialWitness = sutra.status.includes("见证 · 完整来源记录") || sutra.status === "残篇候选 · 完整来源记录";
  const sourceRecordLabel = sutra.status.replace(" · 完整来源记录", "");
  const bilaraCorpusUnit = /律藏|论藏|毗昙/.test(sutra.tradition) ? "全书" : "全经";
  const description = `${sutra.title}：${sutra.summary}`;
  const url = absoluteUrl(`/jingzang/${sutra.slug}`);
  const schemaLanguage = derge
    ? "bo-Tibt"
    : sutra.language.includes("古汉") || isChineseLibraryLanguage(sutra.language)
      ? "zh-Hant"
      : sutra.language.startsWith("梵")
        ? "sa-Latn"
        : sutra.language.includes("俗语")
          ? "pra-Latn"
          : sutra.language.includes("日")
            ? "ja"
            : "pi-Latn";
  const pageJsonLdBase = buildPageJsonLd({
    path: `/jingzang/${sutra.slug}`,
    title: sutra.title,
    description,
    type: "CollectionPage",
    breadcrumb: [
      { name: "首页", path: "/" },
      { name: "经藏目录", path: "/jingzang" },
      { name: sutra.alternateTitle, path: `/jingzang/${sutra.slug}` },
    ],
    about: [sutra.canonRef, sutra.tradition, sutra.language],
    mainEntityId: `${url}#work`,
  });
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        url,
        name: sutra.title,
        alternateName: sutra.alternateTitle,
        description: sutra.summary,
        inLanguage: schemaLanguage,
        isPartOf: { "@id": `${siteOrigin}/#website` },
        publisher: { "@id": `${siteOrigin}/#organization` },
        identifier: sutra.canonRef,
        author: { "@type": "Organization", name: sutra.sourceName },
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
      <ReaderHeader sutra={sutra} />
      <ReaderHashRedirect
        slug={sutra.slug}
        aliases={buildCatalogLegacyAliasMap(reading.segments)}
        segmentFolios={catalog.segmentFolios}
        segmentFolioRanges={catalog.segmentFolioRanges}
      />

      <div className="reader-index-layout">
        <section className="reader-index-lead">
          <Layers3 aria-hidden="true" />
          <p className="eyebrow">文本目录 · READING EDITION</p>
          <h2>{chaptered ? <>按品次，<br />展开一部经典。</> : bilara ? <>按阅读单元，<br />展开一部文本。</> : derge ? <>按函与木刻版页，<br />展开一部藏文经典。</> : sat ? <>按章次，<br />展开一部现代日译。</> : <>按卷与版页，<br />展开一部经典。</>}</h2>
          <p>
            {chaptered
              ? "每个阅读页只加载一品或大品的一部分，Bilara 原生段落标识保持可引用。不同传本的对应关系只有通过审核后才会加入。"
              : bilara
                ? `${partialWitness ? "已发布的局部见证" : "文本"}按原生段落次序确定性分页，每页最多 120 段。Bilara 标识原样保留，未加入未经审核的译文或跨本对齐。`
                : derge
                  ? "每页只加载一个德格木刻版页；藏文 NFD 原样保存，稳定行号同时编码德格目录号、函号、版页、行号与重复序号。"
                  : sat
                    ? "每页只加载 SAT 现代日译的一章。CC BY 4.0，署名 SAT大蔵経テキストデータベース研究会与具名译者。日译挂接已持有汉文佛说，不另建作品。"
                : `每页只加载一个${folioCollectionLabel(sutra)}版页，稳定行号依然可引用。这使长经也能快速阅读，并为未来数千部经典留出空间。`}
          </p>
          <dl className="reader-index-stats">
            <div><dt>{chaptered ? "品" : bilara ? "阅读页" : "版页"}</dt><dd>{chaptered ? juanNavigation.length : reading.navigation.length}</dd></div>
            <div><dt>{bilara ? "稳定段落" : "稳定行段"}</dt><dd>{reading.segmentCount}</dd></div>
          </dl>
          {firstFolio && (
            <Link className="button-primary" href={folioHref(sutra.slug, firstFolio.key)} prefetch={false}>
              <BookOpenText aria-hidden="true" size={17} /> 从第一页开始
            </Link>
          )}
        </section>

        <section className="reader-folio-directory" aria-labelledby="folio-directory-title">
          <div className="reader-folio-directory__heading">
            <div>
              <p className="eyebrow">{chaptered ? "品次目录" : bilara ? "阅读目录" : derge ? "函页目录" : "卷页目录"}</p>
              <h2 id="folio-directory-title">{chaptered ? "二十六品，次第展开" : bilara ? "原生段落，次第展开" : derge ? (multiJuan ? "先选函，再读德格版页" : "德格物理版页") : (multiJuan ? "先选卷，再读版页" : `${folioCollectionLabel(sutra)}物理版页`)}</h2>
            </div>
            <span>{chaptered ? `${juanNavigation.length} 品 · 423 偈` : bilara ? `${reading.navigation.length} 阅读页 · ${reading.segmentCount} 段` : (multiJuan ? `${juanNavigation.length} 卷 · ${reading.navigation.length} 页` : `${reading.navigation.length} 页`)}</span>
          </div>
          {useCompactJuanSelector ? (
            <ReaderJuanSelect
              slug={sutra.slug}
              items={juanNavigation.map((group) => ({
                key: group.first.key,
                juan: group.juan,
                pages: group.pages,
              }))}
            />
          ) : (
            <ol className="reader-folio-grid">
              {(multiJuan ? juanNavigation : reading.navigation.map((item) => ({ first: item, pages: 1 }))).map((group, index) => (
                <li key={group.first.key}>
                  <Link href={folioHref(sutra.slug, group.first.key)} prefetch={false}>
                    <span className="reader-folio-card__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="reader-folio-card__label">
                      <strong>{chaptered ? `第 ${Number(group.first.juan)} 品` : bilara ? `第 ${Number(group.first.juan)} 阅读页` : derge ? (multiJuan ? `第 ${Number(group.first.juan)} 函` : `德格 ${group.first.label}`) : (multiJuan ? `卷 ${Number(group.first.juan)}` : `${folioCollectionLabel(sutra)} ${group.first.label}`)}</strong>
                      <small>
                        {bilara
                          ? group.first.label
                          : derge
                          ? (multiJuan ? `${group.pages} 个版页 · 从德格 ${group.first.label} 开始` : `第 ${Number(group.first.juan)} 函 · ${group.first.id}`)
                          : multiJuan
                          ? `${group.pages} 个版页 · 从${folioCollectionLabel(sutra)} ${group.first.label} 开始`
                          : `单卷 · ${group.first.id.split(".").at(-1)}`}
                      </small>
                    </span>
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="reader-meta reader-index-meta">
          <p className="eyebrow">版本与权利</p>
          <dl>
            <div><dt>{bilara || derge ? "目录" : "经号"}</dt><dd>{sutra.canonRef}</dd></div>
            <div><dt>语言</dt><dd>{sutra.language}</dd></div>
            <div><dt>{bilara ? "版本" : derge ? "译责" : "译者"}</dt><dd>{sutra.translator}</dd></div>
            <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
            <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
            <div><dt>收录</dt><dd>{reading.segmentCount} 个稳定段落 · {bilara ? (partialWitness ? `完整来源 JSON · ${sourceRecordLabel}` : `${bilaraCorpusUnit}完整 Bilara JSON`) : derge ? "完整 Public Domain 藏文切片" : partialWitness ? `完整来源 TEI · ${sourceRecordLabel}` : "完整 TEI"}</dd></div>
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
