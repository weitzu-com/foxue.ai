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
          <h2>按卷与版页，<br />展开一部经。</h2>
          <p>
            每页只加载一个大正藏版页，稳定行号依然可引用。
            这使长经也能快速阅读，并为未来数千部经典留出空间。
          </p>
          <dl className="reader-index-stats">
            <div><dt>版页</dt><dd>{reading.navigation.length}</dd></div>
            <div><dt>稳定行段</dt><dd>{reading.segmentCount}</dd></div>
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
              <p className="eyebrow">卷页目录</p>
              <h2 id="folio-directory-title">{multiJuan ? "先选卷，再读版页" : "大正藏物理版页"}</h2>
            </div>
            <span>{multiJuan ? `${juanNavigation.length} 卷 · ${reading.navigation.length} 页` : `${reading.navigation.length} 页`}</span>
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
                      <strong>{multiJuan ? `卷 ${Number(group.first.juan)}` : `大正藏 ${group.first.label}`}</strong>
                      <small>
                        {multiJuan
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
            <div><dt>经号</dt><dd>{sutra.canonRef}</dd></div>
            <div><dt>语言</dt><dd>{sutra.language}</dd></div>
            <div><dt>译者</dt><dd>{sutra.translator}</dd></div>
            <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
            <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
            <div><dt>收录</dt><dd>{reading.segmentCount} 个稳定行段 · 完整 TEI</dd></div>
          </dl>
          <p className="reader-meta__caution">
            引用、研究或再分发前，请以来源网站最新授权说明为准。
          </p>
        </aside>
      </div>
    </>
  );
}
