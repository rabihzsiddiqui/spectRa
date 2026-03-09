/**
 * simulation-engine.ts
 *
 * Batch CVD simulation: given a foreground + background color pair, returns
 * simulated versions for every relevant CVD type, along with the contrast
 * ratio that pair achieves under that simulation.
 *
 * This is the bridge between the raw math in cvd-matrices.ts / contrast.ts
 * and the UI layer. The UI doesn't need to know about LMS space — it just
 * asks for results and gets back hex-displayable RGB values.
 *
 * ─── Why simulate both fg and bg? ──────────────────────────────────────────
 *
 * When you simulate CVD for a color pair, both colors shift. A high-contrast
 * combination in normal vision can become low-contrast if both colors shift
 * toward the same point in the dichromatic gamut.
 *
 * The most common real-world failure: red (#ff0000) on green (#00ff00).
 * Perfect 3.0:1 contrast for trichromats. Under deuteranopia, both colors
 * collapse to a brownish-olive — contrast drops to roughly 1.2:1.
 */

import { simulateCVD } from "./cvd-matrices";
import { contrastRatio } from "./contrast";
import { rgbToHex } from "./color-math";
import { CVDType } from "@/types";
import type { RGB } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SimulationType = "normal" | CVDType;

export interface SimulatedPair {
  /** Simulated foreground color. Equals the original under "normal". */
  fg: RGB;
  /** Simulated background color. Equals the original under "normal". */
  bg: RGB;
  /** Pre-computed fg hex string for use in inline styles. */
  fgHex: string;
  /** Pre-computed bg hex string for use in inline styles. */
  bgHex: string;
  /** Contrast ratio of the simulated pair (between 1 and 21). */
  contrastRatio: number;
  /** Whether the simulated pair passes WCAG AA for normal text (≥ 4.5:1). */
  passesAA: boolean;
}

export type SimulationRecord = Record<SimulationType, SimulatedPair>;

// ---------------------------------------------------------------------------
// Simulation display metadata
// ---------------------------------------------------------------------------

export const CVD_META: Record<
  SimulationType,
  { label: string; description: string; isBaseline: boolean }
> = {
  normal:       { label: "normal vision",  description: "how most people see colors",                       isBaseline: true  },
  deuteranopia: { label: "deuteranopia",   description: "red-green color blind (green type), ~1% of males", isBaseline: false },
  deuteranomaly:{ label: "deuteranomaly",  description: "reduced red-green sensitivity, ~6% of males",      isBaseline: false },
  protanopia:   { label: "protanopia",     description: "red-green color blind (red type), ~1% of males",   isBaseline: false },
  protanomaly:  { label: "protanomaly",    description: "reduced red sensitivity, ~1% of males",            isBaseline: false },
  tritanopia:   { label: "tritanopia",     description: "blue-yellow color blind, ~0.01%, any sex",         isBaseline: false },
  tritanomaly:  { label: "tritanomaly",    description: "reduced blue-yellow sensitivity, ~0.01%, rare",    isBaseline: false },
};

/**
 * The ordered list of types shown in the grid.
 * Deuteranomaly first — it's the most prevalent form of CVD worldwide.
 */
export const GRID_TYPES: SimulationType[] = [
  "normal",
  CVDType.Deuteranomaly,
  CVDType.Deuteranopia,
  CVDType.Protanomaly,
  CVDType.Protanopia,
  CVDType.Tritanopia,
];

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Simulate a fg/bg color pair for every CVD type in GRID_TYPES.
 *
 * @param fg  Foreground color (text), 8-bit sRGB.
 * @param bg  Background color (surface), 8-bit sRGB.
 * @returns   A record keyed by SimulationType, each containing the
 *            simulated RGB pair, pre-computed hex values, and contrast stats.
 */
export function simulateAllTypes(fg: RGB, bg: RGB): SimulationRecord {
  const build = (simFg: RGB, simBg: RGB): SimulatedPair => {
    const ratio = contrastRatio(simFg, simBg);
    return {
      fg: simFg,
      bg: simBg,
      fgHex: rgbToHex(simFg),
      bgHex: rgbToHex(simBg),
      contrastRatio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
    };
  };

  return {
    normal:              build(fg, bg),
    [CVDType.Deuteranomaly]: build(simulateCVD(fg, CVDType.Deuteranomaly), simulateCVD(bg, CVDType.Deuteranomaly)),
    [CVDType.Deuteranopia]:  build(simulateCVD(fg, CVDType.Deuteranopia),  simulateCVD(bg, CVDType.Deuteranopia)),
    [CVDType.Protanomaly]:   build(simulateCVD(fg, CVDType.Protanomaly),   simulateCVD(bg, CVDType.Protanomaly)),
    [CVDType.Protanopia]:    build(simulateCVD(fg, CVDType.Protanopia),    simulateCVD(bg, CVDType.Protanopia)),
    [CVDType.Tritanopia]:    build(simulateCVD(fg, CVDType.Tritanopia),    simulateCVD(bg, CVDType.Tritanopia)),
    [CVDType.Tritanomaly]:   build(simulateCVD(fg, CVDType.Tritanomaly),   simulateCVD(bg, CVDType.Tritanomaly)),
  };
}
