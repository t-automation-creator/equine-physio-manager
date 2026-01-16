import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { navItems, profileNavItem } from '@/config/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function DesktopSidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-white border-r border-gray-100" style={{ zIndex: 30 }}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cvs-red rounded-xl flex items-center justify-center">
            <Heart size={22} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">EquiPhysio</h1>
            <p className="text-xs text-gray-500">Horse Physiotherapy</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-red-50 text-cvs-red font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} className={active ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link
          to={profileNavItem.to}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive(profileNavItem.to) ? 'bg-red-50 text-cvs-red font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          aria-current={isActive(profileNavItem.to) ? 'page' : undefined}
        >
          <profileNavItem.icon size={20} className={isActive(profileNavItem.to) ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
          <span className="font-medium">{profileNavItem.label}</span>
        </Link>
        <LogoutButton className="w-full justify-start text-gray-600 hover:bg-gray-50" />
      </div>
    </aside>
  );
}