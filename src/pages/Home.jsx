import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { MapPin, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressPrompt from '../components/AddressPrompt';

export default function Home() {
  const [showAddressPrompt, setShowAddressPrompt] = React.useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', today],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Appointment', query: { date: today } });
      return response.data.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Only fetch data needed for today's appointments
  const clientIds = [...new Set(appointments.map(a => a.client_id))];
  const yardIds = [...new Set(appointments.map(a => a.yard_id).filter(Boolean))];
  const horseIds = [...new Set(appointments.flatMap(a => a.horse_ids || []))];

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', clientIds],
    queryFn: async () => {
      if (clientIds.length === 0) return [];
      const response = await base44.functions.invoke('getMyData', { entity: 'Client', query: {} });
      return response.data.data.filter(c => clientIds.includes(c.id));
    },
    enabled: clientIds.length > 0 && !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards', yardIds],
    queryFn: async () => {
      if (yardIds.length === 0) return [];
      const response = await base44.functions.invoke('getMyData', { entity: 'Yard', query: {} });
      return response.data.data.filter(y => yardIds.includes(y.id));
    },
    enabled: yardIds.length > 0 && !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses', horseIds],
    queryFn: async () => {
      if (horseIds.length === 0) return [];
      const response = await base44.functions.invoke('getMyData', { entity: 'Horse', query: {} });
      return response.data.data.filter(h => horseIds.includes(h.id));
    },
    enabled: horseIds.length > 0 && !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', today],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Treatment', query: {} });
      const todayApptIds = appointments.map(a => a.id);
      return response.data.data.filter(t => todayApptIds.includes(t.appointment_id));
    },
    enabled: appointments.length > 0 && !!user,
    staleTime: 2 * 60 * 1000,
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

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Invoice', query: {} });
      return response.data.data;
    },
    enabled: !!user,
  });

  const getInvoice = (apptId) => invoices.find(inv => inv.appointment_id === apptId);

  const getHorseStatus = (apptId, horseId) => {
    const treatment = treatments.find(t => t.appointment_id === apptId && t.horse_id === horseId);
    return treatment?.status || 'not_started';
  };

  const allTreatmentsComplete = (apptId, horseIds) => {
    return horseIds?.every(horseId => getHorseStatus(apptId, horseId) === 'completed');
  };

  return (
    <div className="pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800 mb-1">Today</h1>
        <p className="text-stone-500 text-lg">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {showAddressPrompt && <AddressPrompt user={user} onDismiss={() => setShowAddressPrompt(false)} />}

      {loadingAppts ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg">No appointments today</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(appointmentsByYard).map(([yardId, yardAppts]) => {
            const yard = getYard(yardId);
            return (
              <div key={yardId}>
                {yard && (
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={20} className="text-emerald-600" />
                    <h2 className="text-xl font-bold text-stone-800">{yard.name}</h2>
                  </div>
                )}
                <div className="space-y-4">
                  {yardAppts.map((appt) => {
                    const client = getClient(appt.client_id);
                    const apptHorses = getHorses(appt.horse_ids);
                    const invoice = getInvoice(appt.id);
                    const treatmentsComplete = allTreatmentsComplete(appt.id, appt.horse_ids);

                    return (
                      <div 
                        key={appt.id}
                        className="bg-white rounded-2xl border-2 border-stone-200 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-stone-800">{client?.name}</h3>
                            <p className="text-stone-500 text-lg mt-1">{appt.time}</p>
                          </div>
                        </div>

                        {/* Horses */}
                        <div className="space-y-3 mb-6">
                          {apptHorses.map((horse) => {
                            const status = getHorseStatus(appt.id, horse.id);
                            const statusColor = status === 'completed' ? 'text-emerald-600' : 'text-stone-400';
                            
                            return (
                              <div key={horse.id} className="flex items-center justify-between">
                                <span className="text-lg text-stone-700">{horse.name}</span>
                                <span className={`text-sm font-medium ${statusColor}`}>
                                  {status === 'completed' ? '✓ Done' : 
                                   status === 'in_progress' ? 'In progress' : 'Not started'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          {apptHorses.map((horse) => {
                            const status = getHorseStatus(appt.id, horse.id);
                            if (status === 'completed') return null;
                            
                            return (
                              <Link
                                key={horse.id}
                                to={createPageUrl(`TreatmentEntry?appointmentId=${appt.id}&horseId=${horse.id}`)}
                              >
                                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-2">
                                  <Play size={18} className="fill-white" />
                                  <span className="font-semibold">Start: {horse.name}</span>
                                </Button>
                              </Link>
                            );
                          })}

                          {treatmentsComplete && !invoice && (
                            <Link to={createPageUrl(`CreateInvoice?appointmentId=${appt.id}`)}>
                              <Button className="w-full h-12 bg-stone-800 hover:bg-stone-900 rounded-xl flex items-center justify-center gap-2 font-semibold">
                                <FileText size={18} />
                                Create Invoice
                              </Button>
                            </Link>
                          )}

                          {invoice && (
                            <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                              <Button variant="outline" className="w-full h-10 rounded-xl border-2 flex items-center justify-center gap-2 font-medium">
                                <FileText size={16} />
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