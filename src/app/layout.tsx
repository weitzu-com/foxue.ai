import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const editorial = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";

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
  alternates: { canonical: siteUrl },
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
    <html lang="zh-Hans" className={editorial.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
