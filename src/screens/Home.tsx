'use client';

import HeroBanner from '@/components/home/HeroBanner';
import CarGrid from '@/components/home/CarGrid';

export default function Home() {
  return (
    <div className="page-enter">
      <HeroBanner />
      <CarGrid />
    </div>
  );
}
