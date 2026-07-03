"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { fadeUp } from "./motion";

const STAR_COUNT = 5;

export function FeedbackPrompt() {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      aria-labelledby="feedback-heading"
      className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 print:hidden"
    >
      <h2
        id="feedback-heading"
        className="text-center text-base font-medium text-white/85"
      >
        Help improve Athena
      </h2>
      <p className="mt-2 text-center text-sm text-white/45">
        Your feedback shapes Forge Cortex for every founder who follows.
      </p>

      <div
        className="mt-6 flex items-center justify-center gap-1.5"
        role="group"
        aria-label="Rate your experience from 1 to 5 stars"
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= (hoveredStar || selectedStar);

          return (
            <button
              key={starValue}
              type="button"
              aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
              aria-pressed={selectedStar === starValue}
              onMouseEnter={() => setHoveredStar(starValue)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setSelectedStar(starValue)}
              className="rounded-md p-2 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              <span
                aria-hidden
                className={`text-2xl leading-none transition-colors ${
                  isActive ? "text-[#22c55e]" : "text-white/20"
                }`}
              >
                ★
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => {
            /* Placeholder — feedback collection coming in a future alpha release */
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
        >
          Share Feedback
        </button>
      </div>
    </motion.section>
  );
}
