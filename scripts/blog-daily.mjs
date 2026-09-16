#!/usr/bin/env node
// 每日 SEO 博客流水线：
//   1. 读取 Search Console 最近 90 天查询数据（服务账号）；没有凭据时回落到种子关键词。
//   2. 按“曝光 × 点击率缺口 × 位置权重”挑出尚未覆盖的关键词簇。
//   3. 用 Grok 按结构化 Schema 起草文章；站内链接只允许指向真实页面。
//   4. 每条引文逐字核对仓库内受控 TEI 原文，核对不到的标 unverified。
//   5. 用 Grok Imagine 生成封面与正文配图，写入 public/blogs/<slug>/。
//   6. 写入 content/blogs/posts/<slug>.json，并把当天 GSC 快照写到 reports/gsc/。
//
// 用法：
//   node scripts/blog-daily.mjs                    # 完整流程
//   node scripts/blog-daily.mjs --dry-run          # 只拉数据、选题，不调用 Grok
//   node scripts/blog-daily.mjs --topic "无常是什么意思"
//   node scripts/blog-daily.mjs --regenerate-images <slug>   # 用 Grok 重新生成某篇文章的全部配图
//   node scripts/blog-daily.mjs --date 2026-09-16

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { aggregateByQuery, defaultWindow, fetchSearchAnalytics, gscSiteUrl, loadServiceAccount } from "./blog/gsc.mjs";
import { extensionForFormat, imageDimensions } from "./blog/images.mjs";
import { pickTopic } from "./blog/opportunities.mjs";
import { blogPostSchemaId, draftSchema, normalizeDraftBlock, validatePost } from "./blog/post-schema.mjs";
import { verifyQuote } from "./blog/quote-check.mjs";
import { collectInternalHrefs, curatedSiteLinks, validateInternalHref } from "./blog/site-links.mjs";
import { chatJson, defaultImageModel, defaultTextModel, generateImage, requireXaiKey } from "./blog/xai.mjs";

const root = process.cwd();
const postsDirectory = resolve(root, "content/blogs/posts");
const publicDirectory = resolve(root, "public/blogs");
const reportsDirectory = resolve(root, "reports/gsc");
const authorName = process.env.BLOG_AUTHOR_NAME ?? "leizi";
const authorRole = process.env.BLOG_AUTHOR_ROLE ?? "foxue.ai 编辑";
const minVerifiedQuotes = Number(process.env.BLOG_MIN_VERIFIED_QUOTES ?? 2);
const maxDraftAttempts = Number(process.env.BLOG_MAX_DRAFT_ATTEMPTS ?? 2);

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    topic: { type: "string" },
    date: { type: "string" },
    "regenerate-images": { type: "string" },
  },
});

const today = args.date ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("--date 必须是 YYYY-MM-DD");

function log(message) {
  console.error(`[blog-daily] ${message}`);
}

function loadPosts() {
  if (!existsSync(postsDirectory)) return [];
  return readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(resolve(postsDirectory, name), "utf8")));
}

function loadSeeds() {
  const file = resolve(root, "content/blogs/seed-keywords.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).seeds ?? [] : [];
}

async function loadGscQueries() {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    log("未设置 GSC_SERVICE_ACCOUNT_JSON，跳过 Search Console，改用种子关键词。");
    return { queries: [], window: null };
  }
  const window = defaultWindow();
  log(`读取 Search Console ${gscSiteUrl} ${window.start} → ${window.end} …`);
  const rows = await fetchSearchAnalytics({ serviceAccount, start: window.start, end: window.end });
  const queries = aggregateByQuery(rows);
  log(`得到 ${rows.length} 行 query×page，折叠为 ${queries.length} 个查询。`);
  mkdirSync(reportsDirectory, { recursive: true });
  const snapshot = {
    schema: "https://foxue.ai/schemas/gsc-query-snapshot-v1",
    siteUrl: gscSiteUrl,
    window,
    fetchedAt: new Date().toISOString(),
    totals: {
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      queries: queries.length,
    },
    topQueries: queries.slice(0, 300).map((row) => ({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Number(row.ctr.toFixed(4)),
      position: Number(row.position.toFixed(1)),
      topPage: row.topPage,
    })),
  };
  writeFileSync(resolve(reportsDirectory, `${today}.json`), `${JSON.stringify(snapshot, null, 2)}\n`);
  log(`GSC 快照已写入 reports/gsc/${today}.json`);
  return { queries, window };
}

function buildSystemPrompt() {
  const linkList = curatedSiteLinks.map((item) => `- ${item.href} — ${item.label}（${item.note}）`).join("\n");
  return `你是 foxue.ai 的佛学编辑。foxue.ai 的使命是“从问题，回到原典”：每一个结论都要回到可核验的佛经原文、版本与范围边界。

写作原则（必须遵守）：
1. 目标读者是在搜索引擎里输入这个问题的普通中文读者；先用一段话直接回答问题，再展开。
2. 只引用你确定存在于大正藏原文中的句子。每条引文用 quote 块，写清经名、大正藏经号（如 T0251）、译者，并给出站内原文链接。引文用简体字逐字照录，不要改写、不要拼接不同位置的句子。不确定的句子不要写成引文，改用转述并说明“大意”。
3. 不编造出处、不编造学术共识、不用“佛陀说过”包装网络流行语。遇到流行说法与原典不符，直接指出“原文没有这句”。
4. 解释要有层次：原文位置 → 字面意思 → 语境中的意思 → 常见误读 → 与生活的关系。不写鸡汤，不下断言式的宗派结论。
5. 站内链接只能使用下面清单中的路径，或形如 /jingzang/<slug>/<版页> 的经藏原文路径（版页格式如 001-0848c）。不要链接到站外。
6. 正文 blocks 里必须包含：至少 2 个 heading(level 2)、至少 2 个 quote、至少 2 个 image 块（imageSlot 依次为 1、2，封面是 imageSlot 0，不放进 blocks）、1 个 callout（说明本文引文的核对方式）、结尾 1 个 links 块（标题“回到原典”）。段落用 paragraph，列表用 list。
7. 行内只允许两种标记：**加粗** 与 [文字](站内路径)。不要使用 Markdown 标题、表格或 HTML。
8. 全文 1500–2500 汉字。title 必须包含主关键词且不超过 40 个汉字；description 80–140 个汉字。
9. FAQ 3–5 条，回答简短，能直接被搜索引擎摘录。
10. 图像提示词用英文，描述具体的场景、构图、材质、光线与风格（如 ink wash painting、film photography、paper texture）；画面中不得出现文字、Logo、真人肖像或宗教符号的错误用法；风格克制、留白、契合“回到原典”的沉静气质。

允许的站内链接清单：
${linkList}`;
}

function buildUserPrompt(topic, posts) {
  const gscLines = topic.queries.length > 0
    ? topic.queries.map((row) => `- “${row.query}”：曝光 ${row.impressions}，点击 ${row.clicks}，平均位置 ${row.position}`).join("\n")
    : "（本次没有 Search Console 数据；选题来自站内登记的种子关键词。）";
  const existing = posts.length > 0
    ? posts.map((post) => `- ${post.title}（/blogs/${post.slug}）`).join("\n")
    : "（暂无）";
  return `请写一篇覆盖以下搜索需求的文章。

主关键词：${topic.primary}
次关键词：${topic.secondary.join("、") || "（无）"}
写作意图：${topic.intent || "回到原典解释这个问题"}
建议优先链接的站内页面：${topic.anchors.length > 0 ? topic.anchors.join("、") : "（自行从清单中选择）"}

Search Console 最近 90 天相关查询：
${gscLines}

已发布的文章（避免重复选题，可作为内链）：
${existing}

输出 JSON：title、description、slug（小写拼音连字符）、secondaryKeywords、blocks、faq、related、imagePrompts（第 0 个是封面，随后 2 个对应正文 image 块）。`;
}

function assembleDraft(draft, topic, window) {
  const blocks = draft.blocks.map(normalizeDraftBlock);
  return {
    schema: blogPostSchemaId,
    slug: draft.slug,
    title: draft.title.trim(),
    description: draft.description.trim(),
    publishedAt: today,
    updatedAt: today,
    author: { name: authorName, role: authorRole },
    keywords: {
      primary: topic.primary,
      secondary: [...new Set([...(draft.secondaryKeywords ?? []), ...topic.secondary])].filter((k) => k && k !== topic.primary).slice(0, 8),
    },
    search: {
      source: topic.source,
      ...(window ? { window } : {}),
      queries: topic.queries,
      note: topic.note,
    },
    cover: null,
    blocks,
    faq: draft.faq.map((item) => ({ question: item.question.trim(), answer: item.answer.trim() })),
    related: draft.related.map((item) => ({ label: item.label.trim(), href: item.href.trim(), ...(item.note?.trim() ? { note: item.note.trim() } : {}) })),
    imagePrompts: draft.imagePrompts,
  };
}

function verifyQuotes(post) {
  let verified = 0;
  for (const block of post.blocks) {
    if (block.type !== "quote") continue;
    const result = verifyQuote({ text: block.text, canonId: block.source.canonId }, root);
    block.verification = result.status;
    if (result.status === "verified") verified += 1;
    log(`引文核对 ${result.status}：「${block.text.slice(0, 18)}…」 ${result.reason}`);
  }
  return verified;
}

function checkLinks(post, posts) {
  const problems = [];
  for (const href of collectInternalHrefs(post)) {
    const result = validateInternalHref(href, { root, posts });
    if (!result.ok) problems.push(`${href}：${result.reason}`);
  }
  return problems;
}

function stripBadLinks(post, badHrefs) {
  // 编造的链接不能上线：正文里的坏链接退化为纯文本，related / links 块中的坏条目直接移除。
  const bad = new Set(badHrefs);
  const clean = (text) => text.replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, (whole, label, href) => (bad.has(href) ? label : whole));
  for (const block of post.blocks) {
    if (block.type === "paragraph" || block.type === "callout") block.text = clean(block.text);
    if (block.type === "list") block.items = block.items.map(clean);
    if (block.type === "links") block.items = block.items.filter((item) => !bad.has(item.href));
  }
  post.blocks = post.blocks.filter((block) => block.type !== "links" || block.items.length > 0);
  post.faq = post.faq.map((item) => ({ ...item, answer: clean(item.answer) }));
  post.related = post.related.filter((item) => !bad.has(item.href));
}

async function renderImages(post, prompts) {
  const directory = resolve(publicDirectory, post.slug);
  mkdirSync(directory, { recursive: true });
  const rendered = [];
  for (const [index, item] of prompts.entries()) {
    const baseName = index === 0 ? "cover" : `figure-${index}`;
    log(`Grok 生图 ${index + 1}/${prompts.length}（${defaultImageModel}）…`);
    const { buffer, model, revisedPrompt } = await generateImage({ prompt: item.prompt, aspectRatio: index === 0 ? "16:9" : "3:2" });
    const dimensions = imageDimensions(buffer);
    const fileName = `${baseName}.${extensionForFormat(dimensions.format)}`;
    writeFileSync(resolve(directory, fileName), buffer);
    rendered.push({
      src: `/blogs/${post.slug}/${fileName}`,
      alt: item.alt,
      width: dimensions.width,
      height: dimensions.height,
      generator: model,
      prompt: revisedPrompt ?? item.prompt,
      caption: item.caption,
    });
    log(`已写入 public/blogs/${post.slug}/${fileName}（${dimensions.width}×${dimensions.height}）`);
  }
  return rendered;
}

function attachImages(post, rendered) {
  const cover = rendered[0];
  if (!cover) throw new Error("没有封面图，无法发布图文文章");
  post.cover = { src: cover.src, alt: cover.alt, width: cover.width, height: cover.height, generator: cover.generator, prompt: cover.prompt };
  post.blocks = post.blocks
    .map((block) => {
      if (block.type !== "image") return block;
      const image = rendered[block.imageSlot];
      if (!image) return null;
      return {
        type: "image",
        src: image.src,
        alt: image.alt,
        caption: image.caption,
        width: image.width,
        height: image.height,
        generator: image.generator,
        prompt: image.prompt,
      };
    })
    .filter(Boolean);
}

function writePost(post) {
  mkdirSync(postsDirectory, { recursive: true });
  const { imagePrompts, ...persisted } = post;
  void imagePrompts;
  const problems = validatePost(persisted, `${post.slug}.json`);
  if (problems.length > 0) throw new Error(`文章未通过校验：\n${problems.join("\n")}`);
  const file = resolve(postsDirectory, `${post.slug}.json`);
  writeFileSync(file, `${JSON.stringify(persisted, null, 2)}\n`);
  log(`文章已写入 content/blogs/posts/${post.slug}.json`);
  return file;
}

async function regenerateImages(slug) {
  const file = resolve(postsDirectory, `${slug}.json`);
  if (!existsSync(file)) throw new Error(`找不到文章 ${slug}`);
  requireXaiKey();
  const post = JSON.parse(readFileSync(file, "utf8"));
  const prompts = [
    { prompt: post.cover.prompt, alt: post.cover.alt, caption: "" },
    ...post.blocks.filter((block) => block.type === "image").map((block) => ({ prompt: block.prompt, alt: block.alt, caption: block.caption ?? "" })),
  ];
  if (prompts.some((item) => !item.prompt)) throw new Error("文章图片缺少 prompt，无法重新生成");
  const rendered = await renderImages(post, prompts);
  post.cover = { ...post.cover, src: rendered[0].src, width: rendered[0].width, height: rendered[0].height, generator: rendered[0].generator, prompt: rendered[0].prompt };
  let slot = 1;
  for (const block of post.blocks) {
    if (block.type !== "image") continue;
    const image = rendered[slot];
    slot += 1;
    Object.assign(block, { src: image.src, width: image.width, height: image.height, generator: image.generator, prompt: image.prompt });
  }
  post.updatedAt = today;
  writePost(post);
}

async function main() {
  if (args["regenerate-images"]) {
    await regenerateImages(args["regenerate-images"]);
    return;
  }

  const posts = loadPosts();
  const seeds = loadSeeds();
  const { queries, window } = await loadGscQueries();
  const topic = pickTopic({ gscQueries: queries, posts, seeds, forcedTopic: args.topic });
  log(`选题：${topic.primary}（来源 ${topic.source}）。${topic.note}`);
  if (topic.secondary.length > 0) log(`次关键词：${topic.secondary.join("、")}`);

  if (args["dry-run"]) {
    console.log(JSON.stringify({ date: today, topic, window }, null, 2));
    return;
  }

  requireXaiKey();
  const system = buildSystemPrompt();
  let userPrompt = buildUserPrompt(topic, posts);
  let post;
  let verifiedCount = 0;
  for (let attempt = 1; attempt <= maxDraftAttempts; attempt += 1) {
    log(`Grok 起草（${defaultTextModel}，第 ${attempt}/${maxDraftAttempts} 次）…`);
    const { json: draft, model } = await chatJson({ system, user: userPrompt, schema: draftSchema });
    log(`起草完成：《${draft.title}》 slug=${draft.slug}（模型 ${model}）`);
    if (posts.some((existing) => existing.slug === draft.slug)) draft.slug = `${draft.slug}-${today.replaceAll("-", "")}`;
    post = assembleDraft(draft, topic, window);
    verifiedCount = verifyQuotes(post);
    if (verifiedCount >= minVerifiedQuotes) break;
    const failed = post.blocks.filter((block) => block.type === "quote" && block.verification !== "verified");
    if (attempt === maxDraftAttempts) {
      log(`警告：${maxDraftAttempts} 次起草后仍只有 ${verifiedCount} 条引文能在原文中逐字找到，未核对的引文将标注“尚未逐字核对”。`);
      break;
    }
    log(`只有 ${verifiedCount} 条引文核对通过（要求 ≥ ${minVerifiedQuotes}），把未通过的引文反馈给 Grok 重写…`);
    userPrompt = `${buildUserPrompt(topic, posts)}

上一稿有 ${failed.length} 条引文在大正藏原文里找不到逐字对应，请重写整篇：要么换成你能逐字确定的原文句子（同一部经、同一位置），要么改为转述并说明“大意”，不要再写成 quote。找不到的引文：
${failed.map((block) => `- 「${block.text}」（${block.source.canonId} ${block.source.title}）`).join("\n")}`;
  }
  const linkProblems = checkLinks(post, posts);
  if (linkProblems.length > 0) {
    log(`发现 ${linkProblems.length} 个无效站内链接，正在移除：\n${linkProblems.join("\n")}`);
    stripBadLinks(post, linkProblems.map((item) => item.split("：")[0]));
    const quoteBad = post.blocks.filter((block) => block.type === "quote" && !validateInternalHref(block.source.href, { root, posts }).ok);
    for (const block of quoteBad) {
      // 引文出处链接错了就退回到作品目录页，至少保证可点击且真实。
      const slug = /^\/jingzang\/([a-z0-9-]+)/.exec(block.source.href)?.[1];
      block.source.href = slug && validateInternalHref(`/jingzang/${slug}`, { root, posts }).ok ? `/jingzang/${slug}` : "/jingzang/quanwen";
    }
  }
  log(`引文 ${verifiedCount} 条已核对；仍有 ${post.blocks.filter((b) => b.type === "quote" && b.verification !== "verified").length} 条未核对。`);

  const rendered = await renderImages(post, post.imagePrompts);
  attachImages(post, rendered);
  writePost(post);
  console.log(JSON.stringify({ slug: post.slug, title: post.title, path: `/blogs/${post.slug}`, source: topic.source, verifiedQuotes: verifiedCount }, null, 2));
}

main().catch((error) => {
  console.error(`[blog-daily] 失败：${error.message}`);
  process.exit(1);
});
