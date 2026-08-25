import { buildLlmsFullText } from "@/lib/llms";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return new Response(await buildLlmsFullText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
