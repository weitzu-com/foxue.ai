import { readFileSync } from "node:fs";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";
import { corpusFolioExistence } from "./corpus-folio-existence-document.mjs";

const routing = JSON.parse(
  readFileSync(new URL("../src/data/corpus-runtime-routing.generated.json", import.meta.url), "utf8"),
);

export const corpusRuntimeSmokePaths = [
  "/jingzang/jingangjing/001-0748c",
  "/jingzang/xinjing/001-0848a",
  "/jingzang/daboruo-jing/001-0001a",
  "/jingzang/daboruo-jing/304-0552c",
  "/jingzang/zengyiahanjing/001-0549a",
  "/jingzang/dasheng-ru-lengqiejing/001-0587a",
  "/jingzang/changahanjing/001-0001a",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/derge-kangyur-d0008/021-0279b",
];

export const corpusRuntimeSmokeRoutes = corpusRuntimeSmokePaths.map((path) => {
  const rewritten = rewriteCatalogFolioPath(path, routing, corpusFolioExistence);
  if (!rewritten) throw new Error(`运行时抽样路由无法改写：${path}`);
  return { bucket: rewritten.split("/")[2], path };
});
