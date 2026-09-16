#!/usr/bin/env node
// 每日 SEO 博客工具箱。文章由 Cursor Agent（编辑 leizi）按 .cursor/skills/blog-daily/SKILL.md 撰写，
// 这个脚本负责其中可机械化、必须可复核的部分：
//
//   pick-topic    读取 Search Console 最近 90 天查询（服务账号；无凭据时回落到种子关键词），
//                 按“曝光 × 点击率缺口 × 位置权重”挑出尚未覆盖的关键词簇，输出选题 JSON，
//                 并把当天 GSC 快照写到 reports/gsc/<date>.json。
//   check-quote   在仓库内受控 TEI 原文里逐字核对一句引文（写作时先核对，再落笔）。
//   finalize      读取编辑手写的草稿 JSON + 选题 JSON + public/blogs/<slug>/ 下已生成的图片：
//                 逐条核对引文、校验站内链接、读取图片尺寸、校验 Schema，写入 content/blogs/posts/<slug>.json。
//
// 用法：
//   node scripts/blog-daily.mjs pick-topic [--topic "无常是什么意思"] [--out /tmp/topic.json]
//   node scripts/blog-daily.mjs check-quote --canon T0251 "色不异空，空不异色"
//   node scripts/blog-daily.mjs finalize --draft /tmp/draft.json --topic /tmp/topic.json [--date 2026-09-16]

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { aggregateByQuery, defaultWindow, fetchSearchAnalytics, gscSiteUrl, loadServiceAccount } from "./blog/gsc.mjs";
import { extensionForFormat, imageDimensions } from "./blog/images.mjs";
import { pickTopic } from "./blog/opportunities.mjs";
import { blogPostSchemaId, normalizeDraft, validatePost } from "./blog/post-schema.mjs";
import { verifyQuote } from "./blog/quote-check.mjs";
import { collectInternalHrefs, validateInternalHref } from "./blog/site-links.mjs";

const root = process.cwd();
const postsDirectory = resolve(root, "content/blogs/posts");
const publicDirectory = resolve(root, "public/blogs");
const reportsDirectory = resolve(root, "reports/gsc");
const authorName = process.env.BLOG_AUTHOR_NAME ?? "leizi";
const authorRole = process.env.BLOG_AUTHOR_ROLE ?? "foxue.ai 编辑";
const minVerifiedQuotes = Number(process.env.BLOG_MIN_VERIFIED_QUOTES ?? 2);

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    topic: { type: "string" },
    date: { type: "string" },
    out: { type: "string" },
    draft: { type: "string" },
    canon: { type: "string" },
    // 旧参数：等价于 pick-topic。
    "dry-run": { type: "boolean", default: false },
  },
});

const command = positionals[0] ?? (args["dry-run"] ? "pick-topic" : undefined);
const today = args.date ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("--date 必须是 YYYY-MM-DD");

function log(message) {
  console.error(`[blog-daily] ${message}`);
}

function readJson(file, label) {
  if (!file) throw new Error(`缺少 ${label}`);
  const path = resolve(root, file);
  if (!existsSync(path)) throw new Error(`${label} 不存在：${file}`);
  return JSON.parse(readFileSync(path, "utf8"));
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

async function runPickTopic() {
  const posts = loadPosts();
  const seeds = loadSeeds();
  const { queries, window } = await loadGscQueries();
  const topic = pickTopic({ gscQueries: queries, posts, seeds, forcedTopic: args.topic });
  log(`选题：${topic.primary}（来源 ${topic.source}）。${topic.note}`);
  if (topic.secondary.length > 0) log(`次关键词：${topic.secondary.join("、")}`);
  const output = {
    date: today,
    topic,
    window,
    existingPosts: posts.map((post) => ({ slug: post.slug, title: post.title, primary: post.keywords.primary })),
  };
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (args.out) {
    writeFileSync(resolve(root, args.out), serialized);
    log(`选题已写入 ${args.out}`);
  }
  console.log(serialized.trimEnd());
}

function runCheckQuote() {
  const text = positionals.slice(1).join(" ").trim();
  if (!args.canon || !text) throw new Error('用法：check-quote --canon T0251 "引文"');
  const result = verifyQuote({ text, canonId: args.canon }, root);
  console.log(JSON.stringify({ canonId: args.canon, text, ...result }, null, 2));
  if (result.status !== "verified") process.exitCode = 2;
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

function attachImageFile(slug, image, where) {
  const path = resolve(publicDirectory, slug, image.file);
  if (!existsSync(path)) throw new Error(`${where} 引用的图片不存在：public/blogs/${slug}/${image.file}`);
  const dimensions = imageDimensions(readFileSync(path));
  const expected = extensionForFormat(dimensions.format);
  const allowed = expected === "jpg" ? [".jpg", ".jpeg"] : [`.${expected}`];
  if (!allowed.some((extension) => image.file.toLowerCase().endsWith(extension))) {
    throw new Error(`${where} 的 ${image.file} 实际是 ${dimensions.format}，请重命名为 .${expected}（生成工具可能不按请求的扩展名输出）`);
  }
  const { file, ...rest } = image;
  void file;
  log(`图片 ${image.file}：${dimensions.width}×${dimensions.height} ${dimensions.format}`);
  return { src: `/blogs/${slug}/${image.file}`, width: dimensions.width, height: dimensions.height, ...rest };
}

function runFinalize() {
  const draft = normalizeDraft(readJson(args.draft, "--draft 草稿文件"));
  const topicFile = readJson(args.topic, "--topic 选题文件");
  const topic = topicFile.topic ?? topicFile;
  const posts = loadPosts().filter((post) => post.slug !== draft.slug);
  const existing = existsSync(resolve(postsDirectory, `${draft.slug}.json`));
  const previous = existing ? JSON.parse(readFileSync(resolve(postsDirectory, `${draft.slug}.json`), "utf8")) : null;

  const { file: coverFile, ...coverRest } = attachImageFile(draft.slug, draft.cover, "cover");
  void coverFile;
  const post = {
    schema: blogPostSchemaId,
    slug: draft.slug,
    title: draft.title,
    description: draft.description,
    publishedAt: previous?.publishedAt ?? today,
    updatedAt: today,
    author: { name: authorName, role: authorRole },
    keywords: {
      primary: topic.primary,
      secondary: [...new Set([...draft.secondaryKeywords, ...(topic.secondary ?? [])])].filter((k) => k && k !== topic.primary).slice(0, 8),
    },
    search: {
      source: topic.source,
      ...(topicFile.window ? { window: topicFile.window } : {}),
      queries: topic.queries ?? [],
      note: topic.note,
    },
    cover: coverRest,
    blocks: draft.blocks.map((block, index) => (block.type === "image" ? attachImageFile(draft.slug, block, `blocks[${index}]`) : block)),
    faq: draft.faq,
    related: draft.related,
  };

  const verified = verifyQuotes(post);
  const unverified = post.blocks.filter((block) => block.type === "quote" && block.verification !== "verified");
  const linkProblems = checkLinks(post, posts);
  const schemaProblems = validatePost(post, `${post.slug}.json`);
  const problems = [
    ...schemaProblems,
    ...linkProblems.map((item) => `站内链接无效：${item}`),
    ...(verified < minVerifiedQuotes
      ? [`只有 ${verified} 条引文能在受控原文中逐字找到（要求 ≥ ${minVerifiedQuotes}）。请修正引文原文或改为转述：\n${unverified.map((block) => `  - 「${block.text}」（${block.source.canonId}）`).join("\n")}`]
      : []),
  ];
  if (problems.length > 0) {
    throw new Error(`草稿未通过，未写入：\n${problems.map((item) => `- ${item}`).join("\n")}`);
  }

  mkdirSync(postsDirectory, { recursive: true });
  const file = resolve(postsDirectory, `${post.slug}.json`);
  writeFileSync(file, `${JSON.stringify(post, null, 2)}\n`);
  log(`文章已写入 content/blogs/posts/${post.slug}.json（引文 ${verified} 条已核对，${unverified.length} 条标为未核对）`);
  console.log(JSON.stringify({ slug: post.slug, title: post.title, path: `/blogs/${post.slug}`, source: topic.source, verifiedQuotes: verified, unverifiedQuotes: unverified.length, updated: existing }, null, 2));
}

async function main() {
  switch (command) {
    case "pick-topic":
      await runPickTopic();
      return;
    case "check-quote":
      runCheckQuote();
      return;
    case "finalize":
      runFinalize();
      return;
    default:
      throw new Error("用法：node scripts/blog-daily.mjs <pick-topic | check-quote | finalize> …（见文件头注释）");
  }
}

main().catch((error) => {
  console.error(`[blog-daily] 失败：${error.message}`);
  process.exit(1);
});
