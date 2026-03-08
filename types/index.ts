/**
 * Represents a color in 8-bit sRGB (the standard web color space).
 * Values are integers in the range [0, 255].
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Represents a color in linearized sRGB.
 * Values are floats in the range [0, 1] after gamma expansion.
 * This is the physical light intensity, not the perceptual encoding.
 */
export interface LinearRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Represents a color in HSL (Hue, Saturation, Lightness).
 * h: [0, 360), s: [0, 100], l: [0, 100]
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Represents cone excitation values in LMS color space.
 *
 * L = Long-wavelength (red) cone — peak sensitivity ~560nm
 * M = Medium-wavelength (green) cone — peak sensitivity ~530nm
 * S = Short-wavelength (blue) cone — peak sensitivity ~420nm
 *
 * This is the physiological color space — the actual signals your
 * photoreceptors send to the brain. All color perception starts here.
 * CVD (Color Vision Deficiency) is modeled as the absence or alteration
 * of one of these cone types.
 */
export interface LMS {
  l: number;
  m: number;
  s: number;
}

/**
 * Types of color vision deficiency.
 *
 * Dichromats (-opia): missing one cone type entirely.
 * Anomalous trichromats (-anomaly): shifted or reduced cone sensitivity.
 * Anomalous trichromacy is more common — ~6% of males have deuteranomaly.
 */
export enum CVDType {
  // Dichromatic (missing cone type)
  Protanopia = "protanopia",       // missing L cones (~1% of males)
  Deuteranopia = "deuteranopia",   // missing M cones (~1% of males)
  Tritanopia = "tritanopia",       // missing S cones (~0.01%, rare, equal sex distribution)

  // Anomalous trichromacy (shifted cone)
  Protanomaly = "protanomaly",     // anomalous L cones (~1% of males)
  Deuteranomaly = "deuteranomaly", // anomalous M cones (~6% of males)
  Tritanomaly = "tritanomaly",     // anomalous S cones (~0.01%, rare)
}

/** WCAG 2.1 conformance level. */
export enum WCAGLevel {
  AA = "AA",
  AAA = "AAA",
}

/**
 * Result of a WCAG 2.1 contrast check.
 *
 * ratio: the contrast ratio, e.g. 4.5 means "4.5:1"
 * aa.normal: passes WCAG AA for normal text (4.5:1)
 * aa.large: passes WCAG AA for large text (3:1)
 * aaa.normal: passes WCAG AAA for normal text (7:1)
 * aaa.large: passes WCAG AAA for large text (4.5:1)
 *
 * "Large text" in WCAG means ≥ 18pt regular or ≥ 14pt bold.
 */
export interface ContrastResult {
  ratio: number;
  aa: {
    normal: boolean;
    large: boolean;
  };
  aaa: {
    normal: boolean;
    large: boolean;
  };
}
