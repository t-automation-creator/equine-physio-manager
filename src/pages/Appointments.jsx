import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, parseISO, isToday, isFuture, isPast, isSameDay } from 'date-fns';
import { Plus, Calendar, List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import AppointmentCard from '../components/appointments/AppointmentCard';
import CalendarView from '../components/CalendarView';

export default function Appointments() {
  const [filter, setFilter] = useState('upcoming');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.filter({ created_by: user.email }, '-date'),
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: () => base44.entities.Yard.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments'],
    queryFn: () => base44.entities.Treatment.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const getClient = (id) => clients.find(c => c.id === id);
  const getYard = (id) => yards.find(y => y.id === id);
  const getHorses = (ids) => ids?.map(id => horses.find(h => h.id === id)).filter(Boolean) || [];
  const getTreatmentsForAppointment = (apptId) => treatments.filter(t => t.appointment_id === apptId);

  const filteredAppointments = appointments.filter((appt) => {
    const date = parseISO(appt.date);
    
    // If a date is selected in calendar view, filter by that date
    if (selectedDate && viewMode === 'calendar') {
      return isSameDay(date, selectedDate);
    }
    
    // Otherwise use the filter tabs
    if (filter === 'today') return isToday(date);
    if (filter === 'upcoming') return isFuture(date) || isToday(date);
    if (filter === 'past') return isPast(date) && !isToday(date);
    return true;
  });

  // Group by date
  const appointmentsByDate = filteredAppointments.reduce((acc, appt) => {
    if (!acc[appt.date]) acc[appt.date] = [];
    acc[appt.date].push(appt);
    return acc;
  }, {});

  const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => 
    filter === 'past' ? b.localeCompare(a) : a.localeCompare(b)
  );

  // Handle day click in calendar
  const handleDayClick = (date) => {
    setSelectedDate(date);
  };

  // Clear selected date when switching views or filters
  const handleViewChange = (mode) => {
    setViewMode(mode);
    setSelectedDate(null);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSelectedDate(null);
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="Appointments"
        action={
          <Link to={createPageUrl('NewAppointment')}>
            <Button size="lg">
              <Plus size={20} />
              New
            </Button>
          </Link>
        }
      />

      {/* View Toggle - Pill Style */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => handleViewChange('list')}
          className="flex-1"
          size="lg"
        >
          <List size={20} />
          List
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => handleViewChange('calendar')}
          className="flex-1"
          size="lg"
        >
          <CalendarDays size={20} />
          Calendar
        </Button>
      </div>

      {/* Filter Tabs - CVS Style */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['today', 'upcoming', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleFilterChange(tab)}
            className={`
              px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all
              ${filter === tab 
                ? 'bg-cvs-blue text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="mb-6">
          <CalendarView 
            appointments={appointments}
            onDayClick={handleDayClick}
          />
          {selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-sm text-blue-800 font-medium">
                Showing appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-cvs-blue hover:underline mt-1 font-medium"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Appointments List */}
      {loadingAppts ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={selectedDate 
            ? `No appointments on ${format(selectedDate, 'MMMM d')}`
            : `No ${filter} appointments`
          }
          description={selectedDate
            ? "There are no appointments scheduled for this date."
            : filter === 'upcoming' 
              ? "You have no upcoming appointments scheduled."
              : filter === 'today'
              ? "No appointments for today."
              : "No past appointments found."
          }
          action={
            <Link to={createPageUrl('NewAppointment')}>
              <Button size="lg">
                <Plus size={20} />
                New Appointment
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wide">
                {isToday(parseISO(date)) 
                  ? 'Today' 
                  : format(parseISO(date), 'EEEE, MMMM d')}
              </h2>
              <div className="space-y-3">
                {appointmentsByDate[date].map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    client={getClient(appt.client_id)}
                    yard={getYard(appt.yard_id)}
                    horses={getHorses(appt.horse_ids)}
                    treatments={getTreatmentsForAppointment(appt.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
