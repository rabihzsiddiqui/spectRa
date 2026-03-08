"use client";

import { useRef, useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Hex helpers
// ---------------------------------------------------------------------------
function isValidHex(str: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(str);
}
function normalizeHex(input: string): string {
  const t = input.trim();
  return t.startsWith("#") ? t : "#" + t;
}

// ---------------------------------------------------------------------------
// ColorRow — single palette entry (swatch + hex input + remove)
// ---------------------------------------------------------------------------
interface ColorRowProps {
  index: number;
  value: string;
  onChange: (hex: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ColorRow({ index, value, onChange, onRemove, canRemove }: ColorRowProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [localHex, setLocalHex] = useState(value);

  useEffect(() => {
    setLocalHex(value);
  }, [value]);

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value.toLowerCase());
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLocalHex(raw);
    const norm = normalizeHex(raw).toLowerCase();
    if (isValidHex(norm)) onChange(norm);
  }

  function handleTextBlur() {
    const norm = normalizeHex(localHex).toLowerCase();
    if (!isValidHex(norm)) setLocalHex(value);
  }

  return (
    <div className="flex items-center gap-3">
      {/* Index label */}
      <span className="w-5 text-right text-xs text-neutral-600">{index + 1}</span>

      {/* Color swatch — triggers native color picker */}
      <button
        onClick={() => nativeRef.current?.click()}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-neutral-700 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        style={{ backgroundColor: value }}
        aria-label={`Pick color ${index + 1}`}
      />
      <input
        ref={nativeRef}
        type="color"
        value={value}
        onChange={handleNativeChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      {/* Hex input */}
      <input
        type="text"
        value={localHex}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        maxLength={7}
        spellCheck={false}
        className="w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-white transition-colors focus:border-emerald-500/50 focus:outline-none"
        aria-label={`Hex value for color ${index + 1}`}
      />

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="ml-auto rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-700/50 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`Remove color ${index + 1}`}
        title="remove"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PaletteInput
// ---------------------------------------------------------------------------
export interface PaletteInputProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  onAnalyze: () => void;
}

const MAX_COLORS = 8;
const MIN_COLORS = 2;

export default function PaletteInput({
  colors,
  onChange,
  onAnalyze,
}: PaletteInputProps) {
  function handleColorChange(index: number, hex: string) {
    const next = [...colors];
    next[index] = hex;
    onChange(next);
  }

  function handleRemove(index: number) {
    if (colors.length > MIN_COLORS) {
      onChange(colors.filter((_, i) => i !== index));
    }
  }

  function handleAdd() {
    if (colors.length < MAX_COLORS) {
      // Default new color: mid-grey so it's visually distinct from nothing
      onChange([...colors, "#808080"]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Color rows */}
      <div className="space-y-2.5">
        {colors.map((color, i) => (
          <ColorRow
            key={i}
            index={i}
            value={color}
            onChange={(hex) => handleColorChange(i, hex)}
            onRemove={() => handleRemove(i)}
            canRemove={colors.length > MIN_COLORS}
          />
        ))}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleAdd}
          disabled={colors.length >= MAX_COLORS}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          add color
        </button>

        <span className="text-xs text-neutral-600">
          {colors.length} / {MAX_COLORS}
        </span>

        <button
          onClick={onAnalyze}
          className="ml-auto rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-500"
        >
          analyze palette
        </button>
      </div>
    </div>
  );
}
