import { hexToRgb } from "@/lib/color-math";
import { simulateAllTypes, GRID_TYPES } from "@/lib/simulation-engine";
import CvdPreview from "./CvdPreview";

interface Props {
  /** Foreground color as CSS hex string (e.g. "#fafafa"). */
  fg: string;
  /** Background color as CSS hex string (e.g. "#09090b"). */
  bg: string;
}

/**
 * Renders a responsive grid of CVD simulation cards.
 *
 * Converts the hex strings to RGB once, runs the batch simulation,
 * then delegates rendering to CvdPreview for each type.
 *
 * This component intentionally contains no hooks — it's a pure
 * function of its props, which keeps it composable and easy to
 * test or embed elsewhere.
 */
export default function CvdGrid({ fg, bg }: Props) {
  let fgRgb, bgRgb;

  try {
    fgRgb = hexToRgb(fg);
    bgRgb = hexToRgb(bg);
  } catch {
    return null;
  }

  const results = simulateAllTypes(fgRgb, bgRgb);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GRID_TYPES.map((type) => (
        <CvdPreview key={type} type={type} pair={results[type]} />
      ))}
    </div>
  );
}
