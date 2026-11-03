export default function Loading() {
  return (
    <div className="container-page grid gap-6 py-8 md:grid-cols-[1.15fr_1fr] md:gap-12" aria-busy="true" aria-label="Loading product">
      <div className="skeleton aspect-square" />
      <div>
        <div className="skeleton h-10 w-3/4" />
        <div className="skeleton mt-4 h-6 w-1/3" />
        <div className="skeleton mt-8 h-12 w-full" />
        <div className="skeleton mt-3 h-12 w-full" />
        <div className="skeleton mt-8 h-24 w-full" />
      </div>
    </div>
  );
}
