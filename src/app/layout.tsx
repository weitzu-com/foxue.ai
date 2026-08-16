import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const gaMeasurementId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "")
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  : undefined;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://foxue.ai/#organization",
      name: "foxue.ai",
      url: "https://foxue.ai",
      slogan: "从问题，回到原典",
      description:
        "全球佛学交流的可信 AI 平台。检索、阅读与理解佛典，每一项结论都回到可核验的原文与版本。",
      logo: "https://foxue.ai/icon.svg",
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
      "@id": "https://foxue.ai/#website",
      url: "https://foxue.ai",
      name: "foxue.ai",
      inLanguage: ["zh-Hans", "en"],
      publisher: { "@id": "https://foxue.ai/#organization" },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "foxue.ai｜从问题，回到原典",
    template: "%s｜foxue.ai",
  },
  description:
    "全球佛学交流的可信 AI 平台。检索、阅读与理解佛典，每一项结论都回到可核验的原文与版本。",
  keywords: ["佛学", "佛经", "AI", "佛典", "大藏经", "佛教", "人工智能"],
  authors: [{ name: "foxue.ai contributors" }],
  creator: "foxue.ai",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "foxue.ai",
    title: "foxue.ai｜从问题，回到原典",
    description: "全球佛学交流的可信 AI 平台。让每一个问题回到可核验的原典。",
  },
  twitter: {
    card: "summary_large_image",
    title: "foxue.ai｜从问题，回到原典",
    description: "全球佛学交流的可信 AI 平台。",
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
    <html lang="zh-Hans">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
