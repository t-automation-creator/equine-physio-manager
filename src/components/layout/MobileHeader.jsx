import React from 'react';
import { Bell, Menu, Heart } from 'lucide-react';

export default function MobileHeader({ onMenuToggle, notificationCount = 0 }) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-cvs-red rounded-lg flex items-center justify-center">
          <Heart size={18} className="text-white fill-white" />
        </div>
        <span className="font-bold text-gray-900">EquiPhysio</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
        >
          <Bell size={20} className="text-gray-600" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-cvs-red text-white text-xs rounded-full flex items-center justify-center" aria-hidden="true">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="mobile-menu"
        >
          <Menu size={20} className="text-gray-600" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
