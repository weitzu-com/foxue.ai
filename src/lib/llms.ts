import { allConcepts } from "@/lib/concept-hubs";
import { absoluteUrl, siteOrigin } from "@/lib/site-metadata";
import { getSitemapSnapshot } from "@/lib/sitemap-ledger";

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
    summary: "平台总入口；集中呈现每日可核验原典、佛经在线阅读、原典查询、AI 问经与可信原则。",
  },
  {
    path: "/xue",
    label: "研读",
    summary: "佛经研读中心；从每日原典进入《心经》《金刚经》《阿弥陀经》七日路径、《法句》三源并读与本地研读笺。",
  },
  {
    path: "/wenjing",
    label: "问经",
    summary: "AI 问经与原典出处对照；输入问题后返回结论、范围提醒、证据与不足提示。",
  },
  {
    path: "/hedui",
    label: "核对说法",
    summary: "佛经名句与“佛说”语录出处核对；区分逐字出处、近似转述与当前证据不足。",
  },
  {
    path: "/duidu",
    label: "对读",
    summary: "佛经异译与跨本对读总入口；按佛教徒、爱好者与研究者的任务进入四份受控书案，并明确同作品、候选关系与逐句对齐的边界。",
  },
  {
    path: "/duidu/ebt",
    label: "汉巴 EBT 证据书案",
    summary: "从五蕴、锯喻与央掘魔罗进入巴利原文、Sujato 英译和汉译阿含候选范围；公开反证、证据哈希及双人复核状态。",
  },
  {
    path: "/duidu/amituojing",
    label: "阿弥陀经双译对读",
    summary: "按七个修学关口并读鸠摩罗什译 T0366 与玄奘译 T0367；每行返回稳定坐标，相关段落不等于逐句对齐。",
  },
  {
    path: "/duidu/xinjing",
    label: "心经异译对读",
    summary: "并排阅读七种已审核心经汉译表达；各行回到自己的 CBETA 坐标，并排不等于逐句对齐。",
  },
  {
    path: "/duidu/jingangjing",
    label: "金刚经主题对读",
    summary: "按七个阅读关口比较六种金刚经汉译与 Gemmell 1912 英译；片段各归底本，主题同现不等于逐句对齐。",
  },
  {
    path: "/yanjiu",
    label: "研究",
    summary: "本地佛典研究工作台；声明问题与范围，把已收藏原典整理为主张—证据矩阵并导出 Markdown。",
  },
  {
    path: "/jingzang",
    label: "经藏",
    summary: "佛经在线阅读目录；按来源、版本、经号与稳定行段浏览已登记文本。",
  },
  {
    path: "/jingzang/fanwen",
    label: "梵文原典门",
    summary: "阅读三份已核验的梵文与俗语佛典原文；公开稳定锚点、异本关系及 DSBC、GRETIL 候选资料的权利准入边界。",
  },
  {
    path: "/gainian",
    label: "概念",
    summary: "主题层入口；按四圣谛、八正道、缘起、空、无常、无我、无住、观心等受控证据页进入佛学高频问题。",
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

const conceptHubPages: CorePage[] = allConcepts.map((concept) => ({
  path: concept.href,
  label: `${concept.title}概念 Hub`,
  summary: concept.summary,
}));

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getLlmsSnapshot() {
  const snapshot = getSitemapSnapshot();
  return {
    totalUrls: snapshot.totalUrls,
    sitemapCount: snapshot.sitemapCount,
    sutraCount: snapshot.workCount,
  };
}

function renderCorePageBullets() {
  return [...corePages, ...conceptHubPages]
    .map((page) => `- [${page.label}](${absoluteUrl(page.path)}): ${page.summary}`)
    .join("\n");
}

function renderCorePageTable() {
  return [
    "| 路径 | 名称 | 说明 |",
    "|------|------|------|",
    ...[...corePages, ...conceptHubPages].map((page) => `| ${page.path} | ${page.label} | ${page.summary} |`),
  ].join("\n");
}

export async function buildLlmsText() {
  const { totalUrls, sitemapCount, sutraCount } = getLlmsSnapshot();

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
- /hedui 当前核对 5 个逐字复核的高频条目；未命中不等于所有佛典都不存在相似表达
- /duidu 汇集已发布的受控对读书案；同作品书案与未裁决的 EBT 候选关系分层呈现，不把相邻位置或相似主题解释为逐句等值
- /duidu/ebt 当前开放 3 份审前证据书案；5,161 条关系证据不等于作品合并，80 条待审队列与 20 份 P0 证据包均不能替代真人裁决
- /duidu/amituojing 只并读七组已核验的 T0366/T0367 相关段落；不生成综合经文或自动逐句对齐
- /duidu/xinjing 只并排已审核的同作品表达；左右位置不表示逐句或逐段对应
- /duidu/jingangjing 只提供七个经文导航窗口；六种汉译与 Gemmell 1912 英译不被混成现代合译
- /yanjiu 只在浏览器本地保存研究问题与判断；导出报告明确区分原典证据和读者结论
- /jingzang/fanwen 当前开放 3 个受控梵文与俗语文本表达、24 个固定源文件与 1,909 个稳定段；DSBC、GRETIL 候选资料未获再发布许可前不冒充站内全文

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
  const { totalUrls, sitemapCount, sutraCount } = getLlmsSnapshot();

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
- 当前公开主题 Hub 至少包括：${allConcepts.map((concept) => absoluteUrl(concept.href)).join("、")}
- 经目页与分册页提供稳定段落或版页锚点；全文阅读以 ${absoluteUrl("/jingzang")} 为入口，覆盖治理以 ${absoluteUrl("/fugai")} 为准

## 问经边界

- ${absoluteUrl("/wenjing")} 当前是可信原型，不承诺“已懂全部佛学问题”
- 当已登记样本足以支撑结论时，页面展示结论、范围提醒与原典证据
- 当索引不足、证据分歧或超出当前覆盖时，系统会明确回答“未找到可靠来源”或提示范围不足
- 完整经藏阅读规模与文本来源边界，应分别以 ${absoluteUrl("/jingzang")}、${absoluteUrl("/fugai")}、${absoluteUrl("/touming")} 为准

## 说法核对边界

- ${absoluteUrl("/hedui")} 区分“原句可核验”“找到近似原句”与“当前证据不足”
- 首批核验表含 5 个逐字复核条目，输入仅在浏览器标签页中处理，不写入网址
- 未命中只说明当前受控范围不足，不能据此宣称全部佛典都没有相似表达

## 研究工作台边界

- ${absoluteUrl("/yanjiu")} 把已收藏的稳定原典选文组织为主张—证据矩阵
- 研究问题、来源范围、证据关系和暂定结论只保存在当前浏览器，不上传到服务器
- 工作台提示单一摘句、范围缺失与反证缺口，但不替读者生成或批准学术结论

## 异译对读边界

- ${absoluteUrl("/duidu")} 是受控对读书案的统一入口，分别说明全文并排、主题关口、相关段落与审前证据四种阅读方式
- 总入口组织三份同作品对读与一份汉巴 EBT 审前证据室，不自动扩张作品关系，不生产新经文、现代合译或机器逐句对齐
- ${absoluteUrl("/duidu/ebt")} 首批开放 SN 22.51 ↔ SA 1、MN 21 ↔ EA 50.8、MN 86 ↔ SA 1077 三份候选书案
- EBT 页面固定巴利原文、Sujato 英译、汉译机器定位范围、支持线索、反证和证据哈希；机器定位不等于人工确认的经文边界
- 当前 EBT 关系账本含 5,161 条证据，复核队列含 80 条项目与 20 份 P0 证据包；已完成独立真人复核与裁决均为 0
- AI 整理不计入真人复核；未经两名真人独立判断与必要的第三人裁决，候选关系不改变作品数、段落对齐或全球分母
- ${absoluteUrl("/duidu/amituojing")} 从说法处、极乐释名、念三宝、光寿无量、发愿、持名与难信之法七个关口并读 T0366/T0367
- 阿弥陀经页面完整保留两译的版本、译者与稳定坐标；相关段落窗口不构成逐句对应，也不产生现代综合经文
- ${absoluteUrl("/duidu/xinjing")} 收录七种已审核挂接同一心经作品标识的汉译表达
- 每个行号回到该译本自己的经号、版页与稳定行段；双栏位置不构成逐句对齐
- 页面不生成现代合译，也不把传统译者署名当作无争议的现代裁决
- ${absoluteUrl("/duidu/jingangjing")} 从发心、四相、不住、见相、筏喻与结偈等七个关口进入六种汉译和 Gemmell 1912 英译
- 金刚经页面的窗口只证明片段位置与阅读范围；同一主题、相邻位置或共享作品标识均不构成逐句对应

## 梵文原典准入边界

- ${absoluteUrl("/jingzang/fanwen")} 当前开放 Mahāvadānasūtra、Candrasūtra 与 Patna Dharmapada 三个受控文本表达
- 站内资产来自 24 个固定 SuttaCentral 源文件，共 1,909 个稳定段；2 个梵文文件与 22 个俗语文件分别保留来源、版本和锚点
- DSBC 的 486 条罗马字目录记录只计作候选目录，GRETIL 的 417 个固定文件只计作外部候选；目录项和物理文件都不自动等于去重后的佛经作品
- 免费访问不等于允许复制；权利未明确前不镜像 DSBC 或 GRETIL 正文，也不把候选数量加入站内全文分母
- 跨语种题名与内容相似只建立待校勘关系，不自动合并作品，不生成机器逐段对齐

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
