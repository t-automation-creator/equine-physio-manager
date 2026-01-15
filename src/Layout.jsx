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
  UserCircle,
  Bell,
  Heart
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', page: 'Home', icon: Heart },
    { name: 'Appointments', page: 'Appointments', icon: Calendar },
    { name: 'Clients', page: 'Clients', icon: Users },
    { name: 'Yards', page: 'Yards', icon: Building2 },
    { name: 'Invoices', page: 'Invoices', icon: FileText },
    { name: 'Payments', page: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - CVS Style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cvs-red rounded-lg flex items-center justify-center">
            <Heart size={18} className="text-white fill-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">EquiPhysio</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Bell size={22} className="text-gray-600" />
          </button>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X size={22} className="text-gray-600" /> : <Menu size={22} className="text-gray-600" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden animate-fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu - CVS Style */}
      <nav className={`
        fixed top-0 right-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-out shadow-xl
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}
        md:hidden
      `}>
        <div className="p-6 pt-20">
          <div className="space-y-1">
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
                      ? 'bg-red-50 text-cvs-red' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-cvs-red' : ''} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <Link
              to={createPageUrl('Profile')}
              onClick={() => setMenuOpen(false)}
              className={`
                flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
                ${currentPageName === 'Profile'
                  ? 'bg-red-50 text-cvs-red' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <UserCircle size={20} />
              <span className="font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar - CVS Style */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cvs-red rounded-xl flex items-center justify-center">
              <Heart size={22} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EquiPhysio</h1>
              <p className="text-xs text-gray-500">Horse Physiotherapy</p>
            </div>
          </div>
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
                      ? 'bg-red-50 text-cvs-red font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-cvs-red' : ''} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <Link
              to={createPageUrl('Profile')}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${currentPageName === 'Profile'
                  ? 'bg-red-50 text-cvs-red font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50'
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

      {/* Mobile Bottom Navigation - CVS Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-[100] md:hidden shadow-nav">
        <div className="flex items-center justify-around py-2 px-2 pb-safe">
          {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[4]].map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]
                  ${isActive 
                    ? 'text-cvs-red' 
                    : 'text-gray-400'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-full transition-colors
                  ${isActive ? 'bg-red-50' : ''}
                `}>
                  <Icon size={22} className={isActive ? 'fill-cvs-red/20' : ''} />
                </div>
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
