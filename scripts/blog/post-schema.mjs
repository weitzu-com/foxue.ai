// 博客文章 JSON 结构：既作为 Grok 结构化输出的 Schema，也作为仓库内校验的依据。

export const blogPostSchemaId = "https://foxue.ai/schemas/blog-post-v1";

const inlineText = { type: "string", minLength: 1 };

export const draftSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "slug", "secondaryKeywords", "blocks", "faq", "related", "imagePrompts"],
  properties: {
    title: { type: "string", description: "含主关键词、不超过 40 个汉字、不含站名" },
    description: { type: "string", description: "含主关键词、80–140 个汉字的摘要" },
    slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", description: "拼音或英文小写连字符 slug，不超过 60 个字符" },
    secondaryKeywords: { type: "array", items: { type: "string" }, maxItems: 8 },
    blocks: {
      type: "array",
      minItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "text", "level", "id", "items", "ordered", "source", "imageSlot", "tone", "title", "links"],
        properties: {
          type: { type: "string", enum: ["paragraph", "heading", "list", "quote", "image", "callout", "links"] },
          text: { type: "string", description: "paragraph / heading / quote / callout 的正文；其他类型填空字符串" },
          level: { type: "integer", enum: [2, 3], description: "heading 的层级；其他类型填 2" },
          id: { type: "string", description: "heading 的锚点 id（小写英文/拼音/数字/连字符）；其他类型填空字符串" },
          items: { type: "array", items: inlineText, description: "list 的条目；其他类型填空数组" },
          ordered: { type: "boolean", description: "list 是否有序；其他类型填 false" },
          source: {
            type: "object",
            additionalProperties: false,
            required: ["title", "canonId", "locator", "href", "translator"],
            properties: {
              title: { type: "string", description: "经名，不带书名号" },
              canonId: { type: "string", description: "大正藏经号，如 T0251" },
              locator: { type: "string", description: "稳定行段，如 T0251.001.0848c07–09" },
              href: { type: "string", description: "站内原文链接，如 /jingzang/xinjing/001-0848c#T0251.001.0848c07" },
              translator: { type: "string", description: "译者，如 玄奘" },
            },
            description: "quote 的出处；其他类型全部填空字符串",
          },
          imageSlot: { type: "integer", description: "image 块对应 imagePrompts 的下标（0 起）；其他类型填 -1" },
          tone: { type: "string", enum: ["note", "warning"], description: "callout 的语气；其他类型填 note" },
          title: { type: "string", description: "callout / links 的标题；其他类型填空字符串" },
          links: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["label", "href", "note"],
              properties: { label: inlineText, href: inlineText, note: { type: "string" } },
            },
            description: "links 块的条目；其他类型填空数组",
          },
        },
      },
    },
    faq: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "answer"],
        properties: { question: inlineText, answer: inlineText },
      },
    },
    related: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "href", "note"],
        properties: { label: inlineText, href: inlineText, note: { type: "string" } },
      },
    },
    imagePrompts: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      description: "第 0 个是封面；其余对应正文 image 块。英文提示词，写给图像模型",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "alt", "caption"],
        properties: {
          prompt: { type: "string", description: "英文、具体、含构图/光线/材质/风格；不得出现文字、Logo、真人肖像" },
          alt: { type: "string", description: "中文替代文本，描述画面内容并自然带上关键词" },
          caption: { type: "string", description: "中文图注，一句话说明这张图和正文的关系" },
        },
      },
    },
  },
};

/**
 * 把 Grok 的扁平输出整理成站点使用的 block 结构（去掉无关的空字段）。
 */
export function normalizeDraftBlock(block) {
  switch (block.type) {
    case "paragraph":
      return { type: "paragraph", text: block.text.trim() };
    case "heading":
      return { type: "heading", level: block.level === 3 ? 3 : 2, id: block.id.trim(), text: block.text.trim() };
    case "list":
      return { type: "list", ordered: Boolean(block.ordered), items: block.items.map((item) => item.trim()).filter(Boolean) };
    case "quote":
      return {
        type: "quote",
        text: block.text.trim(),
        source: {
          title: block.source.title.trim(),
          canonId: block.source.canonId.trim(),
          locator: block.source.locator.trim(),
          href: block.source.href.trim(),
          ...(block.source.translator?.trim() ? { translator: block.source.translator.trim() } : {}),
        },
        verification: "unverified",
      };
    case "image":
      return { type: "image", imageSlot: block.imageSlot };
    case "callout":
      return { type: "callout", tone: block.tone === "warning" ? "warning" : "note", title: block.title.trim(), text: block.text.trim() };
    case "links":
      return {
        type: "links",
        title: block.title.trim() || "回到原典",
        items: block.links.map((item) => ({ label: item.label.trim(), href: item.href.trim(), ...(item.note?.trim() ? { note: item.note.trim() } : {}) })),
      };
    default:
      throw new Error(`未知的 block 类型：${block.type}`);
  }
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
