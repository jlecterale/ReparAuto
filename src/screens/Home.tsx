'use client';

import MonetizationCarousel from '@/components/home/MonetizationCarousel';
import CarGrid from '@/components/home/CarGrid';

export default function Home() {
  return (
    <div className="page-enter">
      <MonetizationCarousel />
      <CarGrid />
    </div>
  );
}
