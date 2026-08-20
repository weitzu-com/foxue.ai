import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenText, Clock3, Route, ShieldCheck } from "lucide-react";
import { XinjingLearningPath } from "@/components/xinjing-learning-path";

const title = "心经原文入门｜7天学习路径";
const description = "7 天学习《心经》原文，每天约 5 分钟，附稳定原典链接、理解提示与可跳读的学习节奏。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/xue/xinjing" },
  openGraph: {
    title,
    description,
    url: "https://www.foxue.ai/xue/xinjing",
    siteName: "foxue.ai",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function XinjingLearningPage() {
  return (
    <div className="xinjing-learning-page">
      <div className="page-shell">
        <div className="page-breadcrumb">
          <Link href="/">
            <ArrowLeft aria-hidden="true" size={15} /> 首页
          </Link>
          <span>/</span>
          <span>《心经》入门</span>
        </div>

        <header className="learning-hero">
          <div className="learning-hero__copy">
            <p className="eyebrow">七日入经 · HEART SUTRA</p>
            <h1>
              七天，不求读懂；
              <br />
              <em>
                先和《心经》
                <br />
                见七次面。
              </em>
            </h1>
            <p>
              每天读一小段，只带一个理解提示回到生活。
              没有打卡压力：所有日程都开放，今天读不下去就跳过。
            </p>
            <ul aria-label="学习路径说明">
              <li>
                <Clock3 aria-hidden="true" /> 每天约 5 分钟
              </li>
              <li>
                <Route aria-hidden="true" /> 七天随时可读
              </li>
              <li>
                <ShieldCheck aria-hidden="true" /> 进度仅存本地
              </li>
            </ul>
          </div>

          <aside className="learning-hero__seal" aria-label="学习方法">
            <span aria-hidden="true">七</span>
            <div>
              <BookOpenText aria-hidden="true" />
              <strong>读 · 解 · 观</strong>
              <p>每天三步，每次都回到稳定原典段落。</p>
            </div>
          </aside>
        </header>

        <XinjingLearningPath />
      </div>
    </div>
  );
}
