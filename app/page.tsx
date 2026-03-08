export default function Home() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col items-start justify-center px-6 pt-14">
      <p className="mb-4 text-xs font-medium uppercase tracking-widest text-emerald-500">
        color accessibility
      </p>
      <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
        see color the way
        <br />
        your users do.
      </h1>
      <p className="mb-10 max-w-xl text-base leading-relaxed text-neutral-400">
        analyze contrast ratios, simulate color vision deficiencies, and build
        palettes that work for everyone. grounded in vision science, built for
        the browser.
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-500 hover:scale-105">
          get started
        </button>
        <button className="rounded-full border border-neutral-700 bg-neutral-800 px-6 py-3 text-sm font-medium text-neutral-300 transition-all duration-200 hover:bg-neutral-700">
          learn more
        </button>
      </div>
    </section>
  );
}
