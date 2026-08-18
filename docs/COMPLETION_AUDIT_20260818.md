# foxue.ai 总目标完成审计（2026-08-18）

本文件按“可证明才算完成”的原则，逐项审计 foxue.ai 的总目标：公开 GitHub 仓库、Vercel 生产部署、Cloudflare 自动化解析与经藏分发、中文可信佛学 AI、可延续 100 年的保存机制，以及佛陀教说全球作品覆盖率超过 99%。

审计不以计划、意图、页面存在或单次测试替代完成证据。每一项结论必须来自当前远端状态、不可变发行、机器可读清单、公开运行端点或可重复验证器。

## 1. 结论

截至 2026-08-18，总目标**尚未完成**。

已经成立的部分：

- `weitzu-com/foxue.ai` 是公开 GitHub 仓库，默认分支为 `main`；
- 中文可信原型、经藏阅读、问经、覆盖披露、稳定引文和多语种来源管线已经进入主线；
- GBCR v6.18 已建立不可变 GitHub Release 与 Software Heritage Git 快照；
- `canon.foxue.ai` 的 bootstrap 只读 Worker 曾由主线验证上线；
- 经藏固定来源内已有大规模可复算全文、目录、权利和段落资产；
- 本地已完成 R2 原子发布、不可变发行、季度全量恢复演练的下一阶段自动化。

尚未成立的部分：

- Cloudflare R2 尚未完成订阅、建桶和 263,682 个发布对象的首次播种；
- `canon.foxue.ai/ready` 尚无证据达到 200，不能标记为完整经藏分发就绪；
- 新的 R2 发布与季度恢复工作流尚未进入 GitHub 主线；
- Vercel 当前生产部署无法在本次审计环境中重新取证；
- 全球分母的 3,377 项双重复核任务仍没有真人决定；
- 全球作品、全文、中文翻译、权利和质量覆盖率仍为 `null`，因此不能宣称达到 99%；
- 独立机构镜像、离线 WORM 副本和继任维护者年度实操仍缺少证据，因此不能宣称保证运行 100 年。

## 2. 逐项证据矩阵

| 原始要求 | 完成标准 | 当前证据 | 判定 |
|---|---|---|---|
| GitHub 建仓 | 公开仓库可访问、主线存在、维护者有权限 | `weitzu-com/foxue.ai`，仓库 ID `1330028206`，公开，默认分支 `main`；连接账户报告 admin/push 权限 | 已完成 |
| Vercel 部署 | 当前生产部署为 Ready，`www.foxue.ai` 可从公网取得预期版本 | 历史部署与主线记录存在；本次 Vercel 连接器在唯一可见团队中未列出项目，公网网络也不可达 | 当前证据不足 |
| Cloudflare 自动解析 | Zone active、DNS/Redirect 与 Worker 路由可从 API 和公网复核 | 主线 PR #38、#41–#44 记录了 DNS、www canonical 和 bootstrap Worker；本次 Cloudflare API 只读调用被环境审批策略拒绝 | 历史完成，当前状态未复核 |
| R2 经藏分发 | 桶存在；计划中全部对象哈希匹配；`latest` 最后切换；`/ready=200` | 当前仍有 10042 账户资格阻断；主线 README 明确 `/ready` 刻意返回 503 | 未完成 |
| 中文网站 | 核心界面、说明、错误边界和治理内容为中文 | 远端 README、页面和主线 PR 均为中文产品 | 已完成 |
| 佛学 AI 可信性 | 回答回到原典；稳定引文；无证据时降级；不把生成内容冒充经文 | 主线已有问经、经典阅读、稳定定位符、来源/权利披露与本地回退 | 已完成可信原型；非最终全能系统 |
| 收录佛经 | 来源、版本、哈希、权利、可读段落与恢复链可复算 | v6.18：3,377 部作品、3,829 个完整全文表达或见证、5,656,889 个稳定段落；固定来源资产已校验 | 大规模局部完成 |
| 全球 99% | 先冻结全球作品分母，再由独立双重人工复核；五类覆盖率均达到门槛 | 30,797 条异质候选，3,377 项复核任务，真人决定 0；全球覆盖率为 `null` | 未完成，禁止宣称 99% |
| 运行 100 年 | 多故障域副本、开放格式、不可变身份、季度恢复、离线/机构托管和继任者演练均有持续证据 | GitHub 不可变发行与 Software Heritage 已完成；R2、远端季度恢复、离线 WORM、机构镜像和继任者演练未全部完成 | 长期保存链已建立，但未完成 |

## 3. GitHub 当前状态

远端主线在本次审计时指向：

```text
f72d815a400f4e5945c5a3d36e5eb7331bb07a8c
Merge pull request #45 from weitzu-com/codex/emptiness-concept-hub
```

主线已经包含：

- PR #38：Cloudflare v6.18 bootstrap Worker 与健康检查；
- PR #40：GBCR v6.18 不可变发行、Software Heritage 快照和镜像健康检查；
- PR #42–#44：AI/搜索发现、IndexNow、www canonical 与自动提交修复；
- PR #45：跨传统“空”概念证据页；
- PR #46：供 AI 爬虫读取的全站内容地图。

下列本地新文件在远端主线均返回 404，尚未发布：

- `.github/workflows/preservation-release.yml`
- `.github/workflows/cloudflare-r2-release.yml`
- `.github/workflows/preservation-recovery-drill.yml`
- `scripts/publish-corpus-release-s3.mjs`
- `scripts/test-corpus-r2-publisher.mjs`
- `scripts/verify-preservation-recovery.mjs`
- `scripts/test-preservation-recovery.mjs`
- `scripts/select-preservation-release.mjs`
- `scripts/validate-preservation-release-workflow.mjs`
- `scripts/validate-long-term-operations-workflows.mjs`
- `docs/PRESERVATION_RELEASES.md`
- `docs/CLOUDFLARE_R2_RELEASES.md`

这些文件的本地验证已经通过，但本地通过不能替代远端 PR、主线 CI 和生产运行证据。

## 4. 语料覆盖审计

GBCR v6.18 的固定来源成果是真实且重要的，但“固定来源内完成”与“全球佛陀教说作品 99%”不是同一命题。

当前可证明的量：

- 登记作品：3,377；
- 表达或版本见证：3,875；
- 完整来源表达：3,829；
- 至少有一个完整来源的作品：3,350；
- 稳定段落：5,656,889；
- 全球分母候选记录：30,797；
- 全球复核任务：3,377；
- 真人独立决定：0。

因此下列比例必须继续保持 `null`：

- 全球作品覆盖率；
- 全球全文覆盖率；
- 全球中文翻译覆盖率；
- 全球权利可用率；
- 全球质量通过率。

只有 G0–G7 门全部关闭、分母冻结、双人独立复核与仲裁完成、机器可读清单重新发行后，才允许计算并发布全球百分比。

## 5. 百年运行审计

“运行 100 年”不能由任何一家云厂商承诺。可验证的工程定义是：故障被发现、数据可迁移、身份不可替换、至少两名继任者能从隔离副本恢复。

已经具备：

- Git 历史与开放源码；
- GitHub 不可变 Release；
- Software Heritage 独立 Git 快照；
- 源码 tar、Git bundle、清单和双层 SHA-256；
- 只读、可替换的经藏边缘协议；
- 本地通过的季度全量恢复实现。

仍需真实完成：

1. 将三份长期运维工作流合并到主线；
2. 启用 R2 并完成首次原子播种；
3. 从公网证明 `health`、`ready`、manifest、CORS、安全头和只读门禁；
4. 自动恢复任务从 GitHub Release 下载真实 469,942,187 字节归档并成功恢复；
5. 将同一发行写入与 GitHub、Cloudflare 账户隔离的 WORM/冷存储；
6. 由独立机构持有另一副本；
7. 每年至少两名继任维护者完成无原作者参与的从零恢复；
8. 域名、组织、密钥、账单和法定治理具有可执行继任文件。

## 6. 当前外部阻断

### 6.1 GitHub 写入

- 本地 `gh` 2.94.0 可用，但 `weitzu-com` 的本地令牌无效；
- GitHub 连接器具有 admin/push 账户权限，但创建分支调用被运行环境的 `approval policy is never` 拒绝；
- 本地工作树与远端主线不同步且包含大量无关修改，不能安全地整体提交。

解除条件：恢复有效 GitHub 身份，或允许已连接 GitHub 应用执行写操作。随后只提交第 3 节列出的文件，建立独立 PR，等待全量 CI 通过后合并。

### 6.2 Cloudflare R2

- Cloudflare API 连接器连只读查询也被同一审批策略拒绝；
- 先前账户调用返回 R2 错误 10042，表示账户尚无 R2 资格；
- 在订阅、最小权限密钥和四项 GitHub Secrets 存在之前，不能执行真实上传。

解除条件：账户启用 R2；配置 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`；运行 `cloudflare-r2-release`，并以公网验证结果作为完成证据。

## 7. 最终完成门

只有以下全部为真，才可把总目标标记为完成：

- GitHub 主线包含所有生产与恢复自动化，必需检查全部绿色；
- Vercel 当前生产部署 Ready，www canonical、核心页面、API、sitemap 与 AI 入口实测通过；
- Cloudflare Zone active，DNS/Redirect/Worker 路由与配置可从 API 复核；
- R2 中的发布计划对象数量、总字节数和每项 SHA-256 全部匹配；
- `canon.foxue.ai/ready=200`，清单、对象、缓存、CORS、安全头和只读门禁全部通过；
- 最新不可变发行已由定时任务在空环境完整恢复；
- 离线 WORM、机构镜像、密钥继任和年度双维护者演练均有签名证据；
- 全球分母完成真人双重复核与仲裁，五类覆盖指标可计算且均达到既定 99% 门；
- 网站不再出现把目录记录、注疏、疑伪、局部见证或固定来源内比例冒充全球佛陀亲说覆盖的表述。

在这些门全部关闭前，正确表述是：**foxue.ai 已上线中文可信原型并建立长期保存基础，但 R2 完整分发、百年治理闭环与全球 99% 覆盖尚未完成。**
