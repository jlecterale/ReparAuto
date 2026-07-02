'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function CarCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3 mt-1" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// Placeholder for the detail routes' loading.tsx — mirrors the detail-card
// layout (back button, title, hero photo, description lines).
export function ListingDetailSkeleton() {
  return (
    <div className="page-enter">
      <Skeleton className="h-8 w-24 mb-3" />
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <Skeleton className="h-8 w-2/3 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-1" />
        <Skeleton className="h-7 w-28 mb-6" />
        <Skeleton className="w-full aspect-[4/3] sm:aspect-auto sm:h-80 rounded-xl mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function PecaCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-8 w-full mt-2" />
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
