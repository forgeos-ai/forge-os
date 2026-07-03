"use client";

import { memo, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

type ProgressBarProps = {
  confidence: number;
};

function ProgressBarComponent({ confidence }: ProgressBarProps) {
  const spring = useSpring(confidence, {
    stiffness: 90,
    damping: 22,
    mass: 0.6,
  });
  const width = useTransform(spring, (value) => `${value}%`);

  useEffect(() => {
    spring.set(confidence);
  }, [confidence, spring]);

  return (
    <div className="mb-10" aria-labelledby="understanding-label">
      <div className="mb-2">
        <div className="flex items-baseline justify-between gap-4">
          <p
            id="understanding-label"
            className="text-sm font-medium text-white/70"
          >
            Athena Understanding
          </p>
          <p
            className="font-mono text-2xl font-semibold tracking-tight text-white tabular-nums"
            aria-label={`${confidence} percent understanding`}
          >
            {confidence}%
          </p>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/40">
          Confidence is increasing as Athena learns more about your startup.
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby="understanding-label"
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
      >
        <motion.div
          className="h-full rounded-full bg-[#22c55e]"
          style={{ width }}
        />
      </div>
    </div>
  );
}

export const ProgressBar = memo(ProgressBarComponent);
