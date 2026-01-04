import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  Home, 
  Calendar, 
  Users, 
  Building2, 
  FileText, 
  Menu, 
  X,
  CreditCard,
  Sparkles,
  UserCircle
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: 'Today', page: 'Home', icon: Home },
    { name: 'Appointments', page: 'Appointments', icon: Calendar },
    { name: 'AI Assistant', page: 'SchedulingAssistant', icon: Sparkles },
    { name: 'Clients', page: 'Clients', icon: Users },
    { name: 'Yards', page: 'Yards', icon: Building2 },
    { name: 'Invoices', page: 'Invoices', icon: FileText },
    { name: 'Payments', page: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between md:hidden">
        <h1 className="text-lg font-semibold text-stone-800">EquiPhysio</h1>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-xl bg-stone-100 text-stone-600"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <nav className={`
        fixed top-0 right-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-out
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}
        md:hidden
      `}>
        <div className="p-6 pt-20">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-stone-600 hover:bg-stone-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            </div>

            <div className="border-t border-stone-100 mt-4 pt-4">
            <Link
              to={createPageUrl('Profile')}
              onClick={() => setMenuOpen(false)}
              className={`
                flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
                ${currentPageName === 'Profile'
                  ? 'bg-emerald-600 text-white' 
                  : 'text-stone-600 hover:bg-stone-100'
                }
              `}
            >
              <UserCircle size={20} />
              <span className="font-medium">Profile</span>
            </Link>
            </div>
            </div>
            </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-stone-200 flex-col">
        <div className="p-6 border-b border-stone-100">
          <h1 className="text-xl font-bold text-stone-800">EquiPhysio</h1>
          <p className="text-sm text-stone-500 mt-1">Horse Physiotherapy</p>
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-stone-600 hover:bg-stone-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            </div>

            <div className="border-t border-stone-100 mt-4 pt-4">
            <Link
              to={createPageUrl('Profile')}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${currentPageName === 'Profile'
                  ? 'bg-emerald-600 text-white' 
                  : 'text-stone-600 hover:bg-stone-100'
                }
              `}
            >
              <UserCircle size={20} />
              <span className="font-medium">Profile</span>
            </Link>
            </div>
            </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16 pb-24 md:pt-0 md:pb-0 md:pl-64 min-h-screen">
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-[100] md:hidden">
        <div className="flex items-center justify-around py-2 px-2">
          {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[5]].map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
                  ${isActive 
                    ? 'text-emerald-600' 
                    : 'text-stone-400'
                  }
                `}
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}