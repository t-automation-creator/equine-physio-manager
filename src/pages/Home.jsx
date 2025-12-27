import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tantml:react-query';
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

  // Group appointments by yard
  const appointmentsByYard = appointments.reduce((acc, appt) => {
    const yardId = appt.yard_id || 'no-yard';
    if (!acc[yardId]) acc[yardId] = [];
    acc[yardId].push(appt);
    return acc;
  }, {});

  return (
    <div className="pb-6">
      <PageHeader 
        title="Today"
        subtitle={format(new Date(), 'EEEE, MMMM d')}
        action={
          <Link to={createPageUrl('NewAppointment')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 px-5">
              <Plus size={20} className="mr-2" />
              New Appointment
            </Button>
          </Link>
        }
      />

      {loadingAppts ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments today"
          description="You have no appointments scheduled for today. Create a new appointment to get started."
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
          {Object.entries(appointmentsByYard).map(([yardId, yardAppts]) => {
            const yard = getYard(yardId);
            return (
              <div key={yardId}>
                {yard && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={18} className="text-stone-400" />
                    <h2 className="font-semibold text-stone-700">{yard.name}</h2>
                    <span className="text-stone-400 text-sm">
                      {yardAppts.length} {yardAppts.length === 1 ? 'appointment' : 'appointments'}
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  {yardAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      client={getClient(appt.client_id)}
                      yard={yard}
                      horses={getHorses(appt.horse_ids)}
                      treatments={getTreatmentsForAppointment(appt.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}