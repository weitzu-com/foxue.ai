"use client";

import Link from "next/link";
import { BookMarked, House, MessageCircleQuestion, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "./mobile-task-nav.module.css";

type TaskNavigationItem = {
  href: string;
  label: string;
  icon: typeof House;
  prefetch?: false;
};

const taskNavigation: TaskNavigationItem[] = [
  { href: "/", label: "首页", icon: House },
  { href: "/jingzang/quanwen", label: "搜索", icon: Search, prefetch: false },
  { href: "/wenjing", label: "问经", icon: MessageCircleQuestion },
  { href: "/shufang", label: "书房", icon: BookMarked },
];

function isCurrentTask(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTaskNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="移动端常用任务" data-mobile-task-nav>
      {taskNavigation.map((item) => {
        const Icon = item.icon;
        const current = isCurrentTask(pathname, item.href);

        return (
          <Link
            key={item.href}
            className={styles.link}
            data-current={current ? "true" : undefined}
            href={item.href}
            prefetch={item.prefetch}
            aria-current={current ? "page" : undefined}
          >
            <Icon aria-hidden="true" strokeWidth={1.7} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
