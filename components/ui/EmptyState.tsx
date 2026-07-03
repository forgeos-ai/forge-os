type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center"
    >
      <p className="text-base font-medium text-white/80">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/45">
        {description}
      </p>
    </div>
  );
}
