import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { debounce } from 'lodash';
import { 
  Camera, 
  Save, 
  Check, 
  Upload,
  X,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '../components/ui/PageHeader';

const TREATMENT_TYPES = [
  'Massage',
  'Stretching',
  'Electrotherapy',
  'Laser Therapy',
  'Ultrasound',
  'Heat Treatment',
  'Cold Therapy',
  'Mobilisation',
  'Exercise Prescription',
  'Taping',
];

export default function TreatmentEntry() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointmentId');
  const horseId = urlParams.get('horseId');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [notes, setNotes] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: horse } = useQuery({
    queryKey: ['horse', horseId],
    queryFn: async () => {
      const horses = await base44.entities.Horse.filter({ id: horseId });
      return horses[0];
    },
    enabled: !!horseId,
  });

  const { data: existingTreatment, isLoading: loadingTreatment } = useQuery({
    queryKey: ['treatment', appointmentId, horseId],
    queryFn: async () => {
      const treatments = await base44.entities.Treatment.filter({ 
        appointment_id: appointmentId,
        horse_id: horseId 
      });
      return treatments[0];
    },
    enabled: !!appointmentId && !!horseId,
  });

  useEffect(() => {
    if (existingTreatment) {
      setNotes(existingTreatment.notes || '');
      setSelectedTypes(existingTreatment.treatment_types || []);
      setFollowUpDate(existingTreatment.follow_up_date || '');
      setPhotoUrls(existingTreatment.photo_urls || []);
    }
  }, [existingTreatment]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingTreatment) {
        return base44.entities.Treatment.update(existingTreatment.id, data);
      } else {
        return base44.entities.Treatment.create({
          ...data,
          horse_id: horseId,
          appointment_id: appointmentId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['treatment', appointmentId, horseId]);
      queryClient.invalidateQueries(['treatments']);
    },
  });

  const autoSave = useCallback(
    debounce((data) => {
      setSaving(true);
      saveMutation.mutate({
        ...data,
        status: 'in_progress',
      }, {
        onSettled: () => setSaving(false),
      });
    }, 1000),
    [existingTreatment]
  );

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    autoSave({
      notes: newNotes,
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
    });
  };

  const handleTypeToggle = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    autoSave({
      notes,
      treatment_types: newTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newPhotos = [...photoUrls, file_url];
    setPhotoUrls(newPhotos);
    setUploading(false);

    autoSave({
      notes,
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: newPhotos,
    });
  };

  const removePhoto = (index) => {
    const newPhotos = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(newPhotos);
    autoSave({
      notes,
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: newPhotos,
    });
  };

  const handleFinish = async () => {
    await saveMutation.mutateAsync({
      notes,
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
      status: 'completed',
    });
    navigate(createPageUrl(`TreatmentSummary?appointmentId=${appointmentId}&horseId=${horseId}`));
  };

  if (loadingTreatment) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title={horse?.name || 'Treatment'}
        subtitle="Treatment Notes"
        backTo={`AppointmentDetail?id=${appointmentId}`}
      />

      {saving && (
        <div className="fixed top-20 right-4 bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 z-50 md:top-4">
          <Loader2 size={14} className="animate-spin" />
          Saving...
        </div>
      )}

      <div className="space-y-6">
        {/* Treatment Types */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">
            Treatment Types
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {TREATMENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                  ${selectedTypes.includes(type)
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }
                `}
              >
                <Checkbox 
                  checked={selectedTypes.includes(type)}
                  className="data-[state=checked]:bg-emerald-600"
                />
                <span className="text-sm font-medium">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">
            Treatment Notes
          </Label>
          <Textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Enter treatment notes, observations, and recommendations..."
            className="min-h-[200px] rounded-xl border-stone-200 text-base"
          />
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">
            Photos
          </Label>
          
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={url} 
                    alt={`Treatment photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className={`
              flex items-center justify-center gap-2 p-4 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer
              hover:border-emerald-500 hover:bg-emerald-50 transition-colors
              ${uploading ? 'opacity-50' : ''}
            `}>
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-emerald-600" />
              ) : (
                <Camera size={20} className="text-stone-500" />
              )}
              <span className="text-stone-600 font-medium">
                {uploading ? 'Uploading...' : 'Add Photo'}
              </span>
            </div>
          </label>
        </div>

        {/* Follow-up Date */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-4 block">
            Suggested Follow-up
          </Label>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-stone-400" />
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => {
                setFollowUpDate(e.target.value);
                autoSave({
                  notes,
                  treatment_types: selectedTypes,
                  follow_up_date: e.target.value,
                  photo_urls: photoUrls,
                });
              }}
              className="flex-1 rounded-xl border-stone-200"
            />
          </div>
        </div>

        {/* Finish Button */}
        <Button 
          onClick={handleFinish}
          disabled={saveMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 text-lg"
        >
          {saveMutation.isPending ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <Check size={20} className="mr-2" />
          )}
          Finish Treatment
        </Button>
      </div>
    </div>
  );
}