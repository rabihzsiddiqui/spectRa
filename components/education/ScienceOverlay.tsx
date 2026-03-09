"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

interface Section {
  id: string;
  title: string;
  paragraphs: string[];
}

const SECTIONS: Section[] = [
  {
    id: "eyes",
    title: "how your eyes see color",
    paragraphs: [
      "your retina has two types of photoreceptors: rods for low-light luminance, and cones for color. cones come in three variants tuned to long (L), medium (M), and short (S) wavelengths. most people have roughly 6 million cones, concentrated in the fovea — a 2-degree central patch of the retina where acuity is highest. the rest of your retina is mostly rods.",
      "the L, M, and S cones overlap substantially in their spectral sensitivity. L and M cones are especially close, separated by only about 30nm in peak response. this tight coupling is why the red-green axis accounts for the majority of CVD cases — the two most similar cone types are also the most genetically vulnerable.",
      "color isn't just the raw sum of three cone responses. your retina and lateral geniculate nucleus recode the signals into opponent channels: L minus M (red-green), S minus (L+M) (blue-yellow), and a luminance channel. color perception is built on differences, not absolutes. this is why the same gray patch looks lighter on a dark background and darker on a light one — your brain is reporting contrast, not a fixed value.",
    ],
  },
  {
    id: "cvd",
    title: "what is color vision deficiency?",
    paragraphs: [
      "CVD affects roughly 8% of males and 0.5% of females worldwide. the most common form is deuteranomaly (weakened M cones), followed by protanomaly (weakened L cones). most forms are genetic, caused by mutations on the X chromosome — which is why males are far more likely to be affected. males have one X chromosome, so a single mutation expresses. females need both copies altered.",
      "full dichromacy (a cone type absent entirely) is less common. protanopia and deuteranopia each affect about 1% of males. tritanopia — missing S cones — is rare at around 0.01% and is not sex-linked. anomalous trichromacy (the -anomaly types) means all three cone types are present, but one has a shifted spectral peak. you still experience color, just with reduced discrimination in one range.",
      "CVD is not binary. severity varies widely between individuals with the same genetic variant. two people who both have deuteranomaly may have very different practical experiences — one may struggle to read a traffic light without context clues, another might only notice issues with subtly colored charts. this is part of why testing against simulation (rather than just checking one threshold) matters.",
    ],
  },
  {
    id: "opponent",
    title: "opponent-process theory",
    paragraphs: [
      "in the 1800s, ewald hering noticed that some color combinations seem impossible to perceive simultaneously — you can have a reddish-yellow or a greenish-blue, but not a reddish-green or a yellowish-blue. he proposed that color is encoded in opposing pairs. a century later, neurophysiology confirmed it: retinal ganglion cells and neurons in the lateral geniculate nucleus fire in an opponent fashion.",
      "the L-M opponent channel is the one that breaks in protan and deutan CVD. when L and M cones are absent or spectrally too similar, the L-M signal carries almost no discriminating information. red and green don't turn gray — they map to the same point on the opponent hue axis. they look like the same color. this also explains why a red traffic light appears dimmer to protanopes: L cones contribute heavily to luminance, so their absence or weakness compresses the perceived brightness of long-wavelength light.",
      "tritanopia follows the blue-yellow opponent channel instead. confusion lines in color space run in a completely different direction, which is why tritanopia fails on different color pairs than protan or deutan CVD. the simulation matrices in this tool are plane projections in LMS space — one plane per opponent confusion axis.",
    ],
  },
  {
    id: "contrast",
    title: "contrast and your brain",
    paragraphs: [
      "weber's law says that the minimum detectable difference in a stimulus is proportional to the background level. apply this to vision: what matters for readability isn't the absolute luminance of your text, but its ratio to the background. the WCAG formula — (L_lighter + 0.05) / (L_darker + 0.05) — is a direct application. the 0.05 offset prevents division-by-zero near pure black and approximates the luminance of flare in a typical viewing environment.",
      "the 4.5:1 AA threshold corresponds roughly to the contrast sensitivity of a person with 20/80 vision wearing corrective lenses — the legal driving standard in some jurisdictions. the large-text exception (3:1) reflects that bigger letterforms give the visual system more signal: more edge contrast, more letter area to integrate over. AAA at 7:1 extends coverage to people with more significant impairment.",
      "simultaneous contrast means the colors around your text affect its apparent readability. a 4.5:1 pair inside a brightly-colored container can feel lower contrast than the math suggests, because the surrounding context shifts your adaptation point. the ratio is a floor, not a guarantee.",
    ],
  },
  {
    id: "fovea",
    title: "beyond the fovea",
    paragraphs: [
      "your fovea subtends about 2 degrees of visual angle — roughly the size of your thumbnail at arm's length. cone density drops sharply outside it. by 10 degrees eccentricity, color discrimination is significantly reduced even in people with perfectly normal color vision. past 20 degrees, you're mostly detecting luminance and motion, not hue.",
      "for UI design, this means any color distinction that lives outside the central gaze position is at risk. status indicators at screen corners, color-coded sidebar labels in wide layouts, chart legends that require eye movement to consult — all of these are processed in the periphery, where color discrimination is poor regardless of CVD status.",
      "this is a distinct problem from CVD, but it compounds it. a palette that passes all CVD simulations can still fail in peripheral use if colors are similar in luminance. designing with luminance contrast as the primary signal — and color as a secondary reinforcing layer — holds up in the periphery, under CVD, and in low-light or degraded display conditions. it's the closest thing to a universal rule in color accessibility.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------

function AccordionItem({ section }: { section: Section }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-neutral-800 last:border-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
        aria-expanded={isOpen}
        aria-controls={`science-${section.id}`}
      >
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            isOpen ? "text-emerald-400" : "text-neutral-300 hover:text-white"
          }`}
        >
          {section.title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-neutral-600 transition-transform duration-200 motion-reduce:transition-none ${
            isOpen ? "rotate-180 text-emerald-500/60" : ""
          }`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Animated panel using CSS grid row trick */}
      <div
        id={`science-${section.id}`}
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pb-5">
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-neutral-500">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScienceOverlay
// ---------------------------------------------------------------------------

export default function ScienceOverlay() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/50">
      {/* Section header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-neutral-700/20"
        aria-expanded={isExpanded}
      >
        <div>
          <h2 className="text-lg font-semibold text-white">
            what&rsquo;s behind the numbers?
          </h2>
          <p className="mt-0.5 text-sm text-neutral-400">
            the vision science that explains why these tools work.
          </p>
        </div>
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
          className={`text-neutral-500 transition-transform duration-200 motion-reduce:transition-none ${
            isExpanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Accordion body */}
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-neutral-700/50 px-6">
            {SECTIONS.map((section) => (
              <AccordionItem key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
