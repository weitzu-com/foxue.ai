import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { getSutra, sutras } from "@/data/sutras";

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
  return {
    title: sutra.alternateTitle,
    description: `${sutra.title}：${sutra.summary}`,
    alternates: { canonical: `/jingzang/${sutra.slug}` },
  };
}

export default async function SutraLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const sutra = getSutra(slug);
  if (!sutra) notFound();

  return (
    <div className="reader-page page-shell">
      <div className="page-breadcrumb">
        <Link href="/jingzang"><ArrowLeft aria-hidden="true" size={15} /> 经藏</Link>
        <span>/</span>
        <Link href={`/jingzang/${sutra.slug}`}>{sutra.alternateTitle}</Link>
      </div>

      <header className="reader-header">
        <div className="reader-header__mark" aria-hidden="true">经</div>
        <div className="reader-header__title">
          <p className="eyebrow">{sutra.tradition}</p>
          <h1>{sutra.title}</h1>
          <p>{sutra.alternateTitle} · {sutra.translator}</p>
        </div>
        <div className="reader-header__status">
          <span><CircleCheck aria-hidden="true" /> {sutra.status}</span>
          <span>{sutra.canonRef}</span>
        </div>
      </header>

      {children}
    </div>
  );
}
