import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Search, Plus, Heart, User, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function Horses() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['horses'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Horse', query: {} });
      return response.data.data;
    },
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Client', query: {} });
      return response.data.data;
    },
    enabled: !!user,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Yard', query: {} });
      return response.data.data;
    },
    enabled: !!user,
  });

  const getClient = (id) => clients.find(c => c.id === id);
  const getYard = (id) => yards.find(y => y.id === id);

  const filteredHorses = horses.filter((horse) => {
    const owner = getClient(horse.owner_id);
    const yard = getYard(horse.yard_id);
    const searchLower = searchQuery.toLowerCase();
    return (
      horse.name?.toLowerCase().includes(searchLower) ||
      horse.discipline?.toLowerCase().includes(searchLower) ||
      owner?.name?.toLowerCase().includes(searchLower) ||
      yard?.name?.toLowerCase().includes(searchLower)
    );
  });

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
        title="Horses"
        subtitle={`${horses.length} ${horses.length === 1 ? 'horse' : 'horses'}`}
        action={
          <Link to={createPageUrl('NewHorse')}>
            <Button>
              <Plus size={18} />
              Add Horse
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="search"
          placeholder="Search horses, owners, yards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Horses List */}
      {filteredHorses.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={searchQuery ? 'No horses found' : 'No horses yet'}
          description={searchQuery ? 'Try adjusting your search' : 'Add your first horse to get started'}
          actionLabel={!searchQuery ? 'Add Horse' : undefined}
          actionTo={!searchQuery ? createPageUrl('NewHorse') : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredHorses.map((horse) => {
            const owner = getClient(horse.owner_id);
            const yard = getYard(horse.yard_id);
            
            return (
              <Link 
                key={horse.id}
                to={createPageUrl(`HorseDetail?id=${horse.id}`)}
                className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-cvs-blue hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {horse.photo_url ? (
                    <img 
                      src={horse.photo_url} 
                      alt={horse.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                      <Heart size={28} className="text-cvs-red fill-cvs-red" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">{horse.name}</h3>
                    
                    <div className="space-y-1">
                      {horse.discipline && (
                        <p className="text-sm text-gray-600">{horse.discipline}</p>
                      )}
                      
                      {owner && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <User size={14} />
                          <span>{owner.name}</span>
                        </div>
                      )}
                      
                      {yard && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin size={14} />
                          <span>{yard.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}