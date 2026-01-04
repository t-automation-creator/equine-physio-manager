import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { 
  Calendar,
  Clock,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/ui/PageHeader';

export default function NewAppointment() {
  const navigate = useNavigate();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [clientId, setClientId] = useState('');
  const [yardId, setYardId] = useState('');
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [notes, setNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, 'name'),
    enabled: !!user,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: () => base44.entities.Yard.filter({ created_by: user.email }, 'name'),
    enabled: !!user,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.filter({ created_by: user.email }, 'name'),
    enabled: !!user,
  });

  // Filter horses by selected client
  const availableHorses = clientId 
    ? horses.filter(h => h.owner_id === clientId)
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: (data) => {
      navigate(createPageUrl(`AppointmentDetail?id=${data.id}`));
    },
  });

  const handleHorseToggle = (horseId) => {
    setSelectedHorses(prev => 
      prev.includes(horseId)
        ? prev.filter(id => id !== horseId)
        : [...prev, horseId]
    );
  };

  const handleSubmit = () => {
    createMutation.mutate({
      date,
      time,
      client_id: clientId,
      yard_id: yardId || null,
      horse_ids: selectedHorses,
      notes,
      status: 'scheduled',
    });
  };

  // Auto-select yard when horses are selected
  const handleClientChange = (id) => {
    setClientId(id);
    setSelectedHorses([]);
    
    // Find the most common yard for this client's horses
    const clientHorses = horses.filter(h => h.owner_id === id);
    if (clientHorses.length > 0 && clientHorses[0].yard_id) {
      setYardId(clientHorses[0].yard_id);
    }
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="New Appointment"
        backTo="Appointments"
      />

      <div className="space-y-6">
        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-800 mb-4">When</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Time (optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">Client</Label>
          <Select value={clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Yard */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">Yard (optional)</Label>
          <Select value={yardId} onValueChange={setYardId}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue placeholder="Select a yard" />
            </SelectTrigger>
            <SelectContent>
              {yards.map((yard) => (
                <SelectItem key={yard.id} value={yard.id}>
                  {yard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Horses */}
        {clientId && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <Label className="text-base font-semibold text-stone-800 mb-4 block">
              Horses to Treat
            </Label>
            
            {availableHorses.length === 0 ? (
              <p className="text-stone-500 text-center py-4">
                This client has no horses registered
              </p>
            ) : (
              <div className="space-y-2">
                {availableHorses.map((horse) => (
                  <button
                    key={horse.id}
                    onClick={() => handleHorseToggle(horse.id)}
                    className={`
                      w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                      ${selectedHorses.includes(horse.id)
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-stone-200 hover:border-stone-300'
                      }
                    `}
                  >
                    <Checkbox 
                      checked={selectedHorses.includes(horse.id)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{horse.name}</p>
                      {horse.discipline && (
                        <p className="text-sm text-stone-500">{horse.discipline}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">
            Notes (optional)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes for this appointment..."
            className="rounded-xl"
          />
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit}
          disabled={!clientId || selectedHorses.length === 0 || createMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 text-lg"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <Check size={20} className="mr-2" />
          )}
          Create Appointment
        </Button>
      </div>
    </div>
  );
}