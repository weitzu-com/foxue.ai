import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export default function UnbundledFolioRoute() {
  notFound();
}
