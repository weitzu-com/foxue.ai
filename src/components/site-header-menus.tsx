"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

type NavigationItem = { href: string; label: string; prefetch?: false };

const primaryNavigation: NavigationItem[] = [
  { href: "/wenjing", label: "问经" },
  { href: "/jingzang", label: "经藏", prefetch: false },
  { href: "/gainian", label: "探索" },
  { href: "/duidu", label: "对读" },
  { href: "/xue", label: "研读" },
  { href: "/shufang", label: "书房" },
];

const secondaryNavigation: NavigationItem[] = [
  { href: "/hedui", label: "核对说法" },
  { href: "/yanjiu", label: "研究" },
  { href: "/blogs", label: "博客" },
  { href: "/yuanze", label: "原则" },
  { href: "/touming", label: "透明" },
];

const mobileNavigation: NavigationItem[] = [...primaryNavigation, ...secondaryNavigation];

export function SiteHeaderMenus() {
  const pathname = usePathname();
  const moreRef = useRef<HTMLDetailsElement>(null);
  const mobileRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    moreRef.current?.removeAttribute("open");
    mobileRef.current?.removeAttribute("open");
  }, [pathname]);

  return (
    <>
      <nav className="desktop-nav" aria-label="主要导航">
        {primaryNavigation.map((item) => (
          <Link key={item.href} href={item.href} prefetch={item.prefetch}>
            {item.label}
          </Link>
        ))}
        <details className="desktop-nav__more" ref={moreRef}>
          <summary>
            更多 <ChevronDown aria-hidden="true" size={14} />
          </summary>
          <div className="desktop-nav__menu" role="group" aria-label="更多入口">
            {secondaryNavigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </details>
        <Link className="nav-search" href="/jingzang/quanwen" prefetch={false}>
          <Search aria-hidden="true" size={15} /> 全文检索
        </Link>
      </nav>

      <details className="mobile-nav" ref={mobileRef}>
        <summary aria-label="展开全部导航">
          <Menu aria-hidden="true" />
        </summary>
        <nav aria-label="全部导航">
          <Link href="/jingzang/quanwen" prefetch={false}>
            全文检索
          </Link>
          {mobileNavigation.map((item) => (
            <Link key={item.href} href={item.href} prefetch={item.prefetch}>
              {item.label}
            </Link>
          ))}
        </nav>
      </details>
    </>
  );
}
