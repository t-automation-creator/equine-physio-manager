import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Edit, 
  Check,
  Loader2,
  Mic,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../components/ui/PageHeader';

export default function TreatmentSummary() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointmentId');
  const horseId = urlParams.get('horseId');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Parse notes - handles both new JSON format and legacy plain text
  const parseNotes = (notesString) => {
    if (!notesString) return [];
    try {
      const parsed = JSON.parse(notesString);
      if (Array.isArray(parsed)) return parsed;
      return [{ id: 1, text: notesString, timestamp: null, type: 'typed' }];
    } catch {
      return [{ id: 1, text: notesString, timestamp: null, type: 'typed' }];
    }
  };

  // Format timestamp for display - always show date and time
  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    }
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    }) + ` at ${timeStr}`;
  };

  const { data: treatment, isLoading } = useQuery({
    queryKey: ['treatment', appointmentId, horseId],
    queryFn: async () => {
      const treatments = await base44.entities.Treatment.filter({ 
        appointment_id: appointmentId,
        horse_id: horseId 
      });
      return treatments[0];
    },
    enabled: !!appointmentId && !!horseId,
  });

  const { data: horse } = useQuery({
    queryKey: ['horse', horseId],
    queryFn: async () => {
      const horses = await base44.entities.Horse.filter({ id: horseId });
      return horses[0];
    },
    enabled: !!horseId,
  });

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const appts = await base44.entities.Appointment.filter({ id: appointmentId });
      return appts[0];
    },
    enabled: !!appointmentId,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allTreatments = [] } = useQuery({
    queryKey: ['treatments', appointmentId],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMyData', { entity: 'Treatment', query: { appointment_id: appointmentId } });
      return data;
    },
    enabled: !!appointmentId && !!user,
  });

  const { data: invoice } = useQuery({
    queryKey: ['invoice', appointmentId],
    queryFn: async () => {
      const invoices = await base44.entities.Invoice.filter({ appointment_id: appointmentId });
      return invoices[0];
    },
    enabled: !!appointmentId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Treatment.update(treatment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['treatment', appointmentId, horseId]);
      setEditing(false);
    },
  });

  const handleSaveEdit = () => {
    updateMutation.mutate({ notes: editedNotes });
  };

  const startEditing = () => {
    setEditedNotes(treatment?.notes || '');
    setEditing(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!treatment) {
    return <div>Treatment not found</div>;
  }

  const remainingHorses = appointment?.horse_ids?.filter(
    id => !allTreatments.some(t => t.horse_id === id && t.status === 'completed')
  ) || [];

  const allComplete = remainingHorses.length === 0;

  return (
    <div className="pb-6">
      <PageHeader 
        title="Treatment Complete"
        subtitle={horse?.name}
        backTo={`AppointmentDetail?id=${appointmentId}`}
      />

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-emerald-800">Treatment Completed</h3>
          <p className="text-sm text-emerald-600">{format(new Date(), 'MMMM d, yyyy • h:mm a')}</p>
        </div>
      </div>

      {/* Treatment Summary */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Treatment Summary</h3>
          {!editing && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={startEditing}
              className="text-emerald-600"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
          )}
        </div>

        {/* Treatment Types */}
        {treatment.treatment_types?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-stone-500 mb-2">Treatments Applied</p>
            <div className="flex flex-wrap gap-2">
              {treatment.treatment_types.map((type) => (
                <Badge 
                  key={type}
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <p className="text-sm text-stone-500 mb-2">Notes</p>
          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="min-h-[150px] rounded-xl"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Check size={16} className="mr-2" />
                  )}
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditing(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {parseNotes(treatment.notes).length > 0 ? (
                parseNotes(treatment.notes).map((entry) => (
                  <div 
                    key={entry.id}
                    className={`p-3 rounded-xl border ${
                      entry.type === 'voice' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    {entry.timestamp && (
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        {entry.type === 'voice' ? (
                          <Mic size={12} className="text-blue-500" />
                        ) : (
                          <Keyboard size={12} className="text-stone-400" />
                        )}
                        <span className="font-medium">
                          {entry.type === 'voice' ? 'Voice' : 'Typed'}
                        </span>
                        <span>•</span>
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </div>
                    )}
                    <p className="text-stone-700 whitespace-pre-wrap text-sm">{entry.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-stone-500 italic">No notes added</p>
              )}
            </div>
          )}
        </div>

        {/* Photos */}
        {treatment.photo_urls?.length > 0 && (
          <div>
            <p className="text-sm text-stone-500 mb-2">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {treatment.photo_urls.map((url, index) => (
                <img 
                  key={index}
                  src={url}
                  alt={`Treatment photo ${index + 1}`}
                  className="aspect-square object-cover rounded-xl"
                />
              ))}
            </div>
          </div>
        )}

        {/* Follow-up */}
        {treatment.follow_up_date && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2 text-stone-600">
              <Calendar size={16} />
              <span className="text-sm">
                Follow-up suggested: {format(new Date(treatment.follow_up_date), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {remainingHorses.length > 0 && (
          <Link to={createPageUrl(`AppointmentDetail?id=${appointmentId}`)}>
            <Button 
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold border-2"
            >
              <Plus size={20} className="mr-2" />
              Treat Another Horse ({remainingHorses.length} remaining)
            </Button>
          </Link>
        )}

        {allComplete && !invoice && (
          <Link to={createPageUrl(`CreateInvoice?appointmentId=${appointmentId}`)}>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 font-semibold">
              <FileText size={20} className="mr-2" />
              Create Invoice
            </Button>
          </Link>
        )}

        {invoice && (
          <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
            <Button 
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold border-2"
            >
              <FileText size={20} className="mr-2" />
              View Invoice
            </Button>
          </Link>
        )}

        <Link to={createPageUrl(`AppointmentDetail?id=${appointmentId}`)}>
          <Button 
            variant="ghost"
            className="w-full rounded-xl h-12"
          >
            Back to Appointment
          </Button>
        </Link>
      </div>
    </div>
  );
}