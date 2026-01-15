import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Check, Loader2, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';

export default function NewYard() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Yard.create(data),
    onSuccess: (data) => {
      navigate(createPageUrl(`YardDetail?id=${data.id}`));
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({ name, address, notes });
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="New Yard"
        backTo="Yards"
      />

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Yard name"
                  className="pl-12"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  className="pl-12 min-h-[100px] rounded-lg border-gray-200 focus:border-cvs-blue focus:ring-cvs-blue"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this yard..."
                className="min-h-[100px] rounded-lg border-gray-200 focus:border-cvs-blue focus:ring-cvs-blue"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!name || createMutation.isPending}
          className="w-full"
          size="lg"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Check size={20} />
          )}
          Add Yard
        </Button>
      </div>
    </div>
  );
}
