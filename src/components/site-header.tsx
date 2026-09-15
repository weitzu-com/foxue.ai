import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteHeaderMenus } from "@/components/site-header-menus";

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

        <SiteHeaderMenus />
      </div>
    </header>
  );
}
