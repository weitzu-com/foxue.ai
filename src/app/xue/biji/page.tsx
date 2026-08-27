import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenText,
  Download,
  Fingerprint,
  NotebookPen,
  ShieldCheck,
} from "lucide-react";
import { StudyNotebook } from "@/components/study-notebook";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import sharedStyles from "../xue.module.css";
import styles from "./biji.module.css";

const title = "佛经研读笺｜本地笔记与可复核引用";
const description =
  "把佛经阅读中的观照、理解与待求证问题保存在当前浏览器；每则研读笺自动带稳定段号、原典链接，并可导出为 Markdown。无需登录，不上传。";
const pagePath = "/xue/biji";

export const metadata: Metadata = buildPageMetadata({ title, description, path: pagePath });

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "WebPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "研读笺", path: pagePath },
  ],
  about: ["佛经笔记", "佛典引用", "本地优先", "佛经研读"],
  mainEntityId: `${absoluteUrl(pagePath)}#notebook-title`,
});

const noteModes = [
  { name: "观照", detail: "这段经文照见了什么", icon: BookOpenText },
  { name: "理解", detail: "用自己的话重新说明", icon: NotebookPen },
  { name: "求证", detail: "留下仍需核对的问题", icon: Fingerprint },
] as const;

export default function StudyNotesPage() {
  return (
    <div className={`${sharedStyles.studyPage} ${styles.page}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className={`page-shell ${sharedStyles.shell}`}>
        <nav className={sharedStyles.breadcrumb} aria-label="面包屑">
          <Link href="/xue"><ArrowLeft aria-hidden="true" /> 研读</Link>
          <span aria-hidden="true">/</span>
          <span>研读笺</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={sharedStyles.eyebrow}>研读笺 · LOCAL STUDY NOTES</p>
            <h1>
              把读过的经文，
              <br />
              留下<em>可回到原典</em>的一页。
            </h1>
            <p>
              一则有用的佛经笔记，不只保存感想；它也保存当时读的是哪段文字、哪个版本，
              以及下一次该从哪里继续求证。
            </p>
            <ul aria-label="研读笺数据说明">
              <li><ShieldCheck aria-hidden="true" /> 不登录、不上传</li>
              <li><Fingerprint aria-hidden="true" /> 自动附稳定坐标</li>
              <li><Download aria-hidden="true" /> 随时导出 Markdown</li>
            </ul>
          </div>

          <aside className={styles.modeLedger} aria-label="三种研读笺">
            <p>一则笔记，先说清楚自己在做什么</p>
            <ol>
              {noteModes.map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <li key={mode.name}>
                    <span>0{index + 1}</span>
                    <Icon aria-hidden="true" />
                    <div><strong>{mode.name}</strong><small>{mode.detail}</small></div>
                  </li>
                );
              })}
            </ol>
          </aside>
        </header>

        <StudyNotebook />

        <section className={styles.method} aria-labelledby="notes-method-title">
          <div>
            <p className={sharedStyles.eyebrow}>数据边界 · LOCAL FIRST</p>
            <h2 id="notes-method-title">笔记属于读者，原典仍属于证据层。</h2>
          </div>
          <dl>
            <div><dt>存在何处</dt><dd>当前浏览器的本地存储；本站服务器不会收到笔记正文。</dd></div>
            <div><dt>保存什么</dt><dd>个人文字、研读类型、引文快照、稳定段号与两个返回链接。</dd></div>
            <div><dt>如何带走</dt><dd>导出开放的 Markdown 文本；换设备或清除浏览器前请先备份。</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
