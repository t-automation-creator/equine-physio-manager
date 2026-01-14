import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Check, Loader2, User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';

export default function NewClient() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: (data) => {
      navigate(createPageUrl(`ClientDetail?id=${data.id}`));
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({ name, phone, email });
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="New Client"
        backTo="Clients"
      />

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Client name"
                  className="pl-10 rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="pl-10 rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="pl-10 rounded-xl h-12"
                />
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!name || createMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 font-semibold"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <Check size={20} className="mr-2" />
          )}
          Add Client
        </Button>
      </div>
    </div>
  );
}