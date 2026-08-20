import type { Metadata } from "next";
import { ExternalLink, Scale, Send, UsersRound } from "lucide-react";
import queueDocument from "../../../data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json";
import p0EvidenceDocument from "../../../data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";
import {
  ReviewQueueWorkbench,
  type P0EvidencePacket,
  type ReviewQueueItem,
} from "./review-queue-workbench";

export const metadata: Metadata = buildPageMetadata({
  title: "汉巴作品关系审校台",
  description: "foxue.ai 汉巴作品关系双人复核队列：公开反证、文本范围、证据身份与裁决门槛。",
  path: "/shenjiao",
});

const reviewQueuePageJsonLd = buildPageJsonLd({
  path: "/shenjiao",
  title: "汉巴作品关系审校台",
  description: "foxue.ai 汉巴作品关系双人复核队列：公开反证、文本范围、证据身份与裁决门槛。",
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "汉巴作品审校台", path: "/shenjiao" },
  ],
  about: ["汉巴作品关系", "双人复核队列", "文本范围", "裁决门槛"],
});

export default function ReviewQueuePage() {
  const summary = queueDocument.summary;

  return (
    <main className="review-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewQueuePageJsonLd) }}
      />
      <header className="review-hero page-shell">
        <div className="review-hero__copy">
          <p className="eyebrow">GBCR · TEXTUAL REVIEW QUEUE</p>
          <h1>不是寻找相同，<br />是先证明差异。</h1>
          <p>这里陈列汉译与巴利作品关系的未决证据。每一次归并都必须经得起文本范围、首尾、结构、增删、异本和现代研究的共同检验。</p>
          <a
            className="text-link"
            href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json"
            target="_blank"
            rel="noreferrer"
          >
            查看原始队列 JSON <ExternalLink aria-hidden="true" size={14} />
          </a>
          <a
            className="text-link"
            href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json"
            target="_blank"
            rel="noreferrer"
          >
            查看 P0 审前证据包 <ExternalLink aria-hidden="true" size={14} />
          </a>
        </div>

        <aside className="review-seal" aria-label="当前裁决状态">
          <span>未决</span>
          <strong>{summary.adjudicatedItems}<small> / {summary.queueItems}</small></strong>
          <p>已完成人工作品裁决</p>
          <div>
            <b>{summary.p0ScopeCaveatOrCounterevidence}</b> 项含范围备注或反证<br />
            <b>{summary.p1UpstreamFullStandalonePairs}</b> 项为整经级候选
          </div>
        </aside>
      </header>

      <section className="review-rule-strip">
        <div className="page-shell">
          <article><UsersRound aria-hidden="true" /><span>独立复核</span><strong>2 人</strong></article>
          <article><Scale aria-hidden="true" /><span>分歧处理</span><strong>另行仲裁</strong></article>
          <article><span className="review-rule-strip__zero">零</span><span>自动归并</span><strong>{summary.automaticMerges} 项</strong></article>
          <article><span className="review-rule-strip__none">—</span><span>分母影响</span><strong>无</strong></article>
        </div>
      </section>

      <ReviewQueueWorkbench
        items={queueDocument.items as ReviewQueueItem[]}
        p0EvidencePackets={p0EvidenceDocument.packets as P0EvidencePacket[]}
      />

      <section className="review-governance page-shell">
        <p className="eyebrow">ADJUDICATION GATE</p>
        <h2>两个人都审完，<br />作品边界才开始改变。</h2>
        <div>
          <p>复核者必须分别记录支持证据与反证。若两份独立结论一致，可进入版本化裁决；若不一致，必须由第三位仲裁者处理。</p>
          <p>当前页面不收集登录、批注或裁决。正式复核记录必须进入可追踪的仓库历史，绑定复核者、时间、引用来源和逐对象权利边界。</p>
          <div className="review-governance__actions">
            <a href="https://github.com/weitzu-com/foxue.ai/issues/new?template=han-pali-review.yml" target="_blank" rel="noreferrer">
              提交具名复核意见 <Send aria-hidden="true" size={14} />
            </a>
            <a href="https://github.com/weitzu-com/foxue.ai/blob/main/docs/HAN_PALI_REVIEW_PROTOCOL.md" target="_blank" rel="noreferrer">
              阅读完整复核协议 <ExternalLink aria-hidden="true" size={14} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
