
import { 
  Calendar, 
  Users, 
  Heart, 
  MapPin, 
  FileText, 
  CreditCard,
  User,
  Home,
  Settings
} from 'lucide-react';
import { createPageUrl } from '../../utils';

export const navItems = [
  { label: 'Home', to: createPageUrl('Home'), icon: Home },
  { label: 'Appointments', to: createPageUrl('Appointments'), icon: Calendar },
  { label: 'Clients', to: createPageUrl('Clients'), icon: Users },
  { label: 'Horses', to: createPageUrl('Horses'), icon: Heart },
  { label: 'Yards', to: createPageUrl('Yards'), icon: MapPin },
  { label: 'Invoices', to: createPageUrl('Invoices'), icon: FileText },
  { label: 'Payments', to: createPageUrl('Payments'), icon: CreditCard },
];

export const profileNavItem = { 
  label: 'Profile', 
  to: createPageUrl('Profile'), 
  icon: User 
};

export const settingsNavItem = { 
  label: 'Settings', 
  to: createPageUrl('Settings'), 
  icon: Settings 
};
