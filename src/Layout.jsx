import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader, MobileMenu, DesktopSidebar, BottomNav } from '@/components/layout';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cvs-blue focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <MobileHeader onMenuToggle={() => setIsMenuOpen(true)} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <DesktopSidebar />

      <main
        id="main-content"
        className="pt-16 pb-20 lg:pt-0 lg:pb-0 lg:ml-64"
        style={{
          paddingTop: 'max(4rem, env(safe-area-inset-top))',
          paddingBottom: 'max(5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4 py-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
