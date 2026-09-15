import Link from "next/link";
import { ChevronDown, Menu, Search } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

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
  { href: "/yuanze", label: "原则" },
  { href: "/touming", label: "透明" },
];

const mobileNavigation: NavigationItem[] = [...primaryNavigation, ...secondaryNavigation];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <Link
          href="/"
          className="brand"
          aria-label="佛 foxue.ai 可核验佛典阅读与问经 首页"
        >
          <BrandMark compact />
          <span className="brand__wordmark">foxue.ai</span>
          <span className="brand__descriptor">可核验佛典阅读与问经</span>
        </Link>

        <nav className="desktop-nav" aria-label="主要导航">
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href} prefetch={item.prefetch}>
              {item.label}
            </Link>
          ))}
          <details className="desktop-nav__more">
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

        <details className="mobile-nav">
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
      </div>
    </header>
  );
}
