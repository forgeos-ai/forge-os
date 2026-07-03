import type { ReactNode } from "react";

type AthenaWorkspaceProps = {
  children: ReactNode;
  className?: string;
};

export function AthenaWorkspace({ children, className = "" }: AthenaWorkspaceProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-black font-sans text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]"
      />
      <div
        className={`relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
