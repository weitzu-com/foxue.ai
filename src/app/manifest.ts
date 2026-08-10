import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "foxue.ai｜从问题，回到原典",
    short_name: "foxue.ai",
    description: "全球佛学交流的可信 AI 平台",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#a33a2b",
    lang: "zh-Hans",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
