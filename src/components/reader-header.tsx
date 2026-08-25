import { CircleCheck } from "lucide-react";
import type { Sutra } from "@/data/sutras";

export function ReaderHeader({ sutra, currentLabel }: { sutra: Sutra; currentLabel?: string }) {
  return (
    <header className="reader-header">
      <div className="reader-header__mark" aria-hidden="true">经</div>
      <div className="reader-header__title">
        <p className="eyebrow">{sutra.tradition}</p>
        <h1>
          {sutra.title}
          {currentLabel ? <span className="reader-header__folio-title">{currentLabel}</span> : null}
        </h1>
        <p>{sutra.alternateTitle} · {sutra.translator}</p>
      </div>
      <div className="reader-header__status">
        <span><CircleCheck aria-hidden="true" /> {sutra.status}</span>
        <span>{sutra.canonRef}</span>
      </div>
    </header>
  );
}
