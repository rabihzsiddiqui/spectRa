"use client";

import { useState } from "react";
import type { PaletteAnalysis } from "@/lib/palette-analyzer";
import { GRID_TYPES, CVD_META } from "@/lib/simulation-engine";

interface Props {
  colors: string[];
  analysis: PaletteAnalysis;
}

type Copied = "css" | "url" | null;

export default function PaletteExport({ colors, analysis }: Props) {
  const [copied, setCopied] = useState<Copied>(null);

  function flash(type: Copied) {
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  }

  // ── Copy CSS ──────────────────────────────────────────────────────────────
  function handleCopyCSS() {
    const lines = colors
      .map((hex, i) => `  --color-${i + 1}: ${hex};`)
      .join("\n");
    const css = `:root {\n${lines}\n}`;
    navigator.clipboard.writeText(css).then(() => flash("css"));
  }

  // ── Share URL ─────────────────────────────────────────────────────────────
  function handleShare() {
    const encoded = colors.map((h) => h.replace("#", "")).join(",");
    const url = `${window.location.origin}${window.location.pathname}?palette=${encoded}`;
    navigator.clipboard.writeText(url).then(() => flash("url"));
  }

  // ── Export PNG report ─────────────────────────────────────────────────────
  function handleExportReport() {
    const canvas = document.createElement("canvas");
    const W = 800;

    // Layout constants
    const PAD = 36;
    const HEADER_H = 56;
    const SWATCH_H = 88;
    const GRID_ROWS = 2;
    const GRID_COLS = 3;
    const CELL_H = 144;
    const H = HEADER_H + SWATCH_H + GRID_ROWS * CELL_H;

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;

    // ── Helpers ──────────────────────────────────────────────────────────────
    function rect(
      x: number, y: number, w: number, h: number,
      fill: string, r = 0,
    ) {
      ctx.fillStyle = fill;
      if (r === 0) {
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    function text(
      str: string, x: number, y: number,
      opts: { size?: number; color?: string; weight?: string; align?: CanvasTextAlign } = {},
    ) {
      const { size = 13, color = "#a3a3a3", weight = "400", align = "left" } = opts;
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.textAlign = align;
      ctx.fillText(str, x, y);
    }

    // ── Background ───────────────────────────────────────────────────────────
    rect(0, 0, W, H, "#0a0a0a");

    // ── Header ───────────────────────────────────────────────────────────────
    text("spectRa", PAD, 34, { size: 18, color: "#fafafa", weight: "700" });
    const spectraWidth = 70; // approximate
    text("· palette report", PAD + spectraWidth + 6, 34, { size: 18, color: "#525252" });

    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    text(dateStr, W - PAD, 34, { size: 12, color: "#404040", align: "right" });

    // Header bottom border
    rect(0, HEADER_H - 1, W, 1, "#1a1a1a");

    // ── Swatches ─────────────────────────────────────────────────────────────
    const swatchSize = 32;
    const swatchGap = 12;
    const totalSwatchW =
      colors.length * swatchSize + (colors.length - 1) * swatchGap;
    let sx = (W - totalSwatchW) / 2;
    const sy = HEADER_H + 16;

    for (const hex of colors) {
      rect(sx, sy, swatchSize, swatchSize, hex, 6);
      text(hex.toLowerCase(), sx + swatchSize / 2, sy + swatchSize + 14, {
        size: 10,
        color: "#525252",
        align: "center",
      });
      sx += swatchSize + swatchGap;
    }

    rect(0, HEADER_H + SWATCH_H - 1, W, 1, "#1a1a1a");

    // ── CVD Matrix Grid ───────────────────────────────────────────────────────
    const cvdTypes = GRID_TYPES; // 6 types including "normal"
    const n = colors.length;
    const cellPad = 20;

    // Cell size for matrix cells (color squares)
    const availMatrixPx = Math.floor(W / GRID_COLS) - cellPad * 2 - 16; // 16 for row header
    // Each matrix slot is (n+1) cells wide/tall (including header row/col)
    const cs = Math.max(6, Math.min(14, Math.floor(availMatrixPx / (n + 1))));
    const gap = 2;
    const matrixPx = (n + 1) * cs + n * gap; // includes header row/col

    for (let gi = 0; gi < cvdTypes.length; gi++) {
      const row = Math.floor(gi / GRID_COLS);
      const col = gi % GRID_COLS;
      const cellW = Math.floor(W / GRID_COLS);
      const cellX = col * cellW;
      const cellY = HEADER_H + SWATCH_H + row * CELL_H;

      // Cell vertical separator
      if (col > 0) rect(cellX, cellY, 1, CELL_H, "#1a1a1a");
      // Row separator
      if (row > 0) rect(cellX, cellY, cellW, 1, "#1a1a1a");

      const type = cvdTypes[gi];
      const label = CVD_META[type].label;

      // CVD type label
      text(label, cellX + cellPad, cellY + 22, {
        size: 11,
        color: "#737373",
        weight: type === "normal" ? "500" : "400",
      });

      // Matrix — centered in available cell space
      const matrixX = cellX + (cellW - matrixPx) / 2;
      const matrixY = cellY + 34;
      const pairMatrix = analysis.matrix[type];

      // Column header swatches (row 0)
      for (let j = 0; j < n; j++) {
        const x = matrixX + (cs + gap) + j * (cs + gap);
        const y = matrixY;
        rect(x, y, cs, cs, colors[j], 2);
      }

      // Row header swatches + data cells
      for (let i = 0; i < n; i++) {
        const y = matrixY + (cs + gap) + i * (cs + gap);

        // Row header
        rect(matrixX, y, cs, cs, colors[i], 2);

        // Data cells
        for (let j = 0; j < n; j++) {
          const x = matrixX + (cs + gap) + j * (cs + gap);
          const pair = pairMatrix[i]?.[j];

          if (pair === null) {
            // Diagonal
            rect(x, y, cs, cs, "#1e1e1e", 2);
          } else {
            const fill =
              pair.status === "safe"       ? "#10b981" :
              pair.status === "marginal"   ? "#f59e0b" :
                                            "#f43f5e";
            rect(x, y, cs, cs, fill, 2);
          }
        }
      }
    }

    // ── Footer watermark ─────────────────────────────────────────────────────
    text("spectra.app — browser-native, no uploads, no tracking", W / 2, H - 10, {
      size: 9,
      color: "#2a2a2a",
      align: "center",
    });

    // ── Download ──────────────────────────────────────────────────────────────
    const link = document.createElement("a");
    link.download = "spectra-palette-report.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-widest text-neutral-600">
        export
      </span>

      <button
        onClick={handleCopyCSS}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        {copied === "css" ? "copied!" : "copy css"}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        {copied === "url" ? "copied!" : "share"}
      </button>

      <button
        onClick={handleExportReport}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        export report
      </button>
    </div>
  );
}
