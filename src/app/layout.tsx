import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { canonicalSiteUrl } from "@/lib/site-url";
import "./globals.css";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const gaMeasurementId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "")
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(canonicalSiteUrl),
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
    url: canonicalSiteUrl,
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${canonicalSiteUrl}/#organization`,
        name: "foxue.ai",
        url: canonicalSiteUrl,
        slogan: "从问题，回到原典",
        description:
          "全球佛学交流的可信 AI 平台。检索、阅读与理解佛典，每一项结论都回到可核验的原文与版本。",
        areaServed: ["CN", "US", "TW", "HK", "SG", "JP", "KR", "VN"],
        knowsAbout: [
          "佛教",
          "佛典",
          "大藏经",
          "汉传佛教",
          "巴利三藏",
          "藏文大藏经",
          "人工智能",
          "数字人文学",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "support",
          url: `${canonicalSiteUrl}/touming`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${canonicalSiteUrl}/#website`,
        url: canonicalSiteUrl,
        name: "foxue.ai",
        inLanguage: ["zh-Hans", "zh-Hant", "en"],
        publisher: { "@id": `${canonicalSiteUrl}/#organization` },
      },
      {
        "@type": "WebApplication",
        "@id": `${canonicalSiteUrl}/#webapp`,
        name: "foxue.ai 佛典 AI",
        url: canonicalSiteUrl,
        applicationCategory: "ReferenceApplication",
        operatingSystem: "Any",
        inLanguage: ["zh-Hans", "zh-Hant", "en"],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

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
