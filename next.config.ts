import type { NextConfig } from "next";
import { buildReleaseHeaders } from "./src/lib/release-provenance";
import corpusRuntimeTracing from "./src/data/corpus-runtime-tracing.generated.json";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const releaseHeaders = buildReleaseHeaders().map(([key, value]) => ({ key, value }));
const corpusRuntimeIncludes = Object.fromEntries(
  corpusRuntimeTracing.buckets.map((bucket) => [
    `/corpus-runtime/${bucket.id}/**`,
    bucket.includeGlobs.map((assetPath) => `./${assetPath}`),
  ]),
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  outputFileTracingIncludes: {
    ...corpusRuntimeIncludes,
  },
  experimental: {
    // Each reading page can parse a complete source witness during prerendering.
    // Bound per-worker concurrency so large witnesses do not exhaust the 4 GiB
    // V8 heap used by hosted builds as the corpus grows.
    staticGenerationMaxConcurrency: 2,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...releaseHeaders],
      },
    ];
  },
};

export default nextConfig;
