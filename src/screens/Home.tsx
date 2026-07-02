'use client';

import MonetizationCarousel from '@/components/home/MonetizationCarousel';
import CarGrid from '@/components/home/CarGrid';
import CompareBar from '@/components/busca/CompareBar';

export default function Home() {
  return (
    <div className="page-enter">
      <MonetizationCarousel />
      <CarGrid />
      <CompareBar />
    </div>
  );
}
