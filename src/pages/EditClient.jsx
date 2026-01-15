import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Check, Loader2, User, Phone, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';

export default function EditClient() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
    }
  }, [client]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      navigate(createPageUrl(`ClientDetail?id=${clientId}`));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Client.delete(clientId),
    onSuccess: () => {
      navigate(createPageUrl('Clients'));
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate({ name, phone, email });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cvs-blue" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title="Edit Client"
        backTo={`ClientDetail?id=${clientId}`}
      />

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Name *</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Client name"
                  className="pl-12"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="pl-12"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="pl-12"
                />
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!name || updateMutation.isPending}
          className="w-full"
          size="lg"
        >
          {updateMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Check size={20} />
          )}
          Save Changes
        </Button>

        <Button 
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="w-full"
          size="lg"
        >
          {deleteMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
          Delete Client
        </Button>
      </div>
    </div>
  );
}
