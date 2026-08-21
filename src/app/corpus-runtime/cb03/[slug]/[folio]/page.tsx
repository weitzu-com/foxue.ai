export { default, generateMetadata } from "@/app/jingzang/[slug]/[folio]/page";

export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}
