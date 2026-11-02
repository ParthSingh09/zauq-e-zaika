export default function Loading() {
  return (
    <div className="container-page py-14" aria-busy="true" aria-label="Loading shop">
      <div className="skeleton mx-auto h-12 max-w-xl" />
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i}><div className="skeleton aspect-square" /><div className="skeleton mt-4 h-5 w-2/3" /></div>)}
      </div>
    </div>
  );
}
