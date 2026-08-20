# foxue.ai SEO PDCA 发布闭环清单

日期：2026-08-20（星期四）  
工作树：`/Users/weiqinguang/Desktop/03_工作_工具/03_网站项目/foxue.ai_main_20260820`  
本地修复分支：`codex/seo_metadata_alignment`  
本地修复 HEAD：`b4344207412db15d58f63acc409fce7296509c7b`

## 目标

把 SEO 修复从“本地通过”推进到“生产生效且可证明生效”。

第一性原理上，这件事只有四个阶段：

1. Plan：找出线上真实问题与根因
2. Do：在代码里修正问题
3. Check：在本地生产构建上证明修复成立
4. Act：让修复进入真正触发生产部署与线上复核的链路

本文件只负责第 4 步的执行闭环。

## 当前状态

### Plan：已完成

审计报告已写入：

- [seo-audit-2026-08-20.md](/Users/weiqinguang/Desktop/03_工作_工具/03_网站项目/foxue.ai_main_20260820/reports/seo-audit-2026-08-20.md)

### Do：已完成

本地分支已包含以下修复：

- `robots.txt` 统一到单一 `sitemap-index.xml`
- `llms.txt` / `llms-full.txt` 统一 canonical 主域到 `https://www.foxue.ai`
- `ai.txt` 改为 route 输出，并补齐 canonical、原则入口、透明页入口
- `ai.txt` 收紧训练权利边界，不再授予 blanket training permission
- `/gainian` 与概念 Hub 页面恢复静态生成与页面级 metadata / JSON-LD
- `/fenmu` 重构为静态外壳 + 客户端查询面板
- `/api/health` 增加 `noindex` 与发布指纹
- 生产核验脚本与 Playwright SEO 护栏已同步更新

### Check：已完成

本地验证结果：

- `pnpm typecheck`：通过
- `pnpm lint`：通过
- `pnpm build`：通过
- `pnpm test:seo:e2e`：17 passed
- `pnpm verify:seo:local-production`：通过

关键验证点已被本地生产构建证明：

- `/gainian` 与概念子页都已生成
- `robots.txt` 只声明 `https://www.foxue.ai/sitemap-index.xml`
- `ai.txt` 已包含训练权利约束
- `/api/health` 已包含 `noindex` 与 source commit/ref
- 关键页 canonical / `og:url` / JSON-LD / sitemap 进入情况均已通过验证

## Act：当前未闭环的根因

线上仍未修复，不是因为代码没改完，而是因为修复还没进入触发正式部署的链路。

### 证据 1：质量工作流只在 `main` push 或 PR 上运行

见：

- [quality.yml](/Users/weiqinguang/Desktop/03_工作_工具/03_网站项目/foxue.ai_main_20260820/.github/workflows/quality.yml:1)

关键条件：

- `push.branches: [main]`
- `pull_request`

这意味着：本地单独分支不 push、不提 PR，就不会进入完整质量门。

### 证据 2：生产 Google/SEO 复核只在正式部署事件上运行

见：

- [google-integrations.yml](/Users/weiqinguang/Desktop/03_工作_工具/03_网站项目/foxue.ai_main_20260820/.github/workflows/google-integrations.yml:1)

关键条件：

- `deployment_status`
- 仅当 `environment_url` 以 `https://www.foxue.ai` 开头，或 deployment environment 为 `production`

这意味着：没有真正的正式部署事件，就不会自动验证线上 SEO 输出。

### 证据 3：当前修复分支根本不在远端

本地检查结果：

- 远端 `origin` 存在
- 远端 `main` HEAD：`4212dbb0ee39bb3e3080ba5d2de81e1fbfad53b9`
- 本地修复分支 HEAD：`b4344207412db15d58f63acc409fce7296509c7b`
- `origin` 上不存在 `codex/seo_metadata_alignment`

结论：

- 当前修复还停留在本地工作树
- GitHub Actions 和 Vercel 都没有机会拿到这份修复代码

### 证据 4：当前 Vercel 连接上下文里没有可直接操作的项目

在当前工具上下文里：

- Vercel 可见 team：`aipy`
- 该 team 下返回项目数：`0`

结论：

- 我当前不能直接从这个工具上下文发起受控的 Vercel 项目部署
- 即使代码本地已通过，也还缺“把代码送到生产项目”的那一步

## 生产闭环步骤

### Gate A：把修复送入远端代码链

1. 将本地修复分支 push 到 `origin`
2. 基于该分支创建 PR，目标分支为 `main`
3. 确认 PR 触发质量工作流

验收标准：

- 远端存在 `codex/seo_metadata_alignment` 分支
- PR 可见
- `quality` 工作流开始运行

### Gate B：通过代码门禁

必须通过：

- `pnpm verify`
- `pnpm test:seo:e2e`
- `pnpm verify:seo:local-production`
- 以及 `quality.yml` 中的完整检查链

验收标准：

- PR / main 上的 `quality` 工作流为绿色

### Gate C：进入 Vercel 正式部署

1. 合并 PR 到 `main`
2. 确认 Vercel 生产部署从合并后的 commit 发起
3. 确认正式域名 `https://www.foxue.ai` 指向新部署

验收标准：

- 生产部署 commit 与已合并 commit 一致
- 正式域名输出的 source commit/ref 与新版本一致

### Gate D：触发生产 SEO 复核

部署成功后，应触发：

- `google-integrations.yml`

验收标准：

- `deployment_status` 事件触发
- 线上 SEO / GA4 / GSC / sitemap index / release provenance 校验全部通过

## 生产验收检查单

部署完成后，至少复核以下真实线上输出：

1. `https://www.foxue.ai/gainian` 返回 `200`
2. `https://www.foxue.ai/robots.txt` 只出现一个 `Sitemap:`，且值为 `https://www.foxue.ai/sitemap-index.xml`
3. `https://www.foxue.ai/ai.txt`
   - 包含 `Canonical site: https://www.foxue.ai`
   - 包含 `Not granted by this file:`
   - 不再包含 blanket training permission 的旧表述
4. `https://www.foxue.ai/api/health`
   - 带 `X-Robots-Tag: noindex, nofollow`
   - 带 source commit/ref 相关发布指纹
5. `https://www.foxue.ai`、`/wenjing`、`/fugai`、`/fenmu`、`/touming`、`/yuanze`
   - title / description 正确
   - canonical 自指
   - `og:url` 自指
   - 页面级 JSON-LD 存在

## 最终判断标准

只有同时满足下面两条，才能称为“SEO PDCA 已闭环”：

1. 本地代码通过全部相关验证
2. 生产站点的真实输出与本地验证目标一致

当前状态只满足第 1 条，还不满足第 2 条。

## 下一步最小动作

如果目标是尽快把修复真正送到线上，最小动作不是再写代码，而是：

1. push 当前修复分支  
2. 发起到 `main` 的 PR  
3. 让 `quality` 和正式部署链真正跑起来

在这三步完成之前，继续做本地 SEO 微调，对正式域名都不会产生结果。
