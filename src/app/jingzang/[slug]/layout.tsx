import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSutra, sutras } from "@/data/sutras";
import { buildPageMetadata, buildQualifiedTitle } from "@/lib/site-metadata";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sutras.map((sutra) => ({ slug: sutra.slug }));
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) return { title: "经典未找到" };
  const pageTitle = buildQualifiedTitle(sutra.title, "原文与目录");
  const metadata = buildPageMetadata({
    title: pageTitle,
    description: `${sutra.title}：${sutra.summary}`,
    path: `/jingzang/${sutra.slug}`,
  });
  return {
    ...metadata,
    title: {
      default: pageTitle,
      template: "%s｜foxue.ai",
    },
  };
}

export default async function SutraLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();

  return (
    <div className="reader-page page-shell">
      <div className="page-breadcrumb">
        <Link href="/jingzang" prefetch={false}><ArrowLeft aria-hidden="true" size={15} /> 经藏</Link>
        <span>/</span>
        <Link href={`/jingzang/${sutra.slug}`} prefetch={false}>{sutra.alternateTitle}</Link>
      </div>

      {children}
    </div>
  );
}
