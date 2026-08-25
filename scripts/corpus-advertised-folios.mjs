// Small advertised folio set for build-time prerender. Paths only.
// Must not import folio sources, locators, existence ledger, or routing.
// Do not expand toward the 261k folio index (Vercel 2048-route cap / build heap).

export const corpusAdvertisedFolioMaxCount = 32;

export const corpusAdvertisedFolioPaths = [
  "/jingzang/jingangjing/001-0748c",
  "/jingzang/jingangjing/001-0749a",
  "/jingzang/jingangjing/001-0749c",
  "/jingzang/xinjing/001-0848a",
  "/jingzang/xinjing/001-0848c",
  "/jingzang/daboruo-jing/001-0001a",
  "/jingzang/daboruo-jing/304-0552c",
  "/jingzang/zengyiahanjing/001-0549a",
  "/jingzang/dasheng-ru-lengqiejing/001-0587a",
  "/jingzang/changahanjing/001-0001a",
  "/jingzang/changahanjing/002-0011a",
  "/jingzang/weimojiejing/001-0537a",
  "/jingzang/weimojiejing/001-0537b",
  "/jingzang/zaahanjing/001-0001a",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/derge-kangyur-d0008/021-0279b",
];
