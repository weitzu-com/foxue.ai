import type { ReactNode } from "react";
import Link from "next/link";

const inlinePattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\((\/[^\s)]*|https?:\/\/[^\s)]+)\)/g;

/**
 * 博客正文只允许两种行内标记：**加粗** 与 [文字](链接)。
 * 链接只接受站内路径或 https 绝对地址；其他一律按纯文本输出。
 */
export function BlogInlineText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    const [, bold, label, href] = match;
    if (bold !== undefined) {
      nodes.push(<strong key={key++}>{bold}</strong>);
    } else if (href.startsWith("/")) {
      nodes.push(
        <Link key={key++} href={href} prefetch={false}>
          {label}
        </Link>,
      );
    } else {
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>,
      );
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return <>{nodes}</>;
}
