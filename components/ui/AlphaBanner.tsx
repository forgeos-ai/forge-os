"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeIn } from "./motion";

const STORAGE_KEY = "forge-alpha-banner-dismissed";

export function AlphaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    setVisible(dismissed !== "true");
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="status"
          aria-label="Forge OS Alpha announcement"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#0a0a0a]"
        >
          <div className="mx-auto flex max-w-5xl items-start gap-4 px-4 py-3.5 sm:items-center sm:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#22c55e] uppercase">
                Forge OS Alpha
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/70 sm:text-[15px]">
                Athena is an experimental AI Product Manager designed to reduce
                uncertainty by asking the right questions—not more questions.
                Your feedback directly improves Forge Cortex.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss alpha announcement"
              className="shrink-0 rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
