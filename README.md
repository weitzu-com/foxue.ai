# foxue.ai

全球佛学交流的可信 AI 平台。使命是让每一个问题都能回到可核验的原典，让佛典可以被检索、引用、理解、校订与长期保存。

## 当前阶段

本仓库是 foxue.ai 的中文可信原型，首先交付：

- 从问题回到原典的引证式问经体验；
- 带稳定段落标识和来源说明的经典阅读；
- 可复算、按版页拆分的不可变语料发布，以及只读边缘读取与本地自动降级；
- 数据覆盖、许可证、AI 能力和局限的透明披露；
- 版本化的全球佛典覆盖登记册（GBCR）与公开覆盖 API；
- 可复算的大正藏 T01–T55 与 T85 四十个固定子集、2,471 条汉译来源逐文件清单；
- 可逐卷字节还原的德格《甘珠尔》001–102 卷、1,122 个顶层表达、1,223 个正文切片与稳定版页行号；
- 固定 SuttaCentral 提交中的 272 份古汉译 root、7 个既有作品数字见证与 38,644 个原生稳定段落；
- 全部 3,377 部登记作品的佛陀教说范围规则审计，经、密续／陀罗尼、律、论、注疏史传与疑伪文本分层；
- 版本化全球分母标准、30,797 条异质来源记录、7 类外部来源空白和 3,377 项独立双重复核队列；
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
pnpm verify:derge
pnpm verify:gbcr:v6.15
pnpm verify:gbcr:v6.16
pnpm verify:buddha-word-scope
pnpm verify:gbcr:v6.17
pnpm verify:global-denominator-governance
pnpm verify:gbcr:v6.18
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
pnpm verify:suttacentral:lzh
pnpm verify:suttacentral-lzh-catalog
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
pnpm cloudflare:bootstrap:check
pnpm verify:cloudflare-edge
```

联网复算固定上游提交的目录候选快照：

```bash
pnpm verify:upstream-snapshots
DERGE_KANGYUR_DIR=/path/to/derge-kangyur pnpm verify:derge:upstream
```

生成可离线恢复的源码、Git 历史与完整性清单：

```bash
pnpm preserve
```

### 长期保存镜像

GBCR v6.18 的公开恢复基线固定在 [`gbcr-v6.18.0`](https://github.com/weitzu-com/foxue.ai/releases/tag/gbcr-v6.18.0)，对应 `main` 提交 `8f2a8a7fa3dd88cfbfd0fd12fe82190575cfc1ff`。仓库已经启用 GitHub Release Immutability；发布后标签和四项资产均不可修改或删除，并有 GitHub 自动签发的发行证明。469,942,187 字节外层归档的 SHA-256 是 `f66f8988cff5492a12c38704b5a4f56b1a47f4e76bc6a5b161ed9659933c26fd`，其中包含源码快照、完整可达 Git 历史、保存清单和内部校验和。

公开 Git 仓库也已通过 [Software Heritage 保存请求 2428947](https://archive.softwareheritage.org/api/1/origin/save/2428947/) 完整归档；Origin SWHID 为 `swh:1:ori:5a6f589df03f216f92122303aa0a427521e77e24`，首个完整快照为 [`swh:1:snp:37c001ea9c766f079f18fe995b29929879f6f815`](https://archive.softwareheritage.org/api/1/snapshot/37c001ea9c766f079f18fe995b29929879f6f815/)。GitHub push webhook 指向 Software Heritage 官方接收端，首次 ping 已返回 200；后续推送会自动触发重新归档。`.github/workflows/preservation-mirrors-health.yml` 每日验证 GitHub Release 的不可变状态、标签目标、四项资产摘要、密码学发行证明及这份 Software Heritage 完整快照，防止 30 天 Actions 临时工件被误作长期副本。

公网复核：

```bash
pnpm verify:preservation-mirrors
gh release verify gbcr-v6.18.0 --repo weitzu-com/foxue.ai
```

## 经藏发布架构

经藏发布以内容寻址的版本目录为单一真相来源。`v1/latest.json` 只负责指向当前版本；版本清单、作品索引、原始 TEI 与逐版页 JSON 一经发布即不可变，并由 SHA-256 清单复核。Cloudflare Worker 仅允许白名单内的 `GET`、`HEAD` 与 `OPTIONS`，拒绝写入和路径穿越。

截至 2026-08-16，Cloudflare 自定义域名 [`canon.foxue.ai`](https://canon.foxue.ai/health) 已上线 bootstrap 只读 Worker：`/health` 与 `/v1/latest.json` 返回当前 GBCR v6.18 发行事实，`/ready` 在 R2 尚未首次订阅和播种时刻意返回 503。这个三态协议把“边缘入口存活”“发行指针可发现”“完整不可变对象已就绪”分开，防止监控与维护者把半完成发布误判为完整保存。`.github/workflows/cloudflare-edge-health.yml` 每日从公网核对 Cloudflare 权威 DNS、Worker 身份、安全头、发行 ID、清单哈希、CORS、只读门禁与就绪语义。

生产环境设置 `CORPUS_ASSET_BASE_URL=https://canon.foxue.ai` 后读取边缘语料。变量未设置、R2 尚未启用或边缘读取失败时，服务端自动回退到仓库内已核验的 3,829 个完整全文表达或版本见证和 46 个节译、后分、节本、短本、残篇、组件、局部、分离、版本或已知缺文见证，因此经典阅读不依赖单一供应商存活。CBETA 大正藏 T01–T55 与 T85 四十个固定来源子集均已逐文件闭合并保留 2,471 个 TEI 来源资产；T54 的 9 份外教资料可检索阅读但明确排除于佛教经典及佛陀亲说覆盖分子，T55 的 42 份经录、请来目录与章疏书目作为佛教知识史作品保存，T85 的 192 份古逸与疑似部记录则在写本校勘前保持 192 个暂定作品。它们全部不标成佛陀逐字亲说。固定 SuttaCentral 提交的 7,288 份巴利 root 已全部受控：经藏 5,764 份与 284,702 个原生稳定段落，律藏 422 份、6 个书级表达与 71,557 个可读稳定段落，论藏 1,102 份、七论书级表达与 88,414 个稳定段落；另有 24 份梵文与俗语 root 按 3 个表达保存，272 份古汉译 root 按 4 个完整表达和 3 个局部见证复用 7 个既有作品，保存 38,644 个稳定段落而不新增作品。Esukhia 固定提交中的德格《甘珠尔》001–102 卷也已按 1,122 个顶层 D 编号、1,223 个可逆切片、851 个 BDRC 链接作品候选与 458,913 个稳定行段纳入；第 103 卷及 76 个组件标记只作目录与结构证据。GBCR v6.18 继承 v6.17 对 3,377/3,377 部登记作品的保守规则分类，并新增版本化全球分母治理：七个冻结来源合计 30,797 条计量单位不同且互相重叠的候选记录，另登记七类外部来源空白；3,377 部作品全部进入范围与身份双重复核队列，独立真人决定和自动分母变更均为 0。全球作品、全文、中文翻译、权利和质量覆盖率继续保持 `null`；固定来源内的分类与 100% 绝不冒充全球佛经作品覆盖率或佛陀逐字亲说比例。

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
- `docs/GLOBAL_DENOMINATOR_REVIEW_PROTOCOL.md` — 全球作品分母、双人独立复核、仲裁与 G0–G7 发布门

机器可读覆盖快照：`GET /api/v1/corpus/coverage`

## 开源与数据许可

- 本仓库代码使用 Apache-2.0 许可证。
- 佛典文本、译文、图像和元数据各自保留来源许可证；代码许可证不覆盖第三方内容。
- 正式收录的每项数据都必须具有来源、版本、哈希和权利记录。
