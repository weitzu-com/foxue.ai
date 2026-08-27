import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { serializeJsonLd, siteOrigin } from "@/lib/site-metadata";
import "./globals.css";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const gaMeasurementId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "")
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  : undefined;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteOrigin}/#organization`,
      name: "foxue.ai",
      url: siteOrigin,
      slogan: "从问题，回到原典",
      description:
        "可核验的佛经原典阅读与证据问经平台。检索、阅读与理解佛典，每一项结论都回到原文、版本与范围边界。",
      logo: `${siteOrigin}/icon.svg`,
      areaServed: ["CN", "US", "Global"],
      knowsAbout: ["佛学", "佛经", "佛典", "大藏经", "佛教", "人工智能", "数字人文学"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://github.com/weitzu-com/foxue.ai",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteOrigin}/#website`,
      url: siteOrigin,
      name: "foxue.ai",
      inLanguage: "zh-Hans",
      publisher: { "@id": `${siteOrigin}/#organization` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "佛经原典阅读与可核验问经",
    template: "%s｜foxue.ai",
  },
  description:
    "提供可核验的佛经原典阅读、稳定行段定位与证据问经；完整原文、人工复核范围与建设缺口均公开。",
  keywords: ["佛学", "佛经", "佛经原文", "佛典", "大藏经", "佛教", "原典检索", "AI 问经"],
  authors: [{ name: "foxue.ai contributors" }],
  creator: "foxue.ai",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteOrigin,
    siteName: "foxue.ai",
    title: "佛经原典阅读与可核验问经｜foxue.ai",
    description: "提供佛经原典阅读、稳定行段定位与证据问经，每一项关键结论都回到可核验出处。",
  },
  twitter: {
    card: "summary_large_image",
    title: "佛经原典阅读与可核验问经｜foxue.ai",
    description: "提供佛经原典阅读、稳定行段定位与证据问经，每一项关键结论都回到可核验出处。",
  },
  verification: googleSiteVerification
    ? { google: googleSiteVerification }
    : undefined,
  other: gaMeasurementId
    ? { "ga4-measurement-id": gaMeasurementId }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#101612" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hans" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
