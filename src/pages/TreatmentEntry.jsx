import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';
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
  ChevronDown,
  Plus,
  Trash2,
  MessageSquare,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const MAX_RECORDING_SECONDS = 300; // 5 minutes max

export default function TreatmentEntry() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointmentId');
  const horseId = urlParams.get('horseId');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [noteEntries, setNoteEntries] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioMimeType, setAudioMimeType] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const { data: horse } = useQuery({
    queryKey: ['horse', horseId],
    queryFn: async () => {
      const horses = await base44.entities.Horse.filter({ id: horseId });
      return horses[0];
    },
    enabled: !!horseId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: owner } = useQuery({
    queryKey: ['client', horse?.owner_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: horse.owner_id });
      return clients[0];
    },
    enabled: !!horse?.owner_id,
    staleTime: 10 * 60 * 1000,
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
      if (existingTreatment.notes) {
        try {
          const parsed = JSON.parse(existingTreatment.notes);
          if (Array.isArray(parsed)) {
            setNoteEntries(parsed);
          } else {
            setNoteEntries([{
              id: Date.now(),
              text: existingTreatment.notes,
              timestamp: existingTreatment.created_date || new Date().toISOString(),
              type: 'typed'
            }]);
          }
        } catch {
          setNoteEntries([{
            id: Date.now(),
            text: existingTreatment.notes,
            timestamp: existingTreatment.created_date || new Date().toISOString(),
            type: 'typed'
          }]);
        }
      }
      setSelectedTypes(existingTreatment.treatment_types || []);
      setFollowUpDate(existingTreatment.follow_up_date || '');
      setPhotoUrls(existingTreatment.photo_urls || []);
    }
  }, [existingTreatment]);

  const serializedNotes = useMemo(() => {
    if (noteEntries.length === 0) return '';
    return JSON.stringify(noteEntries);
  }, [noteEntries]);

  useEffect(() => {
    return () => {
      if (mediaRecorder && recording) {
        try {
          mediaRecorder.stop();
          mediaRecorder.stream?.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('[Cleanup] Error stopping recorder:', error);
        }
      }
      if (transcribing) {
        setTranscribing(false);
      }
    };
  }, [mediaRecorder, recording, transcribing]);

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
          setTimeout(() => setSaving(false), 300);
        },
      });
    }, 1500),
    [existingTreatment]
  );

  const addTypedNote = () => {
    if (!currentNote.trim()) return;
    
    const newEntry = {
      id: Date.now(),
      text: currentNote.trim(),
      timestamp: new Date().toISOString(),
      type: 'typed'
    };
    
    const newEntries = [...noteEntries, newEntry];
    setNoteEntries(newEntries);
    setCurrentNote('');
    
    autoSave({
      notes: JSON.stringify(newEntries),
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
    });
    
    toast.success('Note added', { duration: 1500 });
  };

  const addVoiceNote = (transcribedText) => {
    const newEntry = {
      id: Date.now(),
      text: transcribedText,
      timestamp: new Date().toISOString(),
      type: 'voice'
    };
    
    const newEntries = [...noteEntries, newEntry];
    setNoteEntries(newEntries);
    
    autoSave({
      notes: JSON.stringify(newEntries),
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
    });
  };

  const requestDeleteNote = (id) => {
    setNoteToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteNote = () => {
    if (!noteToDelete) return;
    
    const newEntries = noteEntries.filter(entry => entry.id !== noteToDelete);
    setNoteEntries(newEntries);
    
    autoSave({
      notes: newEntries.length > 0 ? JSON.stringify(newEntries) : '',
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
    });
    
    toast.success('Note deleted', { duration: 1500 });
    setDeleteConfirmOpen(false);
    setNoteToDelete(null);
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    }
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    }) + ` at ${timeStr}`;
  };

  const handleTypeToggle = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    autoSave({
      notes: serializedNotes,
      treatment_types: newTypes,
      follow_up_date: followUpDate,
      photo_urls: photoUrls,
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newUrls = [...photoUrls, file_url];
      setPhotoUrls(newUrls);
      autoSave({
        notes: serializedNotes,
        treatment_types: selectedTypes,
        follow_up_date: followUpDate,
        photo_urls: newUrls,
      });
    } catch (error) {
      toast.error('Failed to upload photo');
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    const newUrls = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(newUrls);
    autoSave({
      notes: serializedNotes,
      treatment_types: selectedTypes,
      follow_up_date: followUpDate,
      photo_urls: newUrls,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      setAudioMimeType(selectedMimeType);
      
      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      
      setRecordingDuration(0);
      const durationInterval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            recorder.stop();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(durationInterval);
        stream.getTracks().forEach(track => track.stop());
        
        if (chunks.length === 0) {
          toast.error('No audio recorded');
          return;
        }
        
        setTranscribing(true);
        
        try {
          const actualMimeType = recorder.mimeType || selectedMimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: actualMimeType });

          // Convert blob to base64 for the custom transcribeAudio function
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const audioBlob = await base64Promise;

          /**
           * ⚠️ CRITICAL - DO NOT MODIFY THIS TRANSCRIPTION CODE ⚠️
           *
           * This uses a CUSTOM Deno function (functions/transcribeAudio.ts) that calls
           * OpenAI Whisper directly. DO NOT replace with base44.integrations.Core.Transcribe
           * as that integration is not available and will return 404.
           *
           * Correct: base44.functions.invoke('transcribeAudio', {...})
           * Wrong:   base44.integrations.Core.Transcribe({...})
           */
          const response = await base44.functions.invoke('transcribeAudio', {
            audioBlob,
            mimeType: actualMimeType,
          });
          const result = response.data;

          if (result.text && result.text.trim()) {
            addVoiceNote(result.text.trim());
            toast.success('Voice note added!', { duration: 2000 });
          } else {
            toast.error('No speech detected. Please try again.', { duration: 3000 });
          }
        } catch (error) {
          console.error('Transcription error:', error);
          const errorMsg = error.message || error.error || 'Unknown error';
          if (error.status === 429 || errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit')) {
            toast.error('Rate limit reached. Please wait 1 minute and try again.', { duration: 5000 });
          } else {
            toast.error(`Transcription failed: ${errorMsg}`, { duration: 4000 });
          }
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
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
      notes: serializedNotes,
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
        <Loader2 className="w-8 h-8 animate-spin text-cvs-blue" />
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
        <div className="fixed top-20 right-4 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 z-50 md:top-4">
          <Loader2 size={14} className="animate-spin" />
          Saving...
        </div>
      )}

      {/* Horse Context Banner */}
      <div className="bg-gradient-to-br from-cvs-blue to-blue-700 rounded-2xl p-6 mb-6 text-white shadow-lg border-4 border-blue-800">
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
            <div className="flex items-center gap-2 text-blue-100">
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

      {/* Last Treatment History */}
      {lastTreatment && (
        <details className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6">
          <summary className="font-bold text-amber-900 cursor-pointer list-none flex items-center justify-between">
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
                <p className="text-sm text-gray-700">
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
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-bold text-gray-900">
              Notes
            </Label>
          </div>

          {/* Voice Recording Button */}
          <div className="mb-4">
            {transcribing ? (
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-100 rounded-xl border-2 border-gray-200">
                <Loader2 size={24} className="animate-spin text-cvs-blue" />
                <div className="text-center">
                  <p className="font-bold text-gray-900">Transcribing...</p>
                  <p className="text-sm text-gray-500">This may take a moment</p>
                </div>
              </div>
            ) : recording ? (
              <button
                onClick={stopRecording}
                className="w-full flex flex-col items-center gap-3 p-5 bg-red-50 rounded-xl border-2 border-red-200 transition-all active:scale-[0.98]"
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-cvs-red rounded-full flex items-center justify-center shadow-lg">
                    <Square size={28} fill="white" className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 bg-red-400 rounded-full animate-ping opacity-30" />
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-cvs-red font-mono">
                    {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                  </p>
                  <p className="text-sm font-medium text-red-500 mt-1">
                    Tap to stop recording
                  </p>
                </div>
                
                <div className="w-full bg-red-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-cvs-red h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(recordingDuration / MAX_RECORDING_SECONDS) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-red-400">
                  Max {MAX_RECORDING_SECONDS / 60} minutes
                </p>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-cvs-blue rounded-full flex items-center justify-center shadow-md">
                  <Mic size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Record Voice Note</p>
                  <p className="text-sm text-cvs-blue">Tap to start recording</p>
                </div>
              </button>
            )}
          </div>

          {/* Existing Note Entries */}
          {noteEntries.length > 0 && (
            <div className="space-y-3 mb-4">
              {noteEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={`p-3 rounded-xl border-2 ${
                    entry.type === 'voice' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {entry.type === 'voice' ? (
                        <Mic size={12} className="text-cvs-blue" />
                      ) : (
                        <Keyboard size={12} className="text-gray-400" />
                      )}
                      <span className="font-medium">
                        {entry.type === 'voice' ? 'Voice' : 'Typed'}
                      </span>
                      <span>•</span>
                      <span>{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => requestDeleteNote(entry.id)}
                      className="p-1 text-gray-400 hover:text-cvs-red transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add New Note Input */}
          <div className="space-y-2">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Type your observation here..."
              className="min-h-[80px] text-base"
            />
            <button
              onClick={addTypedNote}
              disabled={!currentNote.trim()}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-full font-semibold transition-all ${
                currentNote.trim()
                  ? 'bg-gray-800 text-white hover:bg-gray-900 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus size={18} />
              Add Note
            </button>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-base font-bold text-gray-900 mb-3 block">
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
                    className="absolute -top-2 -right-2 w-6 h-6 bg-cvs-red text-white rounded-full flex items-center justify-center"
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
              flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer
              hover:border-cvs-blue hover:bg-blue-50 transition-colors
              ${uploading ? 'opacity-50' : ''}
            `}>
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-cvs-blue" />
              ) : (
                <Camera size={20} className="text-gray-500" />
              )}
              <span className="text-gray-600 font-medium">
                {uploading ? 'Uploading...' : 'Add Photo'}
              </span>
            </div>
          </label>
        </div>

        {/* Treatment Types - Optional */}
        <details className="bg-white rounded-2xl border border-gray-200 p-5">
          <summary className="text-base font-bold text-gray-900 cursor-pointer list-none">
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
                    ? 'border-cvs-blue bg-blue-50 text-cvs-blue'
                    : 'border-gray-200 text-gray-600'
                  }
                `}
              >
                <Checkbox 
                  checked={selectedTypes.includes(type)}
                  className="data-[state=checked]:bg-cvs-blue data-[state=checked]:border-cvs-blue"
                />
                <span className="text-sm font-medium">{type}</span>
              </button>
            ))}
          </div>
        </details>

        {/* Follow-up Date - Optional */}
        <details className="bg-white rounded-2xl border border-gray-200 p-5">
          <summary className="text-base font-bold text-gray-900 cursor-pointer list-none">
            Follow-up Date (optional)
          </summary>
          <div className="flex items-center gap-3 mt-4">
            <Calendar size={20} className="text-gray-400" />
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => {
                setFollowUpDate(e.target.value);
                autoSave({
                  notes: serializedNotes,
                  treatment_types: selectedTypes,
                  follow_up_date: e.target.value,
                  photo_urls: photoUrls,
                });
              }}
              className="flex-1"
            />
          </div>
        </details>
      </div>

      {/* Fixed Finish Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent md:relative md:bottom-0 md:mt-6 md:bg-none">
        <Button 
          onClick={handleFinish}
          disabled={saveMutation.isPending}
          className="w-full max-w-4xl mx-auto shadow-lg"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Check size={20} />
          )}
          Finish Treatment
        </Button>
      </div>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setNoteToDelete(null)}
              className="rounded-full"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteNote}
              className="bg-cvs-red hover:bg-red-700 rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}