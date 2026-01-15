import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBottomNavItems } from '@/config/navigation';
import { Z_INDEX } from '@/config/constants';

export default function BottomNav() {
  const location = useLocation();
  const bottomNavItems = getBottomNavItems();
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe"
      style={{ zIndex: Z_INDEX.fixed }}
      aria-label="Quick navigation"
    >
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? 'text-cvs-red' : 'text-gray-500'}`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon size={22} className={active ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
              <span className={`text-xs mt-1 font-medium ${active ? 'text-cvs-red' : 'text-gray-500'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
