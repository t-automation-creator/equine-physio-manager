import React from 'react';

const statusStyles = {
  // Treatment statuses
  not_started: { bg: 'bg-stone-100', text: 'text-stone-600', label: 'Not Started' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  
  // Appointment statuses
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  
  // Invoice statuses
  draft: { bg: 'bg-stone-100', text: 'text-stone-600', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' },
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.not_started;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}