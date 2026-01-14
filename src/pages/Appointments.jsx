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
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 px-5">
              <Plus size={20} className="mr-2" />
              New
            </Button>
          </Link>
        }
      />

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => handleViewChange('list')}
          className={`flex-1 rounded-xl h-12 ${
            viewMode === 'list' 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <List size={20} className="mr-2" />
          List
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => handleViewChange('calendar')}
          className={`flex-1 rounded-xl h-12 ${
            viewMode === 'calendar' 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <CalendarDays size={20} className="mr-2" />
          Calendar
        </Button>
      </div>

      {/* Filter Tabs - Only show in list view or when no date is selected in calendar */}
      {(viewMode === 'list' || !selectedDate) && (
        <Tabs value={filter} onValueChange={handleFilterChange} className="mb-6">
          <TabsList className="w-full bg-stone-100 p-1 rounded-xl">
            <TabsTrigger 
              value="today" 
              className="flex-1 rounded-lg data-[state=active]:bg-white"
            >
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="flex-1 rounded-lg data-[state=active]:bg-white"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="flex-1 rounded-lg data-[state=active]:bg-white"
            >
              Past
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="mb-6">
          <CalendarView 
            appointments={appointments}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />
          {selectedDate && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-800 font-medium">
                Showing appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-1"
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
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
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
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 px-6">
                <Plus size={20} className="mr-2" />
                New Appointment
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="font-semibold text-stone-600 mb-3">
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
