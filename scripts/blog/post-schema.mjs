// 博客文章 JSON 结构：编辑草稿的整理规则，以及最终写入仓库的文章校验。

export const blogPostSchemaId = "https://foxue.ai/schemas/blog-post-v1";

/**
 * 编辑（Cursor Agent）手写的草稿格式：与最终文章基本一致，只是图片以文件名引用、
 * 引文的 verification 与图片尺寸由 finalize 计算。
 *
 * {
 *   slug, title, description, secondaryKeywords: [],
 *   cover:  { file: "cover.png", alt, prompt, generator? },
 *   blocks: [
 *     { type: "paragraph", text },
 *     { type: "heading", level: 2 | 3, id, text },
 *     { type: "list", ordered?, items: [] },
 *     { type: "quote", text, source: { title, canonId, locator, href, translator? } },
 *     { type: "image", file: "figure-1.png", alt, caption?, prompt, generator? },
 *     { type: "callout", tone: "note" | "warning", title, text },
 *     { type: "links", title?, items: [{ label, href, note? }] },
 *   ],
 *   faq: [{ question, answer }],
 *   related: [{ label, href, note? }],
 * }
 */
export const defaultImageGenerator = "cursor-generate-image";

const trimmed = (value, where) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${where} 缺少文本`);
  return value.trim();
};

function normalizeLinkItems(items, where) {
  if (!Array.isArray(items) || items.length < 1) throw new Error(`${where} 没有条目`);
  return items.map((item, index) => ({
    label: trimmed(item.label, `${where}[${index}].label`),
    href: trimmed(item.href, `${where}[${index}].href`),
    ...(item.note?.trim() ? { note: item.note.trim() } : {}),
  }));
}

function normalizeImageRef(image, where) {
  if (!/^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(image.file ?? "")) throw new Error(`${where}.file 必须是 public/blogs/<slug>/ 下的图片文件名，如 cover.png`);
  return {
    file: image.file,
    alt: trimmed(image.alt, `${where}.alt`),
    prompt: trimmed(image.prompt, `${where}.prompt`),
    generator: image.generator?.trim() || defaultImageGenerator,
    ...(image.caption?.trim() ? { caption: image.caption.trim() } : {}),
  };
}

export function normalizeDraftBlock(block, where = "block") {
  switch (block?.type) {
    case "paragraph":
      return { type: "paragraph", text: trimmed(block.text, where) };
    case "heading":
      return { type: "heading", level: block.level === 3 ? 3 : 2, id: trimmed(block.id, `${where}.id`), text: trimmed(block.text, where) };
    case "list": {
      const items = (block.items ?? []).map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
      if (items.length < 1) throw new Error(`${where} list 没有条目`);
      return { type: "list", ordered: Boolean(block.ordered), items };
    }
    case "quote":
      return {
        type: "quote",
        text: trimmed(block.text, where),
        source: {
          title: trimmed(block.source?.title, `${where}.source.title`),
          canonId: trimmed(block.source?.canonId, `${where}.source.canonId`),
          locator: trimmed(block.source?.locator, `${where}.source.locator`),
          href: trimmed(block.source?.href, `${where}.source.href`),
          ...(block.source?.translator?.trim() ? { translator: block.source.translator.trim() } : {}),
        },
        verification: "unverified",
      };
    case "image":
      return { type: "image", ...normalizeImageRef(block, where) };
    case "callout":
      return { type: "callout", tone: block.tone === "warning" ? "warning" : "note", title: trimmed(block.title, `${where}.title`), text: trimmed(block.text, where) };
    case "links":
      return { type: "links", title: block.title?.trim() || "回到原典", items: normalizeLinkItems(block.items, where) };
    default:
      throw new Error(`${where} 类型未知：${block?.type}`);
  }
}

/**
 * 把草稿整理成待 finalize 的结构（图片仍是文件名引用）。
 */
export function normalizeDraft(draft) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug ?? "")) throw new Error("draft.slug 只能是小写字母、数字、连字符");
  if (!Array.isArray(draft.blocks)) throw new Error("draft.blocks 必须是数组");
  if (!Array.isArray(draft.faq)) throw new Error("draft.faq 必须是数组");
  return {
    slug: draft.slug,
    title: trimmed(draft.title, "draft.title"),
    description: trimmed(draft.description, "draft.description"),
    secondaryKeywords: (draft.secondaryKeywords ?? []).map((item) => item.trim()).filter(Boolean),
    cover: normalizeImageRef(draft.cover ?? {}, "draft.cover"),
    blocks: draft.blocks.map((block, index) => normalizeDraftBlock(block, `blocks[${index}]`)),
    faq: draft.faq.map((item, index) => ({ question: trimmed(item.question, `faq[${index}].question`), answer: trimmed(item.answer, `faq[${index}].answer`) })),
    related: normalizeLinkItems(draft.related, "related"),
  };
}

const blockTypes = new Set(["paragraph", "heading", "list", "quote", "image", "callout", "links"]);

/**
 * 校验最终写入仓库的文章 JSON；返回问题列表（空数组表示通过）。
 */
export function validatePost(post, fileName = "<memory>") {
  const problems = [];
  const fail = (message) => problems.push(`${fileName}: ${message}`);
  if (post.schema !== blogPostSchemaId) fail(`schema 必须是 ${blogPostSchemaId}`);
  for (const key of ["slug", "title", "description", "publishedAt", "updatedAt"]) {
    if (typeof post[key] !== "string" || !post[key].trim()) fail(`缺少字符串字段 ${key}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug ?? "")) fail("slug 只能是小写字母、数字、连字符");
  if ((post.slug ?? "").length > 80) fail("slug 超过 80 个字符");
  for (const key of ["publishedAt", "updatedAt"]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post[key] ?? "") || Number.isNaN(Date.parse(post[key]))) fail(`${key} 必须是 YYYY-MM-DD`);
  }
  if (post.updatedAt < post.publishedAt) fail("updatedAt 不能早于 publishedAt");
  const titleLength = Array.from(post.title ?? "").length;
  if (titleLength > 60) fail(`title 过长（${titleLength} 字）`);
  const descriptionLength = Array.from(post.description ?? "").length;
  if (descriptionLength < 40 || descriptionLength > 200) fail(`description 长度应在 40–200 字之间（当前 ${descriptionLength}）`);
  if (!post.author?.name) fail("缺少 author.name");
  if (!post.keywords?.primary) fail("缺少 keywords.primary");
  if (!Array.isArray(post.keywords?.secondary)) fail("keywords.secondary 必须是数组");
  if (post.keywords?.primary && !`${post.title}${post.description}`.includes(post.keywords.primary.replace(/\s+/g, ""))) {
    const compact = (post.keywords.primary ?? "").replace(/[\s?？]/g, "");
    if (!`${post.title}${post.description}`.replace(/[\s?？]/g, "").includes(compact)) {
      fail("主关键词必须出现在 title 或 description 中");
    }
  }
  if (!["gsc", "seed"].includes(post.search?.source)) fail("search.source 必须是 gsc 或 seed");
  if (!Array.isArray(post.search?.queries)) fail("search.queries 必须是数组");
  if (!post.cover?.src?.startsWith(`/blogs/${post.slug}/`)) fail("封面图必须放在 /blogs/<slug>/ 下");
  for (const key of ["width", "height"]) {
    if (!Number.isInteger(post.cover?.[key]) || post.cover[key] < 1) fail(`cover.${key} 必须是正整数`);
  }
  if (!post.cover?.alt) fail("封面图缺少 alt");
  if (!post.cover?.generator) fail("封面图缺少 generator");
  if (!Array.isArray(post.blocks) || post.blocks.length < 6) fail("blocks 至少 6 个");
  const headingIds = new Set();
  let imageCount = 0;
  let quoteCount = 0;
  let h2Count = 0;
  for (const [index, block] of (post.blocks ?? []).entries()) {
    const where = `blocks[${index}]`;
    if (!blockTypes.has(block.type)) {
      fail(`${where} 类型未知：${block.type}`);
      continue;
    }
    if (block.type === "heading") {
      if (![2, 3].includes(block.level)) fail(`${where} heading.level 必须是 2 或 3`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(block.id ?? "")) fail(`${where} heading.id 必须是小写连字符`);
      if (headingIds.has(block.id)) fail(`${where} heading.id 重复：${block.id}`);
      headingIds.add(block.id);
      if (block.level === 2) h2Count += 1;
    }
    if ((block.type === "paragraph" || block.type === "heading" || block.type === "callout") && !block.text?.trim()) fail(`${where} 缺少 text`);
    if (block.type === "list" && (!Array.isArray(block.items) || block.items.length < 1)) fail(`${where} list 没有条目`);
    if (block.type === "quote") {
      quoteCount += 1;
      if (!block.text?.trim()) fail(`${where} quote 缺少 text`);
      for (const key of ["title", "canonId", "locator", "href"]) {
        if (!block.source?.[key]) fail(`${where} quote.source 缺少 ${key}`);
      }
      if (!["verified", "unverified"].includes(block.verification)) fail(`${where} quote.verification 必须是 verified / unverified`);
    }
    if (block.type === "image") {
      imageCount += 1;
      if (!block.src?.startsWith(`/blogs/${post.slug}/`)) fail(`${where} 图片必须放在 /blogs/<slug>/ 下`);
      if (!block.alt) fail(`${where} 图片缺少 alt`);
      if (!block.generator) fail(`${where} 图片缺少 generator`);
      for (const key of ["width", "height"]) {
        if (!Number.isInteger(block[key]) || block[key] < 1) fail(`${where}.${key} 必须是正整数`);
      }
    }
    if (block.type === "callout" && !["note", "warning"].includes(block.tone)) fail(`${where} callout.tone 不正确`);
    if (block.type === "links" && (!Array.isArray(block.items) || block.items.length < 1)) fail(`${where} links 没有条目`);
  }
  if (h2Count < 2) fail("至少需要 2 个二级标题");
  if (imageCount < 1) fail("正文至少需要 1 张配图（图文并茂）");
  if (quoteCount < 1) fail("至少需要 1 条带出处的原典引文");
  if (!Array.isArray(post.faq) || post.faq.length < 2) fail("faq 至少 2 条");
  for (const [index, item] of (post.faq ?? []).entries()) {
    if (!item.question?.trim() || !item.answer?.trim()) fail(`faq[${index}] 缺少 question 或 answer`);
  }
  if (!Array.isArray(post.related) || post.related.length < 1) fail("related 至少 1 条");
  return problems;
}
