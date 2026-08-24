import { includeCorpusBucketJson } from "./nft-json";

export { default, generateMetadata } from "@/app/jingzang/_folio/page-module";

export const revalidate = 86400;

export async function generateStaticParams() {
  await includeCorpusBucketJson(`nft:${process.env.NEXT_RUNTIME ?? "node"}`);
  return [{"slug":"changahanjing","folio":"001-0001a"},{"slug":"changahanjing","folio":"002-0011a"}];
}
