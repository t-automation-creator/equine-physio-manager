import { Heart, Calendar, Users, Home as HomeIcon, FileText, CreditCard, User } from 'lucide-react';
import { createPageUrl } from '@/utils';

export const navItems = [
  { to: createPageUrl('Home'), icon: Heart, label: 'Home', showInBottomNav: true },
  { to: createPageUrl('Appointments'), icon: Calendar, label: 'Appointments', showInBottomNav: true },
  { to: createPageUrl('Clients'), icon: Users, label: 'Clients', showInBottomNav: true },
  { to: createPageUrl('Yards'), icon: HomeIcon, label: 'Yards', showInBottomNav: true },
  { to: createPageUrl('Invoices'), icon: FileText, label: 'Invoices', showInBottomNav: true },
  { to: createPageUrl('Payments'), icon: CreditCard, label: 'Payments', showInBottomNav: false },
];

export const profileNavItem = {
  to: createPageUrl('Profile'),
  icon: User,
  label: 'Profile'
};

export const getBottomNavItems = () =>
  navItems.filter(item => item.showInBottomNav).slice(0, 5);
