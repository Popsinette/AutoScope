export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Chargement…</span>
      <div className="mb-6 h-8 w-56 rounded-lg bg-surface-2" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-40 rounded-[14px] border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
