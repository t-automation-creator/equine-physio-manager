import React, { useState } from 'react';
import { MobileHeader, MobileMenu, DesktopSidebar, BottomNav } from '@/components/layout';

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-cvs-blue focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Mobile Header */}
      <MobileHeader onMenuToggle={() => setIsMenuOpen(true)} />

      {/* Mobile Slide-out Menu */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <main
        id="main-content"
        className="pt-16 pb-24 md:pt-0 md:pb-0 md:pl-64 min-h-screen"
      >
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
