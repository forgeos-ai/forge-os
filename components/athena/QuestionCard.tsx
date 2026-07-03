"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";

import { AthenaLoadingMessages } from "@/components/ui/AthenaLoadingMessages";
import { fadeUp } from "@/components/ui/motion";

type QuestionCardProps = {
  questionId: string;
  question: string;
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onWhyAsked: () => Promise<string | null>;
  isLoading?: boolean;
};

function QuestionCardComponent({
  questionId,
  question,
  value,
  onChange,
  onBack,
  onNext,
  onWhyAsked,
  isLoading = false,
}: QuestionCardProps) {
  const [rationale, setRationale] = useState<string | null>(null);
  const [isRationaleLoading, setIsRationaleLoading] = useState(false);
  const isEmpty = value.trim().length === 0;
  const fieldId = `question-${questionId}`;

  async function handleWhyAsked() {
    if (rationale) {
      setRationale(null);
      return;
    }

    setIsRationaleLoading(true);

    try {
      const explanation = await onWhyAsked();
      setRationale(explanation);
    } finally {
      setIsRationaleLoading(false);
    }
  }

  return (
    <motion.div
      key={questionId}
      {...fadeUp}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-1 flex-col"
    >
      <p className="mb-4 font-mono text-xs tracking-[0.15em] text-[#22c55e] uppercase">
        Athena
      </p>

      <h2
        id={fieldId}
        className="mb-6 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
      >
        {question}
      </h2>

      <button
        type="button"
        onClick={handleWhyAsked}
        disabled={isRationaleLoading || isLoading}
        aria-expanded={Boolean(rationale)}
        aria-controls={`${fieldId}-rationale`}
        className="mb-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-1 text-sm text-white/45 transition-colors hover:text-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] disabled:opacity-50"
      >
        {isRationaleLoading ? (
          <AthenaLoadingMessages />
        ) : rationale ? (
          "Hide explanation"
        ) : (
          "Why did you ask this?"
        )}
      </button>

      {rationale && (
        <motion.div
          id={`${fieldId}-rationale`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 text-sm leading-relaxed text-white/75"
        >
          {rationale}
        </motion.div>
      )}

      <label htmlFor={`${fieldId}-input`} className="sr-only">
        Your answer
      </label>
      <textarea
        id={`${fieldId}-input`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        disabled={isLoading}
        placeholder="Take your time — there are no wrong answers."
        aria-labelledby={fieldId}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-base leading-relaxed text-white placeholder:text-white/25 transition-colors focus:border-[#22c55e]/50 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/50 disabled:opacity-60 sm:text-lg"
      />

      <div className="mt-auto flex flex-col-reverse gap-3 pt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30 disabled:opacity-50"
        >
          <span aria-hidden>←</span>
          Back
        </button>

        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          {isLoading && <AthenaLoadingMessages />}
          <motion.button
            type="button"
            onClick={onNext}
            disabled={isEmpty || isLoading}
            whileHover={!isEmpty && !isLoading ? { scale: 1.02 } : undefined}
            whileTap={!isEmpty && !isLoading ? { scale: 0.98 } : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#16a34a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
            {!isLoading && <span aria-hidden>→</span>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export const QuestionCard = memo(QuestionCardComponent);
