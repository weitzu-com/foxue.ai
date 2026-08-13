import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, Layers3 } from "lucide-react";
import { ReaderHashRedirect } from "@/components/reader-hash-redirect";
import { ReaderJuanSelect } from "@/components/reader-juan-select";
import { ParallelEvidencePanel } from "@/components/parallel-evidence-panel";
import { getSutra } from "@/data/sutras";
import { buildJuanNavigation, buildLegacyAliasMap, getSutraReading } from "@/lib/corpus-reading";
import { buildSegmentFolioMap, buildSegmentFolioRanges, folioHref } from "@/lib/reader-routes";

type PageProps = { params: Promise<{ slug: string }> };

export default async function SutraIndexPage({ params }: PageProps) {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();
  const reading = await getSutraReading(sutra);
  const firstFolio = reading.navigation[0];
  const juanNavigation = buildJuanNavigation(reading.navigation);
  const multiJuan = juanNavigation.length > 1;
  const useCompactJuanSelector = juanNavigation.length > 200;
  const chaptered = sutra.readerMode === "bilara-chapter";
  const bilara = chaptered || sutra.readerMode === "bilara-sutta";
  const partialWitness = sutra.status.includes("见证 · 完整来源记录") || sutra.status === "残篇候选 · 完整来源记录";
  const sourceRecordLabel = sutra.status.replace(" · 完整来源记录", "");
  const bilaraCorpusUnit = /律藏|论藏/.test(sutra.tradition) ? "全书" : "全经";

  return (
    <>
      <ReaderHashRedirect
        slug={sutra.slug}
        aliases={buildLegacyAliasMap(reading.segments)}
        segmentFolios={sutra.readerMode === "bilara-sutta" ? buildSegmentFolioMap(reading.segments) : undefined}
        segmentFolioRanges={sutra.readerMode === "bilara-sutta" ? buildSegmentFolioRanges(reading.segments) : undefined}
      />

      <div className="reader-index-layout">
        <section className="reader-index-lead">
          <Layers3 aria-hidden="true" />
          <p className="eyebrow">文本目录 · READING EDITION</p>
          <h2>{chaptered ? <>按品次，<br />展开一部经典。</> : bilara ? <>按阅读单元，<br />展开一部文本。</> : <>按卷与版页，<br />展开一部经典。</>}</h2>
          <p>
            {chaptered
              ? "每个阅读页只加载一品或大品的一部分，Bilara 原生段落标识保持可引用。不同传本的对应关系只有通过审核后才会加入。"
              : bilara
                ? "全经按原生段落次序确定性分页，每页最多 120 段。Bilara 标识原样保留，未加入未经审核的译文或跨本对齐。"
              : "每页只加载一个大正藏版页，稳定行号依然可引用。这使长经也能快速阅读，并为未来数千部经典留出空间。"}
          </p>
          <dl className="reader-index-stats">
            <div><dt>{chaptered ? "品" : bilara ? "阅读页" : "版页"}</dt><dd>{chaptered ? juanNavigation.length : reading.navigation.length}</dd></div>
            <div><dt>{bilara ? "稳定段落" : "稳定行段"}</dt><dd>{reading.segmentCount}</dd></div>
          </dl>
          {firstFolio && (
            <Link className="button-primary" href={folioHref(sutra.slug, firstFolio.key)}>
              <BookOpenText aria-hidden="true" size={17} /> 从第一页开始
            </Link>
          )}
        </section>

        <section className="reader-folio-directory" aria-labelledby="folio-directory-title">
          <div className="reader-folio-directory__heading">
            <div>
              <p className="eyebrow">{chaptered ? "品次目录" : bilara ? "阅读目录" : "卷页目录"}</p>
              <h2 id="folio-directory-title">{chaptered ? "二十六品，次第展开" : bilara ? "原生段落，次第展开" : (multiJuan ? "先选卷，再读版页" : "大正藏物理版页")}</h2>
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
                      <strong>{chaptered ? `第 ${Number(group.first.juan)} 品` : bilara ? `第 ${Number(group.first.juan)} 阅读页` : (multiJuan ? `卷 ${Number(group.first.juan)}` : `大正藏 ${group.first.label}`)}</strong>
                      <small>
                        {bilara
                          ? group.first.label
                          : multiJuan
                          ? `${group.pages} 个版页 · 从大正藏 ${group.first.label} 开始`
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
            <div><dt>{bilara ? "目录" : "经号"}</dt><dd>{sutra.canonRef}</dd></div>
            <div><dt>语言</dt><dd>{sutra.language}</dd></div>
            <div><dt>{bilara ? "版本" : "译者"}</dt><dd>{sutra.translator}</dd></div>
            <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
            <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
            <div><dt>收录</dt><dd>{reading.segmentCount} 个稳定段落 · {bilara ? `${bilaraCorpusUnit}完整 Bilara JSON` : partialWitness ? `完整来源 TEI · ${sourceRecordLabel}` : "完整 TEI"}</dd></div>
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
