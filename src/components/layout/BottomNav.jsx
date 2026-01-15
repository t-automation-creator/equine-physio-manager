import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBottomNavItems } from '@/config/navigation';

export default function BottomNav() {
  const location = useLocation();
  const bottomNavItems = getBottomNavItems();
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-nav"
      style={{ zIndex: 100 }}
      aria-label="Quick navigation"
    >
      <div className="flex items-center justify-around py-2 px-2 pb-safe">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px] ${active ? 'text-cvs-red' : 'text-gray-400'}`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <div className={`p-1.5 rounded-full transition-colors ${active ? 'bg-red-50' : ''}`}>
                <Icon size={22} className={active ? 'fill-cvs-red/20' : ''} aria-hidden="true" />
              </div>
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
