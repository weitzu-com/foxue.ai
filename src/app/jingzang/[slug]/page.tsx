import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookMarked, CircleCheck, Link2 } from "lucide-react";
import { getSutra, sutras } from "@/data/sutras";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sutras.map((sutra) => ({ slug: sutra.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) return { title: "经典未找到" };
  return {
    title: sutra.alternateTitle,
    description: `${sutra.title}：${sutra.summary}`,
  };
}

export default async function SutraPage({ params }: PageProps) {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();

  return (
    <div className="reader-page page-shell">
      <div className="page-breadcrumb">
        <Link href="/jingzang"><ArrowLeft aria-hidden="true" size={15} /> 经藏</Link>
        <span>/</span>
        <span>{sutra.alternateTitle}</span>
      </div>

      <header className="reader-header">
        <div className="reader-header__mark" aria-hidden="true">经</div>
        <div className="reader-header__title">
          <p className="eyebrow">{sutra.tradition}</p>
          <h1>{sutra.title}</h1>
          <p>{sutra.alternateTitle} · {sutra.translator}</p>
        </div>
        <div className="reader-header__status">
          <span><CircleCheck aria-hidden="true" /> {sutra.status}</span>
          <span>{sutra.canonRef}</span>
        </div>
      </header>

      <div className="reader-layout">
        <aside className="reader-toc">
          <p className="eyebrow">本页段落</p>
          <ol>
            {sutra.segments.map((segment, index) => (
              <li key={segment.id}>
                <a href={`#${segment.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {segment.id}
                </a>
              </li>
            ))}
          </ol>
          <a className="source-outlink" href={sutra.sourceUrl} target="_blank" rel="noreferrer">
            打开来源母版 <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        </aside>

        <article className="sutra-paper">
          <div className="sutra-paper__notice">
            <BookMarked aria-hidden="true" />
            <p><strong>阅读样本</strong>　当前仅展示用于界面和引证验证的段落，不代表全经已收录。</p>
          </div>
          {sutra.segments.map((segment, index) => (
            <section className="sutra-segment" id={segment.id} key={segment.id}>
              <div className="segment-number">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="segment-text">{segment.text}</p>
                {segment.note && <p className="segment-note"><span>边注</span>{segment.note}</p>}
                <a className="segment-anchor" href={`#${segment.id}`}>
                  <Link2 aria-hidden="true" size={13} /> {segment.id}
                </a>
              </div>
            </section>
          ))}
        </article>

        <aside className="reader-meta">
          <p className="eyebrow">版本与权利</p>
          <dl>
            <div><dt>经号</dt><dd>{sutra.canonRef}</dd></div>
            <div><dt>语言</dt><dd>{sutra.language}</dd></div>
            <div><dt>译者</dt><dd>{sutra.translator}</dd></div>
            <div><dt>来源</dt><dd>{sutra.sourceName}</dd></div>
            <div><dt>权利</dt><dd>{sutra.sourceLicense}</dd></div>
          </dl>
          <p className="reader-meta__caution">
            引用、研究或再分发前，请以来源网站最新授权说明为准。
          </p>
        </aside>
      </div>
    </div>
  );
}
