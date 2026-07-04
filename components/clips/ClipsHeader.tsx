"use client";

import Link from "next/link";

export function ClipsHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-black">
            F
          </span>
          Forge Clips
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/create"
            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white/90"
          >
            New project
          </Link>
        </nav>
      </div>
    </header>
  );
}
