"use client";

import { Fragment, useState } from "react";
import { CVDType } from "@/types";
import { GRID_TYPES, CVD_META } from "@/lib/simulation-engine";
import type { SimulationType } from "@/lib/simulation-engine";
import type { PaletteAnalysis, PairResult, Distinguishability } from "@/lib/palette-analyzer";

// ---------------------------------------------------------------------------
// Styling maps
// ---------------------------------------------------------------------------
const CELL_BG: Record<Distinguishability, string> = {
  safe:        "bg-emerald-500/15 hover:bg-emerald-500/25",
  marginal:    "bg-amber-500/15 hover:bg-amber-500/25",
  confusable:  "bg-rose-500/15 hover:bg-rose-500/25",
};

const CELL_TEXT: Record<Distinguishability, string> = {
  safe:        "text-emerald-400",
  marginal:    "text-amber-400",
  confusable:  "text-rose-400",
};

const STATUS_LABEL: Record<Distinguishability, string> = {
  safe:        "safe",
  marginal:    "marginal",
  confusable:  "confusable",
};

// ---------------------------------------------------------------------------
// Tabs config
// ---------------------------------------------------------------------------
const TABS: { type: SimulationType; label: string }[] = GRID_TYPES.map((t) => ({
  type: t,
  label: CVD_META[t].label,
}));

// ---------------------------------------------------------------------------
// Cell component
// ---------------------------------------------------------------------------
interface CellProps {
  pair: PairResult | null;
  i: number;
  j: number;
  isHovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}

function MatrixCell({ pair, isHovered, onEnter, onLeave }: CellProps) {
  // Diagonal — same color
  if (pair === null) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg text-neutral-700 text-sm select-none">
        —
      </div>
    );
  }

  const { status, deltaE } = pair;

  return (
    <div
      className={`flex h-12 w-12 cursor-default items-center justify-center rounded-lg transition-colors duration-150 ${CELL_BG[status]} ${isHovered ? "ring-1 ring-white/20" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      title={`ΔE ${deltaE} — ${STATUS_LABEL[status]}`}
    >
      <span className={`font-mono text-xs font-medium tabular-nums ${CELL_TEXT[status]}`}>
        {Math.round(deltaE)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hover detail panel
// ---------------------------------------------------------------------------
interface DetailProps {
  colors: string[];
  i: number;
  j: number;
  pair: PairResult;
}

function HoverDetail({ colors, i, j, pair }: DetailProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-700/50 bg-neutral-900 px-5 py-4">
      {/* Color 1 */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-lg border border-neutral-700"
          style={{ backgroundColor: pair.simColor1Hex }}
        />
        <div>
          <p className="text-xs font-mono text-white">{pair.simColor1Hex}</p>
          <p className="text-xs text-neutral-500">color {i + 1} (simulated)</p>
        </div>
      </div>

      <span className="text-neutral-600">vs</span>

      {/* Color 2 */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-lg border border-neutral-700"
          style={{ backgroundColor: pair.simColor2Hex }}
        />
        <div>
          <p className="text-xs font-mono text-white">{pair.simColor2Hex}</p>
          <p className="text-xs text-neutral-500">color {j + 1} (simulated)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-sm text-white">ΔE {pair.deltaE.toFixed(1)}</p>
          <p className={`text-xs capitalize ${CELL_TEXT[pair.status]}`}>
            {STATUS_LABEL[pair.status]}
          </p>
        </div>
        {/* Side-by-side mini preview */}
        <div className="flex h-10 overflow-hidden rounded-lg border border-neutral-700">
          <div className="w-10 h-full" style={{ backgroundColor: pair.simColor1Hex }} />
          <div className="w-10 h-full" style={{ backgroundColor: pair.simColor2Hex }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
      <span className="font-medium text-neutral-400">ΔE threshold:</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500/30" />
        safe (≥ 20)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-amber-500/30" />
        marginal (10–19)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-rose-500/30" />
        confusable (&lt; 10)
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfusionMatrix
// ---------------------------------------------------------------------------
interface Props {
  analysis: PaletteAnalysis;
}

export default function ConfusionMatrix({ analysis }: Props) {
  const [activeType, setActiveType] = useState<SimulationType>("normal");
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);

  const { colors, matrix } = analysis;
  const n = colors.length;
  const activeMatrix = matrix[activeType];

  const hoveredPair =
    hoveredCell && hoveredCell.i !== hoveredCell.j
      ? activeMatrix[hoveredCell.i]?.[hoveredCell.j]
      : null;

  return (
    <div className="space-y-4">
      {/* CVD type tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeType === type
                ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                : "border border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-1"
          style={{
            gridTemplateColumns: `2.5rem repeat(${n}, 3rem)`,
          }}
        >
          {/* Top-left corner */}
          <div />

          {/* Column headers */}
          {colors.map((color, j) => (
            <div key={j} className="flex items-end justify-center pb-1">
              <div
                className="h-5 w-5 rounded border border-neutral-700"
                style={{ backgroundColor: color }}
                title={color}
              />
            </div>
          ))}

          {/* Rows */}
          {colors.map((color, i) => (
            <Fragment key={i}>
              {/* Row header */}
              <div className="flex items-center justify-center">
                <div
                  className="h-5 w-5 rounded border border-neutral-700"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              </div>

              {/* Cells */}
              {colors.map((_, j) => (
                <MatrixCell
                  key={j}
                  pair={activeMatrix[i]?.[j] ?? null}
                  i={i}
                  j={j}
                  isHovered={hoveredCell?.i === i && hoveredCell?.j === j}
                  onEnter={() => setHoveredCell({ i, j })}
                  onLeave={() => setHoveredCell(null)}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Hover detail panel */}
      <div className="min-h-[4.5rem]">
        {hoveredPair && hoveredCell ? (
          <HoverDetail
            colors={colors}
            i={hoveredCell.i}
            j={hoveredCell.j}
            pair={hoveredPair}
          />
        ) : (
          <Legend />
        )}
      </div>
    </div>
  );
}
