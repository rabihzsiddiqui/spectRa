/**
 * cvd-matrices.ts
 *
 * Color Vision Deficiency (CVD) simulation using the Brettel et al. (1997) method,
 * with the Viénot, Brettel & Mollon (1999) numerical matrices.
 *
 * ─── Background ──────────────────────────────────────────────────────────────
 *
 * The human eye has three types of cone photoreceptors (L, M, S). Color vision
 * deficiencies arise when one cone type is absent (dichromacy) or has a shifted
 * spectral sensitivity (anomalous trichromacy).
 *
 * Dichromats (–opia) have only two functioning cone types. They can still
 * perceive color, but many colors that are distinct to trichromats appear
 * identical to them. These are "metamers" — different spectra that produce
 * the same cone excitation.
 *
 * Anomalous trichromats (–anomaly) have all three cone types but the L or M
 * cone's peak sensitivity is shifted toward the other, reducing discrimination.
 *
 * ─── Simulation Approach ─────────────────────────────────────────────────────
 *
 * The Brettel 1997 model is the gold standard for simulation. It works by
 * finding, for each input color, the metameric color that lies on the
 * dichromatic projection plane — i.e., the color that a dichromat would
 * perceive identically, but which can be displayed on a trichromatic screen.
 *
 * Algorithm per color:
 *   1. Linear sRGB → LMS (cone excitations)
 *   2. Apply the LMS projection matrix (which half-plane for tritanopia)
 *   3. LMS → linear sRGB
 *   4. Apply sRGB gamma
 *
 * For anomalous trichromacy (partial CVD), the simulation uses linear
 * interpolation between the original and the fully dichromatic LMS:
 *   simulated = lerp(original, dichromatic, severity)
 *
 * This approach matches the Machado et al. (2009) formulation and is
 * equivalent to interpolating the simulation matrix itself.
 *
 * References:
 *   Brettel, Viénot & Mollon (1997). Computerized simulation of color
 *     appearance for dichromats. JOSA-A 14(10).
 *   Viénot, Brettel & Mollon (1999). Digital video colourmaps for checking
 *     the legibility of displays by dichromats. Color Research & Application.
 *   Machado, Oliveira & Fernandes (2009). A physiologically-based model for
 *     simulation of color vision deficiency. IEEE TVCG 15(6).
 */

import { rgbToLinear, linearToRgb, linearToLms, lmsToLinear, clamp } from "./color-math";
import { CVDType } from "@/types";
import type { RGB, LMS } from "@/types";

// ---------------------------------------------------------------------------
// Projection matrices in LMS space
// ---------------------------------------------------------------------------

/**
 * Protanopia — L cones absent (~1% of males).
 *
 * The L (red-sensitive) cone is missing. The simulation replaces L with a
 * linear combination of M and S that lies on the dichromatic projection
 * plane — specifically the plane where all colors that look identical to
 * the protanope are collapsed to the same point.
 *
 * The coefficients 2.02344 and -2.52581 are derived from the anchors at
 * 575nm and 475nm: two reference wavelengths where trichromats and
 * dichromats agree (they share the same perceived color), so these
 * wavelengths define the neutral projection plane.
 *
 * Single matrix (Viénot 1999 showed the two Brettel half-planes give
 * negligibly different results for protan/deutan).
 */
const PROTANOPIA_LMS: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [0,        2.02344, -2.52581],
  [0,        1,        0      ],
  [0,        0,        1      ],
];

/**
 * Deuteranopia — M cones absent (~1% of males).
 *
 * The M (green-sensitive) cone is missing. M is replaced by a combination
 * of L and S derived from the same 575nm and 475nm anchor wavelengths.
 * The coefficients 0.494207 and 1.24827 are the corresponding projections
 * onto the M-missing plane.
 */
const DEUTERANOPIA_LMS: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [1,        0,        0      ],
  [0.494207, 0,        1.24827],
  [0,        0,        1      ],
];

/**
 * Tritanopia — S cones absent (~0.01%, equal in both sexes, autosomal).
 *
 * S (blue-sensitive) cones are missing. Tritanopia requires the full
 * Brettel two-plane model because the chromatic distribution of S-cone
 * confusion lines is not well approximated by a single plane.
 *
 * The LMS space is split into two half-planes by a separator plane whose
 * normal vector n passes through the white point. Colors on each side of
 * the separator use a different projection matrix.
 *
 * Separator normal (in LMS, HPE/D65): n = [0.34478, -0.65456, 0.70376]
 * White point (D65, HPE-normalized): w ≈ [1, 1, 1], so n·w ≈ 0.39398
 *
 * Half-plane 1 (n·LMS > n·white): anchor at long wavelength (~660nm)
 * Half-plane 2 (n·LMS ≤ n·white): anchor at medium wavelength (~485nm)
 *
 * Both matrices replace S with a linear function of L and M.
 */
const TRITANOPIA_LMS_PLANE1: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [1,          0,        0],
  [0,          1,        0],
  [-0.395913,  0.801109, 0],
];

const TRITANOPIA_LMS_PLANE2: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [1,         0,        0],
  [0,         1,        0],
  [0.154501,  0.121772, 0],
];

/** Separator plane normal for tritanopia (in LMS, HPE D65). */
const TRITANOPIA_NORMAL = [0.34478, -0.65456, 0.70376] as const;

/**
 * Dot product of the tritanopia separator normal with D65 white in LMS.
 * Used to classify which half-plane an input LMS color belongs to.
 * White (1,1,1) in LMS → 0.34478 − 0.65456 + 0.70376 = 0.39398
 */
const TRITANOPIA_WHITE_THRESHOLD =
  TRITANOPIA_NORMAL[0] + TRITANOPIA_NORMAL[1] + TRITANOPIA_NORMAL[2];

// ---------------------------------------------------------------------------
// Matrix apply
// ---------------------------------------------------------------------------

function applyLmsMatrix(
  m: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ],
  lms: LMS,
): LMS {
  return {
    l: m[0][0] * lms.l + m[0][1] * lms.m + m[0][2] * lms.s,
    m: m[1][0] * lms.l + m[1][1] * lms.m + m[1][2] * lms.s,
    s: m[2][0] * lms.l + m[2][1] * lms.m + m[2][2] * lms.s,
  };
}

// ---------------------------------------------------------------------------
// Dichromatic simulation (severity = 1.0)
// ---------------------------------------------------------------------------

/**
 * Project LMS to the dichromatic plane for the given base type.
 * Returns the LMS values as perceived by a full dichromat.
 */
function projectDichromatic(lms: LMS, baseType: "protan" | "deutan" | "tritan"): LMS {
  switch (baseType) {
    case "protan":
      return applyLmsMatrix(PROTANOPIA_LMS, lms);

    case "deutan":
      return applyLmsMatrix(DEUTERANOPIA_LMS, lms);

    case "tritan": {
      // Choose half-plane: compare n·LMS to n·white
      const nDotLms =
        TRITANOPIA_NORMAL[0] * lms.l +
        TRITANOPIA_NORMAL[1] * lms.m +
        TRITANOPIA_NORMAL[2] * lms.s;

      const matrix =
        nDotLms > TRITANOPIA_WHITE_THRESHOLD
          ? TRITANOPIA_LMS_PLANE1
          : TRITANOPIA_LMS_PLANE2;

      return applyLmsMatrix(matrix, lms);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate how a color appears to a person with a given CVD type.
 *
 * @param rgb      Input color in 8-bit sRGB.
 * @param type     The CVD type to simulate.
 * @param severity How severe the deficiency is: 0 = normal vision, 1 = full
 *                 dichromacy. Only meaningful for anomalous trichromacy types
 *                 (–anomaly); dichromacy types (–opia) always use 1.0.
 *
 * @returns The simulated color as 8-bit sRGB, suitable for display.
 *
 * @example
 * // Simulate deuteranopia (full)
 * simulateCVD({ r: 255, g: 0, b: 0 }, CVDType.Deuteranopia)
 *
 * // Simulate mild deuteranomaly (40% severity)
 * simulateCVD({ r: 255, g: 0, b: 0 }, CVDType.Deuteranomaly, 0.4)
 */
export function simulateCVD(rgb: RGB, type: CVDType, severity: number = 1.0): RGB {
  const s = clamp(severity, 0, 1);

  // Determine the underlying dichromatic axis and whether it's anomalous
  let baseType: "protan" | "deutan" | "tritan";
  let isAnomaly: boolean;

  switch (type) {
    case CVDType.Protanopia:   baseType = "protan"; isAnomaly = false; break;
    case CVDType.Protanomaly:  baseType = "protan"; isAnomaly = true;  break;
    case CVDType.Deuteranopia: baseType = "deutan"; isAnomaly = false; break;
    case CVDType.Deuteranomaly:baseType = "deutan"; isAnomaly = true;  break;
    case CVDType.Tritanopia:   baseType = "tritan"; isAnomaly = false; break;
    case CVDType.Tritanomaly:  baseType = "tritan"; isAnomaly = true;  break;
  }

  // 1. sRGB → linear light → LMS cone excitations
  const linear = rgbToLinear(rgb);
  const lms = linearToLms(linear);

  // 2. Project to dichromatic plane
  const dichroLms = projectDichromatic(lms, baseType);

  // 3. For anomalous trichromacy: lerp between original and dichromatic.
  //    For dichromacy: always use full dichromatic (severity ignored).
  const effectiveSeverity = isAnomaly ? s : 1.0;

  const simulatedLms: LMS = {
    l: lms.l + effectiveSeverity * (dichroLms.l - lms.l),
    m: lms.m + effectiveSeverity * (dichroLms.m - lms.m),
    s: lms.s + effectiveSeverity * (dichroLms.s - lms.s),
  };

  // 4. LMS → linear sRGB → gamma-encoded sRGB
  const simulatedLinear = lmsToLinear(simulatedLms);

  // Clamp linear values before gamma encoding (out-of-gamut colors)
  const clamped = {
    r: clamp(simulatedLinear.r, 0, 1),
    g: clamp(simulatedLinear.g, 0, 1),
    b: clamp(simulatedLinear.b, 0, 1),
  };

  return linearToRgb(clamped);
}

/**
 * Simulate a color for all six CVD types at once.
 * Useful for rendering a full comparison panel.
 */
export function simulateAll(rgb: RGB, severity: number = 1.0): Record<CVDType, RGB> {
  return {
    [CVDType.Protanopia]:    simulateCVD(rgb, CVDType.Protanopia),
    [CVDType.Deuteranopia]:  simulateCVD(rgb, CVDType.Deuteranopia),
    [CVDType.Tritanopia]:    simulateCVD(rgb, CVDType.Tritanopia),
    [CVDType.Protanomaly]:   simulateCVD(rgb, CVDType.Protanomaly,  severity),
    [CVDType.Deuteranomaly]: simulateCVD(rgb, CVDType.Deuteranomaly, severity),
    [CVDType.Tritanomaly]:   simulateCVD(rgb, CVDType.Tritanomaly,  severity),
  };
}
