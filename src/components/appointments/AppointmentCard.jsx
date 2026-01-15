import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

export default function AppointmentCard({ 
  appointment, 
  client, 
  yard, 
  horses, 
  treatments,
  showDate = false 
}) {
  const getHorseStatus = (horseId) => {
    const treatment = treatments?.find(t => t.horse_id === horseId);
    return treatment?.status || 'not_started';
  };

  return (
    <Link 
      to={createPageUrl(`AppointmentDetail?id=${appointment.id}`)}
      className="block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-card-hover transition-all"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{client?.name || 'Unknown Client'}</h3>
            {yard && (
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin size={14} />
                <span>{yard.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showDate && (
              <span className="text-sm text-gray-500">{appointment.date}</span>
            )}
            {appointment.time && (
              <div className="flex items-center gap-1 text-gray-500 text-sm bg-gray-100 px-2.5 py-1 rounded-full">
                <Clock size={14} />
                <span>{appointment.time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horses List */}
      <div className="px-4 py-3 bg-gray-50">
        {horses?.map((horse, index) => (
          <div 
            key={horse.id}
            className={`flex items-center justify-between py-2 ${
              index !== horses.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <span className="font-medium text-gray-700">{horse.name}</span>
            <StatusBadge status={getHorseStatus(horse.id)} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-cvs-blue">View Details</span>
        <ChevronRight size={18} className="text-cvs-blue" />
      </div>
    </Link>
  );
}
