export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "foxue.ai",
      version: "0.1.0",
      capabilities: {
        reading: "available",
        citedAnswers: "prototype",
        generativeAI: "disabled",
        corpusRegistry: "building",
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
