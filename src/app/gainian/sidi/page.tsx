import type { Metadata } from "next";
import { ConceptHubPage } from "@/components/concept-hub-page";
import { getConceptHub } from "@/lib/concept-hubs";
import { buildPageMetadata } from "@/lib/site-metadata";

const hub = getConceptHub("sidi");

export const metadata: Metadata = buildPageMetadata({
  title: hub.metadataTitle,
  description: hub.description,
  path: hub.entry.href,
});

export default function FourNobleTruthsConceptPage() {
  return <ConceptHubPage hub={hub} />;
}
