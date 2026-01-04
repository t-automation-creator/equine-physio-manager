import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  MapPin, 
  ChevronRight, 
  Plus,
  Edit,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';

export default function YardDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const yardId = urlParams.get('id');

  const { data: yard, isLoading } = useQuery({
    queryKey: ['yard', yardId],
    queryFn: async () => {
      const yards = await base44.entities.Yard.filter({ id: yardId });
      return yards[0];
    },
    enabled: !!yardId,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses', yardId],
    queryFn: async () => {
      const allHorses = await base44.entities.Horse.filter({ created_by: user.email, yard_id: yardId });
      return allHorses;
    },
    enabled: !!yardId && !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const getClient = (id) => clients.find(c => c.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!yard) {
    return <div>Yard not found</div>;
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title={yard.name}
        backTo="Yards"
        action={
          <Link to={createPageUrl(`EditYard?id=${yardId}`)}>
            <Button variant="outline" className="rounded-xl">
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </Link>
        }
      />

      {/* Address */}
      {yard.address && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
          <h3 className="font-semibold text-stone-800 mb-3">Location</h3>
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-stone-400 mt-0.5" />
            <p className="text-stone-700">{yard.address}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {yard.notes && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
          <h3 className="font-semibold text-stone-800 mb-3">Notes</h3>
          <p className="text-stone-700 whitespace-pre-wrap">{yard.notes}</p>
        </div>
      )}

      {/* Horses at this yard */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Horses at this Yard</h3>
          <Link to={createPageUrl(`NewHorse?yardId=${yardId}`)}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </Link>
        </div>

        {horses.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <p>No horses at this yard yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {horses.map((horse) => {
              const owner = getClient(horse.owner_id);
              return (
                <Link
                  key={horse.id}
                  to={createPageUrl(`HorseDetail?id=${horse.id}`)}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-stone-800">{horse.name}</h4>
                    <div className="text-sm text-stone-500">
                      {owner && <span>Owner: {owner.name}</span>}
                      {owner && horse.discipline && <span> • </span>}
                      {horse.discipline && <span>{horse.discipline}</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}