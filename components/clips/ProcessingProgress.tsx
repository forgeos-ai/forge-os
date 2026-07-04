"use client";

import { motion } from "framer-motion";

import { PROCESSING_STAGES } from "@/lib/clips/constants";
import type { ProcessingStage } from "@/lib/clips/types";

type ProcessingProgressProps = {
  stage: ProcessingStage;
  stageProgress: number;
  sourceLabel: string;
};

function stageIndex(stage: ProcessingStage): number {
  if (stage === "queued") return -1;
  if (stage === "complete") return PROCESSING_STAGES.length;
  if (stage === "failed") return -1;
  return PROCESSING_STAGES.findIndex((s) => s.id === stage);
}

export function ProcessingProgress({
  stage,
  stageProgress,
  sourceLabel,
}: ProcessingProgressProps) {
  const currentIndex = stageIndex(stage);
  const overallProgress =
    stage === "complete"
      ? 100
      : currentIndex < 0
        ? 5
        : Math.round(
            ((currentIndex + stageProgress / 100) / PROCESSING_STAGES.length) * 100,
          );

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[#22c55e]" />
        </motion.div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Processing your video
        </h1>
        <p className="mt-2 truncate text-sm text-white/40">{sourceLabel}</p>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-white/50">Overall progress</span>
          <span className="font-mono text-[#22c55e]">{overallProgress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#16a34a] to-[#22c55e]"
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>

      <ol className="space-y-3">
        {PROCESSING_STAGES.map((item, index) => {
          const isComplete = currentIndex > index || stage === "complete";
          const isActive = currentIndex === index && stage !== "complete";
          const isPending = currentIndex < index && stage !== "complete";

          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                isActive
                  ? "border-[#22c55e]/30 bg-[#22c55e]/[0.06]"
                  : isComplete
                    ? "border-white/[0.06] bg-white/[0.02]"
                    : "border-white/[0.04] bg-transparent opacity-40"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isComplete
                    ? "bg-[#22c55e] text-black"
                    : isActive
                      ? "border border-[#22c55e]/50 text-[#22c55e]"
                      : "border border-white/15 text-white/30"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    isActive ? "font-medium text-white" : "text-white/60"
                  }`}
                >
                  {item.label}
                </p>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/[0.08]"
                  >
                    <motion.div
                      className="h-full bg-[#22c55e]/70"
                      animate={{ width: `${stageProgress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.div>
                )}
              </div>
              {isPending && (
                <span className="text-[10px] uppercase tracking-wide text-white/20">
                  Pending
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
