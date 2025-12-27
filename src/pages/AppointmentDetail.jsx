import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, Phone, Mail, Play, FileText, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';

export default function AppointmentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const appts = await base44.entities.Appointment.filter({ id: appointmentId });
      return appts[0];
    },
    enabled: !!appointmentId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', appointment?.client_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: appointment.client_id });
      return clients[0];
    },
    enabled: !!appointment?.client_id,
  });

  const { data: yard } = useQuery({
    queryKey: ['yard', appointment?.yard_id],
    queryFn: async () => {
      const yards = await base44.entities.Yard.filter({ id: appointment.yard_id });
      return yards[0];
    },
    enabled: !!appointment?.yard_id,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list(),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', appointmentId],
    queryFn: () => base44.entities.Treatment.filter({ appointment_id: appointmentId }),
    enabled: !!appointmentId,
  });

  const { data: invoice } = useQuery({
    queryKey: ['invoice', appointmentId],
    queryFn: async () => {
      const invoices = await base44.entities.Invoice.filter({ appointment_id: appointmentId });
      return invoices[0];
    },
    enabled: !!appointmentId,
  });

  const getHorse = (id) => horses.find(h => h.id === id);
  const getTreatment = (horseId) => treatments.find(t => t.horse_id === horseId);

  const updateStatusMutation = useMutation({
    mutationFn: (status) => base44.entities.Appointment.update(appointmentId, { status }),
    onSuccess: () => queryClient.invalidateQueries(['appointment', appointmentId]),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="h-40 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (!appointment) {
    return <div>Appointment not found</div>;
  }

  const appointmentHorses = appointment.horse_ids?.map(getHorse).filter(Boolean) || [];
  const allTreatmentsComplete = appointmentHorses.length > 0 && 
    appointmentHorses.every(h => getTreatment(h.id)?.status === 'completed');

  return (
    <div className="pb-6">
      <PageHeader 
        title="Appointment"
        subtitle={format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
        backTo="Appointments"
      />

      {/* Client & Yard Info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">{client?.name || 'Unknown Client'}</h2>
            {yard && (
              <div className="flex items-center gap-1.5 text-stone-500 mt-1">
                <MapPin size={16} />
                <span>{yard.name}</span>
              </div>
            )}
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {appointment.time && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <Clock size={16} />
              <span>{appointment.time}</span>
            </div>
          )}
          {client?.phone && (
            <a 
              href={`tel:${client.phone}`}
              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700"
            >
              <Phone size={16} />
              <span>{client.phone}</span>
            </a>
          )}
          {client?.email && (
            <a 
              href={`mailto:${client.email}`}
              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700"
            >
              <Mail size={16} />
              <span>{client.email}</span>
            </a>
          )}
        </div>
      </div>

      {/* Horses List */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <h3 className="font-semibold text-stone-800 mb-4">Horses to Treat</h3>
        
        <div className="space-y-3">
          {appointmentHorses.map((horse) => {
            const treatment = getTreatment(horse.id);
            return (
              <div 
                key={horse.id}
                className="flex items-center justify-between p-4 bg-stone-50 rounded-xl"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-stone-800">{horse.name}</h4>
                  {horse.discipline && (
                    <p className="text-sm text-stone-500">{horse.discipline}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={treatment?.status || 'not_started'} />
                  <Link to={createPageUrl(`TreatmentEntry?appointmentId=${appointmentId}&horseId=${horse.id}`)}>
                    <Button 
                      size="sm"
                      className={`rounded-xl ${
                        treatment?.status === 'completed'
                          ? 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {treatment?.status === 'completed' ? (
                        <>
                          <Check size={16} className="mr-1" />
                          View
                        </>
                      ) : treatment?.status === 'in_progress' ? (
                        <>
                          <Play size={16} className="mr-1" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Play size={16} className="mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {allTreatmentsComplete && !invoice && (
          <Link to={createPageUrl(`CreateInvoice?appointmentId=${appointmentId}`)}>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 text-lg">
              <FileText size={20} className="mr-2" />
              Create Invoice
            </Button>
          </Link>
        )}

        {invoice && (
          <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
            <Button 
              variant="outline" 
              className="w-full rounded-xl h-14 text-lg border-2"
            >
              <FileText size={20} className="mr-2" />
              View Invoice
              <StatusBadge status={invoice.status} />
            </Button>
          </Link>
        )}

        {appointment.status === 'scheduled' && (
          <Button 
            variant="outline"
            className="w-full rounded-xl h-12"
            onClick={() => updateStatusMutation.mutate('in_progress')}
          >
            Mark as In Progress
          </Button>
        )}

        {appointment.status === 'in_progress' && allTreatmentsComplete && (
          <Button 
            variant="outline"
            className="w-full rounded-xl h-12"
            onClick={() => updateStatusMutation.mutate('completed')}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
}