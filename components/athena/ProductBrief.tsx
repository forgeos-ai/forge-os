"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { FeedbackPrompt } from "@/components/ui/FeedbackPrompt";
import {
  staggerContainer,
  staggerItem,
} from "@/components/ui/motion";
import type { FounderBlueprint } from "@/lib/ai/types";

type ProductBriefProps = {
  brief: FounderBlueprint;
  onStartOver: () => void;
};

const SECTIONS: {
  key: keyof Omit<FounderBlueprint, "metadata">;
  label: string;
}[] = [
  { key: "executiveSummary", label: "Executive Summary" },
  { key: "startupThesis", label: "Startup Thesis" },
  { key: "coreProblem", label: "Core Problem" },
  { key: "targetCustomer", label: "Target Customer" },
  { key: "buyer", label: "Buyer" },
  { key: "keyAssumptions", label: "Key Assumptions" },
  { key: "biggestRisks", label: "Biggest Risks" },
  { key: "validationPlan", label: "Validation Plan" },
  { key: "mvp30Day", label: "30-Day MVP" },
  { key: "successMetrics", label: "Success Metrics" },
  { key: "recommendedNextAction", label: "Recommended Next Action" },
  { key: "founderDNASummary", label: "Founder DNA Summary" },
  { key: "evidenceSummary", label: "Evidence Summary" },
  { key: "blindSpots", label: "Blind Spots" },
  { key: "opportunityScore", label: "Opportunity Score" },
  { key: "conversationQuality", label: "Conversation Quality" },
];

function formatSectionContent(content: string): string[] {
  return content.split("\n").filter((line) => line.trim().length > 0);
}

export function ProductBrief({ brief, onStartOver }: ProductBriefProps) {
  return (
    <article
      className="blueprint-document mx-auto flex w-full max-w-3xl flex-1 flex-col"
      data-document-type={brief.metadata.documentType}
      data-blueprint-version={brief.metadata.version}
      aria-labelledby="blueprint-title"
    >
      <header className="mb-12 border-b border-white/10 pb-10">
        <p className="text-accent-print mb-4 font-mono text-[11px] tracking-[0.2em] text-[#22c55e] uppercase">
          Founder Blueprint
        </p>
        <h1
          id="blueprint-title"
          className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Your execution plan
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50">
          A structured strategic document synthesized from your discovery
          session. Print or save as PDF for your records.
        </p>
      </header>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        {SECTIONS.map(({ key, label }) => {
          const content = brief[key];
          const lines = formatSectionContent(content);

          if (lines.length === 0) {
            return null;
          }

          return (
            <motion.section
              key={key}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              data-section={key}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-7 sm:px-8 sm:py-8"
            >
              <h2 className="mb-4 text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
                {label}
              </h2>
              <div className="space-y-3 text-[15px] leading-[1.75] text-white/82 sm:text-base sm:leading-[1.8]">
                {lines.map((line) => (
                  <p key={`${key}-${line.slice(0, 32)}`}>{line}</p>
                ))}
              </div>
            </motion.section>
          );
        })}
      </motion.div>

      <FeedbackPrompt />

      <footer className="print-hidden mt-12 flex flex-col gap-3 border-t border-white/10 pt-10 sm:flex-row sm:items-center">
        <motion.button
          type="button"
          onClick={() => window.print()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
        >
          Print / Save PDF
        </motion.button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          Start Over
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg px-6 py-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          Back to Home
        </Link>
      </footer>
    </article>
  );
}
