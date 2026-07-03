type QuestionCardProps = {
  questionNumber: number;
  question: string;
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
};

export function QuestionCard({
  questionNumber,
  question,
  value,
  onChange,
  onBack,
  onNext,
  isLast,
}: QuestionCardProps) {
  const isEmpty = value.trim().length === 0;
  const fieldId = `question-${questionNumber}`;

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 font-mono text-xs tracking-wider text-[#22c55e] uppercase">
        Athena
      </p>

      <h2
        id={fieldId}
        className="mb-8 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
      >
        {question}
      </h2>

      <label htmlFor={`${fieldId}-input`} className="sr-only">
        {question}
      </label>
      <textarea
        id={`${fieldId}-input`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Take your time — there are no wrong answers."
        aria-labelledby={fieldId}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-base leading-relaxed text-white placeholder:text-white/25 transition-colors focus:border-[#22c55e]/50 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/50 sm:text-lg"
      />

      <div className="mt-auto flex items-center justify-between gap-4 pt-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          <span aria-hidden>←</span>
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={isEmpty}
          className="inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#16a34a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? "Generate Product Brief" : "Next"}
          {!isLast && <span aria-hidden>→</span>}
        </button>
      </div>
    </div>
  );
}
