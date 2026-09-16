import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const blogPostSchema = "https://foxue.ai/schemas/blog-post-v1";
export const blogPostsDirectory = "content/blogs/posts";

export type BlogImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** 生成模型标识，例如 grok-2-image-1212；人工图片写 "manual"。 */
  generator: string;
  prompt?: string;
};

export type BlogQuoteSource = {
  title: string;
  canonId: string;
  locator: string;
  href: string;
  translator?: string;
};

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; id: string; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | {
      type: "quote";
      text: string;
      source: BlogQuoteSource;
      /** verified：逐字核对到仓库内受控原文；unverified：尚未核对，页面会标注。 */
      verification: "verified" | "unverified";
    }
  | ({ type: "image"; caption?: string } & BlogImage)
  | { type: "callout"; tone: "note" | "warning"; title: string; text: string }
  | { type: "links"; title: string; items: Array<{ label: string; href: string; note?: string }> };

export type BlogSearchQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type BlogPost = {
  schema: typeof blogPostSchema;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  author: { name: string; role?: string };
  keywords: { primary: string; secondary: string[] };
  search: {
    /** gsc：来自 Search Console 数据；seed：来自登记的种子关键词，等待 GSC 数据接入。 */
    source: "gsc" | "seed";
    window?: { start: string; end: string };
    queries: BlogSearchQuery[];
    note?: string;
  };
  cover: BlogImage;
  blocks: BlogBlock[];
  faq: Array<{ question: string; answer: string }>;
  related: Array<{ label: string; href: string; note?: string }>;
};

let cache: BlogPost[] | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertPost(value: unknown, fileName: string): BlogPost {
  if (!isRecord(value)) throw new Error(`${fileName}: 博客文章必须是 JSON 对象`);
  if (value.schema !== blogPostSchema) throw new Error(`${fileName}: schema 必须是 ${blogPostSchema}`);
  for (const key of ["slug", "title", "description", "publishedAt", "updatedAt"]) {
    if (typeof value[key] !== "string" || !(value[key] as string).trim()) {
      throw new Error(`${fileName}: 缺少字符串字段 ${key}`);
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug as string)) {
    throw new Error(`${fileName}: slug 只能使用小写字母、数字与连字符`);
  }
  if (fileName !== `${value.slug}.json`) throw new Error(`${fileName}: 文件名必须与 slug 一致`);
  if (!Array.isArray(value.blocks) || value.blocks.length < 1) throw new Error(`${fileName}: blocks 不能为空`);
  if (!isRecord(value.cover) || typeof value.cover.src !== "string") throw new Error(`${fileName}: 缺少封面图`);
  if (!isRecord(value.keywords) || typeof value.keywords.primary !== "string") {
    throw new Error(`${fileName}: 缺少主关键词`);
  }
  if (!isRecord(value.search) || !Array.isArray(value.search.queries)) throw new Error(`${fileName}: 缺少搜索需求记录`);
  if (!Array.isArray(value.faq)) throw new Error(`${fileName}: faq 必须是数组`);
  if (!Array.isArray(value.related)) throw new Error(`${fileName}: related 必须是数组`);
  return value as unknown as BlogPost;
}

export function getAllBlogPosts(root = process.cwd()): BlogPost[] {
  if (cache) return cache;
  const directory = resolve(root, blogPostsDirectory);
  let fileNames: string[] = [];
  try {
    fileNames = readdirSync(directory).filter((name) => name.endsWith(".json"));
  } catch {
    fileNames = [];
  }
  const posts = fileNames
    .map((fileName) => assertPost(JSON.parse(readFileSync(resolve(directory, fileName), "utf8")), fileName))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a.slug.localeCompare(b.slug)));
  cache = posts;
  return posts;
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getAllBlogPosts().find((post) => post.slug === slug);
}

export function blogPostPath(slug: string) {
  return `/blogs/${slug}`;
}

export function estimateReadingMinutes(post: BlogPost) {
  let characters = 0;
  for (const block of post.blocks) {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") characters += Array.from(block.text).length;
    else if (block.type === "list") characters += block.items.reduce((sum, item) => sum + Array.from(item).length, 0);
    else if (block.type === "callout") characters += Array.from(block.text).length;
  }
  for (const item of post.faq) characters += Array.from(item.question).length + Array.from(item.answer).length;
  return Math.max(1, Math.round(characters / 400));
}

export function blogPlainText(post: BlogPost) {
  return post.blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") return block.text;
      if (block.type === "list") return block.items.join("\n");
      if (block.type === "callout") return `${block.title}：${block.text}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export function blogHeadings(post: BlogPost) {
  return post.blocks.flatMap((block) => (block.type === "heading" && block.level === 2 ? [{ id: block.id, text: block.text }] : []));
}

const imageMimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function blogImageMimeType(src: string) {
  const extension = src.split(".").pop()?.toLowerCase() ?? "";
  return imageMimeTypes[extension] ?? "application/octet-stream";
}
