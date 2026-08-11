import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, Layers3 } from "lucide-react";
import { ReaderHashRedirect } from "@/components/reader-hash-redirect";
import { ReaderJuanSelect } from "@/components/reader-juan-select";
import { getSutra } from "@/data/sutras";
import { buildJuanNavigation, buildLegacyAliasMap, getSutraReading } from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";

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
  const bilara = sutra.readerMode === "bilara-chapter";

  return (
    <>
      <ReaderHashRedirect
        slug={sutra.slug}
        aliases={buildLegacyAliasMap(reading.segments)}
      />

      <div className="reader-index-layout">
        <section className="reader-index-lead">
          <Layers3 aria-hidden="true" />
          <p className="eyebrow">经本目录 · READING EDITION</p>
          <h2>{bilara ? <>按品次，<br />展开一部经。</> : <>按卷与版页，<br />展开一部经。</>}</h2>
          <p>
            {bilara
              ? "每个阅读页只加载一品或大品的一部分，Bilara 原生段落标识保持可引用。不同传本的对应关系只有通过审核后才会加入。"
              : "每页只加载一个大正藏版页，稳定行号依然可引用。这使长经也能快速阅读，并为未来数千部经典留出空间。"}
          </p>
          <dl className="reader-index-stats">
            <div><dt>{bilara ? "品" : "版页"}</dt><dd>{bilara ? juanNavigation.length : reading.navigation.length}</dd></div>
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
              <p className="eyebrow">{bilara ? "品次目录" : "卷页目录"}</p>
              <h2 id="folio-directory-title">{bilara ? "二十六品，次第展开" : (multiJuan ? "先选卷，再读版页" : "大正藏物理版页")}</h2>
            </div>
            <span>{bilara ? `${juanNavigation.length} 品 · 423 偈` : (multiJuan ? `${juanNavigation.length} 卷 · ${reading.navigation.length} 页` : `${reading.navigation.length} 页`)}</span>
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
                      <strong>{bilara ? `第 ${Number(group.first.juan)} 品` : (multiJuan ? `卷 ${Number(group.first.juan)}` : `大正藏 ${group.first.label}`)}</strong>
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
            <div><dt>收录</dt><dd>{reading.segmentCount} 个稳定段落 · {bilara ? "完整 Bilara JSON" : "完整 TEI"}</dd></div>
          </dl>
          <p className="reader-meta__caution">
            引用、研究或再分发前，请以来源网站最新授权说明为准。
          </p>
        </aside>
      </div>
    </>
  );
}
