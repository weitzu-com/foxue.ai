import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, PenLine, RefreshCw } from "lucide-react";
import { BlogArticleBody, BlogFaq } from "@/components/blog-article";
import {
  blogHeadings,
  blogPlainText,
  blogPostPath,
  estimateReadingMinutes,
  getAllBlogPosts,
  getBlogPost,
} from "@/lib/blogs";
import { absoluteUrl, buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";
import styles from "../blogs.module.css";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const base = buildPageMetadata({ title: post.title, description: post.description, path: blogPostPath(post.slug) });
  return {
    ...base,
    keywords: [post.keywords.primary, ...post.keywords.secondary],
    authors: [{ name: post.author.name }],
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      images: [{ url: absoluteUrl(post.cover.src), width: post.cover.width, height: post.cover.height, alt: post.cover.alt }],
    },
    twitter: {
      ...base.twitter,
      images: [absoluteUrl(post.cover.src)],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const posts = getAllBlogPosts();
  const index = posts.findIndex((item) => item.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : undefined;
  const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined;
  const pagePath = blogPostPath(post.slug);
  const headings = blogHeadings(post);
  const verifiedQuotes = post.blocks.filter((block) => block.type === "quote" && block.verification === "verified").length;

  const pageJsonLd = buildPageJsonLd({
    path: pagePath,
    title: post.title,
    description: post.description,
    breadcrumb: [
      { name: "首页", path: "/" },
      { name: "博客", path: "/blogs" },
      { name: post.title, path: pagePath },
    ],
    about: [post.keywords.primary, ...post.keywords.secondary],
    mainEntityId: `${absoluteUrl(pagePath)}#article`,
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(pagePath)}#article`,
    mainEntityOfPage: `${absoluteUrl(pagePath)}#page`,
    headline: post.title,
    description: post.description,
    url: absoluteUrl(pagePath),
    inLanguage: "zh-Hans",
    image: [absoluteUrl(post.cover.src)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    isPartOf: { "@id": `${absoluteUrl("/blogs")}#blog` },
    keywords: [post.keywords.primary, ...post.keywords.secondary].join(", "),
    articleBody: blogPlainText(post),
    citation: post.blocks.flatMap((block) =>
      block.type === "quote"
        ? [
            {
              "@type": "CreativeWork",
              name: block.source.title,
              identifier: block.source.canonId,
              url: absoluteUrl(block.source.href),
            },
          ]
        : [],
    ),
  };

  const faqJsonLd =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${absoluteUrl(pagePath)}#faq`,
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer.replaceAll(/\[([^\]]+)\]\([^)]*\)/g, "$1") },
          })),
        }
      : null;

  return (
    <div className={`page-shell ${styles.article}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }} />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }} />
      ) : null}

      <div className="page-breadcrumb">
        <Link href="/">
          <ArrowLeft aria-hidden="true" size={15} /> 首页
        </Link>
        <span>/</span>
        <Link href="/blogs">博客</Link>
        <span>/</span>
        <span>{post.keywords.primary}</span>
      </div>

      <article>
        <header className={styles.articleHeader}>
          <p className="eyebrow">佛学博客 · {post.publishedAt}</p>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <div className={styles.byline}>
            <span>
              <PenLine aria-hidden="true" size={14} /> {post.author.name}
              {post.author.role ? ` · ${post.author.role}` : ""}
            </span>
            <span>
              <CalendarDays aria-hidden="true" size={14} />
              <time dateTime={post.publishedAt}>发布 {post.publishedAt}</time>
            </span>
            {post.updatedAt !== post.publishedAt ? (
              <span>
                <RefreshCw aria-hidden="true" size={14} />
                <time dateTime={post.updatedAt}>更新 {post.updatedAt}</time>
              </span>
            ) : null}
            <span>
              <Clock3 aria-hidden="true" size={14} /> 约 {estimateReadingMinutes(post)} 分钟
            </span>
          </div>
        </header>

        <figure className={styles.cover}>
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            width={post.cover.width}
            height={post.cover.height}
            sizes="(max-width: 900px) 100vw, 820px"
            priority
          />
          <figcaption>{post.cover.alt}</figcaption>
        </figure>

        <div className={styles.layout}>
          <div>
            <BlogArticleBody post={post} />
            <BlogFaq post={post} />

            {post.related.length > 0 ? (
              <section className={styles.related} aria-labelledby="blog-related-heading">
                <h2 id="blog-related-heading">继续回到原典</h2>
                <ul>
                  {post.related.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} prefetch={false}>
                        {item.label} <ArrowRight aria-hidden="true" size={13} />
                      </Link>
                      {item.note ? <span>{item.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <nav className={styles.pagerNav} aria-label="前后文章">
              {older ? (
                <Link href={blogPostPath(older.slug)}>
                  <ArrowLeft aria-hidden="true" size={14} /> {older.title}
                </Link>
              ) : (
                <span />
              )}
              {newer ? (
                <Link href={blogPostPath(newer.slug)}>
                  {newer.title} <ArrowRight aria-hidden="true" size={14} />
                </Link>
              ) : null}
            </nav>
          </div>

          <aside>
            {headings.length > 1 ? (
              <nav className={styles.toc} aria-label="本文目录">
                <strong>本文目录</strong>
                <ol>
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <div className={styles.demand}>
              <strong>本文覆盖的搜索需求</strong>
              <ul>
                {[post.keywords.primary, ...post.keywords.secondary].map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
              <p>
                {post.search.source === "gsc"
                  ? `选题依据：Search Console ${post.search.window?.start ?? ""} 至 ${post.search.window?.end ?? ""} 的查询数据。`
                  : "选题依据：站内登记的种子关键词；Search Console 数据接入后将按真实查询复核。"}
                {verifiedQuotes > 0 ? ` 文中 ${verifiedQuotes} 条引文已逐字核对受控原文。` : ""}
              </p>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
