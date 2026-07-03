"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOADING_MESSAGES = [
  "Athena is understanding your startup...",
  "Mapping your assumptions...",
  "Looking for missing evidence...",
  "Finding your biggest uncertainty...",
  "Preparing your next question...",
] as const;

type AthenaLoadingMessagesProps = {
  className?: string;
};

export function AthenaLoadingMessages({
  className = "",
}: AthenaLoadingMessagesProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`min-h-[1.5rem] ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={LOADING_MESSAGES[index]}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-sm font-medium text-white/55"
        >
          {LOADING_MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
