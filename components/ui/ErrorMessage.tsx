type ErrorMessageProps = {
  title?: string;
  message: string;
};

export function ErrorMessage({
  title = "Something went wrong",
  message = "Please retry in a few moments.",
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-4 sm:px-5"
    >
      <p className="text-sm font-medium text-red-100">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-red-200/80">{message}</p>
    </div>
  );
}
