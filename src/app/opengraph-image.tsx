import { ImageResponse } from "next/og";

export const alt = "foxue.ai｜从问题，回到原典";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "#f4f0e6",
        color: "#1e2620",
        padding: "72px 84px",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", inset: 28, border: "1px solid #d8d1c2" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 26, color: "#a33a2b" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 30,
              background: "#a33a2b",
              color: "#fffdf7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >佛</div>
          foxue.ai · 全球佛学交流 AI 平台
        </div>
        <div style={{ fontSize: 82, fontWeight: 600, letterSpacing: "-3px" }}>从问题，回到原典。</div>
        <div style={{ fontSize: 29, color: "#667067" }}>可引用 · 可验证 · 可纠错 · 可传承</div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 84,
          bottom: 72,
          width: 170,
          height: 170,
          border: "2px solid #a33a2b",
          borderRadius: 90,
          opacity: 0.24,
        }}
      />
    </div>,
    size,
  );
}
