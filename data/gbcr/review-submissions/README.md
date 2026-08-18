# 全球分母复核原始提交归档

本目录只保存已经通过维护者具名核验、并经受保护 Pull Request 进入主线的 GitHub Issue Form 候选。

不可违反的边界：

- GitHub Action 只验证不可信 Issue 输入并生成临时候选制品，绝不自动写入本目录或审校账本；
- `scripts/global-review-intake.mjs accept-candidate` 默认只做预演，必须显式传入维护者、验收时间和 `--write`；
- 提交者不得自行验收；Bot 账户不得计作自然人；
- 每个归档包含原始 Issue 正文、作者、时间、正文 SHA-256、规范化决定草案和候选 SHA-256；
- 验收命令会依据候选内的原始 Issue 与当前队列重新生成候选；即使攻击者改写内容并重算哈希，也不能进入账本；
- 验收后仍只形成一名复核者的三条审校线意见，不会满足双人门槛，也不会改变全球分母；
- 自动共识至少要求两名不同自然人且机构声明不同；同机构例外必须经过新协议版本和公开理由，v0.1 自动路径不接受；
- 历史只追加，不覆盖。Issue 修订或证据纠错必须生成新候选、新提交记录和新 GBCR 版本。

典型流程：

```bash
node scripts/global-review-intake.mjs validate-issue \
  --event issue-event.json \
  --output candidate.json

node scripts/global-review-intake.mjs accept-candidate \
  --candidate candidate.json \
  --queue data/gbcr/global-denominator-review-queue-v0.1.0.json \
  --accepted-by maintainer-handle \
  --accepted-at 2026-08-19T03:00:00Z

# 完成身份、证据与权利人工核验后，再显式追加 --write。
```
