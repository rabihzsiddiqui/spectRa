import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "spectRa — color accessibility, grounded in vision science";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SWATCHES = ["#e84040", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          gap: 0,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 20 }}>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#fafafa",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            spectRa
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#10b981",
              lineHeight: 1,
            }}
          >
            .
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: "#525252",
            marginBottom: 52,
            letterSpacing: "0.01em",
          }}
        >
          color accessibility, grounded in vision science
        </div>

        {/* Color swatches */}
        <div style={{ display: "flex", gap: 14, marginBottom: 48 }}>
          {SWATCHES.map((color) => (
            <div
              key={color}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        {/* Feature tags */}
        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          {["contrast checker", "CVD simulator", "palette analysis", "image simulator"].map(
            (feature, i) => (
              <div key={feature} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && (
                  <span style={{ color: "#2a2a2a", fontSize: 14 }}>·</span>
                )}
                <span
                  style={{
                    fontSize: 14,
                    color: "#404040",
                    letterSpacing: "0.02em",
                  }}
                >
                  {feature}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
