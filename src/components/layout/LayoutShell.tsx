'use client';

import { useState, type ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileTopBar from '@/components/layout/MobileTopBar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ChatModal from '@/components/chat/ChatModal';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Content column — offset by the fixed sidebar on desktop */}
      <div className="flex flex-col min-h-screen lg:pl-64">
        <MobileTopBar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-5 pb-24 lg:pb-5">{children}</main>
        <Footer />
      </div>

      <BottomNav />
      <ChatModal />
    </div>
  );
}
