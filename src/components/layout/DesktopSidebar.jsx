import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems, profileNavItem } from '@/config/navigation';
import { Z_INDEX, LAYOUT } from '@/config/constants';

export default function DesktopSidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 h-full flex-col bg-white border-r border-gray-200"
      style={{ zIndex: Z_INDEX.fixed, width: LAYOUT.sidebarWidth }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cvs-red rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">EP</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Equine Physio</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-red-50 text-cvs-red' : 'text-gray-700 hover:bg-gray-100'}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} className={active ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          to={profileNavItem.to}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive(profileNavItem.to) ? 'bg-red-50 text-cvs-red' : 'text-gray-700 hover:bg-gray-100'}`}
          aria-current={isActive(profileNavItem.to) ? 'page' : undefined}
        >
          <profileNavItem.icon size={20} className={isActive(profileNavItem.to) ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
          <span className="font-medium">{profileNavItem.label}</span>
        </Link>
      </div>
    </aside>
  );
}
