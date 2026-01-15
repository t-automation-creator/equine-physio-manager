import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function PageHeader({ title, subtitle, backTo, action }) {
  return (
    <div className="mb-6">
      {backTo && (
        <Link 
          to={createPageUrl(backTo)}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
