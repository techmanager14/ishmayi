import { ProductCardSkeleton } from "@/components/ProductCard";

export default function Loading() {
  return (
    <div className="container-page py-10 md:py-16" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-10 w-2/3 max-w-md" />
      <div className="skeleton mt-3 h-4 w-1/2 max-w-sm" />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
