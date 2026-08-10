"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="not-found page-shell">
      <span aria-hidden="true">止</span>
      <p className="eyebrow">暂时无法完成</p>
      <h1>这里遇到了一处可恢复的错误。</h1>
      <p>错误没有被隐藏。你可以重试；若问题持续出现，它会进入公开的修复流程。</p>
      <button className="button-primary" onClick={reset}><RotateCcw aria-hidden="true" size={16} /> 重新尝试</button>
    </div>
  );
}
