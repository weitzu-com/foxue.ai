import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { AnalyticsPreferencesButton } from "@/components/google-analytics";
import { corpusRegistry } from "@/lib/corpus-registry";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__grid">
        <div className="footer-vow">
          <BrandMark />
          <div>
            <p className="eyebrow">FOXUE.AI · 立愿于 2026</p>
            <p>愿每一个问题都能回到原典，愿智慧不因时代迁移而失传。</p>
          </div>
        </div>
        <div className="footer-links">
          <Link href="/jingzang" prefetch={false}>浏览经藏</Link>
          <Link href="/shufang">我的书房</Link>
          <Link href="/jingzang/quanwen">佛经全文检索</Link>
          <Link href="/jingzang/fanwen">梵文原典门</Link>
          <Link href="/duidu">佛经对读书案</Link>
          <Link href="/duidu/ebt">汉巴 EBT 证据书案</Link>
          <Link href="/duidu/amituojing" prefetch={false}>阿弥陀经双译对读</Link>
          <Link href="/duidu/xinjing" prefetch={false}>心经异译对读</Link>
          <Link href="/duidu/jingangjing" prefetch={false}>金刚经主题对读</Link>
          <Link href="/blogs">佛学博客</Link>
          <Link href="/hedui">核对说法</Link>
          <Link href="/fugai">佛典覆盖</Link>
          <Link href="/fenmu">全球分母</Link>
          <Link href="/shenjiao">作品审校</Link>
          <Link href="/yuanze">方法与边界</Link>
          <Link href="/touming">数据透明</Link>
          <a
            href="https://github.com/weitzu-com/foxue.ai"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowUpRight aria-hidden="true" size={14} />
          </a>
          <AnalyticsPreferencesButton />
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>代码 Apache-2.0 · 佛典与译文遵循各自来源许可</span>
        <span>当前版本：可信原型 · GBCR {corpusRegistry.registry.version}</span>
      </div>
    </footer>
  );
}
