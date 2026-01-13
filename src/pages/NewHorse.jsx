import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Check, Loader2, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/ui/PageHeader';

const DISCIPLINES = [
  'Dressage',
  'Show Jumping',
  'Eventing',
  'Endurance',
  'Western',
  'Polo',
  'Racing',
  'Leisure',
  'Breeding',
  'Other',
];

export default function NewHorse() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedOwnerId = urlParams.get('ownerId');
  const preselectedYardId = urlParams.get('yardId');
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [ownerId, setOwnerId] = useState(preselectedOwnerId || '');
  const [yardId, setYardId] = useState(preselectedYardId || '');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMyData', { entity: 'Client', query: {} });
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    enabled: !!user,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMyData', { entity: 'Yard', query: {} });
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Horse.create(data),
    onSuccess: (data) => {
      navigate(createPageUrl(`HorseDetail?id=${data.id}`));
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      name,
      age: age ? parseInt(age) : null,
      discipline,
      owner_id: ownerId,
      yard_id: yardId || null,
      medical_notes: medicalNotes,
      photo_url: photoUrl,
    });
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="New Horse"
        backTo={preselectedOwnerId ? `ClientDetail?id=${preselectedOwnerId}` : 'Clients'}
      />

      <div className="space-y-6">
        {/* Photo */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="mb-4 block">Photo</Label>
          
          {photoUrl ? (
            <div className="relative">
              <img 
                src={photoUrl} 
                alt="Horse"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={() => setPhotoUrl('')}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className={`
                flex items-center justify-center gap-2 p-8 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer
                hover:border-emerald-500 hover:bg-emerald-50 transition-colors
                ${uploading ? 'opacity-50' : ''}
              `}>
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                ) : (
                  <Camera size={24} className="text-stone-400" />
                )}
                <span className="text-stone-600 font-medium">
                  {uploading ? 'Uploading...' : 'Add Photo'}
                </span>
              </div>
            </label>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Horse name"
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Age (years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="rounded-xl h-12"
                />
              </div>

              <div>
                <Label className="mb-2 block">Discipline</Label>
                <Select value={discipline} onValueChange={setDiscipline}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Owner & Yard */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Owner *</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Stable</Label>
              <Select value={yardId} onValueChange={setYardId}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select stable" />
                </SelectTrigger>
                <SelectContent>
                  {yards.map((yard) => (
                    <SelectItem key={yard.id} value={yard.id}>
                      {yard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Medical Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="mb-3 block">Medical Notes</Label>
          <Textarea
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Any medical history, conditions, or notes..."
            className="rounded-xl min-h-[120px]"
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!name || !ownerId || createMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 text-lg"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <Check size={20} className="mr-2" />
          )}
          Add Horse
        </Button>
      </div>
    </div>
  );
}