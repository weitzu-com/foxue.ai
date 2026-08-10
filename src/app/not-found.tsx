import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="not-found page-shell">
      <span aria-hidden="true">空</span>
      <p className="eyebrow">404 · 未找到</p>
      <h1>这一页尚未进入经藏。</h1>
      <p>链接可能已经改变，也可能还在等待整理。稳定段落的旧链接会在正式语料系统中长期保留映射。</p>
      <Link className="button-primary" href="/"><ArrowLeft aria-hidden="true" size={16} /> 返回首页</Link>
    </div>
  );
}
