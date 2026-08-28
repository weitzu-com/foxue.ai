# foxue.ai 测量与搜索数据方案

最后更新：2026-08-11

## 第一性原理

分析工具不是目的。我们只收集能回答以下产品问题的数据：

1. 访客能否从入口开始一个真实问题？
2. 回答是否把访客带回可核验的原典证据？
3. 访客是否继续进入经藏阅读？
4. 哪些自然搜索查询把合适的读者带到合适的经典页面？

任何不能改变产品、内容或检索决策的数据都不应新增。问题原文可能包含宗教、健康或个人经历，因此绝不发送到 GA4、网址、日志或第三方脚本。

## 工具边界

- GSC 是搜索曝光、查询、点击、索引和页面体验的事实来源。
- GA4 是访客到站后的匿名使用路径和关键行为来源。
- GA4 与 GSC 的关联只用于把自然搜索流量与站内行为放在同一分析上下文中；两个系统的数字口径不同，不应强求完全相等。

## 事件计划

| 事件 | 用途 | 参数 | 触发条件 | GA4 关键事件 |
|---|---|---|---|---|
| `page_view` | 页面到达与内容流量 | `page_path`, `page_title`, `page_location` | 同意统计后的首次加载与站内导航 | 否 |
| `question_started` | 首页任务启动率 | `entry_point`, `mode`, `input_length`, `example_used` | 从首页提交问题或示例 | 是 |
| `question_submitted` | 问经任务完成率 | `entry_point`, `input_length`, `result_status`, `evidence_count` | 问经页生成本地证据结果 | 是 |
| `source_opened` | 回到原典的核心信任行为 | `content_id`, `link_location`, `link_text` | 从证据卡打开原文 | 是 |
| `scripture_opened` | 经藏阅读启动率 | `content_id`, `link_location`, `link_text` | 从经藏目录打开一部经典 | 否 |
| `citation_copied` | 带出处保存引文 | `content_id`, `entry_point` | 从“今日原典”或研读路径复制引文、版本、行段与链接 | 否 |

`input_length` 只记录字符数，绝不记录输入内容。`page_location` 只保留路径与 UTM/gclid/dclid 参数，其他查询参数会被丢弃。

## 隐私与同意

- GA4 默认关闭；只有访客选择“同意匿名统计”后才请求 Google 脚本。
- `analytics_storage` 默认 `denied`，广告存储、广告用户数据和广告个性化始终为 `denied`。
- Google Signals 与广告个性化关闭。
- 页脚“分析偏好”可以随时撤回同意；撤回立即停止后续发送。
- 本站不设置 User-ID，不发送姓名、邮箱、问题原文或其他个人身份信息。

## GA4 资源约定

- 账号：现有 foxue.ai 所属 Google Analytics 账号
- 媒体资源名称：`foxue.ai`
- 报告时区：`中国 - 上海`
- 网页数据流：`https://foxue.ai`
- 数据流名称：`foxue.ai · production`
- 数据保留：14 个月
- 增强型衡量：保留出站点击、滚动和文件下载；站内搜索使用自定义事件，不从网址抓取问题
- 跨网域：当前不配置
- 内部流量：团队固定出口 IP 明确后再配置，不猜测地址

生产环境变量：

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## GSC 与关联约定

- 首选资源类型：网域资源 `foxue.ai`
- 所有权验证：Cloudflare 根域 TXT `google-site-verification=...`
- 站点地图：`https://foxue.ai/sitemap.xml`
- GA4 关联：GA4 管理 → 产品关联 → Search Console 关联 → 选择 `sc-domain:foxue.ai` → 选择生产网页数据流
- Search Console 报告：关联完成后发布到 GA4 报告导航

DNS 验证记录应长期保留。删除它可能导致所有权在以后重新检查时失效。

## 自动化与验收

- GA4 衡量 ID 通过环境变量注入，预览环境未配置时不会加载分析代码。
- Next.js 自动生成 `robots.txt` 和 `sitemap.xml`，新增经典版页会进入站点地图。
- GitHub Actions 每日检查生产站的 GA4 标记、CSP、robots、sitemap 和 GSC DNS TXT。完成 GA4 与 GSC 配置后，将仓库变量 `GOOGLE_INTEGRATIONS_ENABLED` 设为 `true` 才启用该检查，避免尚未配置时产生误报。
- 本地或人工复查可运行：

```bash
node scripts/verify-google-integrations.mjs https://foxue.ai
```

- 每次发布后在 GA4 实时报告或 DebugView 验证事件，并确认没有问题原文或重复 `page_view`。
