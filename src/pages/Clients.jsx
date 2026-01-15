import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, Search, Users, ChevronRight, Phone, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function Clients() {
  const [search, setSearch] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ created_by: user?.email }, 'name'),
    enabled: !!user?.email,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const getHorseCount = (clientId) => horses.filter(h => h.owner_id === clientId).length;

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isError) {
    return (
      <div className="pb-6">
        <PageHeader title="Clients" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-cvs-red mx-auto mb-3" />
          <h3 className="font-bold text-red-800 mb-2">Failed to load clients</h3>
          <p className="text-red-600 text-sm">{error?.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title="Clients"
        action={
          <Link to={createPageUrl('NewClient')}>
            <Button size="lg">
              <Plus size={20} />
              Add Client
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="pl-12"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No clients found" : "No clients yet"}
          description={search 
            ? "Try a different search term."
            : "Add your first client to get started."
          }
          action={!search && (
            <Link to={createPageUrl('NewClient')}>
              <Button size="lg">
                <Plus size={20} />
                Add Client
              </Button>
            </Link>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={createPageUrl(`ClientDetail?id=${client.id}`)}
              className="block bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{client.name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {client.email}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-cvs-blue font-medium mt-2">
                    {getHorseCount(client.id)} horse{getHorseCount(client.id) !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
