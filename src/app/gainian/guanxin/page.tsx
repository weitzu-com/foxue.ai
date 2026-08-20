import type { Metadata } from "next";
import { ConceptHubPage } from "@/components/concept-hub-page";
import { getConceptHub } from "@/lib/concept-hubs";
import { buildPageMetadata } from "@/lib/site-metadata";

const hub = getConceptHub("guanxin");

if (!hub) {
  throw new Error("缺少观心主题 Hub 配置");
}

export const metadata: Metadata = buildPageMetadata({
  title: hub.metadataTitle,
  description: hub.description,
  path: hub.entry.href,
});

export default function ObservingMindConceptPage() {
  return <ConceptHubPage hub={hub} />;
}
