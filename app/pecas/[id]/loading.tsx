import { PecaCardSkeleton } from '@/components/ui/Skeleton';

// The part detail reuses the listing screen (with the detail modal on top),
// so the placeholder mirrors the parts grid.
export default function Loading() {
  return (
    <div className="page-enter">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PecaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
