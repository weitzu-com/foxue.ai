# foxue.ai

全球佛学交流的可信 AI 平台。使命是让每一个问题都能回到可核验的原典，让佛典可以被检索、引用、理解、校订与长期保存。

## 当前阶段

本仓库是 foxue.ai 的中文可信原型，首先交付：

- 从问题回到原典的引证式问经体验；
- 带稳定段落标识和来源说明的经典阅读；
- 可复算、按版页拆分的不可变语料发布，以及只读边缘读取与本地自动降级；
- 数据覆盖、许可证、AI 能力和局限的透明披露；
- 版本化的全球佛典覆盖登记册（GBCR）与公开覆盖 API；
- 可复算的大正藏 T01–T50 三十四个固定子集、2,156 条汉译来源逐文件清单；
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

当前 CBETA 汉文与 SuttaCentral 巴利原文批次可分别校验：

```bash
pnpm verify:cbeta-pilot
pnpm verify:suttacentral-catalog
pnpm verify:suttacentral-dn-catalog
pnpm verify:suttacentral-mn-catalog
pnpm verify:suttacentral-sn-catalog
pnpm verify:suttacentral-an-catalog
pnpm verify:suttacentral-kn-catalog
```

T01–T02 阿含部批次可从固定 CBETA 工作树重新审计：

```bash
pnpm audit:cbeta:agama -- --source-dir=/path/to/xml-p5
```

T03–T04 本缘部批次及作品关系候选可从同一固定工作树重新审计：

```bash
pnpm audit:cbeta:benyuan -- --source-dir=/path/to/xml-p5
```

从固定 CBETA 提交重建受控批次及登记册：

```bash
pnpm build:cbeta-catalog
pnpm import:cbeta --all
pnpm build:suttacentral-catalog
pnpm import:suttacentral --all
pnpm build:suttacentral-dn-catalog
pnpm import:suttacentral:dn --all
pnpm build:suttacentral-mn-catalog
pnpm import:suttacentral:mn --all
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

生产环境设置 `CORPUS_ASSET_BASE_URL=https://canon.foxue.ai` 后读取边缘语料。变量未设置、R2 尚未启用或边缘读取失败时，服务端自动回退到仓库内已核验的 2,388 个完整全文表达或版本见证和 43 个节译、后分、节本、短本、残篇、组件、局部、分离、版本或已知缺文见证，因此经典阅读不依赖单一供应商存活。CBETA 大正藏 T01–T50 三十四个固定来源子集均已逐文件闭合并保留 2,156 个 TEI 来源资产；T33–T50 的根本经、根本律、根本论、根本译本、戒本、羯磨、整经注疏、章节注释、行事钞、含注本、男女众范围、讲说记录、删补本、述记、枢要、再注释、平行论疏、颂疏、因明疏、宗致义记、略疏、末后一颂、节要、补注、复合责任题记、伴随著作、综合义章、同数字经号异作、相关传本、宗派著述、止观、礼赞、仪轨、禅宗语录、公案评唱、宗论、警策、清规、结集与法灭记录、部派论书、佛教史传、论师传、高僧传与尼僧传、史料复用、本编与续集、集撰、失译、未署名、同作品异版及目录责任标签冲突均分层建模，不把后世著述冒充佛陀亲说，也不因题名、作者、宗师、宗派、文类、主题、引文或文本重叠误并作品。固定 SuttaCentral 提交的 7,288 份巴利 root 已全部受控：经藏 5,764 份与 284,702 个原生稳定段落，律藏 422 份、6 个书级表达与 71,557 个可读稳定段落，论藏 1,102 份、七论书级表达与 88,414 个稳定段落；另有 24 份梵文与俗语 root 按 3 个表达保存。经、律、论、疏、史传分别统计，物理文件、经号、文本表达、版本见证、暂定书目实体、书级集合和规范作品始终分层；固定来源内 100% 绝不冒充全球佛经作品覆盖率。

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
- `data/corpus/suttacentral/NOTICE.md` — 巴利五部尼柯耶经藏目录的固定来源、公共领域决定、体裁边界与原生段落标识
- `docs/RECOVERY.md` — 灾难恢复、3-2-1 保存与百年交接演练
- `docs/ANALYTICS.md` — 隐私优先的 GA4、Search Console 与事件口径

机器可读覆盖快照：`GET /api/v1/corpus/coverage`

## 开源与数据许可

- 本仓库代码使用 Apache-2.0 许可证。
- 佛典文本、译文、图像和元数据各自保留来源许可证；代码许可证不覆盖第三方内容。
- 正式收录的每项数据都必须具有来源、版本、哈希和权利记录。
