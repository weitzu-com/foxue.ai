import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, FileCheck2, Search } from "lucide-react";
import { blogPostPath, estimateReadingMinutes, getAllBlogPosts } from "@/lib/blogs";
import { absoluteUrl, buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";
import styles from "./blogs.module.css";

const title = "佛学博客｜回到原典的佛经解读与常见问题";
const description =
  "foxue.ai 博客：围绕读者真实搜索的佛学问题，逐句回到大正藏与巴利原典解释心经、金刚经、空、无常、缘起等主题；每篇引文都标明经号、行段与核对状态。";
const pagePath = "/blogs";

export const dynamic = "force-static";

const baseMetadata = buildPageMetadata({ title, description, path: pagePath });

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: {
    ...baseMetadata.alternates,
    types: { "application/rss+xml": `${pagePath}/feed.xml` },
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const jsonLd = buildPageJsonLd({
    path: pagePath,
    title,
    description,
    type: "CollectionPage",
    breadcrumb: [
      { name: "首页", path: "/" },
      { name: "博客", path: pagePath },
    ],
    about: ["佛学", "佛经解读", "心经", "金刚经"],
    mainEntityId: `${absoluteUrl(pagePath)}#blog`,
  });
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absoluteUrl(pagePath)}#blog`,
    url: absoluteUrl(pagePath),
    name: "foxue.ai 佛学博客",
    description,
    inLanguage: "zh-Hans",
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${absoluteUrl(blogPostPath(post.slug))}#article`,
      headline: post.title,
      url: absoluteUrl(blogPostPath(post.slug)),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      image: absoluteUrl(post.cover.src),
      author: { "@type": "Person", name: post.author.name },
    })),
  };

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogJsonLd) }} />
      <div className="page-breadcrumb">
        <Link href="/">
          <ArrowLeft aria-hidden="true" size={15} /> 首页
        </Link>
        <span>/</span>
        <span>博客</span>
      </div>

      <header className={styles.hero}>
        <p className="eyebrow">佛学博客 · FROM SEARCH TO SOURCE</p>
        <h1>
          读者搜什么，
          <br />
          <em>就回到原典答什么。</em>
        </h1>
        <p>
          每篇文章都从 Search Console 里读者真实输入的问题出发，逐句回到大正藏、巴利藏与可核验的译本。
          引文标明经号与稳定行段；核对不到的说法，会被明确写成“证据不足”，不会被写成“佛经说”。
        </p>
        <ul className={styles.heroMeta} aria-label="博客说明">
          <li>
            <Search aria-hidden="true" /> 选题来自真实搜索需求
          </li>
          <li>
            <FileCheck2 aria-hidden="true" /> 引文逐字核对受控原文
          </li>
          <li>
            <CalendarDays aria-hidden="true" /> 每日一篇
          </li>
        </ul>
      </header>

      {posts.length < 1 ? (
        <p className={styles.empty}>第一篇文章正在整理中。</p>
      ) : (
        <ul className={styles.grid} aria-label="文章列表">
          {posts.map((post, index) => (
            <li key={post.slug} className={styles.card}>
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                width={post.cover.width}
                height={post.cover.height}
                sizes="(max-width: 720px) 100vw, 380px"
                priority={index === 0}
              />
              <div className={styles.cardBody}>
                <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                <h2>
                  <Link href={blogPostPath(post.slug)}>{post.title}</Link>
                </h2>
                <p>{post.description}</p>
                <ul className={styles.cardKeywords} aria-label="覆盖关键词">
                  {[post.keywords.primary, ...post.keywords.secondary.slice(0, 3)].map((keyword) => (
                    <li key={keyword}>{keyword}</li>
                  ))}
                </ul>
                <div className={styles.cardMeta}>
                  <span>
                    <Clock3 aria-hidden="true" size={12} /> 约 {estimateReadingMinutes(post)} 分钟
                  </span>
                  <span>{post.author.name}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
