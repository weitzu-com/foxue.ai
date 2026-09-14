import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenText,
  Download,
  FileSearch,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { ResearchWorkbench } from "@/components/research-workbench";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/yanjiu";
const pageTitle = "佛经研究任务与主张—证据矩阵";
const pageDescription =
  "以本地研究任务组织佛经选文：声明问题与来源范围，逐条标注支持、限定、反证或背景，并导出带稳定原典链接的 Markdown 报告。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研究", path: pagePath },
  ],
  about: ["佛经研究", "主张证据矩阵", "佛典引用", "研究报告", "本地优先"],
  mainEntityId: `${absoluteUrl(pagePath)}#research-workbench-title`,
});

const boundaries = [
  { icon: BookOpenText, title: "原典是证据", text: "引文必须保留版本、稳定段号和可打开链接。" },
  { icon: FileSearch, title: "判断是判断", text: "研究者写下的关系说明与暂定结论不会冒充经文。" },
  { icon: ListChecks, title: "反证要可见", text: "工作台会提醒单一摘句、范围缺失与只收支持材料。" },
  { icon: Download, title: "成果可带走", text: "开放 Markdown 在浏览器生成，不依赖账号或私有云。" },
] as const;

export default function ResearchPage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className="page-shell">
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/"><ArrowLeft aria-hidden="true" /> 首页</Link>
          <span aria-hidden="true">/</span>
          <span>研究</span>
        </nav>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>证据式佛典研究 · RESEARCH WITH SOURCES</p>
            <h1>
              不从结论出发，
              <br />从<em>可反驳的问题</em>出发。
            </h1>
            <p className={styles.lead}>
              一项研究至少要交代查什么、查到哪里、每条原文能证明什么，以及哪些材料正在限制自己的判断。
              这里把经藏中的本地选文组织成主张—证据矩阵，不替你生成看似完整的答案。
            </p>
            <div className={styles.privacyNote}>
              <ShieldCheck aria-hidden="true" />
              <span>无需登录；研究问题、证据判断与导出文件都在当前浏览器处理。</span>
            </div>
          </div>
          <aside className={styles.boundaryLedger} aria-label="研究工作台边界">
            <p>RESEARCH CONTRACT</p>
            <ol>
              {boundaries.map((boundary, index) => {
                const Icon = boundary.icon;
                return (
                  <li key={boundary.title}>
                    <span>0{index + 1}</span>
                    <Icon aria-hidden="true" />
                    <div><strong>{boundary.title}</strong><small>{boundary.text}</small></div>
                  </li>
                );
              })}
            </ol>
          </aside>
        </header>

        <ResearchWorkbench />
      </div>
    </div>
  );
}
