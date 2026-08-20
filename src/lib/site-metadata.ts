import type { Metadata } from "next";

export const siteOrigin = "https://www.foxue.ai";
export const siteName = "foxue.ai";

export const titleLimit = 42;
export const descriptionLimit = 150;

export function truncateMetadata(value: string, limit: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  const characters = Array.from(compact);
  if (characters.length <= limit) return compact;
  return `${characters.slice(0, Math.max(1, limit - 1)).join("").trimEnd()}…`;
}

export function formatSiteTitle(title: string) {
  return `${title}｜${siteName}`;
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
      title: formatSiteTitle(safeTitle),
      description: safeDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: formatSiteTitle(safeTitle),
      description: safeDescription,
    },
  };
}

export function absoluteUrl(path: string) {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return new URL(safePath, siteOrigin).href;
}

type JsonLdThing = {
  "@type": string;
  name: string;
  [key: string]: unknown;
};

type BreadcrumbEntry = {
  name: string;
  path: string;
};

export function buildBreadcrumbJsonLd(path: string, items: BreadcrumbEntry[]) {
  const url = absoluteUrl(path);
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildPageJsonLd({
  path,
  title,
  description,
  type = "WebPage",
  breadcrumb = [],
  about = [],
  mainEntityId,
}: {
  path: string;
  title: string;
  description: string;
  type?: string;
  breadcrumb?: BreadcrumbEntry[];
  about?: Array<string | JsonLdThing>;
  mainEntityId?: string;
}) {
  const url = absoluteUrl(path);
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": type,
      "@id": `${url}#page`,
      url,
      name: title,
      description,
      inLanguage: "zh-Hans",
      isPartOf: { "@id": `${siteOrigin}/#website` },
      publisher: { "@id": `${siteOrigin}/#organization` },
      ...(about.length > 0
        ? {
            about: about.map((item) =>
              typeof item === "string" ? { "@type": "Thing", name: item } : item,
            ),
          }
        : {}),
      ...(breadcrumb.length > 0 ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
      ...(mainEntityId ? { mainEntity: { "@id": mainEntityId } } : {}),
    },
  ];

  if (breadcrumb.length > 0) {
    graph.push(buildBreadcrumbJsonLd(path, breadcrumb) as Record<string, unknown>);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
