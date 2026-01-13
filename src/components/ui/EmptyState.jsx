import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-stone-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-stone-800 mb-2">{title}</h3>
      {description && (
        <p className="text-stone-500 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}