import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, CircleAlert, FileCheck2, Info, Quote } from "lucide-react";
import { BlogInlineText } from "@/components/blog-inline-text";
import type { BlogBlock, BlogPost } from "@/lib/blogs";
import styles from "./blog-article.module.css";

function Block({ block, priority }: { block: BlogBlock; priority?: boolean }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <BlogInlineText text={block.text} />
        </p>
      );
    case "heading":
      return block.level === 2 ? <h2 id={block.id}>{block.text}</h2> : <h3 id={block.id}>{block.text}</h3>;
    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index}>
          <BlogInlineText text={item} />
        </li>
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "quote":
      return (
        <figure className={styles.quote}>
          <Quote aria-hidden="true" size={18} />
          <blockquote>
            <p>{block.text}</p>
          </blockquote>
          <figcaption>
            <span>
              《{block.source.title}》{block.source.translator ? ` · ${block.source.translator}` : ""} · {block.source.locator}
            </span>
            {block.verification === "verified" ? (
              <span className={styles.verified}>
                <FileCheck2 aria-hidden="true" size={13} /> 已逐字核对受控原文
              </span>
            ) : (
              <span className={styles.unverified}>
                <CircleAlert aria-hidden="true" size={13} /> 尚未逐字核对
              </span>
            )}
            <Link href={block.source.href} prefetch={false}>
              打开原文行段 <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </figcaption>
        </figure>
      );
    case "image":
      return (
        <figure className={styles.figure}>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            sizes="(max-width: 900px) 100vw, 820px"
            priority={priority}
          />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "callout":
      return (
        <aside className={`${styles.callout} ${block.tone === "warning" ? styles.calloutWarning : ""}`} role="note">
          {block.tone === "warning" ? <CircleAlert aria-hidden="true" size={17} /> : <Info aria-hidden="true" size={17} />}
          <div>
            <strong>{block.title}</strong>
            <p>
              <BlogInlineText text={block.text} />
            </p>
          </div>
        </aside>
      );
    case "links":
      return (
        <section className={styles.links} aria-label={block.title}>
          <h3>
            <BookOpenText aria-hidden="true" size={16} /> {block.title}
          </h3>
          <ul>
            {block.items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false}>
                  {item.label} <ArrowRight aria-hidden="true" size={13} />
                </Link>
                {item.note ? <span>{item.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      );
    default:
      return null;
  }
}

export function BlogArticleBody({ post }: { post: BlogPost }) {
  return (
    <div className={styles.body}>
      {post.blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

export function BlogFaq({ post }: { post: BlogPost }) {
  if (post.faq.length < 1) return null;
  return (
    <section className={styles.faq} aria-labelledby="blog-faq-heading">
      <h2 id="blog-faq-heading">常见问题</h2>
      <dl>
        {post.faq.map((item) => (
          <div key={item.question}>
            <dt>{item.question}</dt>
            <dd>
              <BlogInlineText text={item.answer} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
