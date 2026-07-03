type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-white/50">
          Question {current} of {total}
        </span>
        <span className="font-mono text-xs text-white/30">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Discovery progress: question ${current} of ${total}`}
        className="h-1 w-full overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-[#22c55e] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
