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
  Square,
  User,
  Clock,
  ChevronDown
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
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const { data: owner } = useQuery({
    queryKey: ['client', horse?.owner_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: horse.owner_id });
      return clients[0];
    },
    enabled: !!horse?.owner_id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lastTreatment } = useQuery({
    queryKey: ['lastTreatment', horseId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Treatment', query: { horse_id: horseId } });
      const allTreatments = response.data.data;
      const completed = allTreatments.filter(t => t.status === 'completed' && t.id !== existingTreatment?.id);
      if (completed.length === 0) return null;
      return completed.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    },
    enabled: !!horseId && !!user,
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
    onMutate: async (newData) => {
      // Optimistic update - immediately update UI without waiting for server
      await queryClient.cancelQueries(['treatment', appointmentId, horseId]);
      
      const previousTreatment = queryClient.getQueryData(['treatment', appointmentId, horseId]);
      
      if (existingTreatment) {
        queryClient.setQueryData(['treatment', appointmentId, horseId], {
          ...existingTreatment,
          ...newData,
        });
      }
      
      return { previousTreatment };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousTreatment) {
        queryClient.setQueryData(
          ['treatment', appointmentId, horseId],
          context.previousTreatment
        );
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
        onSettled: () => {
          // Delay hiding saving indicator to give user feedback
          setTimeout(() => setSaving(false), 300);
        },
      });
    }, 1500), // Increased debounce to reduce API calls
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

  // OpenAI Whisper API for reliable audio transcription
  // Works on all browsers and devices
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setTranscribing(true);
        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          await new Promise((resolve) => {
            reader.onloadend = resolve;
          });
          const base64Audio = reader.result.split(',')[1];

          // Call Base44 serverless function to transcribe via OpenAI Whisper
          const result = await base44.functions.transcribeAudio({ audioBlob: base64Audio });

          if (!result || result.error) {
            throw new Error(result?.error || 'Transcription failed');
          }

          const { text } = result;
          const transcribedText = text || '';
          const newNotes = notes ? `${notes}\n\n${transcribedText}` : transcribedText;
          setNotes(newNotes);

          autoSave({
            notes: newNotes,
            treatment_types: selectedTypes,
            follow_up_date: followUpDate,
            photo_urls: photoUrls,
          });
        } catch (error) {
          console.error('Transcription error:', error);
          alert('Failed to transcribe audio. Please try again.');
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
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
        title="Treatment Entry"
        backTo={`AppointmentDetail?id=${appointmentId}`}
      />

      {saving && (
        <div className="fixed top-20 right-4 bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 z-50 md:top-4">
          <Loader2 size={14} className="animate-spin" />
          Saving...
        </div>
      )}

      {/* Horse Context Banner - Always Visible */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 mb-6 text-white shadow-lg border-4 border-emerald-800">
        <div className="flex items-center gap-4 mb-3">
          {horse?.photo_url && (
            <img 
              src={horse.photo_url} 
              alt={horse.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white/30"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{horse?.name || 'Loading...'}</h2>
            <div className="flex items-center gap-2 text-emerald-100">
              <User size={16} />
              <span className="font-medium">{owner?.name || 'Loading owner...'}</span>
            </div>
          </div>
        </div>
        <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
          <p className="text-sm font-semibold text-center">
            ✓ You are treating {horse?.name}
          </p>
        </div>
      </div>

      {/* Last Treatment History - Collapsed */}
      {lastTreatment && (
        <details className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6">
          <summary className="font-semibold text-amber-900 cursor-pointer list-none flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Last Treatment History</span>
            </div>
            <ChevronDown size={18} className="text-amber-600" />
          </summary>
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-sm text-amber-800 mb-2">
              <strong>Date:</strong> {new Date(lastTreatment.created_date).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            {lastTreatment.notes && (
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <p className="text-sm text-stone-700">
                  {lastTreatment.notes.substring(0, 200)}
                  {lastTreatment.notes.length > 200 ? '...' : ''}
                </p>
              </div>
            )}
          </div>
        </details>
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
                flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all min-h-[44px]
                ${recording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : transcribing
                  ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }
              `}
            >
              {transcribing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-base">Transcribing...</span>
                </>
              ) : recording ? (
                <>
                  <Square size={20} fill="currentColor" />
                  <span className="text-base">Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  <span className="text-base">Voice Note</span>
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