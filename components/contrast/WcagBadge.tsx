interface Props {
  label: string;
  sublabel: string;
  passes: boolean;
}

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function WcagBadge({ label, sublabel, passes }: Props) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 ${
        passes
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-rose-500/20 bg-rose-500/10"
      }`}
    >
      {/* Pass/fail icon */}
      <span
        className={`transition-colors duration-300 ${
          passes ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {passes ? <CheckIcon /> : <CrossIcon />}
      </span>

      {/* Labels */}
      <div>
        <p
          className={`text-xs font-bold transition-colors duration-300 ${
            passes ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">{sublabel}</p>
      </div>
    </div>
  );
}
