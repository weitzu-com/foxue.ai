import { buildAiPolicyText } from "@/lib/ai-policy";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return new Response(buildAiPolicyText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
