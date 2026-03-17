"use client";

import { useState, useMemo } from "react";
import ColorPicker from "@/components/color-input/ColorPicker";
import ContrastRatio from "@/components/contrast/ContrastRatio";
import WcagBadge from "@/components/contrast/WcagBadge";
import TextPreview from "@/components/text-preview/TextPreview";
import CvdGrid from "@/components/simulation/CvdGrid";
import PaletteSection from "@/components/palette/PaletteSection";
import ImageSimulator from "@/components/image-sim/ImageSimulator";
import ScienceOverlay from "@/components/education/ScienceOverlay";
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
    <div>
      {/* Centered hero */}
      <div className="flex flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {["open source", "no uploads", "browser-based"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-700/60 px-3 py-1 text-xs text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-6xl font-bold tracking-tight md:text-8xl">
          <span className="bg-gradient-to-r from-red-500 to-emerald-400 bg-clip-text text-transparent">spectRa</span><span className="inline-block w-[0.08em] h-[0.08em] ml-[0.04em] align-baseline bg-emerald-500" />
        </h1>
        <p className="mt-5 max-w-md text-base text-neutral-400 leading-relaxed">
          check if your colors are readable by everyone. contrast ratios, color blindness simulation, and palette testing.
        </p>
        <a
          href="#tool"
          className="mt-8 rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-500 hover:scale-105"
        >
          get started
        </a>
      </div>

      {/* Tool content */}
      <div id="tool" className="mx-auto max-w-3xl space-y-6 px-6 pb-16">

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
              accessibility standards
            </span>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              AA is what most websites aim for. AAA is stricter, for high-stakes or public content.
              headings get a lower threshold because larger text is easier to read at lower contrast.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <WcagBadge
                label="AA"
                sublabel="body text (min 4.5:1)"
                passes={result.aa.normal}
              />
              <WcagBadge
                label="AA"
                sublabel="headings (min 3:1)"
                passes={result.aa.large}
              />
              <WcagBadge
                label="AAA"
                sublabel="body text (min 7:1)"
                passes={result.aaa.normal}
              />
              <WcagBadge
                label="AAA"
                sublabel="headings (min 4.5:1)"
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
          <h2 className="text-lg font-semibold text-white">color blindness simulation</h2>
          <p className="mt-1 text-sm text-neutral-400">
            each card shows how your colors appear to someone with that type of color vision. the contrast ratio and pass/fail badge update to reflect what they actually see.
          </p>
        </div>
        <CvdGrid fg={fg} bg={bg} />
      </div>

      {/* Palette analysis — collapsed by default */}
      <PaletteSection />

      {/* Image CVD simulator — collapsed by default */}
      <ImageSimulator />

      {/* Educational content — collapsed by default */}
      <ScienceOverlay />
    </div>
    </div>
  );
}
