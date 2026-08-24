import { includeCorpusBucketJson } from "./nft-json";

export { default, generateMetadata } from "@/app/jingzang/_folio/page-module";

export const revalidate = 86400;

export async function generateStaticParams() {
  await includeCorpusBucketJson(`nft:${process.env.NEXT_RUNTIME ?? "node"}`);
  return [{"slug":"dasheng-ru-lengqiejing","folio":"001-0587a"},{"slug":"jingangjing","folio":"001-0748c"},{"slug":"jingangjing","folio":"001-0749a"},{"slug":"jingangjing","folio":"001-0749c"}];
}
