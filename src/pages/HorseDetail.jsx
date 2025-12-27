import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { 
  Edit,
  Loader2,
  Calendar,
  FileText,
  ChevronRight,
  User,
  MapPin,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../components/ui/PageHeader';

export default function HorseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const horseId = urlParams.get('id');

  const { data: horse, isLoading } = useQuery({
    queryKey: ['horse', horseId],
    queryFn: async () => {
      const horses = await base44.entities.Horse.filter({ id: horseId });
      return horses[0];
    },
    enabled: !!horseId,
  });

  const { data: owner } = useQuery({
    queryKey: ['client', horse?.owner_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: horse.owner_id });
      return clients[0];
    },
    enabled: !!horse?.owner_id,
  });

  const { data: yard } = useQuery({
    queryKey: ['yard', horse?.yard_id],
    queryFn: async () => {
      const yards = await base44.entities.Yard.filter({ id: horse.yard_id });
      return yards[0];
    },
    enabled: !!horse?.yard_id,
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', horseId],
    queryFn: async () => {
      const allTreatments = await base44.entities.Treatment.list('-created_date');
      return allTreatments.filter(t => t.horse_id === horseId);
    },
    enabled: !!horseId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!horse) {
    return <div>Horse not found</div>;
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title={horse.name}
        backTo="Clients"
        action={
          <Link to={createPageUrl(`EditHorse?id=${horseId}`)}>
            <Button variant="outline" className="rounded-xl">
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </Link>
        }
      />

      {/* Photo */}
      {horse.photo_url && (
        <div className="mb-4">
          <img 
            src={horse.photo_url} 
            alt={horse.name}
            className="w-full h-48 object-cover rounded-2xl"
          />
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <h3 className="font-semibold text-stone-800 mb-4">Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {horse.age && (
            <div>
              <p className="text-sm text-stone-500">Age</p>
              <p className="font-medium text-stone-800">{horse.age} years</p>
            </div>
          )}
          {horse.discipline && (
            <div>
              <p className="text-sm text-stone-500">Discipline</p>
              <p className="font-medium text-stone-800">{horse.discipline}</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
          {owner && (
            <Link 
              to={createPageUrl(`ClientDetail?id=${owner.id}`)}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-stone-400" />
                <div>
                  <p className="text-sm text-stone-500">Owner</p>
                  <p className="font-medium text-stone-800">{owner.name}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400" />
            </Link>
          )}

          {yard && (
            <Link 
              to={createPageUrl(`YardDetail?id=${yard.id}`)}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-stone-400" />
                <div>
                  <p className="text-sm text-stone-500">Yard</p>
                  <p className="font-medium text-stone-800">{yard.name}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400" />
            </Link>
          )}
        </div>
      </div>

      {/* Medical Notes */}
      {horse.medical_notes && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
          <h3 className="font-semibold text-stone-800 mb-3">Medical Notes</h3>
          <p className="text-stone-700 whitespace-pre-wrap">{horse.medical_notes}</p>
        </div>
      )}

      {/* Treatment History */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Treatment History</h3>
          <span className="text-sm text-stone-500">{treatments.length} treatments</span>
        </div>

        {treatments.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <Activity size={32} className="mx-auto mb-2 opacity-50" />
            <p>No treatments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {treatments.map((treatment) => (
              <div 
                key={treatment.id}
                className="p-4 bg-stone-50 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Calendar size={14} />
                    <span>{format(new Date(treatment.created_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {treatment.treatment_types?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {treatment.treatment_types.map((type) => (
                      <Badge 
                        key={type}
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 text-xs"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                {treatment.notes && (
                  <p className="text-stone-600 text-sm line-clamp-3">
                    {treatment.notes}
                  </p>
                )}

                {treatment.photo_urls?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {treatment.photo_urls.slice(0, 3).map((url, i) => (
                      <img 
                        key={i}
                        src={url}
                        alt={`Treatment photo ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ))}
                    {treatment.photo_urls.length > 3 && (
                      <div className="w-16 h-16 bg-stone-200 rounded-lg flex items-center justify-center text-stone-500 text-sm">
                        +{treatment.photo_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}