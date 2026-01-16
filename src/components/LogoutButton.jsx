import React from 'react';
import { User } from '@/api/entities';
import { LogOut } from 'lucide-react';

const LogoutButton = ({
  className = '',
  variant = 'default',
  showIcon = true,
  showText = true,
  text = 'Logout'
}) => {
  const handleLogout = () => {
    User.logout();
  };

  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    default: 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg focus:ring-gray-500',
    primary: 'px-4 py-2 bg-cvs-blue hover:bg-blue-700 text-white rounded-lg focus:ring-cvs-blue',
    danger: 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg focus:ring-red-500',
    ghost: 'px-2 py-1 hover:bg-gray-100 text-gray-600 rounded focus:ring-gray-500',
    link: 'text-cvs-blue hover:underline focus:ring-cvs-blue'
  };

  return (
    <button
      onClick={handleLogout}
      className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
      aria-label="Logout"
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      {showText && <span>{text}</span>}
    </button>
  );
};

export default LogoutButton;
