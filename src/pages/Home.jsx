import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { MapPin, Play, FileText, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressPrompt from '../components/AddressPrompt';

export default function Home() {
  const [showAddressPrompt, setShowAddressPrompt] = React.useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Use optimized hooks for shared data
  const { data: user, isLoading: loadingUser } = useUser();

  // Fetch today's appointments with proper caching
  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: queryKeys.appointments.byDate(today),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Appointment', query: { date: today } });
      return response.data.data || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.appointments,
  });

  // Use shared hooks for reference data - these are cached globally
  // so navigating to Clients page won't refetch
  const { data: clients = [] } = useClients();
  const { data: yards = [] } = useYards();
  const { data: horses = [] } = useHorses();
  const { data: invoices = [] } = useInvoices();

  // Fetch treatments for today's appointments
  const { data: treatments = [] } = useQuery({
    queryKey: queryKeys.treatments.byAppointment(today),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Treatment', query: {} });
      const todayApptIds = appointments.map(a => a.id);
      return (response.data.data || []).filter(t => todayApptIds.includes(t.appointment_id));
    },
    enabled: appointments.length > 0 && !!user,
    ...CACHE_PRESETS.treatments,
  });

  const getClient = (id) => clients.find(c => c.id === id);
  const getYard = (id) => yards.find(y => y.id === id);
  const getHorses = (ids) => ids?.map(id => horses.find(h => h.id === id)).filter(Boolean) || [];
  const getTreatmentsForAppointment = (apptId) => treatments.filter(t => t.appointment_id === apptId);

  // Group appointments by yard and sort by time
  const appointmentsByYard = appointments
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    .reduce((acc, appt) => {
      const yardId = appt.yard_id || 'no-yard';
      if (!acc[yardId]) acc[yardId] = [];
      acc[yardId].push(appt);
      return acc;
    }, {});

  const getInvoice = (apptId) => invoices.find(inv => inv.appointment_id === apptId);

  const getHorseStatus = (apptId, horseId) => {
    const treatment = treatments.find(t => t.appointment_id === apptId && t.horse_id === horseId);
    return treatment?.status || 'not_started';
  };

  const allTreatmentsComplete = (apptId, horseIds) => {
    return horseIds?.every(horseId => getHorseStatus(apptId, horseId) === 'completed');
  };

  // Show full-page loading state until initial data is ready
  if (loadingAppts || loadingUser) {
    return (
      <div className="pb-6">
        <div className="mb-6">
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
              <div className="h-12 w-full bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header Section */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm font-medium mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-3xl font-bold text-gray-900">
          What can we help you<br />find, {user?.full_name?.split(' ')[0] || 'there'}?
        </h1>
      </div>

      {showAddressPrompt && !user?.home_address && <AddressPrompt user={user} onDismiss={() => setShowAddressPrompt(false)} />}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="space-y-1">
          <Link 
            to={createPageUrl('Appointments')}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">View all appointments</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
          <Link 
            to={createPageUrl('Clients')}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Manage clients</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Today's Appointments Section */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule</h2>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">No appointments today</h3>
          <p className="text-gray-500 mb-6">Your schedule is clear for today</p>
          <Link to={createPageUrl('NewAppointment')}>
            <Button>Schedule Appointment</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(appointmentsByYard).map(([yardId, yardAppts]) => {
            const yard = getYard(yardId);
            return (
              <div key={yardId}>
                {yard && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-cvs-green/10 rounded-lg flex items-center justify-center">
                      <MapPin size={16} className="text-cvs-green" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{yard.name}</h3>
                  </div>
                )}
                <div className="space-y-3">
                  {yardAppts.map((appt) => {
                    const client = getClient(appt.client_id);
                    const apptHorses = getHorses(appt.horse_ids);
                    const invoice = getInvoice(appt.id);
                    const treatmentsComplete = allTreatmentsComplete(appt.id, appt.horse_ids);

                    return (
                      <div 
                        key={appt.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-5 border-b border-gray-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">{client?.name}</h4>
                              <p className="text-gray-500 flex items-center gap-1 mt-1">
                                <Clock size={14} />
                                {appt.time}
                              </p>
                            </div>
                            {treatmentsComplete && (
                              <div className="flex items-center gap-1 text-cvs-green bg-cvs-green-light px-3 py-1 rounded-full text-sm font-medium">
                                <CheckCircle2 size={14} />
                                Complete
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Horses List */}
                        <div className="px-5 py-3 bg-gray-50">
                          {apptHorses.map((horse) => {
                            const status = getHorseStatus(appt.id, horse.id);
                            return (
                              <div key={horse.id} className="flex items-center justify-between py-2">
                                <span className="font-medium text-gray-700">{horse.name}</span>
                                <span className={`text-sm font-medium ${
                                  status === 'completed' ? 'text-cvs-green' : 
                                  status === 'in_progress' ? 'text-cvs-blue' : 'text-gray-400'
                                }`}>
                                  {status === 'completed' ? '✓ Done' : 
                                   status === 'in_progress' ? 'In progress' : 'Pending'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="p-5 space-y-3">
                          {apptHorses.map((horse) => {
                            const status = getHorseStatus(appt.id, horse.id);
                            if (status === 'completed') return null;
                            
                            return (
                              <Link
                                key={horse.id}
                                to={createPageUrl(`TreatmentEntry?appointmentId=${appt.id}&horseId=${horse.id}`)}
                              >
                                <Button className="w-full" size="lg">
                                  <Play size={18} className="fill-white" />
                                  Start Treatment: {horse.name}
                                </Button>
                              </Link>
                            );
                          })}

                          {treatmentsComplete && !invoice && (
                            <Link to={createPageUrl(`CreateInvoice?appointmentId=${appt.id}`)}>
                              <Button variant="primary" className="w-full" size="lg">
                                <FileText size={18} />
                                Create Invoice
                              </Button>
                            </Link>
                          )}

                          {invoice && (
                            <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                              <Button variant="outline" className="w-full" size="lg">
                                <FileText size={18} />
                                View Invoice
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}