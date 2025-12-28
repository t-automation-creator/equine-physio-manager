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
  Activity,
  Download,
  Clock,
  TrendingUp
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
      return allTreatments.filter(t => t.horse_id === horseId && t.status === 'completed');
    },
    enabled: !!horseId,
  });

  const handleExportPDF = async () => {
    const treatmentText = treatments.map((t, idx) => 
      `Treatment ${idx + 1} - ${format(new Date(t.created_date), 'dd/MM/yyyy')}
${t.treatment_types?.join(', ') || 'Physiotherapy Treatment'}
${t.notes || 'No notes'}\n`
    ).join('\n---\n\n');

    const fullReport = `TREATMENT HISTORY REPORT
Horse: ${horse.name}
Owner: ${owner?.name || 'N/A'}
Yard: ${yard?.name || 'N/A'}
Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}

Total Treatments: ${treatments.length}

${horse.medical_notes ? `Medical Notes:\n${horse.medical_notes}\n\n---\n\n` : ''}${treatmentText}`;

    const blob = new Blob([fullReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${horse.name.replace(/\s+/g, '_')}_Treatment_History.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-800">Treatment History</h3>
            <Badge className="bg-emerald-100 text-emerald-700">
              {treatments.length}
            </Badge>
          </div>
          {treatments.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              className="rounded-lg"
            >
              <Download size={16} className="mr-1" />
              Export
            </Button>
          )}
        </div>

        {treatments.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <Activity size={32} className="mx-auto mb-2 opacity-50" />
            <p>No treatments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Latest Treatment - Prominent */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                  Latest Treatment
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-emerald-800 mb-3">
                <Calendar size={16} />
                <span className="font-semibold">
                  {format(new Date(treatments[0].created_date), 'EEEE, MMMM d, yyyy')}
                </span>
                <span className="text-emerald-600 text-sm">
                  ({Math.floor((new Date() - new Date(treatments[0].created_date)) / (1000 * 60 * 60 * 24))} days ago)
                </span>
              </div>

              {treatments[0].treatment_types?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {treatments[0].treatment_types.map((type) => (
                    <Badge 
                      key={type}
                      className="bg-emerald-600 text-white"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              )}

              {treatments[0].notes && (
                <div className="bg-white rounded-xl p-4 border border-emerald-200">
                  <p className="text-stone-700 text-sm whitespace-pre-wrap">
                    {treatments[0].notes}
                  </p>
                </div>
              )}

              {treatments[0].photo_urls?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {treatments[0].photo_urls.map((url, i) => (
                    <img 
                      key={i}
                      src={url}
                      alt={`Treatment photo ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-200"
                    />
                  ))}
                </div>
              )}

              {treatments[0].follow_up_date && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Clock size={14} />
                    <span>Follow-up: {format(new Date(treatments[0].follow_up_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Treatment Timeline */}
            {treatments.length > 1 && (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-600 pt-2">
                  <Clock size={16} />
                  <span>Previous Treatments</span>
                </div>
                
                <div className="relative pl-6 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-stone-200" />
                  
                  {treatments.slice(1).map((treatment, idx) => (
                    <div key={treatment.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-3 w-4 h-4 rounded-full bg-stone-300 border-4 border-white" />
                      
                      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                        <div className="flex items-center gap-2 text-stone-600 text-sm mb-2">
                          <Calendar size={14} />
                          <span className="font-medium">
                            {format(new Date(treatment.created_date), 'MMM d, yyyy')}
                          </span>
                          <span className="text-stone-400">
                            ({Math.floor((new Date() - new Date(treatment.created_date)) / (1000 * 60 * 60 * 24))} days ago)
                          </span>
                        </div>

                        {treatment.treatment_types?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {treatment.treatment_types.map((type) => (
                              <Badge 
                                key={type}
                                variant="secondary"
                                className="bg-stone-200 text-stone-700 text-xs"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {treatment.notes && (
                          <p className="text-stone-600 text-sm line-clamp-2">
                            {treatment.notes}
                          </p>
                        )}

                        {treatment.photo_urls?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {treatment.photo_urls.slice(0, 3).map((url, i) => (
                              <img 
                                key={i}
                                src={url}
                                alt={`Treatment photo ${i + 1}`}
                                className="w-14 h-14 object-cover rounded-lg"
                              />
                            ))}
                            {treatment.photo_urls.length > 3 && (
                              <div className="w-14 h-14 bg-stone-200 rounded-lg flex items-center justify-center text-stone-500 text-xs">
                                +{treatment.photo_urls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}