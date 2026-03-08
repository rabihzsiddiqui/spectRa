/**
 * contrast.ts
 *
 * WCAG 2.1 contrast ratio calculation and conformance checking.
 *
 * ─── Background ──────────────────────────────────────────────────────────────
 *
 * Contrast ratio is the most important single metric for color accessibility.
 * It quantifies how much brighter one color is than another, in a way that
 * correlates with legibility for people with low contrast sensitivity
 * (including those with some forms of CVD, cataracts, or other conditions).
 *
 * WCAG defines two things:
 *   1. Relative luminance — a measure of how much light a color emits/reflects,
 *      weighted by how sensitive the human visual system is to each wavelength.
 *   2. Contrast ratio — a comparison of luminances of two colors.
 *
 * ─── Relative Luminance ─────────────────────────────────────────────────────
 *
 * Relative luminance (Y) is defined by the CIE as:
 *   Y = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
 *
 * These weights reflect the sensitivity of the human eye:
 *   - Green (~555nm): most sensitive (≈71.5%)
 *   - Red (~700nm): moderately sensitive (≈21.3%)
 *   - Blue (~445nm): least sensitive (≈7.2%)
 *
 * This is why green text on white often looks "too bright" and blue text
 * "too dark" at the same numeric lightness value.
 *
 * ─── Contrast Ratio ─────────────────────────────────────────────────────────
 *
 * WCAG 2.1 contrast ratio formula:
 *   ratio = (L_lighter + 0.05) / (L_darker + 0.05)
 *
 * The +0.05 offset represents flare — the minimum amount of light reflected
 * from a display, preventing a division by zero and modeling real-world
 * monitor behavior.
 *
 * Range: 1:1 (identical) to 21:1 (black on white).
 *
 * ─── Pass Thresholds ─────────────────────────────────────────────────────────
 *
 *              Normal text     Large text
 *   WCAG AA       4.5:1          3:1
 *   WCAG AAA      7:1            4.5:1
 *
 * "Large text" = ≥ 18pt (24px) regular or ≥ 14pt (≈18.67px) bold.
 * Text under these sizes must pass the stricter normal-text thresholds.
 *
 * References:
 *   WCAG 2.1 §1.4.3 (Contrast Minimum, Level AA)
 *   WCAG 2.1 §1.4.6 (Contrast Enhanced, Level AAA)
 *   WCAG 2.1 §1.4.11 (Non-text Contrast, not implemented here)
 */

import { rgbToLinear } from "./color-math";
import type { RGB, ContrastResult } from "@/types";

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const THRESHOLD_AA_NORMAL = 4.5;
const THRESHOLD_AA_LARGE  = 3.0;
const THRESHOLD_AAA_NORMAL = 7.0;
const THRESHOLD_AAA_LARGE  = 4.5;

// ---------------------------------------------------------------------------
// Luminance
// ---------------------------------------------------------------------------

/**
 * Compute WCAG 2.1 relative luminance for an sRGB color.
 *
 * Returns a value in [0, 1] where:
 *   0 = absolute black
 *   1 = absolute white (or 100% full-field emission on the display)
 *
 * Step 1: Linearize sRGB channels (remove gamma).
 * Step 2: Weight by the CIE luminous efficiency function for D65.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(rgb: RGB): number {
  const { r, g, b } = rgbToLinear(rgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------------------
// Contrast ratio
// ---------------------------------------------------------------------------

/**
 * Compute the WCAG 2.1 contrast ratio between two colors.
 *
 * Order-independent: always returns a value ≥ 1.
 *
 * @returns contrast ratio as a number (e.g. 4.5 means "4.5:1")
 */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);

  const lighter = Math.max(la, lb);
  const darker  = Math.min(la, lb);

  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Full WCAG result
// ---------------------------------------------------------------------------

/**
 * Evaluate a foreground/background color pair against all WCAG 2.1 text
 * contrast requirements.
 *
 * @param fg  Foreground color (text).
 * @param bg  Background color (surface behind text).
 * @returns   A ContrastResult with the ratio and pass/fail for each level.
 *
 * @example
 * const result = getContrastResult({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
 * // result.ratio → 21
 * // result.aa.normal → true
 * // result.aaa.normal → true
 */
export function getContrastResult(fg: RGB, bg: RGB): ContrastResult {
  const ratio = contrastRatio(fg, bg);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: {
      normal: ratio >= THRESHOLD_AA_NORMAL,
      large:  ratio >= THRESHOLD_AA_LARGE,
    },
    aaa: {
      normal: ratio >= THRESHOLD_AAA_NORMAL,
      large:  ratio >= THRESHOLD_AAA_LARGE,
    },
  };
}

/**
 * Format a contrast ratio for display (e.g. "4.53:1").
 */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Describe the overall WCAG compliance of a contrast ratio in plain language.
 * Returns one of: "aaa", "aa", "aa-large", "fail"
 */
export function wcagGrade(ratio: number): "aaa" | "aa" | "aa-large" | "fail" {
  if (ratio >= THRESHOLD_AAA_NORMAL) return "aaa";
  if (ratio >= THRESHOLD_AA_NORMAL)  return "aa";
  if (ratio >= THRESHOLD_AA_LARGE)   return "aa-large";
  return "fail";
}
