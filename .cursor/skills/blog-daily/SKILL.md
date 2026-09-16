---
name: blog-daily
description: 每日一篇 SEO 博客的完整流程：读 Search Console 数据选题 → 编辑（Cursor Agent，署名 leizi）回到原典撰文 → 生成配图 → 逐字核对引文 → 开 PR。当任务是“写今天的博客”“blog daily”或定时器触发时使用。
---

# 每日 SEO 博客（编辑：leizi）

文章由你——Cursor Agent——亲自撰写，不调用任何第三方文本模型。理由来自第一性原理：文章的价值在于“每一句引文都能回到原典”，而你可以直接读仓库内的受控原文（`data/corpus/cbeta/*.xml`）、用脚本逐字核对，外部模型做不到。配图同样由你用 `GenerateImage` 工具生成。

脚本只做机械、可复核的事：`scripts/blog-daily.mjs`（选题 / 核对引文 / 落盘校验）。详见 `docs/BLOGS.md`。

## 流程

工作目录是仓库根目录。所有中间文件放在 `/tmp`，只有 `content/blogs/posts/<slug>.json`、`public/blogs/<slug>/*`、`reports/gsc/<date>.json` 进入仓库。

### 1. 选题

```bash
git fetch origin main && git checkout -b blog/daily-$(date +%F) origin/main
pnpm install --frozen-lockfile
node scripts/blog-daily.mjs pick-topic --out /tmp/topic.json
```

- 有 `GSC_SERVICE_ACCOUNT_JSON` 时，选题来自最近 90 天 Search Console 查询：曝光高、点击率低于该位置应有水平、排名 4–30 位、且尚未被已发布文章覆盖的关键词簇。快照写入 `reports/gsc/<date>.json`，一并提交。
- 没有凭据时回落到 `content/blogs/seed-keywords.json` 中第一个未覆盖的条目。
- 读 `/tmp/topic.json`：`topic.primary` 是主关键词，`topic.secondary` 是次关键词，`topic.anchors` 是建议内链，`existingPosts` 是已发布文章（避免重复，可作内链）。

### 2. 找原文，先核对再落笔

写之前先确定要引的句子，并逐字核对：

```bash
node scripts/blog-daily.mjs check-quote --canon T0251 "色不异空，空不异色，色即是空，空即是色"
```

- 引文用**简体逐字照录**，脚本会做简繁与标点归一后在对应 TEI 文件中匹配。
- 通过的才能写成 `quote` 块；核对不到的改为转述并说明“大意”。至少 2 条 `verified` 引文，否则 `finalize` 会拒绝写入。
- 查原文：`data/corpus/cbeta/T08n0251.xml` 这类文件；站内原文页路径形如 `/jingzang/xinjing/001-0848c`（版页格式 `卷-页栏`），可用 `rg` 在 `src/data/corpus-folio-existence.generated.json` 中确认版页存在。

### 3. 撰写草稿 `/tmp/draft.json`

格式见 `scripts/blog/post-schema.mjs` 顶部注释。要求：

- 读者是把这个问题输进搜索引擎的普通人：第一段直接回答问题，再展开。
- 结构：原文位置 → 字面意思 → 语境中的意思 → 常见误读 → 与生活的关系。不写鸡汤，不下宗派断言。
- 正文 `blocks`：≥ 2 个 `heading`(level 2)、≥ 2 个 `quote`、恰好 2 个 `image`（文件名 `figure-1.jpg`、`figure-2.jpg`）、1 个 `callout`（说明引文核对方式）、结尾 1 个 `links`（标题“回到原典”）。全文 1500–2500 汉字。
- 行内只允许 `**加粗**` 与 `[文字](站内路径)`。站内链接只能用 `scripts/blog/site-links.mjs` 的清单或真实经藏版页路径；不链接站外。
- `title` 含主关键词、≤ 40 汉字；`description` 含主关键词、80–140 汉字；`faq` 3–5 条，答案短、可被摘录；`related` 2–6 条。
- `slug`：小写拼音连字符，不与 `existingPosts` 重复。
- 不编造出处、不编造学术共识、不用“佛陀说过”包装网络流行语；流行说法与原典不符时直接写“原文没有这句”。

### 4. 生成配图

用 `GenerateImage` 生成 3 张图，然后复制到 `public/blogs/<slug>/`：

| 文件 | 比例 | 用途 |
|---|---|---|
| `cover.jpg` | 16:9 | 封面 |
| `figure-1.jpg` | 4:3 | 正文第一张 |
| `figure-2.jpg` | 4:3 | 正文第二张 |

扩展名以文件**实际格式**为准（工具即使被要求 `.png` 也常输出 JPEG；`finalize` 会检查并报错）。可用 `node --input-type=module -e 'import {imageDimensions} from "./scripts/blog/images.mjs"; …'` 或 `file` 命令确认。

提示词用英文，写具体场景、构图、材质、光线、风格（ink wash、film photography、paper texture、negative space 等），风格克制、留白、契合“回到原典”的沉静气质。画面中**不得**出现文字、Logo、真人肖像，也不要错误使用宗教符号。把最终提示词原样写进草稿的 `prompt` 字段，`alt` 用中文描述画面并自然带上关键词。

### 5. 落盘、校验

```bash
node scripts/blog-daily.mjs finalize --draft /tmp/draft.json --topic /tmp/topic.json
node scripts/verify-blogs.mjs
pnpm lint && pnpm typecheck
```

`finalize` 会逐条核对引文并写入 `verification`、校验所有站内链接、读取图片尺寸、校验 Schema；任何一项不过都不写入，按提示修改草稿后重跑。

### 6. 提交并开 PR

```bash
git add content/blogs public/blogs reports/gsc
git commit -m "blog: <title>"
git push -u origin HEAD
```

用 PR 工具开 PR（base `main`），标题 `blog: <title>`，正文写明：路径、选题来源（gsc / seed）、已核对引文数、未核对引文数、配图生成方式。合并由人工完成。

## 不要做的事

- 不要手工把 `unverified` 改成 `verified`。
- 不要放入没有 `prompt` 的图片，不要用站外图片。
- 不要为了凑数改写原文；宁可少引一条。
