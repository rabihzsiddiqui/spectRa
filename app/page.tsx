"use client";

import { useState, useMemo } from "react";
import ColorPicker from "@/components/color-input/ColorPicker";
import ContrastRatio from "@/components/contrast/ContrastRatio";
import WcagBadge from "@/components/contrast/WcagBadge";
import TextPreview from "@/components/text-preview/TextPreview";
import CvdGrid from "@/components/simulation/CvdGrid";
import PaletteSection from "@/components/palette/PaletteSection";
import { hexToRgb } from "@/lib/color-math";
import { getContrastResult } from "@/lib/contrast";

// Starting with white on near-black (the default spectRa palette)
const DEFAULT_FG = "#fafafa";
const DEFAULT_BG = "#09090b";

export default function Home() {
  const [fg, setFg] = useState(DEFAULT_FG);
  const [bg, setBg] = useState(DEFAULT_BG);

  // Recalculate contrast only when colors change
  const result = useMemo(() => {
    try {
      return getContrastResult(hexToRgb(fg), hexToRgb(bg));
    } catch {
      return null;
    }
  }, [fg, bg]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 pb-16 pt-24">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">contrast checker</h1>
        <p className="mt-1 text-sm text-neutral-400">
          pick two colors, see if they meet wcag standards.
        </p>
      </div>

      {/* Color input panel */}
      <ColorPicker
        fg={fg}
        bg={bg}
        onFgChange={setFg}
        onBgChange={setBg}
      />

      {/* Contrast results */}
      {result && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
          <ContrastRatio result={result} />

          {/* WCAG badge panel */}
          <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-6">
            <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              wcag 2.1
            </span>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <WcagBadge
                label="AA"
                sublabel="normal text (4.5:1)"
                passes={result.aa.normal}
              />
              <WcagBadge
                label="AA"
                sublabel="large text (3:1)"
                passes={result.aa.large}
              />
              <WcagBadge
                label="AAA"
                sublabel="normal text (7:1)"
                passes={result.aaa.normal}
              />
              <WcagBadge
                label="AAA"
                sublabel="large text (4.5:1)"
                passes={result.aaa.large}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live text preview */}
      <TextPreview fg={fg} bg={bg} />

      {/* CVD simulation grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">vision simulation</h2>
          <p className="mt-1 text-sm text-neutral-400">
            how your colors look across different types of color vision.
          </p>
        </div>
        <CvdGrid fg={fg} bg={bg} />
      </div>

      {/* Palette analysis — collapsed by default */}
      <PaletteSection />
    </div>
  );
}
