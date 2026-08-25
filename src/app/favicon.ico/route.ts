const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#a33a2b"/>
  <circle cx="32" cy="32" r="23" fill="none" stroke="#f4f0e6" stroke-width="1.5" opacity=".8"/>
  <text x="32" y="42" text-anchor="middle" font-family="serif" font-size="31" fill="#fffdf7">佛</text>
</svg>
`.trim();

export const dynamic = "force-static";

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
