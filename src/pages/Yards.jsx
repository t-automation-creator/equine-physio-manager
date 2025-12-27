import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, Search, Building2, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function Yards() {
  const [search, setSearch] = useState('');

  const { data: yards = [], isLoading } = useQuery({
    queryKey: ['yards'],
    queryFn: () => base44.entities.Yard.list('name'),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list(),
  });

  const getHorseCount = (yardId) => horses.filter(h => h.yard_id === yardId).length;

  const filteredYards = yards.filter(yard =>
    yard.name?.toLowerCase().includes(search.toLowerCase()) ||
    yard.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-6">
      <PageHeader 
        title="Yards"
        action={
          <Link to={createPageUrl('NewYard')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 px-5">
              <Plus size={20} className="mr-2" />
              Add
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search yards..."
          className="pl-12 h-12 rounded-xl border-stone-200"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredYards.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? "No yards found" : "No yards yet"}
          description={search 
            ? "Try a different search term."
            : "Add your first yard to get started."
          }
          action={!search && (
            <Link to={createPageUrl('NewYard')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 px-6">
                <Plus size={20} className="mr-2" />
                Add Yard
              </Button>
            </Link>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filteredYards.map((yard) => (
            <Link
              key={yard.id}
              to={createPageUrl(`YardDetail?id=${yard.id}`)}
              className="block bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-800 mb-1">{yard.name}</h3>
                  {yard.address && (
                    <div className="flex items-start gap-1.5 text-sm text-stone-500">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{yard.address}</span>
                    </div>
                  )}
                  <p className="text-sm text-emerald-600 mt-2">
                    {getHorseCount(yard.id)} horse{getHorseCount(yard.id) !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={20} className="text-stone-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}