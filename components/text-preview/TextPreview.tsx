"use client";

import { useState } from "react";

interface Props {
  fg: string;
  bg: string;
}

const DEFAULT_TEXT = "the quick brown fox jumps over the lazy dog.";

export default function TextPreview({ fg, bg }: Props) {
  const [text, setText] = useState(DEFAULT_TEXT);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/50">
      {/* Control bar */}
      <div className="flex items-center gap-4 border-b border-neutral-700/50 px-6 py-4">
        <span className="shrink-0 text-xs font-medium uppercase tracking-widest text-neutral-500">
          text preview
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="type sample text..."
          className="flex-1 bg-transparent text-sm text-neutral-400 placeholder-neutral-600 transition-colors focus:text-white focus:outline-none"
        />
      </div>

      {/* Rendered text at three sizes on the actual bg color */}
      <div
        className="space-y-5 p-6 transition-colors duration-150"
        style={{ backgroundColor: bg, color: fg }}
      >
        {/* Heading — 24px */}
        <div>
          <p className="text-2xl font-semibold leading-tight">
            {text || DEFAULT_TEXT}
          </p>
        </div>

        {/* Body — 16px */}
        <div>
          <p className="text-base leading-relaxed">
            {text || DEFAULT_TEXT}
          </p>
        </div>

        {/* Caption — 12px */}
        <div>
          <p className="text-xs leading-relaxed">
            {text || DEFAULT_TEXT}
          </p>
        </div>
      </div>

      {/* Size labels */}
      <div className="flex gap-6 border-t border-neutral-700/50 px-6 py-3">
        <span className="text-xs text-neutral-600">24px · heading</span>
        <span className="text-xs text-neutral-600">16px · body</span>
        <span className="text-xs text-neutral-600">12px · caption</span>
      </div>
    </div>
  );
}
