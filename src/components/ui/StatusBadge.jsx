import React from 'react';
import { CheckCircle2, Clock, Circle, AlertCircle, Send, FileText } from 'lucide-react';

const statusStyles = {
  // Treatment statuses
  not_started: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    label: 'Pending',
    icon: Circle
  },
  in_progress: { 
    bg: 'bg-blue-50', 
    text: 'text-cvs-blue', 
    label: 'In Progress',
    icon: Clock
  },
  completed: { 
    bg: 'bg-green-50', 
    text: 'text-cvs-green', 
    label: 'Complete',
    icon: CheckCircle2
  },
  
  // Appointment statuses
  scheduled: { 
    bg: 'bg-blue-50', 
    text: 'text-cvs-blue', 
    label: 'Scheduled',
    icon: Clock
  },
  cancelled: { 
    bg: 'bg-red-50', 
    text: 'text-cvs-red', 
    label: 'Cancelled',
    icon: AlertCircle
  },
  
  // Invoice statuses
  draft: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    label: 'Draft',
    icon: FileText
  },
  sent: { 
    bg: 'bg-blue-50', 
    text: 'text-cvs-blue', 
    label: 'Sent',
    icon: Send
  },
  paid: { 
    bg: 'bg-green-50', 
    text: 'text-cvs-green', 
    label: 'Paid',
    icon: CheckCircle2
  },
};

export default function StatusBadge({ status, showIcon = true }) {
  const style = statusStyles[status] || statusStyles.not_started;
  const Icon = style.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {showIcon && Icon && <Icon size={12} />}
      {style.label}
    </span>
  );
}
