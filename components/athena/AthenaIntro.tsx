type AthenaIntroProps = {
  onStart: () => void;
};

const DISCOVERY_ITEMS = [
  "Problem",
  "Customer",
  "Solution",
  "MVP",
  "Success Metrics",
] as const;

export function AthenaIntro({ onStart }: AthenaIntroProps) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="mb-8 text-sm font-medium tracking-widest text-[#22c55e] uppercase">
        Welcome to Forge OS
      </p>

      <div className="mb-10 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Hi, I&apos;m Athena.
        </h1>
        <p className="text-lg text-white/70 sm:text-xl">
          I&apos;m your AI Product Manager.
        </p>
        <p className="max-w-lg text-base leading-relaxed text-white/50 sm:text-lg">
          I&apos;ll help you transform your startup idea into a clear execution
          plan.
        </p>
      </div>

      <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <p className="mb-5 text-sm font-medium text-white/60">
          Together we&apos;ll define:
        </p>
        <ul className="space-y-3">
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
      </div>

      <p className="mb-10 text-sm text-white/40">
        This usually takes around 10 minutes.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#16a34a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] sm:w-auto"
      >
        Let&apos;s Build
        <span
          aria-hidden
          className="transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </button>
    </div>
  );
}
