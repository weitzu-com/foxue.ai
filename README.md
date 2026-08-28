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

当前公开恢复基线为 [`gbcr-v6.22.0`](https://github.com/weitzu-com/foxue.ai/releases/tag/gbcr-v6.22.0)，精确对应提交 `168c78e0ca1f7413dc17937c00027aceee4e9d2b`。仓库已经启用 GitHub Release Immutability；发布后标签和四项资产均不可修改或删除，并有 GitHub 自动签发的发行证明。470,688,854 字节外层归档的 SHA-256 是 `4117dd352606f1f5268e97df0802057ccab1a23c1ae1b2ed62c20ed8b11ca45c`，其中包含源码快照、完整可达 Git 历史、保存清单和内部校验和。首个不可变基线 [`gbcr-v6.18.0`](https://github.com/weitzu-com/foxue.ai/releases/tag/gbcr-v6.18.0) 仍作为历史恢复证据保留。

公开 Git 仓库已通过 [Software Heritage 保存请求 2452194](https://archive.softwareheritage.org/api/1/origin/save/2452194/) 完整归档；Origin SWHID 为 `swh:1:ori:5a6f589df03f216f92122303aa0a427521e77e24`，v6.22 对应完整快照为 [`swh:1:snp:0add4f1457ddf7634cca36714eddee9b7d17a077`](https://archive.softwareheritage.org/api/1/snapshot/0add4f1457ddf7634cca36714eddee9b7d17a077/)。GitHub push webhook 指向 Software Heritage 官方接收端，首次 ping 已返回 200；后续推送会自动触发重新归档。`.github/workflows/preservation-mirrors-health.yml` 每日验证 GitHub Release 的不可变状态、标签目标、四项资产摘要、密码学发行证明及这份 Software Heritage 完整快照，防止 30 天 Actions 临时工件被误作长期副本。

公网复核：

```bash
pnpm verify:preservation-mirrors
gh release verify gbcr-v6.22.0 --repo weitzu-com/foxue.ai
```

## 经藏发布架构

经藏发布以内容寻址的版本目录为单一真相来源。`v1/latest.json` 只负责指向当前版本；版本清单、作品索引、原始 TEI 与逐版页 JSON 一经发布即不可变，并由 SHA-256 清单复核。Cloudflare Worker 仅允许白名单内的 `GET`、`HEAD` 与 `OPTIONS`，拒绝写入和路径穿越。

截至 2026-08-28，Cloudflare 自定义域名 [`canon.foxue.ai`](https://canon.foxue.ai/health) 已由 R2 只读 Worker 提供服务：`/health`、`/ready` 与 `/v1/latest.json` 均从公网返回 200。当前指针是 `gbcr-6.26.0-2b8ab8d5e4fe-eac6c24781dd-a582cf471b7c-dd80008cb1a9`，清单 SHA-256 为 `c94718353e37df5f02d9df6552c4a6b246bd6e6501e933f60869699152124bc2`；清单固定 284,495 个不可变对象、2,892,796,439 字节、4,189 个文本表达、265,225 个阅读版页与 5,945,340 个稳定行段。Worker 只允许白名单内的读取方法。这个三态协议仍将“边缘入口存活”“发行指针可发现”“完整不可变对象已就绪”分开，防止监控与维护者把半完成发布误判为完整保存。`.github/workflows/cloudflare-edge-health.yml` 每日从公网核对 Cloudflare 权威 DNS、Worker 身份、安全头、发行 ID、清单哈希、CORS、只读门禁、Muller《法句经》与 Gemmell《金刚经》代表对象及就绪语义。

生产环境设置 `CORPUS_ASSET_BASE_URL=https://canon.foxue.ai` 后读取边缘语料。变量未设置、R2 尚未启用或边缘读取失败时，服务端自动回退到仓库内已核验的 4,143 个完整全文表达或版本见证和 46 个节译、后分、节本、短本、残篇、组件、局部、分离、版本或已知缺文见证，因此经典阅读不依赖单一供应商存活。当前登记册包含 3,396 个可追踪作品实体或权威候选，其中 3,369 个作品至少有一个完整来源表达。CBETA 大正藏 T01–T55 与 T85 四十个固定来源子集均已逐文件闭合并保留 2,471 个 TEI 来源资产；固定 SuttaCentral 提交中的巴利、印度语与古汉译 root、Esukhia 德格《甘珠尔》001–102 卷，以及经权利核验的现代日英译本继续按 Work、Expression 与 Witness 分层保存。v6.26 新增 William Gemmell 1912 年《金刚经》英译的 1 个完整表达：它复用既有 Vajracchedikā／《金刚经》作品，保存 31 个阅读单元和 95 个稳定段落，不虚构拆分原书合并的第三、四章，也不据 Project Gutenberg 的美国公版声明推断全球公版。当前独立真人决定和自动全球分母变更均为 0；全球作品、全文、中文翻译、权利和质量覆盖率继续保持 `null`，固定来源内的完整性绝不冒充全球佛经作品覆盖率或佛陀逐字亲说比例。

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
