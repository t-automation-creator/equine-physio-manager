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
  Loader2,
  Mic,
  Square
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
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcribing, setTranscribing] = useState(false);

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

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
      
      stream.getTracks().forEach(track => track.stop());
      
      setTranscribing(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transcribe this audio recording. Only return the transcribed text, nothing else.',
        file_urls: [file_url]
      });
      
      const transcribedText = result || '';
      const newNotes = notes ? `${notes}\n\n${transcribedText}` : transcribedText;
      setNotes(newNotes);
      setTranscribing(false);
      
      autoSave({
        notes: newNotes,
        treatment_types: selectedTypes,
        follow_up_date: followUpDate,
        photo_urls: photoUrls,
      });
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
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
    <div className="pb-24 md:pb-6 max-h-screen overflow-y-auto">
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

      <div className="space-y-4">
        {/* Notes - Primary Input */}
        <div className="bg-white rounded-2xl border-2 border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-lg font-semibold text-stone-800">
              Notes
            </Label>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                ${recording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : transcribing
                  ? 'bg-stone-300 text-stone-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }
              `}
            >
              {transcribing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Transcribing...</span>
                </>
              ) : recording ? (
                <>
                  <Square size={18} />
                  <span className="text-sm">Stop</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span className="text-sm">Record</span>
                </>
              )}
            </button>
          </div>
          <Textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="What did you observe? What treatment was given?"
            className="min-h-[150px] rounded-xl border-stone-200 text-base"
          />
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-3 block">
            Photos (optional)
          </Label>
          
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={url} 
                    alt={`Photo ${index + 1}`}
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

        {/* Treatment Types - Optional */}
        <details className="bg-white rounded-2xl border border-stone-200 p-5">
          <summary className="text-base font-semibold text-stone-800 cursor-pointer list-none">
            Treatment Types (optional)
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {TREATMENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`
                  flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left
                  ${selectedTypes.includes(type)
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 text-stone-600'
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
        </details>

        {/* Follow-up Date - Optional */}
        <details className="bg-white rounded-2xl border border-stone-200 p-5">
          <summary className="text-base font-semibold text-stone-800 cursor-pointer list-none">
            Follow-up Date (optional)
          </summary>
          <div className="flex items-center gap-3 mt-4">
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
        </details>
      </div>

      {/* Fixed Finish Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent md:relative md:bottom-0 md:mt-6 md:bg-none">
        <Button 
          onClick={handleFinish}
          disabled={saveMutation.isPending}
          className="w-full max-w-4xl mx-auto bg-emerald-600 hover:bg-emerald-700 rounded-xl h-16 text-lg shadow-lg"
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