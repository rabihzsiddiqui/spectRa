import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "about - spectRa",
  description:
    "why spectRa exists, what it does, and the story behind it.",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>
      {children}
    </section>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      {/* Page heading */}
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white">about spectRa</h1>
        <p className="mt-3 text-base text-neutral-400">
          built by someone who actually needs it.
        </p>
      </div>

      <div className="space-y-14">

        {/* Personal story */}
        <Section label="the backstory">
          <p className="text-base leading-relaxed text-neutral-300">
            i&apos;ve known i was red-green color blind since i was a kid. most of the time it&apos;s fine. you learn to adapt, you pick up on context clues, and you mostly get by.
          </p>
          <p className="text-base leading-relaxed text-neutral-400">
            but occasionally something breaks through and reminds you. recently i was playing a game where progress depended on telling red and green apart. the colors were close enough in brightness that i genuinely couldn&apos;t figure out which path to take. it wasn&apos;t a bug. it was just a design decision that never considered that 1 in 12 men can&apos;t reliably distinguish those two colors.
          </p>
          <p className="text-base leading-relaxed text-neutral-400">
            that kind of thing is fixable. it doesn&apos;t take much: a slightly different hue, a small contrast bump, an icon alongside the color. designers just need to know the problem exists, and have tools that make checking easy.
          </p>
        </Section>

        {/* Why I built it */}
        <Section label="why i built this">
          <p className="text-base leading-relaxed text-neutral-300">
            my major was cognitive science, with a focus in design. so i had both the personal motivation and the background to actually think through the problem properly.
          </p>
          <p className="text-base leading-relaxed text-neutral-400">
            most color accessibility tools i found were either too simplistic (just a contrast number) or too technical for designers who aren&apos;t deep into accessibility standards. i wanted something that was honest about the science, visual enough to actually show the problem, and simple enough that you didn&apos;t need to already know what you were doing to use it.
          </p>
          <p className="text-base leading-relaxed text-neutral-400">
            spectRa is that tool. everything runs in your browser. nothing is uploaded. it&apos;s free and always will be.
          </p>
        </Section>

        {/* What it does */}
        <Section label="what spectRa does">
          <div className="space-y-3">
            {[
              {
                title: "contrast checker",
                body: "pick any two colors and see if they meet readability standards for body text and headings. the ratio tells you how much brightness difference exists between them.",
              },
              {
                title: "color blindness simulation",
                body: "see your color pair as it appears across six types of color vision, including the most common red-green forms. contrast ratios update automatically for each simulation.",
              },
              {
                title: "palette analysis",
                body: "test a full set of colors at once. a color confusion map shows which pairs are hard to distinguish under color blindness, with suggested replacements for problem pairs.",
              },
              {
                title: "image simulator",
                body: "upload any image and drag a curtain slider to compare the original side by side with how it looks under different types of color blindness. nothing leaves your device.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-5"
              >
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Privacy note */}
        <Section label="privacy">
          <p className="text-base leading-relaxed text-neutral-400">
            all computation happens locally in your browser using javascript. no images, colors, or palette data are ever sent to a server. there are no accounts, no analytics, and no tracking of any kind.
          </p>
        </Section>

        {/* CTA */}
        <div className="border-t border-neutral-800 pt-10">
          <Link
            href="/"
            className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-500 hover:scale-105"
          >
            try spectRa
          </Link>
        </div>

      </div>
    </div>
  );
}
