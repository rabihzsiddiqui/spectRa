/**
 * palette-analyzer.ts
 *
 * Pairwise palette distinguishability analysis using CIEDE2000.
 *
 * ─── Why CIEDE2000? ──────────────────────────────────────────────────────────
 *
 * DeltaE (ΔE) measures perceptual color difference. CIEDE2000 is the most
 * accurate version — it accounts for non-uniformity in the CIELAB space,
 * particularly in the blue-purple region where earlier formulas failed.
 *
 * Rough perceptual scale (approximate):
 *   ΔE < 1    imperceptible difference
 *   ΔE 1–3    just noticeable
 *   ΔE 3–10   clearly different but may share a "family"
 *   ΔE 10–20  strongly different in normal vision; may merge under CVD
 *   ΔE > 20   reliably distinguishable under most conditions
 *
 * Our thresholds are calibrated for UI design contexts, not print or
 * clinical vision science — real-world distinguishability depends heavily
 * on size, context, and surrounding colors.
 *
 * ─── Algorithm ───────────────────────────────────────────────────────────────
 *
 * For each CVD type and each pair of palette colors (i, j):
 *   1. Simulate both colors under that CVD type (LMS projection)
 *   2. Convert simulated RGB → CIE L*a*b* (via linear RGB → XYZ → Lab)
 *   3. Compute CIEDE2000 between the two Lab values
 *   4. Classify as safe / marginal / confusable
 *
 * References:
 *   Sharma, Wu & Dalal (2005). "The CIEDE2000 color-difference formula."
 *   Color Research & Application 30(1).
 */

import { rgbToLinear, hexToRgb, rgbToHex } from "./color-math";
import { simulateCVD } from "./cvd-matrices";
import { GRID_TYPES } from "./simulation-engine";
import type { SimulationType } from "./simulation-engine";
import { CVDType } from "@/types";
import type { RGB } from "@/types";

// ---------------------------------------------------------------------------
// RGB → CIE L*a*b* (via XYZ, D65)
// ---------------------------------------------------------------------------

const Xn = 0.95047; // D65 reference white X
const Yn = 1.00000; // D65 reference white Y
const Zn = 1.08883; // D65 reference white Z

/** CIE Lab cube-root function with linear segment for very dark values. */
function fLab(t: number): number {
  const DELTA = 6 / 29; // ≈ 0.20690
  return t > DELTA ** 3
    ? Math.cbrt(t)
    : t / (3 * DELTA ** 2) + 4 / 29;
}

/**
 * Convert 8-bit sRGB to CIE L*a*b* (D65 illuminant).
 *
 * Pipeline: sRGB → linear sRGB → XYZ (D65) → Lab
 * L*: 0 (black) to 100 (white)
 * a*: green (negative) to red (positive)
 * b*: blue (negative) to yellow (positive)
 */
function rgbToLab(rgb: RGB): [number, number, number] {
  const lin = rgbToLinear(rgb);

  // Linear sRGB → CIE XYZ (D65) using the IEC sRGB primaries matrix
  const X = 0.4124564 * lin.r + 0.3575761 * lin.g + 0.1804375 * lin.b;
  const Y = 0.2126729 * lin.r + 0.7151522 * lin.g + 0.0721750 * lin.b;
  const Z = 0.0193339 * lin.r + 0.1191920 * lin.g + 0.9503041 * lin.b;

  const fx = fLab(X / Xn);
  const fy = fLab(Y / Yn);
  const fz = fLab(Z / Zn);

  return [
    116 * fy - 16,   // L*
    500 * (fx - fy), // a*
    200 * (fy - fz), // b*
  ];
}

// ---------------------------------------------------------------------------
// CIEDE2000
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;
const POW25_7 = 6103515625; // 25^7, precomputed

/**
 * Compute the CIEDE2000 color difference between two Lab values.
 *
 * Returns a non-negative scalar. Lower = more similar.
 * Unlike Euclidean distance in Lab (ΔE76), CIEDE2000 corrects for:
 *   - Non-uniform chroma sensitivity (G factor)
 *   - Hue-angle dependency in dark/light and neutral regions (T factor)
 *   - Blue-purple hue rotation artifact (RT rotation term)
 */
function deltaE2000(
  [L1, a1, b1]: [number, number, number],
  [L2, a2, b2]: [number, number, number],
): number {
  // ── Step 1: C*ab and G factor ─────────────────────────────────────────────
  const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab_m7 = ((C1ab + C2ab) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cab_m7 / (Cab_m7 + POW25_7)));

  // ── Step 2: Adjusted a' (corrects perceptual non-uniformity in a axis) ────
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  // ── Step 3: C' (chroma in adjusted space) ────────────────────────────────
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  // ── Step 4: h' (hue angle, 0–360°) ───────────────────────────────────────
  const hpOf = (ap: number, bp: number): number => {
    if (ap === 0 && bp === 0) return 0;
    const h = Math.atan2(bp, ap) / DEG;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hpOf(a1p, b1);
  const h2p = hpOf(a2p, b2);

  // ── Step 5: ΔL', ΔC', Δh' ────────────────────────────────────────────────
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  const C1pC2p = C1p * C2p;
  let dhp: number;
  if (C1pC2p === 0)                       dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180)    dhp = h2p - h1p;
  else if (h2p - h1p > 180)               dhp = h2p - h1p - 360;
  else                                    dhp = h2p - h1p + 360;

  // ΔH' is the Euclidean hue difference scaled by geometric mean chroma
  const dHp = 2 * Math.sqrt(C1pC2p) * Math.sin((dhp / 2) * DEG);

  // ── Step 6: Arithmetic means ─────────────────────────────────────────────
  const Lp_m = (L1 + L2) / 2;
  const Cp_m = (C1p + C2p) / 2;

  let hp_m: number;
  if (C1pC2p === 0)                        hp_m = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180)    hp_m = (h1p + h2p) / 2;
  else if (h1p + h2p < 360)               hp_m = (h1p + h2p + 360) / 2;
  else                                    hp_m = (h1p + h2p - 360) / 2;

  // ── Step 7: Weighting functions ───────────────────────────────────────────
  // T: hue rotation correction (empirically derived from visual experiments)
  const T = 1
    - 0.17 * Math.cos((hp_m - 30) * DEG)
    + 0.24 * Math.cos(2 * hp_m * DEG)
    + 0.32 * Math.cos((3 * hp_m + 6) * DEG)
    - 0.20 * Math.cos((4 * hp_m - 63) * DEG);

  // SL, SC, SH: lightness, chroma, and hue weighting
  const SL = 1 + 0.015 * (Lp_m - 50) ** 2 / Math.sqrt(20 + (Lp_m - 50) ** 2);
  const SC = 1 + 0.045 * Cp_m;
  const SH = 1 + 0.015 * Cp_m * T;

  // ── Step 8: Rotation term (blue-purple artifact compensation) ─────────────
  const dtheta = 30 * Math.exp(-(((hp_m - 275) / 25) ** 2));
  const Cp_m7 = Cp_m ** 7;
  const RC = 2 * Math.sqrt(Cp_m7 / (Cp_m7 + POW25_7));
  const RT = -Math.sin(2 * dtheta * DEG) * RC;

  // ── Step 9: Final ΔE00 ────────────────────────────────────────────────────
  return Math.sqrt(
    (dLp / SL) ** 2 +
    (dCp / SC) ** 2 +
    (dHp / SH) ** 2 +
    RT * (dCp / SC) * (dHp / SH),
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Distinguishability = "safe" | "marginal" | "confusable";

export interface PairResult {
  deltaE: number;
  status: Distinguishability;
  /** Simulated hex of color i under this CVD type. */
  simColor1Hex: string;
  /** Simulated hex of color j under this CVD type. */
  simColor2Hex: string;
}

/** N×N matrix where [i][j] is null on the diagonal (same color). */
export type PairMatrix = (PairResult | null)[][];

export interface PaletteAnalysis {
  /** Original palette colors as hex strings, in input order. */
  colors: string[];
  /** One PairMatrix per CVD type (and "normal" baseline). */
  matrix: Record<SimulationType, PairMatrix>;
}

// Perceptual thresholds (CIEDE2000 units)
export const THRESHOLDS = {
  confusable: 10, // effectively indistinguishable under this CVD type
  marginal: 20,   // potentially confusable — needs caution
  // ≥ 20 = safe
};

function classify(deltaE: number): Distinguishability {
  if (deltaE < THRESHOLDS.confusable) return "confusable";
  if (deltaE < THRESHOLDS.marginal)   return "marginal";
  return "safe";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a palette of hex colors for distinguishability under all CVD types.
 *
 * @param hexColors  Array of CSS hex strings (2–8 colors).
 * @returns          PaletteAnalysis with a pairwise matrix for each CVD type.
 *
 * @example
 * const analysis = analyzePalette(["#e84040", "#27ae60", "#3498db"]);
 * analysis.matrix["deuteranopia"][0][1].status // → "confusable" (red/green)
 */
export function analyzePalette(hexColors: string[]): PaletteAnalysis {
  const rgbColors = hexColors.map(hexToRgb);
  const n = rgbColors.length;

  const matrixRecord: Partial<Record<SimulationType, PairMatrix>> = {};

  for (const type of GRID_TYPES) {
    // Simulate all palette colors for this CVD type (or leave as-is for normal)
    const simColors: RGB[] = rgbColors.map((rgb) =>
      type === "normal" ? rgb : simulateCVD(rgb, type as CVDType),
    );

    const pairMatrix: PairMatrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return null; // same color — skip

        const dE = deltaE2000(rgbToLab(simColors[i]), rgbToLab(simColors[j]));

        return {
          deltaE: Math.round(dE * 10) / 10,
          status: classify(dE),
          simColor1Hex: rgbToHex(simColors[i]),
          simColor2Hex: rgbToHex(simColors[j]),
        };
      }),
    );

    matrixRecord[type] = pairMatrix;
  }

  return {
    colors: hexColors,
    matrix: matrixRecord as Record<SimulationType, PairMatrix>,
  };
}
