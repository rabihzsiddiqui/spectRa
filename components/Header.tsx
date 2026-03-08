import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-semibold text-white tracking-tight"
        >
          spectRa<span className="text-emerald-500">.</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-neutral-400 transition-colors duration-200 hover:text-white"
          >
            about
          </Link>
        </nav>
      </div>
    </header>
  );
}
