"use client";

import { useRouter } from "next/navigation";

type JuanOption = {
  key: string;
  juan?: string;
  pages: number;
};

export function ReaderJuanSelect({
  slug,
  items,
  currentKey,
}: {
  slug: string;
  items: JuanOption[];
  currentKey?: string;
}) {
  const router = useRouter();

  return (
    <label className="reader-juan-select">
      <span>选择卷次</span>
      <select
        aria-label="选择经文卷次"
        value={currentKey ?? ""}
        onChange={(event) => {
          if (event.target.value) router.push(`/jingzang/${slug}/${event.target.value}`);
        }}
      >
        {!currentKey && <option value="">请选择一卷</option>}
        {items.map((item) => (
          <option key={item.key} value={item.key}>
            卷 {Number(item.juan)} · {item.pages} 页
          </option>
        ))}
      </select>
      <small>六百卷保持一个精确入口；选择后从该卷第一页开始。</small>
    </label>
  );
}
