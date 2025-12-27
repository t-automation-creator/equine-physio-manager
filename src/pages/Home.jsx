import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { MapPin, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', today],
    queryFn: () => base44.entities.Appointment.filter({ date: today }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: () => base44.entities.Yard.list(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list(),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', today],
    queryFn: async () => {
      const allTreatments = await base44.entities.Treatment.list();
      const todayApptIds = appointments.map(a => a.id);
      return allTreatments.filter(t => todayApptIds.includes(t.appointment_id));
    },
    enabled: appointments.length > 0,
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
    queryFn: () => base44.entities.Invoice.list(),
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
                                <Button className="w-full h-16 text-lg bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                                  <Play size={24} className="mr-3" />
                                  Start Treatment - {horse.name}
                                </Button>
                              </Link>
                            );
                          })}

                          {treatmentsComplete && !invoice && (
                            <Link to={createPageUrl(`CreateInvoice?appointmentId=${appt.id}`)}>
                              <Button className="w-full h-16 text-lg bg-stone-800 hover:bg-stone-900 rounded-xl">
                                <FileText size={24} className="mr-3" />
                                Create Invoice
                              </Button>
                            </Link>
                          )}

                          {invoice && (
                            <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                              <Button variant="outline" className="w-full h-14 text-lg rounded-xl border-2">
                                <FileText size={20} className="mr-3" />
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