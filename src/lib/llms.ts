import { sutras } from "@/data/sutras";
import { absoluteUrl, siteOrigin } from "@/lib/site-metadata";
import { getSitemapEntries, getSitemapIds } from "@/lib/sitemap-data";

type CorePage = {
  path: string;
  label: string;
  summary: string;
};

const siteHeadline = "佛经在线阅读与 AI 问经平台";
const siteSummary = "提供佛经在线阅读、原典查询与 AI 问经；每一项关键结论都回到可核验的原文、版本与段落。";

const corePages: CorePage[] = [
  {
    path: "/",
    label: "首页",
    summary: "平台总入口；集中呈现佛经在线阅读、原典查询、AI 问经与可信原则。",
  },
  {
    path: "/wenjing",
    label: "问经",
    summary: "AI 问经与原典出处对照；输入问题后返回结论、范围提醒、证据与不足提示。",
  },
  {
    path: "/jingzang",
    label: "经藏",
    summary: "佛经在线阅读目录；按来源、版本、经号与稳定行段浏览已登记文本。",
  },
  {
    path: "/gainian",
    label: "概念",
    summary: "主题层入口；按空、无住、观心等受控证据页进入佛学高频问题。",
  },
  {
    path: "/gainian/kong",
    label: "空概念 Hub",
    summary: "从受控巴利经藏与汉译般若证据理解“空”的术语范围、传统边界与常见误解。",
  },
  {
    path: "/fugai",
    label: "覆盖登记册",
    summary: "全球佛典覆盖登记册；公开分母、来源快照、权利状态与可复算收录进度。",
  },
  {
    path: "/fenmu",
    label: "分母治理",
    summary: "全球佛经作品分母治理；公开来源宇宙、保守公式、审校队列和发布门槛。",
  },
  {
    path: "/shenjiao",
    label: "审校台",
    summary: "汉巴作品关系双人复核队列；公开反证、文本范围、证据身份与裁决门槛。",
  },
  {
    path: "/touming",
    label: "透明",
    summary: "公开 foxue.ai 的数据覆盖、来源、AI 能力、已知局限与当前建设状态。",
  },
  {
    path: "/yuanze",
    label: "原则",
    summary: "说明 foxue.ai 如何定义可信、纠错、多传统公平与长期传承的底层原则。",
  },
];

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

async function getLlmsSnapshot() {
  const [entries, sitemapIds] = await Promise.all([getSitemapEntries(), getSitemapIds()]);
  return {
    totalUrls: entries.length,
    sitemapCount: sitemapIds.length,
    sutraCount: sutras.length,
  };
}

function renderCorePageBullets() {
  return corePages
    .map((page) => `- [${page.label}](${absoluteUrl(page.path)}): ${page.summary}`)
    .join("\n");
}

function renderCorePageTable() {
  return [
    "| 路径 | 名称 | 说明 |",
    "|------|------|------|",
    ...corePages.map((page) => `| ${page.path} | ${page.label} | ${page.summary} |`),
  ].join("\n");
}

export async function buildLlmsText() {
  const { totalUrls, sitemapCount, sutraCount } = await getLlmsSnapshot();

  return `# foxue.ai

> ${siteHeadline}。${siteSummary}

foxue.ai 把“先有答案”改成“先回原典”：能回答时给出出处，证据不足时明确停下。

## Core Pages

${renderCorePageBullets()}

## Site Snapshot

- Canonical 主域：${siteOrigin}
- 当前 sitemap 共 ${sitemapCount} 个分片，登记 ${formatCount(totalUrls)} 个 canonical URL
- 当前经藏目录登记 ${formatCount(sutraCount)} 部文本表达；全文阅读规模以 /jingzang 与 /fugai 为准
- /wenjing 当前是可信原型：回答范围只覆盖已完成样本复核的主题，不把未知内容伪装成结论

## AI Entry Points

- ${absoluteUrl("/llms.txt")}: 本文件，站点概览
- ${absoluteUrl("/llms-full.txt")}: AI 可读完整版
- ${absoluteUrl("/sitemap-index.xml")}: 全站页面索引
- ${absoluteUrl("/ai.txt")}: AI 代理使用边界
- ${absoluteUrl("/robots.txt")}: 爬虫规则与站点地图入口

## Data & Sources

- 佛典文本来自公开可核验的数字化大藏经与学术版本
- 每一项 AI 回答都要求回到原文、版本与稳定段落
- 数据来源、版本信息与限制见 ${absoluteUrl("/touming")} 与 ${absoluteUrl("/yuanze")}

## Contact

- GitHub: https://github.com/weitzu-com/foxue.ai
- Site: ${siteOrigin}
`;
}

export async function buildLlmsFullText() {
  const { totalUrls, sitemapCount, sutraCount } = await getLlmsSnapshot();

  return `# foxue.ai — 全站内容地图（AI 可读完整版）

> ${siteHeadline}。
> 本站定位：佛学研究的证据基础设施——不替佛陀说话，只让原典、版本与证据链开口。

## 平台身份

- **使命**：让现代问题可以回到可核验的佛典原文，而不是停留在不可追溯的二手总结。
- **方法**：原典优先、失败可见、多传统公平、可纠错与可接管。
- **开源仓库**：https://github.com/weitzu-com/foxue.ai
- **Canonical 主域**：${siteOrigin}

## 核心页面

${renderCorePageTable()}

## 内容规模快照

- 当前 sitemap 共 **${sitemapCount}** 个分片：${absoluteUrl("/sitemap/0.xml")} … ${absoluteUrl(`/sitemap/${sitemapCount - 1}.xml`)}
- 当前登记 **${formatCount(totalUrls)}** 个 canonical URL
- 当前经藏目录登记 **${formatCount(sutraCount)}** 部文本表达，覆盖汉文、藏文、巴利文、梵文与俗语见证
- 当前公开主题 Hub 至少包括：${absoluteUrl("/gainian/kong")}、${absoluteUrl("/gainian/wuzhu")}、${absoluteUrl("/gainian/guanxin")}
- 经目页与分册页提供稳定段落或版页锚点；全文阅读以 ${absoluteUrl("/jingzang")} 为入口，覆盖治理以 ${absoluteUrl("/fugai")} 为准

## 问经边界

- ${absoluteUrl("/wenjing")} 当前是可信原型，不承诺“已懂全部佛学问题”
- 当已登记样本足以支撑结论时，页面展示结论、范围提醒与原典证据
- 当索引不足、证据分歧或超出当前覆盖时，系统会明确回答“未找到可靠来源”或提示范围不足
- 完整经藏阅读规模与文本来源边界，应分别以 ${absoluteUrl("/jingzang")}、${absoluteUrl("/fugai")}、${absoluteUrl("/touming")} 为准

## AI 入口点

- ${absoluteUrl("/llms.txt")} — 站点概览（本文件的精简版）
- ${absoluteUrl("/llms-full.txt")} — 全站内容地图（本文件）
- ${absoluteUrl("/sitemap-index.xml")} — 全站页面索引
- ${absoluteUrl("/ai.txt")} — AI 代理使用边界
- ${absoluteUrl("/robots.txt")} — 爬虫规则与站点地图入口

## 数据与方法

- 佛典文本来自公开可核验的数字化大藏经与学术版本
- 每一项 AI 回答均要求标注可回溯的原文出处（经号、版本、段落或版页）
- 数据来源、权利状态、已知局限与建设状态详见 ${absoluteUrl("/touming")}
- 可信原则、纠错边界与长期传承目标详见 ${absoluteUrl("/yuanze")}

## 联系

- 开源仓库：https://github.com/weitzu-com/foxue.ai
- 问题与反馈：通过 GitHub Issues
- 站点：${siteOrigin}
`;
}
