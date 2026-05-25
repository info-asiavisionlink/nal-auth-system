export function LoadingSpinner({ label = "処理中..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2" role="status">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
        aria-hidden
      />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}
