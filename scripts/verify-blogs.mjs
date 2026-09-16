#!/usr/bin/env node
// 校验 content/blogs：文章结构、图片文件与尺寸、站内链接真实存在、
// 标为 verified 的引文确实能逐字核对到受控原文、种子关键词与链接清单可用。

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { imageDimensions } from "./blog/images.mjs";
import { validatePost } from "./blog/post-schema.mjs";
import { verifyQuote } from "./blog/quote-check.mjs";
import { collectInternalHrefs, curatedSiteLinks, validateInternalHref } from "./blog/site-links.mjs";

const root = process.cwd();
const postsDirectory = resolve(root, "content/blogs/posts");
const failures = [];
const fail = (message) => failures.push(message);

const fileNames = existsSync(postsDirectory) ? readdirSync(postsDirectory).filter((name) => name.endsWith(".json")).sort() : [];
const posts = [];
for (const fileName of fileNames) {
  try {
    const post = JSON.parse(readFileSync(resolve(postsDirectory, fileName), "utf8"));
    posts.push(post);
    if (fileName !== `${post.slug}.json`) fail(`${fileName}: 文件名必须与 slug 一致`);
  } catch (error) {
    fail(`${fileName}: 不是合法 JSON（${error.message}）`);
  }
}

const slugs = new Set();
for (const post of posts) {
  const fileName = `${post.slug}.json`;
  if (slugs.has(post.slug)) fail(`${fileName}: slug 重复`);
  slugs.add(post.slug);
  failures.push(...validatePost(post, fileName));

  const images = [post.cover, ...post.blocks.filter((block) => block.type === "image")].filter(Boolean);
  for (const image of images) {
    if (!image?.src) continue;
    const file = resolve(root, "public", image.src.replace(/^\//, ""));
    if (!existsSync(file)) {
      fail(`${fileName}: 图片文件不存在 ${image.src}`);
      continue;
    }
    if (statSync(file).size > 4 * 1024 * 1024) fail(`${fileName}: 图片超过 4MB ${image.src}`);
    try {
      const dimensions = imageDimensions(readFileSync(file));
      if (dimensions.width !== image.width || dimensions.height !== image.height) {
        fail(`${fileName}: ${image.src} 尺寸 ${dimensions.width}×${dimensions.height} 与登记 ${image.width}×${image.height} 不一致`);
      }
      if (dimensions.width < 1024) fail(`${fileName}: ${image.src} 宽度不足 1024px，不满足高质量配图要求`);
    } catch (error) {
      fail(`${fileName}: 无法读取图片 ${image.src}（${error.message}）`);
    }
  }

  for (const href of collectInternalHrefs(post)) {
    const result = validateInternalHref(href, { root, posts });
    if (!result.ok) fail(`${fileName}: 站内链接无效 ${href}（${result.reason}）`);
  }

  for (const [index, block] of post.blocks.entries()) {
    if (block.type !== "quote") continue;
    const result = verifyQuote({ text: block.text, canonId: block.source?.canonId }, root);
    if (block.verification === "verified" && result.status !== "verified") {
      fail(`${fileName}: blocks[${index}] 标为已核对，但无法在受控原文中逐字找到「${block.text.slice(0, 20)}…」（${result.reason}）`);
    }
    if (block.verification === "unverified" && result.status === "verified") {
      fail(`${fileName}: blocks[${index}] 可以逐字核对，应标为 verified`);
    }
  }
}

// 链接清单里的页面必须真实存在（app 路由或经藏作品）。
for (const item of curatedSiteLinks) {
  const routeFile = resolve(root, "src/app", item.href.replace(/^\//, ""), "page.tsx");
  const work = /^\/jingzang\/([a-z0-9-]+)(?:\/([0-9]{3}-[0-9]{4}[a-z]))?$/.exec(item.href);
  if (!existsSync(routeFile) && !(work && validateInternalHref(item.href, { root, posts }).ok)) {
    fail(`site-links: 链接清单中的页面不存在 ${item.href}`);
  }
}

const seedFile = resolve(root, "content/blogs/seed-keywords.json");
if (!existsSync(seedFile)) {
  fail("缺少 content/blogs/seed-keywords.json");
} else {
  const seeds = JSON.parse(readFileSync(seedFile, "utf8")).seeds ?? [];
  if (seeds.length < 5) fail("种子关键词少于 5 条，每日例行任务会很快无题可写");
  const primaries = new Set();
  for (const seed of seeds) {
    if (!seed.primary) fail("种子关键词缺少 primary");
    if (primaries.has(seed.primary)) fail(`种子关键词重复：${seed.primary}`);
    primaries.add(seed.primary);
    for (const href of seed.anchors ?? []) {
      const result = validateInternalHref(href, { root, posts });
      if (!result.ok) fail(`种子关键词「${seed.primary}」的锚点无效 ${href}（${result.reason}）`);
    }
  }
}

if (failures.length > 0) {
  console.error(`博客校验失败（${failures.length} 项）：`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`博客校验通过：${posts.length} 篇文章，${curatedSiteLinks.length} 个允许的站内链接。`);
