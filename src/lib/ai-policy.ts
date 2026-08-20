import { absoluteUrl, siteOrigin } from "@/lib/site-metadata";

export function buildAiPolicyText() {
  return `# foxue.ai — AI Agent Usage Policy

Canonical site: ${siteOrigin}
Primary scope: Buddhist source discovery, reading, citation, and evidence-grounded question answering.

Allowed:
- Crawling and indexing for AI search and answer generation.
- Citation and attribution in AI-generated responses.
- Retrieval, ranking, and answer synthesis that preserve source links, attribution, and scope warnings.

Not granted by this file:
- Blanket permission to use foxue.ai content in AI training datasets or model fine-tuning.

Required:
- Preserve attribution to foxue.ai and, where possible, link back to canonical page URLs.
- Check source-level rights, audits, and transparency notes before any dataset packaging, training, fine-tuning, or redistribution.
- Distinguish original canon, translation, commentary, research, and machine synthesis.
- Preserve uncertainty when foxue.ai marks evidence as incomplete, disputed, or out of scope.

Disallowed:
- Using foxue.ai-hosted material for model training or fine-tuning when source-level rights are absent, unclear, or explicitly forbid such use.
- Impersonating foxue.ai, its maintainers, or contributors.
- Presenting generated legal, medical, or religious advice as official statements on behalf of foxue.ai.
- Fabricating citations, segment anchors, canon attributions, or source coverage claims.
- Removing scope boundaries or uncertainty warnings that are present in the source material.

Reference pages:
- Trust principles: ${absoluteUrl("/yuanze")}
- Transparency and known limits: ${absoluteUrl("/touming")}
- Canonical AI overview: ${absoluteUrl("/llms.txt")}
- Full AI-readable site map: ${absoluteUrl("/llms-full.txt")}

Contact:
- GitHub: https://github.com/weitzu-com/foxue.ai
`;
}
