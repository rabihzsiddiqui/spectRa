import type { SimulatedPair, SimulationType } from "@/lib/simulation-engine";
import { CVD_META } from "@/lib/simulation-engine";

interface Props {
  type: SimulationType;
  pair: SimulatedPair;
}

export default function CvdPreview({ type, pair }: Props) {
  const meta = CVD_META[type];
  const { fgHex, bgHex, contrastRatio, passesAA } = pair;

  return (
    <article
      aria-label={`${meta.label}: contrast ${contrastRatio.toFixed(2)}:1, WCAG AA ${passesAA ? "pass" : "fail"}`}
      className={`flex flex-col overflow-hidden rounded-xl border bg-neutral-800/50 transition-colors duration-300 ${
        meta.isBaseline
          ? "border-neutral-600/50"
          : passesAA
            ? "border-emerald-500/30"
            : "border-rose-500/20"
      }`}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {meta.label}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
              {meta.description}
            </p>
          </div>
          {meta.isBaseline && (
            <span className="shrink-0 rounded-full border border-neutral-600/50 bg-neutral-700/50 px-2 py-0.5 text-xs text-neutral-400">
              baseline
            </span>
          )}
        </div>

        {/* Color swatches */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="h-4 w-4 rounded-full border border-neutral-600"
              style={{ backgroundColor: fgHex }}
              title={`fg: ${fgHex}`}
            />
            <span className="text-xs text-neutral-600">fg {fgHex}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-4 w-4 rounded-full border border-neutral-600"
              style={{ backgroundColor: bgHex }}
              title={`bg: ${bgHex}`}
            />
            <span className="text-xs text-neutral-600">bg {bgHex}</span>
          </div>
        </div>
      </div>

      {/* Mini text preview rendered in simulated colors — decorative */}
      <div
        aria-hidden="true"
        className="mx-4 mb-4 flex-1 rounded-lg px-4 py-3"
        style={{ backgroundColor: bgHex }}
      >
        <p className="text-xl font-bold leading-tight" style={{ color: fgHex }}>
          Aa
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: fgHex }}>
          the quick brown fox
        </p>
      </div>

      {/* Footer: contrast ratio + AA badge */}
      <div className="flex items-center justify-between border-t border-neutral-700/50 px-4 py-3">
        <span className="font-mono text-sm font-medium text-neutral-400">
          {contrastRatio.toFixed(2)}:1
        </span>
        <span
          aria-label={`WCAG AA: ${passesAA ? "pass" : "fail"}`}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-300 ${
            passesAA
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
          }`}
        >
          <span aria-hidden="true">{passesAA ? "✓" : "✗"}</span>
          {" AA"}
        </span>
      </div>
    </article>
  );
}
