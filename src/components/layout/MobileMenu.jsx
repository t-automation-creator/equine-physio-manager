import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { navItems, profileNavItem, settingsNavItem } from '@/config/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function MobileMenu({ isOpen, onClose }) {
  const location = useLocation();
  const menuRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastFocusedElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      lastFocusedElement.current = document.activeElement;
      setTimeout(() => closeButtonRef.current?.focus(), 300);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();

        if (e.key === 'Tab' && menuRef.current) {
          const focusableElements = menuRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        lastFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) onClose();
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 40 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <nav
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        className={`md:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ zIndex: 50 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} className="text-gray-600" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-1">
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
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
          <Link
            to={profileNavItem.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive(profileNavItem.to) ? 'bg-red-50 text-cvs-red' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-current={isActive(profileNavItem.to) ? 'page' : undefined}
          >
            <profileNavItem.icon size={20} className={isActive(profileNavItem.to) ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
            <span className="font-medium">{profileNavItem.label}</span>
          </Link>
          <Link
            to={settingsNavItem.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive(settingsNavItem.to) ? 'bg-red-50 text-cvs-red' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-current={isActive(settingsNavItem.to) ? 'page' : undefined}
          >
            <settingsNavItem.icon size={20} className={isActive(settingsNavItem.to) ? 'text-cvs-red' : 'text-gray-500'} aria-hidden="true" />
            <span className="font-medium">{settingsNavItem.label}</span>
          </Link>
          <LogoutButton className="w-full justify-start text-gray-700 hover:bg-gray-100" />
        </div>
      </nav>
    </>
  );
}