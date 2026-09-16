import { blogImageMimeType, blogPlainText, blogPostPath, getAllBlogPosts } from "@/lib/blogs";
import { absoluteUrl, siteName } from "@/lib/site-metadata";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = getAllBlogPosts();
  const updated = posts[0]?.updatedAt ?? "2026-09-16";
  const items = posts
    .map((post) => {
      const url = absoluteUrl(blogPostPath(post.slug));
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `<pubDate>${new Date(`${post.publishedAt}T00:00:00+08:00`).toUTCString()}</pubDate>`,
        `<description>${escapeXml(post.description)}</description>`,
        `<content:encoded><![CDATA[<p>${escapeXml(blogPlainText(post)).replaceAll("\n\n", "</p><p>")}</p>]]></content:encoded>`,
        `<enclosure url="${escapeXml(absoluteUrl(post.cover.src))}" type="${blogImageMimeType(post.cover.src)}" length="0" />`,
        ...[post.keywords.primary, ...post.keywords.secondary].map((keyword) => `<category>${escapeXml(keyword)}</category>`),
        "</item>",
      ].join("");
    })
    .join("\n");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    "<channel>",
    `<title>${escapeXml(`${siteName} 佛学博客`)}</title>`,
    `<link>${escapeXml(absoluteUrl("/blogs"))}</link>`,
    `<atom:link href="${escapeXml(absoluteUrl("/blogs/feed.xml"))}" rel="self" type="application/rss+xml" />`,
    "<description>围绕读者真实搜索的佛学问题，逐句回到可核验的佛经原典。</description>",
    "<language>zh-Hans</language>",
    `<lastBuildDate>${new Date(`${updated}T00:00:00+08:00`).toUTCString()}</lastBuildDate>`,
    items,
    "</channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
