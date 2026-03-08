/**
 * color-math.ts
 *
 * Core color space conversions. All math implemented from first principles
 * using the IEC 61966-2-1 (sRGB) and CIE standards.
 *
 * Key concepts:
 *
 * sRGB is a non-linear encoding. The gamma curve compresses bright values
 * so more bits are used in the perceptually important dark ranges. Most web
 * colors (CSS hex, Tailwind classes, browser DevTools) are in sRGB.
 *
 * "Linear light" / "linearized sRGB" is the physical intensity version —
 * each channel is proportional to actual photon count. You must work in
 * linear light for any weighted sum (luminance, blending, CVD matrices)
 * or the math will be wrong.
 */

import type { RGB, LinearRGB, HSL, LMS } from "@/types";

// ---------------------------------------------------------------------------
// Hex ↔ RGB
// ---------------------------------------------------------------------------

/**
 * Parse a CSS hex color string to 8-bit RGB.
 * Accepts: #RGB, #RRGGBB (leading # optional).
 */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, "");

  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const int = parseInt(expanded, 16);
  return {
    r: (int >> 16) & 0xff,
    g: (int >> 8) & 0xff,
    b: int & 0xff,
  };
}

/**
 * Convert 8-bit RGB to a lowercase CSS hex string (e.g. "#1a2b3c").
 */
export function rgbToHex({ r, g, b }: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ---------------------------------------------------------------------------
// sRGB gamma ↔ linear light
// ---------------------------------------------------------------------------

/**
 * Remove sRGB gamma from a single normalized channel value [0, 1].
 *
 * The sRGB standard (IEC 61966-2-1) uses a piecewise function:
 * - Linear segment for very dark values (avoids noise amplification)
 * - Power curve (γ ≈ 2.2, precisely 2.4) for everything else
 *
 * This is required before any weighted calculation involving light
 * (luminance, blending, CVD simulation).
 */
function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Apply sRGB gamma to a single linear channel value [0, 1].
 * Inverse of linearize().
 */
function delinearize(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * Convert 8-bit sRGB to linear light (float [0, 1] per channel).
 */
export function rgbToLinear({ r, g, b }: RGB): LinearRGB {
  return {
    r: linearize(r / 255),
    g: linearize(g / 255),
    b: linearize(b / 255),
  };
}

/**
 * Convert linear light (float [0, 1]) back to 8-bit sRGB.
 */
export function linearToRgb({ r, g, b }: LinearRGB): RGB {
  return {
    r: Math.round(clamp(delinearize(r), 0, 1) * 255),
    g: Math.round(clamp(delinearize(g), 0, 1) * 255),
    b: Math.round(clamp(delinearize(b), 0, 1) * 255),
  };
}

// ---------------------------------------------------------------------------
// Linear RGB ↔ LMS (cone responses)
// ---------------------------------------------------------------------------

/**
 * Combined transformation matrix: linear sRGB → LMS (cone excitation).
 *
 * Derived by multiplying:
 *   1. The IEC sRGB → CIE XYZ (D65) matrix
 *   2. The Hunt–Pointer–Estévez XYZ → LMS matrix (adapted to D65)
 *
 * This gives us the actual cone excitation signals the eye sends to the
 * brain when it sees a given RGB color on a standard monitor.
 *
 * Source: Machado, Oliveira & Fernandes (2009), "A Physiologically-based
 * Model for Simulation of Color Vision Deficiency". IEEE TVCG.
 */
const M_RGB_TO_LMS: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [0.31399022, 0.63951294, 0.04649755],
  [0.15537241, 0.75789446, 0.08670142],
  [0.01775239, 0.10944209, 0.87256922],
];

/**
 * Inverse of M_RGB_TO_LMS: LMS → linear sRGB.
 */
const M_LMS_TO_RGB: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [5.47221206, -4.64196010, 0.16963142],
  [-1.12524190, 2.29317979, -0.16789990],
  [0.02980165, -0.19318073, 1.16364789],
];

/** Convert linear sRGB to LMS cone excitation values. */
export function linearToLms({ r, g, b }: LinearRGB): LMS {
  return {
    l: M_RGB_TO_LMS[0][0] * r + M_RGB_TO_LMS[0][1] * g + M_RGB_TO_LMS[0][2] * b,
    m: M_RGB_TO_LMS[1][0] * r + M_RGB_TO_LMS[1][1] * g + M_RGB_TO_LMS[1][2] * b,
    s: M_RGB_TO_LMS[2][0] * r + M_RGB_TO_LMS[2][1] * g + M_RGB_TO_LMS[2][2] * b,
  };
}

/** Convert LMS cone excitation back to linear sRGB. */
export function lmsToLinear({ l, m, s }: LMS): LinearRGB {
  return {
    r: M_LMS_TO_RGB[0][0] * l + M_LMS_TO_RGB[0][1] * m + M_LMS_TO_RGB[0][2] * s,
    g: M_LMS_TO_RGB[1][0] * l + M_LMS_TO_RGB[1][1] * m + M_LMS_TO_RGB[1][2] * s,
    b: M_LMS_TO_RGB[2][0] * l + M_LMS_TO_RGB[2][1] * m + M_LMS_TO_RGB[2][2] * s,
  };
}

// ---------------------------------------------------------------------------
// RGB ↔ HSL
// ---------------------------------------------------------------------------

/**
 * Convert 8-bit RGB to HSL.
 * h: [0, 360), s: [0, 100], l: [0, 100]
 *
 * HSL is a cylinder transform of the RGB cube — it separates hue (color angle),
 * saturation (colorfulness), and lightness (perceived brightness). Note that
 * HSL lightness is not the same as WCAG luminance — it's a geometric average,
 * not a perceptually weighted sum.
 */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));

  let h = 0;
  if (max === rn) {
    h = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    h = (bn - rn) / delta + 2;
  } else {
    h = (rn - gn) / delta + 4;
  }

  h = ((h * 60) + 360) % 360;

  return { h, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL back to 8-bit RGB.
 */
export function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Clamp a number to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Apply a 3×3 matrix to a [x, y, z] column vector.
 * Used internally for LMS transforms.
 */
export function mat3x3MultiplyVec(
  m: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ],
  v: readonly [number, number, number],
): [number, number, number] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}
