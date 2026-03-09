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
      "your retina has two types of light sensors: rods for dim conditions, and cones for color. cones come in three types tuned to different wavelengths of light, roughly corresponding to red, green, and blue. most people have around 6 million cones, concentrated in a tiny central patch called the fovea, where your vision is sharpest. the rest of your retina is mostly rods.",
      "the red and green cone types overlap a lot in their sensitivity ranges. this tight coupling is why red-green is the most common form of color blindness. the two most similar cone types are also the most genetically vulnerable.",
      "your brain doesn't just add up the three cone signals. it computes differences between them: red vs green, blue vs yellow, and overall brightness. color perception is built on contrast, not raw values. this is why the same gray patch looks lighter on a dark background and darker on a light one. your brain is reporting relative differences, not fixed measurements.",
    ],
  },
  {
    id: "cvd",
    title: "what is color blindness?",
    paragraphs: [
      "color blindness affects roughly 8% of males and 0.5% of females worldwide. the most common form is deuteranomaly (reduced green cone sensitivity), followed by protanomaly (reduced red cone sensitivity). most forms are genetic, caused by mutations on the X chromosome, which is why males are far more likely to be affected. males have one X chromosome, so a single mutation expresses. females need both copies altered.",
      "full color blindness (where a cone type is missing entirely) is less common. protanopia and deuteranopia each affect about 1% of males. tritanopia (missing blue cones) is rare at around 0.01% and is not linked to sex. the milder forms (ending in -anomaly) mean all three cone types are present, but one has a shifted sensitivity peak. you still see color, just with reduced ability to distinguish in one range.",
      "color blindness is not binary. two people with the same diagnosis can have very different experiences: one may struggle to read a traffic light without context clues, another might only notice issues with subtly colored charts. this is part of why testing against simulations, not just one threshold, matters.",
    ],
  },
  {
    id: "opponent",
    title: "how your brain processes color",
    paragraphs: [
      "in the 1800s, ewald hering noticed that some color combinations seem impossible to perceive at the same time: you can have a reddish-yellow or a greenish-blue, but not a reddish-green or a yellowish-blue. he proposed that color is encoded in opposing pairs. a century later, science confirmed it. neurons in the visual system fire in an opponent fashion, one color suppressing the other.",
      "the red-green opponent channel is the one that breaks in red-green color blindness. when the red and green cone types are too similar, the brain's red-vs-green signal carries almost no useful information. red and green don't turn gray exactly, they collapse to the same perceived hue. this also explains why a red traffic light appears dimmer to people with protanopia: red cones contribute heavily to perceived brightness, so their absence compresses how bright red light looks.",
      "blue-yellow color blindness (tritanopia) affects a completely different channel. confusion happens between different color pairs entirely, which is why the simulations look so different from the red-green types.",
    ],
  },
  {
    id: "contrast",
    title: "contrast and your brain",
    paragraphs: [
      "what matters for readability isn't the brightness of your text in isolation, but its ratio to the background. the accessibility contrast formula, (brighter + 0.05) / (darker + 0.05), captures this directly. the 0.05 offset prevents math errors near pure black and approximates a small amount of screen glare in real viewing conditions.",
      "the 4.5:1 AA threshold corresponds roughly to the contrast sensitivity of someone with 20/80 vision wearing corrective lenses. the 3:1 threshold for large text reflects that bigger letters give your visual system more signal to work with. the stricter AAA level (7:1 for body text) extends coverage to people with more significant vision impairment.",
      "the colors surrounding your text also affect how readable it feels. a pair that passes 4.5:1 inside a bright container can still feel harder to read, because the surrounding context shifts your eye's adaptation. the contrast ratio is a minimum floor, not a guarantee of readability.",
    ],
  },
  {
    id: "fovea",
    title: "your blind spot for color",
    paragraphs: [
      "your sharpest color vision covers only about 2 degrees of visual angle, roughly the size of your thumbnail at arm's length. cone density drops sharply beyond that. by the time you're 10 degrees off-center, color discrimination is significantly reduced even for people with perfectly normal color vision. past 20 degrees, you're mostly detecting brightness and motion.",
      "for interface design, this means any color distinction that lives outside the center of the user's gaze is at risk. status badges at screen corners, color-coded sidebar labels, chart legends that need a glance to read: all of these land in the periphery, where color discrimination is poor regardless of color blindness.",
      "this compounds color blindness rather than replacing it. a palette that passes all color blindness simulations can still fail in peripheral use if colors are only distinguished by hue. using brightness contrast as the primary signal, with color as a secondary reinforcing layer, holds up in the periphery, under color blindness, and in low-light conditions. it's the closest thing to a universal rule in color accessibility.",
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
            the science behind color blindness and why contrast ratios matter.
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
