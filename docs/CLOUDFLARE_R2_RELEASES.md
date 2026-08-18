# foxue.ai Cloudflare R2 原子发布协议

本协议定义 R2 首次开通以及后续经藏版本发布的自动化路径。R2 是在线内容分发副本，不是百年保存的唯一副本，也不改变 GBCR 全球覆盖率的统计门槛。

## 1. 为什么新增 S3 批量发布器

当前 GBCR v6.18 发布计划包含约 263,682 个对象。逐个启动 Wrangler 进程适合少量文件，却会把大量小文件发布放大成不可接受的进程启动成本。Cloudflare 官方建议大量文件使用 R2 的 S3 兼容接口或 rclone 等批量工具。

`scripts/publish-corpus-release-s3.mjs` 直接使用 Node.js 标准库实现 AWS Signature Version 4，不引入运行时第三方依赖。它固定使用：

- R2 账户端点 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`；
- S3 服务名 `s3` 和 R2 区域 `auto`；
- 每个请求的完整正文 SHA-256，而不是 `UNSIGNED-PAYLOAD`；
- 上传计划中的 Content-Type 与 Cache-Control；
- 单段 PUT 返回的 ETag 与本地 MD5 对比；
- 最多 32 个并发上传和有限指数退避；
- 全部不可变对象成功后才更新 `v1/latest.json`。

SigV4 实现使用 AWS 官方 `test$file.text` PUT Object 测试向量持续复核，预期签名为 `98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd`。

## 2. 不可变对象规则

所有 `v1/releases/<release-id>/...` 对象必须：

1. 位于上传计划声明的发行命名空间；
2. 相对路径与对象键完全一致；
3. 在上传前重新计算并匹配字节数和 SHA-256；
4. 使用 `If-None-Match: *` 条件写入，避免静默覆盖；
5. 若对象已存在，只能在 HEAD 返回的 ETag、字节数、Content-Type 和 Cache-Control 全部匹配时复用；
6. 任一冲突或漂移立即中止，绝不通过覆盖“修复”历史发行。

`v1/latest.json` 是唯一可更新对象。它必须精确指向同一上传计划内的发行清单，并在所有不可变对象确认后最后写入。

## 3. GitHub Actions 自动化

`.github/workflows/cloudflare-r2-release.yml` 有两个模式：

- 普通 PR：只运行 SigV4 与上传计划合成测试，权限只读；
- 手动生产发布：输入 `seed-foxue-ai-corpus` 后，执行全量验证、桶检查、对象发布、R2 Worker 部署和公网就绪验证。

生产发布需要四项 GitHub Actions secrets：

| Secret | 最小用途 |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | 确定唯一 R2 账户端点 |
| `CLOUDFLARE_API_TOKEN` | 查询/创建指定 R2 桶并部署指定 Worker |
| `R2_ACCESS_KEY_ID` | S3 对象写入身份 |
| `R2_SECRET_ACCESS_KEY` | S3 SigV4 签名密钥 |

管理令牌与对象写入密钥应分开创建和轮换。对象密钥只授予 `foxue-ai-corpus` 桶的对象读写；管理令牌只授予创建/读取该桶和部署 `foxue-ai-corpus-edge` 所需权限。密钥不得进入日志、构建产物、恢复包或客户端代码。

## 4. 首次开通状态机

```text
R2 未订阅 / 10042
  → 账户启用 R2 订阅
  → 创建最小权限管理令牌与桶级 S3 密钥
  → 配置四项 GitHub Secrets
  → 运行 cloudflare-r2-release
  → pnpm verify
  → 创建或确认 foxue-ai-corpus
  → 上传并逐对象确认不可变数据
  → 最后写 v1/latest.json
  → 部署带 CORPUS 绑定的只读 Worker
  → /health storage=ready
  → /ready=200
  → 公开清单 HEAD=200
```

任何中间步骤失败时，bootstrap Worker 保持在线，`/ready` 必须继续返回 503。只有最后的公网验证全部成功，才可以把 R2 状态标记为就绪。

## 5. 发布前验证

上传计划预检可独立运行：

```bash
node scripts/publish-corpus-release-s3.mjs \
  --dry-run \
  --plan=artifacts/corpus-release/<release-id>/upload-plan.json
```

合成测试不需要 Cloudflare 凭据：

```bash
node scripts/test-corpus-r2-publisher.mjs
```

预检会读取全部文件并重新计算 SHA-256 和 MD5。对于约 2.87 GB 的当前版本，这是有意的端到端验证，不应为了缩短任务而跳过。

## 6. 发布完成定义

一次 R2 发布只有同时满足以下条件才算完成：

- 全量 `pnpm verify` 通过；
- 上传计划、清单和 `latest.json` 相互一致；
- 每个不可变对象的上传响应或复用 HEAD 与本地摘要/元数据一致；
- `latest.json` 在全部不可变对象之后更新；
- R2 绑定版 Worker 部署成功；
- 公网 `/health`、`/ready`、发行指针、清单、CORS、安全头和只读门禁全部通过；
- 发布报告与上传计划作为短期 CI 证据保存；
- 同一版本另有 GitHub 不可变 Release、Software Heritage 和离线/机构副本。

Actions 工件保留 30 天，只是审计证据，不能算长期副本。

## 7. 诚实披露

- R2 订阅未启用时，状态只能是 `bootstrap` 或 `unavailable`；
- 只有对象上传完成但 Worker 未切换时，状态仍不能写 `ready`；
- R2 就绪只证明当前固定语料发布可读取，不证明全球佛经覆盖达到 99%；
- 100 年目标以可迁移、可恢复、多组织托管和持续演练衡量，不以 Cloudflare 单一账户寿命衡量。
