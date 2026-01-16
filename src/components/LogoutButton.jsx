import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton({ className }) {
  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className={className}
    >
      <LogOut size={18} />
      Logout
    </Button>
  );
}