/**
 * safe-color.ts
 *
 * Given two palette colors that are confusable under CVD simulation,
 * find the nearest perceptually distinct alternatives for the first color.
 *
 * Strategy:
 *   1. Convert the target color to OKLCH (perceptually uniform, hue-preserving)
 *   2. Grid-sample the OKLCH space by varying Lightness and Chroma, fixing Hue
 *   3. For each candidate, simulate both colors under all common CVD types
 *   4. Compute CIEDE2000 between the simulated candidate and simulated other color
 *   5. Return the top 3 candidates sorted by similarity to the original
 *
 * OKLCH reference: Björn Ottosson, "A perceptual color space for image processing"
 * https://bottosson.github.io/posts/oklab/
 */

import { hexToRgb, rgbToHex, rgbToLinear, linearToRgb } from "./color-math";
import { simulateCVD } from "./cvd-matrices";
import { rgbToLab, deltaE2000, THRESHOLDS } from "./palette-analyzer";
import { CVDType } from "@/types";

// ---------------------------------------------------------------------------
// OKLAB / OKLCH color space
// Uses Ottosson's matrices — different from the HPE/D65 LMS used for CVD sim.
// ---------------------------------------------------------------------------

function linearToOklab(r: number, g: number, b: number): [number, number, number] {
  // linear sRGB → LMS (OKLAB-specific matrix)
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // LMS → LMS_ (cube root for perceptual uniformity)
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS_ → OKLAB
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.4072165128 * m_ - 0.4341205028 * s_,
  ];
}

function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  // OKLAB → LMS_
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // LMS_ → LMS (cube)
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear sRGB
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

/** Convert hex color to OKLCH [L ∈ 0-1, C ≥ 0, H ∈ 0-360]. */
function hexToOklch(hex: string): [number, number, number] {
  const lin = rgbToLinear(hexToRgb(hex));
  const [L, a, b] = linearToOklab(lin.r, lin.g, lin.b);
  const C = Math.sqrt(a * a + b * b);
  const H = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return [L, C, H];
}

/**
 * Convert OKLCH back to a hex string.
 * Returns null if the color falls outside the sRGB gamut.
 */
function oklchToHex(L: number, C: number, H: number): string | null {
  const hr = (H * Math.PI) / 180;
  const [lr, lg, lb] = oklabToLinear(L, C * Math.cos(hr), C * Math.sin(hr));

  // Reject colors that are significantly out of gamut (epsilon for fp errors)
  if (lr < -0.02 || lr > 1.02 || lg < -0.02 || lg > 1.02 || lb < -0.02 || lb > 1.02) {
    return null;
  }

  const rgb = linearToRgb({
    r: Math.max(0, Math.min(1, lr)),
    g: Math.max(0, Math.min(1, lg)),
    b: Math.max(0, Math.min(1, lb)),
  });
  return rgbToHex(rgb);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Which CVD types to check. Includes the five most prevalent. */
const CVD_TYPES: CVDType[] = [
  CVDType.Deuteranomaly,
  CVDType.Deuteranopia,
  CVDType.Protanomaly,
  CVDType.Protanopia,
  CVDType.Tritanopia,
];

export interface ColorSuggestion {
  /** The proposed replacement color as a hex string. */
  hex: string;
  /**
   * OKLAB Euclidean distance from the original color × 100.
   * Lower = more visually similar to the original.
   */
  similarity: number;
  /**
   * The minimum CIEDE2000 ΔE across all CVD types vs the other color.
   * Higher = more robustly distinguishable.
   */
  worstCaseDeltaE: number;
  /** Per-type ΔE breakdown. */
  cvdDeltaE: Partial<Record<CVDType, number>>;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Find the top 3 nearest alternatives for `targetHex` that are clearly
 * distinguishable from `otherHex` under every common CVD type.
 *
 * The search preserves hue — only Lightness and Chroma are adjusted.
 *
 * @param targetHex  The color to replace (must be a valid 6-digit hex).
 * @param otherHex   The color it must distinguish from under CVD.
 * @returns          Up to 3 suggestions, ranked by perceptual similarity.
 */
export function findSafeAlternatives(
  targetHex: string,
  otherHex: string,
): ColorSuggestion[] {
  const targetRgb = hexToRgb(targetHex);
  const otherRgb = hexToRgb(otherHex);
  const [origL, origC, origH] = hexToOklch(targetHex);
  const origLinear = rgbToLinear(targetRgb);
  const origOklab = linearToOklab(origLinear.r, origLinear.g, origLinear.b);

  // Pre-compute the other color's Lab under each CVD type once
  const otherSimLab: Partial<Record<CVDType, [number, number, number]>> = {};
  for (const type of CVD_TYPES) {
    otherSimLab[type] = rgbToLab(simulateCVD(otherRgb, type));
  }

  // Sampling grid: vary L (±5 steps of 0.05) and C (5 scale factors)
  // H is fixed to preserve perceptual hue
  const lOffsets = [-0.20, -0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15, 0.20];
  const cFactors = [0.5, 0.7, 1.0, 1.3, 1.6];

  const candidates: ColorSuggestion[] = [];

  for (const dl of lOffsets) {
    for (const cf of cFactors) {
      const newL = Math.max(0.02, Math.min(0.98, origL + dl));
      const newC = Math.max(0, origC * cf);

      const hex = oklchToHex(newL, newC, origH);
      if (!hex || hex === targetHex) continue;

      const candidateRgb = hexToRgb(hex);

      // Compute CIEDE2000 against the other color under each CVD type
      const cvdDeltaE: Partial<Record<CVDType, number>> = {};
      let worstCase = Infinity;

      for (const type of CVD_TYPES) {
        const simLab = rgbToLab(simulateCVD(candidateRgb, type));
        const de = deltaE2000(simLab, otherSimLab[type]!);
        cvdDeltaE[type] = Math.round(de * 10) / 10;
        if (de < worstCase) worstCase = de;
      }

      // Require at least marginal distinguishability across all CVD types
      if (worstCase < THRESHOLDS.confusable) continue;

      // Compute similarity to original in OKLAB space
      const canLinear = rgbToLinear(candidateRgb);
      const canOklab = linearToOklab(canLinear.r, canLinear.g, canLinear.b);
      const similarity =
        Math.sqrt(
          (origOklab[0] - canOklab[0]) ** 2 +
          (origOklab[1] - canOklab[1]) ** 2 +
          (origOklab[2] - canOklab[2]) ** 2,
        ) * 100;

      candidates.push({
        hex,
        similarity,
        worstCaseDeltaE: Math.round(worstCase * 10) / 10,
        cvdDeltaE,
      });
    }
  }

  // Sort: prefer safe (≥20) over marginal (≥10), then by similarity ascending
  candidates.sort((a, b) => {
    const aIsSafe = a.worstCaseDeltaE >= THRESHOLDS.marginal;
    const bIsSafe = b.worstCaseDeltaE >= THRESHOLDS.marginal;
    if (aIsSafe !== bIsSafe) return aIsSafe ? -1 : 1;
    return a.similarity - b.similarity;
  });

  // Deduplicate by hex value
  const seen = new Set<string>();
  const unique: ColorSuggestion[] = [];
  for (const c of candidates) {
    if (!seen.has(c.hex)) {
      seen.add(c.hex);
      unique.push(c);
    }
  }

  return unique.slice(0, 3);
}
