"use client";

type UrlInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
};

export function UrlInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isSubmitting,
}: UrlInputProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          disabled={disabled || isSubmitting}
          className="w-full rounded-xl bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onSubmit();
          }}
        />
      </div>
      <p className="text-xs leading-relaxed text-white/35">
        Paste a URL for videos you own or have permission to repurpose. Supports YouTube,
        podcasts, and webinar platforms.
      </p>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isSubmitting || !value.trim()}
        className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Importing video…" : "Import & process"}
      </button>
    </div>
  );
}
