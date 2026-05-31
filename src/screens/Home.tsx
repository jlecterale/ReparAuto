'use client';

import HeroBanner from '@/components/home/HeroBanner';
import CarGrid from '@/components/home/CarGrid';
import FaqSection from '@/components/home/FaqSection';

export default function Home() {
  return (
    <div className="page-enter">
      <HeroBanner />
      <CarGrid />
      <FaqSection />
    </div>
  );
}
