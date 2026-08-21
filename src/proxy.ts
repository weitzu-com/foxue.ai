import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import corpusRuntimeRouting from "@/data/corpus-runtime-routing.generated.json";

const slugToBucket = corpusRuntimeRouting.slugToBucket as Record<string, string>;
const folioPathPattern = /^\/jingzang\/([a-z0-9-]+)\/([a-z0-9.-]+)$/;

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const match = pathname.match(folioPathPattern);
  if (!match) return NextResponse.next();
  const [, slug, folio] = match;
  const bucket = slugToBucket[slug];
  if (!bucket) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = `/corpus-runtime/${bucket}/${slug}/${folio}`;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: "/jingzang/:slug/:folio",
};
