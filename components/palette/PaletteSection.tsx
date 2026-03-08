"use client";

import { useState } from "react";
import PaletteInput from "./PaletteInput";
import ConfusionMatrix from "./ConfusionMatrix";
import { analyzePalette } from "@/lib/palette-analyzer";
import type { PaletteAnalysis } from "@/lib/palette-analyzer";

// Default palette chosen to immediately show the classic red/green CVD failure
const DEFAULT_COLORS = ["#e84040", "#27ae60", "#3498db", "#f39c12"];

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-neutral-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function PaletteSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [analysis, setAnalysis] = useState<PaletteAnalysis | null>(null);

  function handleColorsChange(next: string[]) {
    setColors(next);
    // Invalidate previous analysis when the palette changes
    setAnalysis(null);
  }

  function handleAnalyze() {
    try {
      setAnalysis(analyzePalette(colors));
    } catch {
      // Invalid colors — silently skip
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/50">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-neutral-700/20"
        aria-expanded={isExpanded}
      >
        <div>
          <h2 className="text-lg font-semibold text-white">palette analysis</h2>
          <p className="mt-0.5 text-sm text-neutral-400">
            check if your full palette works for everyone.
          </p>
        </div>
        <ChevronIcon expanded={isExpanded} />
      </button>

      {/* Body — only rendered when expanded */}
      {isExpanded && (
        <div className="space-y-6 border-t border-neutral-700/50 p-6">
          <PaletteInput
            colors={colors}
            onChange={handleColorsChange}
            onAnalyze={handleAnalyze}
          />

          {analysis && (
            <div className="border-t border-neutral-700/50 pt-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">
                confusion matrix
              </p>
              <ConfusionMatrix analysis={analysis} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
