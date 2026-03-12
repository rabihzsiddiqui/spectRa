"use client";

import { useRef, useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// EyeDropper API types (not in TypeScript lib yet)
// ---------------------------------------------------------------------------
interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperConstructor {
  new (): { open(): Promise<EyeDropperResult> };
}
declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isValidHex(str: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(str);
}

function normalizeHex(input: string): string {
  const trimmed = input.trim();
  return trimmed.startsWith("#") ? trimmed : "#" + trimmed;
}

// ---------------------------------------------------------------------------
// ColorWell — single color well (swatch + hex input + eyedropper)
// ---------------------------------------------------------------------------
interface ColorWellProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorWell({ label, value, onChange }: ColorWellProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [localHex, setLocalHex] = useState(value);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);

  // Feature-detect EyeDropper after mount (avoids SSR mismatch)
  useEffect(() => {
    setHasEyeDropper(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  // Keep local input in sync when parent value changes (e.g. from swap or eyedropper)
  useEffect(() => {
    setLocalHex(value);
  }, [value]);

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value.toLowerCase());
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLocalHex(raw);
    const normalized = normalizeHex(raw).toLowerCase();
    if (isValidHex(normalized)) {
      onChange(normalized);
    }
  }

  // Revert to last known-good value on blur if input is invalid
  function handleTextBlur() {
    const normalized = normalizeHex(localHex).toLowerCase();
    if (!isValidHex(normalized)) {
      setLocalHex(value);
    }
  }

  async function handleEyeDropper() {
    if (!window.EyeDropper) return;
    try {
      const picker = new window.EyeDropper();
      const result = await picker.open();
      onChange(result.sRGBHex.toLowerCase());
    } catch {
      // User dismissed the picker — not an error
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
        {label}
      </span>

      {/* Color swatch — clicking opens the native color picker */}
      <button
        onClick={() => nativeRef.current?.click()}
        className="h-20 w-full cursor-pointer rounded-xl border border-neutral-700 transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        style={{ backgroundColor: value }}
        aria-label={`Pick ${label} color`}
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

      {/* Hex text input + eyedropper */}
      <div className="flex gap-2">
        <input
          type="text"
          value={localHex}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          maxLength={7}
          spellCheck={false}
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-white transition-colors focus:border-emerald-500/50 focus:outline-none"
          aria-label={`${label} hex value`}
        />
        {hasEyeDropper && (
          <button
            onClick={handleEyeDropper}
            className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
            title="pick from screen"
            aria-label="Open eyedropper"
          >
            {/* Pipette icon (Lucide-style) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m2 22 1-1h3l9-9" />
              <path d="M3 21v-3l9-9" />
              <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorPicker — the full two-well panel
// ---------------------------------------------------------------------------
export interface ColorPickerProps {
  fg: string;
  bg: string;
  onFgChange: (hex: string) => void;
  onBgChange: (hex: string) => void;
}

export default function ColorPicker({
  fg,
  bg,
  onFgChange,
  onBgChange,
}: ColorPickerProps) {
  function handleSwap() {
    // Swap by reading current values — avoids stale closure issues
    onFgChange(bg);
    onBgChange(fg);
  }

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4 sm:p-6">
      {/* Mobile: stacked layout. Desktop: three-column side-by-side */}
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
        <ColorWell label="foreground" value={fg} onChange={onFgChange} />

        {/* Swap button — vertical arrows on mobile, horizontal on desktop */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="rounded-full border border-neutral-700 bg-neutral-800 p-2.5 text-neutral-400 transition-all hover:border-neutral-600 hover:bg-neutral-700 hover:text-white active:scale-95"
            title="swap colors"
            aria-label="Swap foreground and background"
          >
            {/* Arrow-up-down on mobile, arrow-left-right on desktop */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="block sm:hidden"
            >
              <path d="M3 8 7 4l4 4" />
              <path d="M7 4v16" />
              <path d="m21 16-4 4-4-4" />
              <path d="M17 20V4" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hidden sm:block"
            >
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
          </button>
        </div>

        <ColorWell label="background" value={bg} onChange={onBgChange} />
      </div>
    </div>
  );
}
