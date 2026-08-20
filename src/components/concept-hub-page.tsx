import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  CircleAlert,
  Languages,
  Link2,
  ShieldCheck,
} from "lucide-react";
import type { ConceptHub } from "@/lib/concept-hubs";
import { getConceptEntry } from "@/lib/concept-hubs";
import { absoluteUrl, buildPageJsonLd, serializeJsonLd } from "@/lib/site-metadata";

export function ConceptHubPage({ hub }: { hub: ConceptHub }) {
  const conceptUrl = absoluteUrl(hub.entry.href);
  const conceptPageJsonLdBase = buildPageJsonLd({
    path: hub.entry.href,
    title: hub.metadataTitle,
    description: hub.description,
    breadcrumb: [
      { name: "首页", path: "/" },
      { name: "概念", path: "/gainian" },
      { name: hub.entry.title, path: hub.entry.href },
    ],
    about: hub.about,
    mainEntityId: `${conceptUrl}#term`,
  });
  const conceptPageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ...(conceptPageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
      {
        "@type": "DefinedTerm",
        "@id": `${conceptUrl}#term`,
        name: hub.entry.title,
        url: conceptUrl,
        description: hub.description,
        inLanguage: "zh-Hans",
        termCode: hub.termCode,
        inDefinedTermSet: absoluteUrl("/gainian"),
      },
    ],
  };
  const relatedConcepts = hub.related
    .map((slug) => getConceptEntry(slug))
    .filter((concept): concept is NonNullable<typeof concept> => Boolean(concept));

  return (
    <article className="concept-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(conceptPageJsonLd) }}
      />
      <header className="concept-hero">
        <div className="page-shell">
          <nav className="page-breadcrumb" aria-label="面包屑">
            <Link href="/"><ArrowLeft aria-hidden="true" size={15} /> 首页</Link>
            <span>/</span>
            <Link href="/gainian">概念</Link>
            <span>/</span>
            <span aria-current="page">{hub.heading}</span>
          </nav>

          <div className="concept-hero__grid">
            <div className="concept-hero__copy">
              <p className="eyebrow">{hub.hero.eyebrow}</p>
              <h1><span>{hub.hero.highlight}</span>{hub.hero.beforeBreak}<br />{hub.hero.afterBreak}</h1>
              <p className="concept-hero__lead">{hub.hero.lead}</p>
              <div className="concept-hero__actions">
                <a className="button-primary" href={hub.hero.primaryActionHref}>
                  {hub.hero.primaryActionLabel} <ArrowDown aria-hidden="true" size={16} />
                </a>
                <Link className="button-ghost" href={hub.hero.secondaryActionHref}>
                  {hub.hero.secondaryActionLabel} <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </div>

            <aside className="emptiness-lens" aria-label={`${hub.entry.title}的三个阅读边界`}>
              <span className="emptiness-lens__glyph" aria-hidden="true">{hub.entry.title}</span>
              {hub.hero.lensNotes.map((item, index) => (
                <p className={`emptiness-lens__note emptiness-lens__note--${index + 1 === 1 ? "one" : index + 1 === 2 ? "two" : "three"}`} key={item.label}>
                  <small>{item.label}</small>
                  {item.text}
                </p>
              ))}
            </aside>
          </div>

          <dl className="concept-proofline">
            {hub.stats.map((item) => (
              <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
            ))}
          </dl>
        </div>
      </header>

      <section className="concept-section concept-terms page-shell" aria-labelledby="terms-title">
        <div className="concept-section__heading">
          <p className="eyebrow">{hub.sectionTitle}</p>
          <h2 id="terms-title">{hub.termsHeading}</h2>
          <p>{hub.termsIntro}</p>
        </div>
        <div className="term-register">
          {hub.terms.map((item) => (
            <article key={item.heading}>
              <Languages aria-hidden="true" />
              <span>{item.label}</span>
              <h3>{item.heading}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="concept-boundaries" aria-labelledby="boundaries-title">
        <div className="page-shell">
          <div className="concept-section__heading concept-section__heading--light">
            <p className="eyebrow">传统边界</p>
            <h2 id="boundaries-title">{hub.boundariesHeading}</h2>
            <p>{hub.boundariesIntro}</p>
          </div>
          <div className="tradition-ledger">
            {hub.traditions.map((tradition) => (
              <article key={tradition.label}>
                <div className="tradition-ledger__name">
                  <span>{tradition.label}</span>
                  <strong>{tradition.term}</strong>
                </div>
                <div>
                  <small>当前可支持</small>
                  <p>{tradition.supported}</p>
                </div>
                <div>
                  <small>不能越过的线</small>
                  <p>{tradition.boundary}</p>
                </div>
                <code>{tradition.sources}</code>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="evidence" className="concept-section concept-evidence page-shell" aria-labelledby="evidence-title">
        <div className="concept-section__heading concept-evidence__heading">
          <div>
            <p className="eyebrow">原典证据账本</p>
            <h2 id="evidence-title">每项判断，都有可以重新打开的位置。</h2>
          </div>
          <p><ShieldCheck aria-hidden="true" /> 站内链接固定到作品、阅读页与原生段落；外部链接保留来源核对路径。</p>
        </div>

        <div className="concept-evidence__list">
          {hub.evidence.map((item, index) => (
            <article key={item.locator} className="concept-evidence-card">
              <div className="concept-evidence-card__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="concept-evidence-card__body">
                <div className="concept-evidence-card__meta">
                  <span className={item.kind === "直接证据" ? "is-direct" : "is-related"}>{item.kind}</span>
                  <span>{item.canon}</span>
                </div>
                <h3>{item.title}</h3>
                <blockquote lang={item.language ?? "zh-Hans"}>{item.quote}</blockquote>
                <p>{item.reading}</p>
              </div>
              <div className="concept-evidence-card__links">
                <code>{item.locator}</code>
                <Link href={item.href}>
                  <Link2 aria-hidden="true" size={15} /> 站内稳定原文
                </Link>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  来源页 <ArrowUpRight aria-hidden="true" size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
        {hub.translationNote ? (
          <p className="concept-translation-note">
            <CircleAlert aria-hidden="true" /> {hub.translationNote}
          </p>
        ) : null}
      </section>

      <section className="concept-misreadings" aria-labelledby="misreadings-title">
        <div className="page-shell concept-misreadings__grid">
          <div className="concept-misreadings__intro">
            <CircleAlert aria-hidden="true" />
            <p className="eyebrow">常见误解</p>
            <h2 id="misreadings-title">{hub.misreadingsHeading}</h2>
            <p>{hub.misreadingsIntro}</p>
          </div>
          <div className="misreading-list">
            {hub.misconceptions.map((item) => (
              <article key={item.myth}>
                <h3>{item.myth}</h3>
                <ArrowRight aria-hidden="true" />
                <p>{item.correction}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="concept-section concept-reading page-shell" aria-labelledby="reading-title">
        <div className="concept-section__heading">
          <p className="eyebrow">下一步阅读</p>
          <h2 id="reading-title">{hub.readingHeading}</h2>
          <p>{hub.readingIntro}</p>
        </div>
        <ol className="reading-path">
          {hub.readingPath.map((item, index) => (
            <li key={item.title}>
              <Link href={item.href}>
                <span className="reading-path__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="reading-path__copy">
                  <small>{item.step}</small>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <footer className="concept-footer">
        <div className="page-shell concept-footer__inner">
          <div>
            <BookOpenCheck aria-hidden="true" />
            <p className="eyebrow">证据边界声明</p>
            <h2>这是入口，不是最后一句话。</h2>
          </div>
          <p>
            {hub.footerNote}
            <span>证据校订：<time dateTime={hub.updatedAt}>{hub.updatedAt}</time></span>
            {relatedConcepts.length > 0 ? (
              <span>
                继续分辨：
                {relatedConcepts.map((concept, index) => (
                  <Link href={concept.href} key={concept.slug}>
                    {index === 0 ? ` ${concept.title}` : ` · ${concept.title}`}
                  </Link>
                ))}
              </span>
            ) : null}
          </p>
          <Link className="button-primary" href={hub.footerActionHref}>
            {hub.footerActionLabel} <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </footer>
    </article>
  );
}
