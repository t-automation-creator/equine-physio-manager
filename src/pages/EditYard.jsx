import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Check, Loader2, Building2, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';

export default function EditYard() {
  const urlParams = new URLSearchParams(window.location.search);
  const yardId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const { data: yard, isLoading } = useQuery({
    queryKey: ['yard', yardId],
    queryFn: async () => {
      const yards = await base44.entities.Yard.filter({ id: yardId });
      return yards[0];
    },
    enabled: !!yardId,
  });

  useEffect(() => {
    if (yard) {
      setName(yard.name || '');
      setAddress(yard.address || '');
      setNotes(yard.notes || '');
    }
  }, [yard]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Yard.update(yardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['yard', yardId]);
      navigate(createPageUrl(`YardDetail?id=${yardId}`));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Yard.delete(yardId),
    onSuccess: () => {
      navigate(createPageUrl('Yards'));
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate({ name, address, notes });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this stable? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="Edit Stable"
        backTo={`YardDetail?id=${yardId}`}
      />

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Stable name"
                  className="pl-10 rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-stone-400" size={18} />
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  className="pl-10 rounded-xl min-h-[80px]"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this stable..."
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!name || updateMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 text-lg"
        >
          {updateMutation.isPending ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <Check size={20} className="mr-2" />
          )}
          Save Changes
        </Button>

        <Button 
          variant="outline"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="w-full rounded-xl h-12 text-red-600 border-red-200 hover:bg-red-50"
        >
          {deleteMutation.isPending ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Trash2 size={18} className="mr-2" />
          )}
          Delete Stable
        </Button>
      </div>
    </div>
  );
}