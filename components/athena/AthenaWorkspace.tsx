"use client";

import type { ReactNode } from "react";

type AthenaWorkspaceProps = {
  children: ReactNode;
  className?: string;
};

export function AthenaWorkspace({ children, className = "" }: AthenaWorkspaceProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-black font-sans text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-size-[4rem_4rem]"
      />
      <div
        className={`relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-16 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
