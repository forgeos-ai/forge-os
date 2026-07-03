"use client";

import { motion } from "framer-motion";

import { AthenaLoadingMessages } from "@/components/ui/AthenaLoadingMessages";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

type AthenaIntroProps = {
  onStart: () => void;
  isLoading?: boolean;
};

const DISCOVERY_ITEMS = [
  "Problem clarity",
  "Customer precision",
  "Business model",
  "Competitive context",
  "MVP scope",
  "Success metrics",
] as const;

export function AthenaIntro({ onStart, isLoading = false }: AthenaIntroProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="flex flex-1 flex-col justify-center"
    >
      <motion.p
        variants={staggerItem}
        className="mb-8 text-sm font-medium tracking-[0.2em] text-[#22c55e] uppercase"
      >
        Welcome to Forge OS
      </motion.p>

      <motion.div variants={staggerItem} className="mb-10 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Hi, I&apos;m Athena.
        </h1>
        <p className="text-lg text-white/70 sm:text-xl">
          I&apos;m your AI Product Manager.
        </p>
        <p className="max-w-lg text-base leading-relaxed text-white/50 sm:text-lg">
          I&apos;ll reduce uncertainty about your startup idea before we build
          an execution plan. I ask one high-value question at a time.
        </p>
      </motion.div>

      <motion.div
        variants={staggerItem}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25 }}
        className="mb-10 rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8"
      >
        <p className="mb-5 text-sm font-medium text-white/60">
          Powered by Forge Cortex, I focus on:
        </p>
        <ul className="space-y-3" role="list">
          {DISCOVERY_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-white/80">
              <span
                aria-hidden
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/15 text-xs text-[#22c55e]"
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.p variants={staggerItem} className="mb-10 text-sm text-white/40">
        Discovery adapts to your answers. No fixed questionnaire.
      </motion.p>

      <motion.div variants={staggerItem}>
        {isLoading ? (
          <AthenaLoadingMessages className="py-2" />
        ) : (
          <motion.button
            type="button"
            onClick={onStart}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#16a34a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Let&apos;s Build
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
