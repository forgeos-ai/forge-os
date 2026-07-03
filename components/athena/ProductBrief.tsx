import Link from "next/link";

import type { ProductBriefData } from "./types";

type ProductBriefProps = {
  brief: ProductBriefData;
  onStartOver: () => void;
};

const SECTIONS: { key: keyof ProductBriefData; label: string }[] = [
  { key: "startupIdea", label: "Startup Idea" },
  { key: "problem", label: "Problem" },
  { key: "customer", label: "Customer" },
  { key: "currentSolution", label: "Current Solution" },
  { key: "frustrations", label: "Frustrations" },
  { key: "proposedSolution", label: "Proposed Solution" },
  { key: "mvp", label: "30-Day MVP" },
  { key: "successGoal", label: "90-Day Success Goal" },
];

export function ProductBrief({ brief, onStartOver }: ProductBriefProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-10">
        <p className="mb-3 font-mono text-xs tracking-wider text-[#22c55e] uppercase">
          Product Brief
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Athena has finished understanding your idea.
        </h1>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(({ key, label }) => (
          <section
            key={key}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-6"
          >
            <h2 className="mb-2 text-xs font-medium tracking-wider text-white/40 uppercase">
              {label}
            </h2>
            <p className="text-base leading-relaxed text-white/80 sm:text-lg">
              {brief[key]}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center justify-center rounded-lg border border-white/15 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          Start Over
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
