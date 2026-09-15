import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpenText,
  Download,
  FileSearch,
  Fingerprint,
  LockKeyhole,
  NotebookPen,
  Route,
  ShieldCheck,
} from "lucide-react";
import { ReadingShelf } from "@/components/reading-shelf";
import { SavedPassages } from "@/components/saved-passages";
import { StudyNotebook } from "@/components/study-notebook";
import { StudyRoomOverview } from "@/components/study-room-overview";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/shufang";
const pageTitle = "我的佛经书房｜续读、选文、研读笺与研究证据";
const pageDescription =
  "在一个本地私密的佛经书房中继续研读路径与经卷，整理带稳定段号的原典选文、个人研读笺和研究证据；无需登录，不上传，可导出。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "WebPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "书房", path: pagePath },
  ],
  about: ["佛经书房", "佛经选文", "佛经笔记", "续读", "佛典研究", "本地优先"],
  mainEntityId: `${absoluteUrl(pagePath)}#study-room-overview-title`,
});

const roomShelves = [
  { icon: Route, name: "续读", detail: "研读路径和经卷位置" },
  { icon: BookMarked, name: "选文", detail: "原文快照与稳定坐标" },
  { icon: NotebookPen, name: "研读笺", detail: "观照、理解与求证" },
  { icon: FileSearch, name: "研究", detail: "主张—证据矩阵" },
] as const;

export default function StudyRoomPage() {
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
          <span>书房</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>我的书房 · LOCAL STUDY ROOM</p>
            <h1>
              有一处放下，
              <br />就有一处<em>再回来。</em>
            </h1>
            <p className={styles.lead}>
              这里汇集你在 foxue.ai 留下的续读位置、原典选文、研读笺和研究材料。
              它们属于读者，不属于平台：不要求登录，不上传内容，也不以连续打卡催促你回来。
            </p>
            <div className={styles.heroActions}>
              <a href="#study-room-overview-title">查看本地书房 <ArrowRight aria-hidden="true" /></a>
              <Link href="/xue">选择一条研读路径</Link>
            </div>
            <ul aria-label="书房数据原则">
              <li><LockKeyhole aria-hidden="true" /> 只存当前浏览器</li>
              <li><Fingerprint aria-hidden="true" /> 笔记不与原典混写</li>
              <li><Download aria-hidden="true" /> 选文与笔记可导出</li>
            </ul>
          </div>

          <aside className={styles.roomMap} aria-label="书房四层结构">
            <div className={styles.roomMapTitle}>
              <span>一间书房</span>
              <small>FOUR SHELVES · ONE LOCAL BROWSER</small>
            </div>
            <ol>
              {roomShelves.map((shelf, index) => {
                const Icon = shelf.icon;
                return (
                  <li key={shelf.name}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon aria-hidden="true" />
                    <div><strong>{shelf.name}</strong><small>{shelf.detail}</small></div>
                  </li>
                );
              })}
            </ol>
            <p><ShieldCheck aria-hidden="true" /> 页面不会把这些内容发送给服务器。</p>
          </aside>
        </header>

        <StudyRoomOverview />

        <ReadingShelf />

        <section className={styles.collectionIntro} aria-labelledby="room-collection-title">
          <div>
            <p className={styles.eyebrow}>从位置到理解 · KEEP THE SOURCE</p>
            <h2 id="room-collection-title">收藏原句，也保留自己尚未确定的部分。</h2>
          </div>
          <p>
            选文保存的是当时所见的原典与坐标；研读笺保存的是你的观照、理解或待求证问题。
            两层可以相互连接，但永远不会被合并成“佛经原文”。
          </p>
        </section>

        <SavedPassages />

        <StudyNotebook />

        <section className={styles.researchBridge} aria-labelledby="room-research-title">
          <div className={styles.researchMark} aria-hidden="true">
            <BookOpenText />
            <span>证</span>
          </div>
          <div>
            <p className={styles.eyebrow}>研究者入口 · EVIDENCE MATRIX</p>
            <h2 id="room-research-title">选文多起来以后，先说明每一条能证明什么。</h2>
            <p>
              研究工作台会读取同一浏览器里的本地选文，并要求逐条区分支持、限定、反证、背景或排除。
              它不会替研究者生成结论，也不会上传问题和判断。
            </p>
          </div>
          <Link href="/yanjiu">打开研究证据工作台 <ArrowRight aria-hidden="true" /></Link>
        </section>

        <section className={styles.boundary} aria-labelledby="room-boundary-title">
          <div>
            <p className={styles.eyebrow}>书房边界 · READER OWNED</p>
            <h2 id="room-boundary-title">平台可以保存入口，不能占有读者。</h2>
          </div>
          <dl>
            <div><dt>谁能看到</dt><dd>只有能访问当前浏览器网站数据的人；服务器不会收到正文。</dd></div>
            <div><dt>什么会丢失</dt><dd>清除网站数据或更换设备会移除本地记录；重要选文与笔记请先导出。</dd></div>
            <div><dt>怎样退出</dt><dd>不需要注销账户；逐项移除或清除本地网站数据即可离开。</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
