import { ListingDetailSkeleton } from '@/components/ui/Skeleton';

// Instant feedback while an uncached listing renders on the server — without
// this, the previous page stays frozen until the navigation completes.
export default function Loading() {
  return <ListingDetailSkeleton />;
}
