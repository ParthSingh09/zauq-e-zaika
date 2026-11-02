export default function Loading() {
  return (
    <div className="container-page py-14" aria-busy="true" aria-label="Loading recipes">
      <div className="skeleton mx-auto h-12 max-w-xl" />
      <div className="mt-6 flex gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-10 w-32 rounded-full" />)}</div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line/70">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-6"><div className="skeleton h-4 w-24" /><div className="skeleton h-6 w-3/4" /><div className="skeleton h-4 w-full" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
