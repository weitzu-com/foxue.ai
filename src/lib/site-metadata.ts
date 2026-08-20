import type { Metadata } from "next";

export const siteOrigin = "https://www.foxue.ai";
export const siteName = "foxue.ai";

const titleLimit = 42;
const descriptionLimit = 150;

export function truncateMetadata(value: string, limit: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  const characters = Array.from(compact);
  if (characters.length <= limit) return compact;
  return `${characters.slice(0, Math.max(1, limit - 1)).join("").trimEnd()}…`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const safeTitle = truncateMetadata(title, titleLimit);
  const safeDescription = truncateMetadata(description, descriptionLimit);
  const canonical = path.startsWith("/") ? path : `/${path}`;

  return {
    title: safeTitle,
    description: safeDescription,
    alternates: { canonical },
    robots: index ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName,
      url: `${siteOrigin}${canonical}`,
      title: `${safeTitle}｜${siteName}`,
      description: safeDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: `${safeTitle}｜${siteName}`,
      description: safeDescription,
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
