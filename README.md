# foxue.ai

全球佛学交流的可信 AI 平台。使命是让每一个问题都能回到可核验的原典，让佛典可以被检索、引用、理解、校订与长期保存。

## 当前阶段

本仓库是 foxue.ai 的中文可信原型，首先交付：

- 从问题回到原典的引证式问经体验；
- 带稳定段落标识和来源说明的经典阅读；
- 可复算、按版页拆分的不可变语料发布，以及只读边缘读取与本地自动降级；
- 数据覆盖、许可证、AI 能力和局限的透明披露；
- 版本化的全球佛典覆盖登记册（GBCR）与公开覆盖 API；
- 可复算的 881 条汉译经藏候选逐文件清单；
- 可被下一代维护者接管的开放代码与文档。

尚未接入的能力会明确标为“筹建中”，不会用生成内容冒充佛经或学术共识。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

## 质量检查

```bash
pnpm verify
```

登记册还可单独校验：

```bash
pnpm verify:corpus
```

当前 CBETA 完整原文批次可单独校验：

```bash
pnpm verify:cbeta-pilot
```

从固定 CBETA 提交重建受控批次及登记册：

```bash
pnpm build:cbeta-catalog
pnpm import:cbeta --all
pnpm snapshot:upstream
pnpm build:corpus-catalog
pnpm verify:corpus-catalog
```

构建并逐对象校验可发布的经藏版本：

```bash
pnpm build:corpus-release
pnpm verify:corpus-release
```

检查 Cloudflare Worker 的类型和部署包（不修改远端）：

```bash
pnpm cloudflare:types:check
pnpm cloudflare:check
```

联网复算固定上游提交的目录候选快照：

```bash
pnpm verify:upstream-snapshots
```

生成可离线恢复的源码、Git 历史与完整性清单：

```bash
pnpm preserve
```

## 经藏发布架构

经藏发布以内容寻址的版本目录为单一真相来源。`v1/latest.json` 只负责指向当前版本；版本清单、作品索引、原始 TEI 与逐版页 JSON 一经发布即不可变，并由 SHA-256 清单复核。Cloudflare Worker 仅允许白名单内的 `GET`、`HEAD` 与 `OPTIONS`，拒绝写入和路径穿越。

生产环境设置 `CORPUS_ASSET_BASE_URL=https://canon.foxue.ai` 后读取边缘语料。变量未设置、R2 尚未启用或边缘读取失败时，服务端自动回退到仓库内已经核验的 24 个完整文本，因此经典阅读不依赖单一供应商存活。

已授权的维护者在通过校验后可执行：

```bash
pnpm publish:corpus:r2
```

发布器先上传全部不可变对象，最后才更新 `v1/latest.json`，避免读者看到半完成版本。完整恢复顺序见 `docs/RECOVERY.md`。

## 项目文档

完整产品、语料、AI、治理和百年保存方案见：

- `docs/foxue.ai_建站方案_v1.0_20260811.md`
- `data/gbcr/README.md` — 99% 覆盖统计纪律、版本与完整性规则
- `data/corpus/cbeta/NOTICE.md` — 首批完整原文的来源、非商业限制与字节规范化
- `docs/RECOVERY.md` — 灾难恢复、3-2-1 保存与百年交接演练
- `docs/ANALYTICS.md` — 隐私优先的 GA4、Search Console 与事件口径

机器可读覆盖快照：`GET /api/v1/corpus/coverage`

## 开源与数据许可

- 本仓库代码使用 Apache-2.0 许可证。
- 佛典文本、译文、图像和元数据各自保留来源许可证；代码许可证不覆盖第三方内容。
- 正式收录的每项数据都必须具有来源、版本、哈希和权利记录。
