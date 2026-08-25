import Link from "next/link";
import { BookMarked, Link2 } from "lucide-react";
import type { Sutra } from "@/data/sutras";
import { folioCollectionLabel } from "@/data/sutras";
import { folioHref } from "@/lib/reader-routes";
import {
  decorateWorkLandingSegments,
  type WorkLandingText,
} from "@/lib/work-landing-text";

export function WorkLandingTextPanel({
  sutra,
  landing,
}: {
  sutra: Sutra;
  landing: WorkLandingText;
}) {
  const segments = decorateWorkLandingSegments(sutra, landing);
  const collection = folioCollectionLabel(sutra);
  const groups = new Map<string, typeof segments>();
  for (const segment of segments) {
    const group = groups.get(segment.folioKey) ?? [];
    group.push(segment);
    groups.set(segment.folioKey, group);
  }

  return (
    <article className="sutra-paper sutra-paper--complete reader-index-yuanwen" id="yuanwen" lang="zh-Hant">
      <div className="sutra-paper__notice">
        <BookMarked aria-hidden="true" />
        <p>
          <strong>{landing.mode === "full" ? "完整原文 · 本页阅读" : "开卷原文 · 第一卷"}</strong>
          {"　"}
          {landing.mode === "full"
            ? `${sutra.translator}。CBETA / ${sutra.canonRef} 为版本来源，不是作者。稳定行号可引用；版页目录仍用于出处定位。`
            : `${sutra.translator}。本页只录第 ${Number(landing.juan)} 卷原文，不冒充${collection}全文。其余卷次见下方目录。CBETA / ${sutra.canonRef} 为版本来源，不是作者。`}
        </p>
      </div>
      {[...groups.entries()].map(([folioKey, folioSegments]) => (
        <section className="reader-index-yuanwen__folio" key={folioKey} aria-labelledby={`yuanwen-${folioKey}`}>
          <header>
            <h3 id={`yuanwen-${folioKey}`}>{collection} {folioSegments[0]?.sourceLine.slice(0, 5)}</h3>
            <Link href={folioHref(sutra.slug, folioKey)} prefetch={false}>
              打开版页引用
            </Link>
          </header>
          {folioSegments.map((segment, index) => (
            <section className="sutra-segment" id={segment.id} key={segment.id}>
              {segment.legacyIds?.map((legacyId) => (
                <span className="legacy-anchor" id={legacyId} aria-hidden="true" key={legacyId} />
              ))}
              <div className="segment-number">{segment.sourceLine ?? String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="segment-text">{segment.text}</p>
                {segment.note ? <p className="segment-note"><span>边注</span>{segment.note}</p> : null}
                <a className="segment-anchor" href={`#${segment.id}`}>
                  <Link2 aria-hidden="true" size={13} /> {segment.id}
                </a>
              </div>
            </section>
          ))}
        </section>
      ))}
    </article>
  );
}
