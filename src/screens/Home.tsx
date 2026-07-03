'use client';

import { useMemo } from 'react';
import MonetizationCarousel from '@/components/home/MonetizationCarousel';
import CarGrid from '@/components/home/CarGrid';
import CompareBar from '@/components/busca/CompareBar';
import { deserializeCarro, type SerializedCarro } from '@/lib/serializeCarro';

// `initialCarros` is the approved-listing snapshot fetched by the server
// component (ISR) — it fills the grid on first paint while the realtime
// Firestore subscription is still connecting.
export default function Home({ initialCarros }: { initialCarros?: SerializedCarro[] }) {
  const decodedInitialCarros = useMemo(() => (initialCarros ?? []).map(deserializeCarro), [initialCarros]);

  return (
    <div className="page-enter">
      <MonetizationCarousel />
      <CarGrid initialCarros={decodedInitialCarros} />
      <CompareBar />
    </div>
  );
}
