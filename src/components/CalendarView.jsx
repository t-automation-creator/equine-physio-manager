import React, { useState, useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CalendarView - Mobile-optimized calendar component
 * 
 * @param {Array} appointments - Array of appointment objects with { id, date, time, client_id, horse_ids, status }
 * @param {Function} onDayClick - Callback when a day is clicked, receives the date
 */
export default function CalendarView({ appointments = [], onDayClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get appointments count for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => {
      // Handle both string dates and Date objects
      const aptDate = typeof apt.date === 'string' ? apt.date : format(apt.date, 'yyyy-MM-dd');
      return aptDate === dateStr;
    });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Handle day click
  const handleDayClick = (date) => {
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0 && onDayClick) {
      onDayClick(date);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors active:scale-95"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} className="text-stone-700" />
        </button>

        <h2 className="text-lg sm:text-xl font-semibold text-stone-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={handleNextMonth}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors active:scale-95"
          aria-label="Next month"
        >
          <ChevronRight size={20} className="text-stone-700" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium text-stone-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDate(day);
          const hasAppointments = dayAppointments.length > 0;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!hasAppointments}
              className={`
                relative aspect-square min-h-[44px] rounded-xl flex flex-col items-center justify-center
                transition-all duration-200
                ${isCurrentMonth ? 'text-stone-800' : 'text-stone-400'}
                ${isTodayDate && isCurrentMonth ? 'bg-emerald-50 border-2 border-emerald-600 font-semibold' : ''}
                ${!isTodayDate && isCurrentMonth ? 'hover:bg-stone-50' : ''}
                ${hasAppointments && !isTodayDate ? 'cursor-pointer active:scale-95' : ''}
                ${!hasAppointments ? 'cursor-default' : ''}
              `}
            >
              {/* Day Number */}
              <span className={`text-sm sm:text-base ${isTodayDate ? 'text-emerald-600' : ''}`}>
                {format(day, 'd')}
              </span>

              {/* Appointment Badge */}
              {hasAppointments && (
                <span className={`
                  absolute bottom-1 left-1/2 transform -translate-x-1/2
                  min-w-[20px] h-5 px-1.5 rounded-full
                  flex items-center justify-center
                  text-[10px] sm:text-xs font-medium
                  ${isTodayDate 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-100 text-emerald-700'
                  }
                `}>
                  {dayAppointments.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-emerald-600 bg-emerald-50"></div>
          <span className="text-xs sm:text-sm text-stone-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
            <span className="text-[8px] font-medium text-emerald-700">1</span>
          </div>
          <span className="text-xs sm:text-sm text-stone-600">Has Appointments</span>
        </div>
      </div>
    </div>
  );
}
