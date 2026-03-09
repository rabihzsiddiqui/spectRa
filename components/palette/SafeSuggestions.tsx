"use client";

import { useMemo } from "react";
import { findSafeAlternatives } from "@/lib/safe-color";
import type { ColorSuggestion } from "@/lib/safe-color";
import { THRESHOLDS } from "@/lib/palette-analyzer";

interface Props {
  /** The palette color being replaced. */
  targetHex: string;
  /** Index of that color in the palette array. */
  targetIndex: number;
  /** The other color it must be distinguishable from. */
  otherHex: string;
  /** Called when the user clicks "apply" on a suggestion. */
  onApply: (index: number, hex: string) => void;
}

export default function SafeSuggestions({ targetHex, targetIndex, otherHex, onApply }: Props) {
  // Compute suggestions synchronously — OKLAB sampling + CIEDE2000 is fast enough
  const suggestions = useMemo(
    () => findSafeAlternatives(targetHex, otherHex),
    [targetHex, otherHex],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
        suggested replacements for color {targetIndex + 1}
      </p>

      {suggestions.length === 0 ? (
        <p className="text-xs text-neutral-600">
          no alternatives found. try adjusting the palette manually.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={i}
              suggestion={s}
              originalHex={targetHex}
              onApply={() => onApply(targetIndex, s.hex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single suggestion card
// ---------------------------------------------------------------------------

interface CardProps {
  suggestion: ColorSuggestion;
  originalHex: string;
  onApply: () => void;
}

function SuggestionCard({ suggestion, originalHex, onApply }: CardProps) {
  const isSafe = suggestion.worstCaseDeltaE >= THRESHOLDS.marginal;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-700/50 bg-neutral-900 p-4">
      {/* Before → after swatch */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 shrink-0 rounded-md border border-neutral-700"
          style={{ backgroundColor: originalHex }}
          title="original"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-neutral-600"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
        <div
          className="h-7 w-7 shrink-0 rounded-md border border-neutral-700"
          style={{ backgroundColor: suggestion.hex }}
          title="proposed"
        />
        <span className="truncate font-mono text-xs text-neutral-400">
          {suggestion.hex}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        {/* Worst-case ΔE badge */}
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-xs font-medium ${
            isSafe
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          ΔE {suggestion.worstCaseDeltaE}
        </span>

        {/* Similarity */}
        <span className="text-xs text-neutral-600">
          Δ {suggestion.similarity.toFixed(1)} from orig.
        </span>
      </div>

      {/* Apply button */}
      <button
        onClick={onApply}
        className="mt-auto w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
      >
        apply
      </button>
    </div>
  );
}
