export function SystemLibraryLoading() {
  return (
    <section className="glass-panel w-full min-w-0 max-w-full p-5 sm:p-8" aria-busy="true">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-sky-100" />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-12 animate-pulse rounded-xl bg-sky-50" />
        <div className="h-12 animate-pulse rounded-xl bg-sky-50 sm:w-52" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl border border-sky-100 bg-white/80"
          />
        ))}
      </div>
    </section>
  );
}
