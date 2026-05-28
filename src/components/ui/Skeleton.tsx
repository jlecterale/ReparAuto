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
      <Skeleton className="h-44 rounded-none" />
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
