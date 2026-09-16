// 博客文章允许指向的站内页面。
// 生成模型只能从这份清单和已登记的经藏路径里选择内链，防止编造不存在的页面。

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { catalogFolioKeyExists } from "../../src/lib/corpus-folio-existence.mjs";

export const curatedSiteLinks = [
  { href: "/wenjing", label: "问经：从问题回到原典", note: "输入佛学问题，获得带出处的证据式回答" },
  { href: "/hedui", label: "核对说法：这句是佛经原文吗", note: "把常见“佛经名句”逐字核对到受控原文" },
  { href: "/jingzang", label: "经藏目录", note: "大正藏、巴利藏与译本的稳定阅读入口" },
  { href: "/jingzang/quanwen", label: "佛经全文检索", note: "在受控原文里逐字搜索" },
  { href: "/jingzang/xinjing", label: "《般若波罗蜜多心经》玄奘译本全文", note: "T0251，稳定行段" },
  { href: "/jingzang/xinjing/001-0848c", label: "《心经》0848c 版页原文", note: "全经所在的单一版页" },
  { href: "/jingzang/jingangjing", label: "《金刚般若波罗蜜经》鸠摩罗什译本全文", note: "T0235，稳定行段" },
  { href: "/jingzang/amituojing", label: "《佛说阿弥陀经》鸠摩罗什译本全文", note: "T0366" },
  { href: "/xue", label: "研读中心", note: "全部七日路径与研读工具" },
  { href: "/xue/xinjing", label: "《心经》七日入门", note: "逐句阅读玄奘译本" },
  { href: "/xue/xinjing/jiaoji", label: "《心经》校记与异译", note: "版本、异文与译本差异" },
  { href: "/xue/jingangjing", label: "《金刚经》七日入门", note: "逐段阅读鸠摩罗什译本" },
  { href: "/xue/amituojing", label: "《阿弥陀经》七日入门", note: "净土经典逐句阅读" },
  { href: "/xue/fahuajing", label: "《法华经》阅读路径", note: "二十八品导读" },
  { href: "/xue/faju", label: "《法句经》研读", note: "巴利与汉译对照" },
  { href: "/xue/dujing", label: "怎样读佛经：证据式阅读方法", note: "读经方法与常见误区" },
  { href: "/xue/xuanjing", label: "选经：从哪部经开始", note: "按目标选择第一部经" },
  { href: "/xue/meiri", label: "今日原典", note: "每天一段可核验经文" },
  { href: "/duidu", label: "佛经对读书案", note: "同经异译逐句对照" },
  { href: "/duidu/xinjing", label: "《心经》异译对读", note: "玄奘、鸠摩罗什等译本逐句对照" },
  { href: "/duidu/jingangjing", label: "《金刚经》主题对读", note: "按主题对照多译本" },
  { href: "/duidu/amituojing", label: "《阿弥陀经》双译对读", note: "鸠摩罗什与玄奘译本对照" },
  { href: "/duidu/ebt", label: "汉巴早期经典证据书案", note: "阿含与尼柯耶平行经文" },
  { href: "/gainian", label: "佛学概念总览", note: "空、无常、无我、缘起等概念 Hub" },
  { href: "/gainian/kong", label: "概念：空", note: "空不是无，回到原典看“空”的用法" },
  { href: "/gainian/wuchang", label: "概念：无常", note: "无常不是悲观" },
  { href: "/gainian/wuwo", label: "概念：无我", note: "无我是否否定“我”" },
  { href: "/gainian/wuzhu", label: "概念：无住", note: "应无所住而生其心" },
  { href: "/gainian/guanxin", label: "概念：观心", note: "烦恼生起时如何观察" },
  { href: "/gainian/yuanqi", label: "概念：缘起", note: "此有故彼有" },
  { href: "/gainian/sidi", label: "概念：四圣谛", note: "苦、集、灭、道" },
  { href: "/gainian/bazhengdao", label: "概念：八正道", note: "不是八条独立规则" },
  { href: "/gainian/wuyun", label: "概念：五蕴", note: "色、受、想、行、识" },
  { href: "/gainian/ku", label: "概念：苦", note: "苦不是消极" },
  { href: "/yuanze", label: "方法与边界", note: "本站如何对待原典、翻译与 AI" },
  { href: "/touming", label: "数据透明", note: "来源、许可与局限" },
  { href: "/fugai", label: "佛典覆盖登记册", note: "已收录哪些经典" },
  { href: "/blogs", label: "佛学博客", note: "更多回到原典的解读" },
];

let workLedger;
let folioExistence;

function loadLedgers(root) {
  if (!workLedger) {
    workLedger = JSON.parse(readFileSync(resolve(root, "src/data/corpus-work-ledger.generated.json"), "utf8"));
    folioExistence = JSON.parse(readFileSync(resolve(root, "src/data/corpus-folio-existence.generated.json"), "utf8"));
  }
}

/**
 * 站内链接是否指向真实存在的页面。
 * 返回 { ok: boolean, reason?: string }。
 */
export function validateInternalHref(href, { root = process.cwd(), posts = [] } = {}) {
  if (typeof href !== "string" || !href.startsWith("/")) return { ok: false, reason: "不是站内路径" };
  const [pathname, hash] = href.split("#");
  if (curatedSiteLinks.some((item) => item.href === pathname)) return { ok: true };
  if (pathname === "/blogs") return { ok: true };
  const blog = /^\/blogs\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(pathname);
  if (blog) {
    return posts.some((post) => post.slug === blog[1]) ? { ok: true } : { ok: false, reason: `博客文章 ${blog[1]} 不存在` };
  }
  const work = /^\/jingzang\/([a-z0-9-]+)(?:\/([0-9]{3}-[0-9]{4}[a-z]))?$/.exec(pathname);
  if (work) {
    loadLedgers(root);
    const [, slug, folio] = work;
    if (!workLedger.slugToShard[slug] && workLedger.slugToShard[slug] !== 0) {
      return { ok: false, reason: `经藏中没有 slug 为 ${slug} 的作品` };
    }
    if (folio && !catalogFolioKeyExists(folioExistence, slug, folio)) {
      return { ok: false, reason: `${slug} 没有版页 ${folio}` };
    }
    if (hash && !/^[A-Za-z0-9._-]+$/.test(hash)) return { ok: false, reason: "锚点格式不正确" };
    return { ok: true };
  }
  return { ok: false, reason: `不在允许的站内链接清单中：${pathname}` };
}

export function collectInternalHrefs(post) {
  const hrefs = new Set();
  const inline = /\[([^\]]+)\]\((\/[^\s)]*)\)/g;
  const scan = (text) => {
    for (const match of String(text ?? "").matchAll(inline)) hrefs.add(match[2]);
  };
  for (const block of post.blocks ?? []) {
    if (block.type === "paragraph" || block.type === "callout") scan(block.text);
    if (block.type === "list") block.items.forEach(scan);
    if (block.type === "quote" && block.source?.href) hrefs.add(block.source.href);
    if (block.type === "links") block.items.forEach((item) => hrefs.add(item.href));
  }
  for (const item of post.faq ?? []) scan(item.answer);
  for (const item of post.related ?? []) hrefs.add(item.href);
  return [...hrefs];
}
