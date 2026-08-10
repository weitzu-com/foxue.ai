# foxue.ai 灾难恢复与百年交接手册

本手册是 foxue.ai 在原维护团队、代码托管、部署平台或域名服务不可用时的恢复入口。目标不是假设任何供应商能存在 100 年，而是确保每一层都可替换、每一份关键资产都可验证、下一代维护者不依赖口述记忆。

## 1. 恢复目标

| 资产 | 恢复点目标（RPO） | 恢复时间目标（RTO） | 最低副本 |
|---|---:|---:|---:|
| 源码与治理文档 | 每次主分支提交 | 4 小时 | 3 份、2 种介质、1 份异地 |
| GBCR 登记册与快照 | 每个版本 | 4 小时 | Git 历史、对象存储、离线介质 |
| 只读经典阅读站 | 最近稳定发布 | 24 小时 | 可从源码独立构建 |
| 域名与 DNS | 最近导出的受控配置 | 4 小时 | 注册商账户、加密离线记录、继任托管 |
| 用户数据（未来） | 24 小时以内 | 24 小时 | 加密备份；当前版本尚无账户数据 |

“3-2-1”是最低线：至少 3 份副本、2 种介质、1 份异地。GitHub Actions 工件会过期，只能作为临时副本。

## 2. 保存包内容

运行：

```bash
pnpm preserve
```

输出目录 `artifacts/preservation/<commit>/` 包含：

- `*-source.tar`：该提交的干净源码、文档和受控数据；
- `*-history.bundle`：可克隆的 Git 历史；
- `preservation-manifest.json`：提交、时间、大小、关键资产和 SHA-256；
- `SHA256SUMS`：逐文件完整性校验。

保存包不包含 `.env`、访问令牌、平台密钥、用户数据或未经许可的第三方全文。

## 3. 从零恢复代码

先核验：

```bash
shasum -a 256 -c SHA256SUMS
git bundle verify foxue.ai-*-history.bundle
```

从 Git 历史恢复：

```bash
git clone foxue.ai-*-history.bundle foxue.ai
cd foxue.ai
corepack enable
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm build
```

若 Git 工具不可用，可直接解开 `source.tar`。运行环境以 `package.json` 的 Node 与 pnpm 版本为准；当前基线是 Node 22.x 和 pnpm 11.16.0。

## 4. 恢复 GBCR 与佛典数据

1. 核对 `data/gbcr/checksums.sha256`。
2. 运行 `pnpm verify:corpus`，验证登记册结构、来源提交、权利状态和统计纪律。
3. 有网络时运行 `pnpm verify:upstream-snapshots`，从固定提交复算 CBETA 与 SuttaCentral 候选路径摘要。
4. 运行 `pnpm verify:cbeta-pilot`，核对首批完整 TEI 文件的哈希、头部、来源声明和代表性短语。
5. 不得把候选文件数升级为作品分母；Work、Expression 与 Witness 的人工裁决日志必须随下一版登记册保存。
6. 未保存的第三方全文从权利允许的原始来源重建；不能证明许可时，只恢复目录与来源链接。

## 5. 恢复网站

平台无关的最低恢复方式：在任意支持 Node 22 的环境执行 `pnpm build` 和 `pnpm start`。当前生产平台是 Vercel，但代码不依赖专有运行时才能阅读三部样本与覆盖登记册。

Vercel 恢复顺序：

1. 新建 Next.js 项目并连接恢复后的 Git 仓库；
2. 生产分支设为 `main`，Node 设为 22.x；
3. 设置 `NEXT_PUBLIC_SITE_URL=https://foxue.ai`；
4. 部署后验证 `/api/health`、`/api/v1/corpus/coverage`、`/fugai` 和三个阅读页；
5. 通过后再切换 DNS，失败则保留原站或静态维护页。

## 6. 恢复域名、DNS 与 TLS

当前域名由 Cloudflare Registrar 管理，启用注册锁、自动续费与 DNSSEC。恢复时：

1. 先确认组织控制的注册邮箱、双因素认证和继任人权限；
2. 核对 apex 与 `www` 指向生产托管目标；
3. 启用代理前先验证平台域名所有权和 TLS；
4. DNSSEC 迁移必须按“新 DNSKEY → 新 DS → 验证 → 移除旧 DS”的顺序，避免签名中断；
5. 用独立解析器核对 DS、DNSKEY、A/CNAME 与 HTTPS；
6. 不在本仓库记录账户邮箱、恢复码、API 令牌或付款信息。

域名若不可恢复，应启用预先登记的备用域名，并在所有保存包、公共目录和合作机构页面发布迁移声明；旧稳定段落 ID 保持不变。

## 7. 密钥与账户继任

本仓库只记录密钥名称，不记录值。未来至少需要受控保管：GitHub、Vercel、Cloudflare、对象存储、监控和支付账户。每个账户必须有：

- 组织所有权而非个人永久所有权；
- 两名以上受托人和最小权限；
- 硬件安全密钥与密封恢复流程；
- 年度权限复核、离任撤权和继任演练；
- 访问日志与紧急操作的双人复核。

## 8. 恢复演练

- 每次主分支构建：生成保存包并验证 Git bundle。
- 每季度：在全新临时环境从保存包恢复、构建并运行测试。
- 每半年：导出 DNS、账户与对象存储清单，验证异地副本可读。
- 每年：由未参与日常维护的人执行完整接管演练，记录用时、失败点与改进项。
- 每五年：迁移一次保存介质与哈希算法策略，保留旧校验并追加新校验。

任何演练都不得在未确认目标时覆盖生产 DNS、删除现有部署或暴露真实密钥。先在隔离环境恢复，验证通过后再执行受控切换。
