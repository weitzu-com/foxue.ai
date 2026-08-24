import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import corpusRuntimeRouting from "@/data/corpus-runtime-routing.generated.json";
import { rewriteCatalogFolioPath } from "@/lib/corpus-folio-proxy.mjs";

export function proxy(request: NextRequest) {
  const destinationPath = rewriteCatalogFolioPath(request.nextUrl.pathname, corpusRuntimeRouting);
  if (!destinationPath) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = destinationPath;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: [
    "/jingzang/:slug/:folio",
    "/jingzang/:slug/:folio/",
    "/jingzang/:slug/:folio.rsc",
  ],
};
