"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-md transition-all duration-200 ${
        scrolled ? "border-b border-neutral-800/80" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-base font-semibold text-white tracking-tight"
        >
          spectRa<span className="inline-block w-[4px] h-[4px] ml-[1.5px] align-baseline bg-emerald-500" />
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
