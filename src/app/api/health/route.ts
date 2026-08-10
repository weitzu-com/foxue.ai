export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "foxue.ai",
      version: "0.2.0",
      capabilities: {
        reading: "available",
        citedAnswers: "prototype",
        generativeAI: "disabled",
        corpusRegistry: "v0.1.0-public-draft",
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
