import { wcagGrade } from "@/lib/contrast";
import type { ContrastResult } from "@/types";

type Grade = ReturnType<typeof wcagGrade>;

const GRADE_LABEL: Record<Grade, string> = {
  aaa: "AAA",
  aa: "AA",
  "aa-large": "AA large only",
  fail: "fail",
};

// Color applied to the big ratio number
const RATIO_COLOR: Record<Grade, string> = {
  aaa: "text-emerald-400",
  aa: "text-emerald-400",
  "aa-large": "text-amber-400",
  fail: "text-rose-400",
};

// Pill badge behind the grade label
const GRADE_PILL: Record<Grade, string> = {
  aaa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  aa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "aa-large": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  fail: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

interface Props {
  result: ContrastResult;
}

export default function ContrastRatio({ result }: Props) {
  const grade = wcagGrade(result.ratio);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-6">
      <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
        contrast ratio
      </span>

      {/* Large ratio number */}
      <div className="flex items-end gap-2">
        <span
          className={`font-bold leading-none tabular-nums transition-colors duration-300 text-6xl ${RATIO_COLOR[grade]}`}
        >
          {result.ratio.toFixed(2)}
        </span>
        <span className="mb-1 text-2xl text-neutral-500">:1</span>
      </div>

      {/* Grade pill */}
      <span
        className={`self-start rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-300 ${GRADE_PILL[grade]}`}
      >
        {GRADE_LABEL[grade]}
      </span>
    </div>
  );
}
