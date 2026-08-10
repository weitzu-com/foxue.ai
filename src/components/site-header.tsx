import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { href: "/wenjing", label: "问经" },
  { href: "/jingzang", label: "经藏" },
  { href: "/yuanze", label: "原则" },
  { href: "/touming", label: "透明" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <Link href="/" className="brand" aria-label="foxue.ai 首页">
          <BrandMark compact />
          <span className="brand__wordmark">foxue.ai</span>
          <span className="brand__descriptor">全球佛学交流 AI 平台</span>
        </Link>

        <nav className="desktop-nav" aria-label="主要导航">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <a
            className="nav-source"
            href="https://github.com/weitzu-com/foxue.ai"
            target="_blank"
            rel="noreferrer"
          >
            开放源码 <ArrowUpRight aria-hidden="true" size={15} />
          </a>
        </nav>

        <details className="mobile-nav">
          <summary aria-label="打开导航">
            <Menu aria-hidden="true" />
          </summary>
          <nav aria-label="移动端导航">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
