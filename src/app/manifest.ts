import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "foxue.ai｜佛经在线阅读与 AI 问经平台",
    short_name: "foxue.ai",
    description: "提供佛经在线阅读、原典查询与 AI 问经，每一项关键结论都回到可核验的原文与版本。",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#a33a2b",
    lang: "zh-Hans",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
