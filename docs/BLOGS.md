# foxue.ai 每日 SEO 博客流水线

最后更新：2026-09-16

## 第一性原理

博客不是为了“多一些页面”，而是回答一个问题：**读者在搜索引擎里真正输入了什么，而我们还没有用原典把它答清楚？**

由此推出三条约束：

1. 选题只来自真实需求。第一来源是 Search Console 最近 90 天的查询数据；没有数据时才回落到一份人工登记的种子关键词表，且种子表在接入 GSC 后要按真实数据重排。
2. 文章仍然是 foxue.ai 的文章。每一条引文都必须能在仓库内受控原文（`content/corpus/**/*.xml`，CBETA TEI）里逐字找到；找不到的句子在页面上明确标注“尚未逐字核对”，不能伪装成“佛经说”。
3. 图文并茂，但图不能撒谎。所有配图由 Grok Imagine 生成，提示词随文章 JSON 保存；画面里不出现文字、Logo、真人肖像。

## 页面

| 路径 | 说明 |
|---|---|
| `/blogs` | 博客索引，`CollectionPage` + `Blog` JSON-LD |
| `/blogs/<slug>` | 文章页，`BlogPosting` + `FAQPage` + `BreadcrumbList` JSON-LD，引文带经号、行段与核对状态 |
| `/blogs/feed.xml` | RSS 2.0 |
| `/sitemap-hubs.xml` | 索引页按 `daily`、文章按 `monthly` 收录 |

站点导航与页脚都已加入“博客”入口；新文章合并后 `geo-auto-submit` 会把 `/blogs`、`/blogs/feed.xml` 与文章 URL 提交到 IndexNow。

## 内容模型

文章存为 `content/blogs/posts/<slug>.json`，Schema 见 `scripts/blog/post-schema.mjs` 与 `src/lib/blogs.ts`。要点：

- `keywords.primary` / `keywords.secondary`：本文覆盖的主次关键词。
- `search`：选题证据。`source` 为 `gsc` 或 `seed`；`queries` 保留当天该关键词簇的曝光、点击、平均位置；`window` 是 GSC 数据窗口。
- `cover` 与正文 `image` 块：`src`（`/blogs/<slug>/…`）、`width`、`height`、`generator`（模型名）、`prompt`。
- `quote` 块：`text`（简体逐字照录）、`source.canonId`（如 `T0251`）、`source.href`（站内原文页）、`verification`（`verified` / `unverified`，由脚本写入，不允许人工改成 verified）。
- `faq`：3–5 条，用于 `FAQPage`。
- `related` 与结尾 `links` 块：只能指向 `scripts/blog/site-links.mjs` 允许清单中的路径或真实存在的经藏版页。

图片文件放在 `public/blogs/<slug>/`，与 JSON 一起提交。

## 流水线（`scripts/blog-daily.mjs`）

```
GSC 90 天数据 ──┐
                ├─→ 机会评分 + 关键词聚簇 ─→ 选题 ─→ Grok 起草（结构化 JSON）
种子关键词 ─────┘                                         │
                                                          ├─→ 引文逐字核对 TEI 原文
                                                          ├─→ 站内链接校验（坏链接降级为文字）
                                                          ├─→ Grok Imagine 生成封面 + 2 张正文图
                                                          └─→ 校验 → 写入 content/blogs/posts、public/blogs、reports/gsc
```

### 选题评分

对每个查询计算 `score = impressions × ctrGap × positionWeight`：

- `ctrGap`：按位置的经验 CTR 与实际 CTR 之差，衡量“有曝光、没点击”的缺口；
- `positionWeight`：4–30 位最高（striking distance），前 3 位与 30 位以后都降权；
- 品牌词（foxue、佛学 ai 等）与已发布文章高度相似的簇会被跳过。

相似查询按字符二元组相似度聚簇，簇头作为主关键词，其余作为次关键词。GSC 无数据、或所有簇都已覆盖时，退回种子表中第一个未覆盖的条目。

### 命令

```bash
pnpm blog:dry-run                                  # 只拉数据、选题，不调用 Grok
pnpm blog:daily                                    # 完整流程（需要 XAI_API_KEY）
node scripts/blog-daily.mjs --topic "无常是什么意思"   # 手动指定主关键词
node scripts/blog-daily.mjs --regenerate-images <slug>  # 用 Grok 重新生成某篇的全部配图
pnpm verify:blogs                                  # 校验全部文章（Schema、图片、链接、引文）
```

`verify:blogs` 已加入 `prebuild` 与 `pnpm verify`：任何一篇文章 Schema 不合法、图片缺失、链接指向不存在的页面、或标了 `verified` 却在原文里找不到，构建都会失败。

## 每日例行任务（`.github/workflows/blog-daily.yml`）

- 时间：每天 06:10 Asia/Shanghai（cron `10 22 * * *` UTC）。也可在 Actions 页手动触发，支持指定主关键词与 dry run。
- 产物：一个 `blog/daily-<date>-<slug>` 分支与 PR，包含文章 JSON、图片与当天的 GSC 快照 `reports/gsc/<date>.json`。**合并前人工过一遍正文与图片**。
- 合并后 Vercel 部署，`geo-auto-submit` 自动向 IndexNow 提交新 URL。

### 需要的配置

| 位置 | 名称 | 说明 |
|---|---|---|
| Repository secret | `XAI_API_KEY` | xAI 密钥，起草与生图都需要；缺失时工作流直接失败 |
| Repository secret | `GSC_SERVICE_ACCOUNT_JSON` | Google 服务账号 JSON（原文或 base64）。在 Google Cloud 启用 Search Console API，创建服务账号并下载密钥；到 Search Console → 设置 → 用户和权限，把服务账号邮箱加为 `sc-domain:foxue.ai` 的用户（受限权限即可）。缺失时回落到种子关键词 |
| Settings → Actions → General | Allow GitHub Actions to create and approve pull requests | 否则 `gh pr create` 会被拒绝 |

可选环境变量见 `.env.example`（模型名、画质、署名等）。

## 编辑守则

- 引文 `unverified` 不是错误，是诚实：页面会显示“尚未逐字核对”。但一篇文章至少要有 2 条 `verified` 引文才值得发布；否则应改选题或改引文后重跑。
- 不要手工把 `unverified` 改成 `verified`；重跑脚本或修正引文文本。
- 不要在文章里链接站外；不要放入未经 Grok 生成、或没有保存提示词的图片。
- `content/blogs/seed-keywords.json` 中每条种子都必须能用仓库内原文作答，`anchors` 必须是真实页面（`verify:blogs` 会检查）。
