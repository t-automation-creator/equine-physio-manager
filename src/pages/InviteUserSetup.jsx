import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Check, ChevronRight, Loader2, Upload, FileSpreadsheet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';

export default function InviteUserSetup() {
  const [step, setStep] = useState(1);
  const [invitedEmail, setInvitedEmail] = useState('');
  
  // Step 1: Invite form
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  
  // Step 2: Data creation
  const [clients, setClients] = useState([{ name: '', phone: '', email: '' }]);
  const [yards, setYards] = useState([{ name: '', address: '' }]);
  const [horses, setHorses] = useState([{ name: '', age: '', discipline: '', owner_name: '', yard_name: '', medical_notes: '' }]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('inviteUserWithData', {
        action: 'invite',
        email,
        role,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Invitation sent to ${email}`);
      setInvitedEmail(email);
      setStep(2);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to invite user');
    },
  });

  const createDataMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('inviteUserWithData', {
        action: 'createData',
        userEmail: invitedEmail,
        clients: clients.filter(c => c.name.trim()),
        yards: yards.filter(y => y.name.trim()),
        horses: horses.filter(h => h.name.trim()),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Data created successfully!');
      // Reset form
      setStep(1);
      setEmail('');
      setRole('user');
      setInvitedEmail('');
      setClients([{ name: '', phone: '', email: '' }]);
      setYards([{ name: '', address: '' }]);
      setHorses([{ name: '', age: '', discipline: '', owner_name: '', yard_name: '', medical_notes: '' }]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create data');
    },
  });

  const addClient = () => {
    setClients([...clients, { name: '', phone: '', email: '' }]);
  };

  const updateClient = (index, field, value) => {
    const updated = [...clients];
    updated[index][field] = value;
    setClients(updated);
  };

  const removeClient = (index) => {
    setClients(clients.filter((_, i) => i !== index));
  };

  const addYard = () => {
    setYards([...yards, { name: '', address: '' }]);
  };

  const updateYard = (index, field, value) => {
    const updated = [...yards];
    updated[index][field] = value;
    setYards(updated);
  };

  const removeYard = (index) => {
    setYards(yards.filter((_, i) => i !== index));
  };

  const addHorse = () => {
    setHorses([...horses, { name: '', age: '', discipline: '', owner_name: '', yard_name: '', medical_notes: '' }]);
  };

  const updateHorse = (index, field, value) => {
    const updated = [...horses];
    updated[index][field] = value;
    setHorses(updated);
  };

  const removeHorse = (index) => {
    setHorses(horses.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Define schema based on type
      const schema = type === 'clients'
        ? {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        : type === 'yards'
        ? {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { type: 'string' }
              }
            }
          }
        : {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'string' },
                discipline: { type: 'string' },
                owner_name: { type: 'string' },
                yard_name: { type: 'string' },
                medical_notes: { type: 'string' }
              }
            }
          };

      // Extract data
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === 'success' && result.output) {
        if (type === 'clients') {
          setClients(result.output);
          toast.success(`Loaded ${result.output.length} clients`);
        } else if (type === 'yards') {
          setYards(result.output);
          toast.success(`Loaded ${result.output.length} yards`);
        } else {
          setHorses(result.output);
          toast.success(`Loaded ${result.output.length} horses`);
        }
      } else {
        toast.error(result.details || 'Failed to parse file');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Only admins can access this page</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Invite User & Setup Data"
        subtitle="Invite a user and pre-load their data"
        backTo="Home"
      />

      {step === 1 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cvs-blue rounded-full flex items-center justify-center">
              <UserPlus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Step 1: Invite User</h2>
              <p className="text-sm text-gray-500">Send an invitation email</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!email || inviteMutation.isPending}
              className="w-full"
              size="lg"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Send Invitation
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Check size={20} className="text-green-600" />
              <p className="font-semibold text-green-900">
                Invitation sent to {invitedEmail}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-2">Step 2: Add Their Data</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <FileSpreadsheet size={18} className="text-cvs-blue mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">CSV Format:</p>
                <p className="text-blue-700">Clients: name, phone, email</p>
                <p className="text-blue-700">Yards: name, address</p>
                <p className="text-blue-700">Horses: name, age, discipline, owner_name, yard_name, medical_notes</p>
              </div>
            </div>

            {/* Clients */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-bold">Clients</Label>
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, 'clients')}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    <Button size="sm" variant="outline" asChild disabled={uploadingFile}>
                      <span>
                        {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        Upload CSV
                      </span>
                    </Button>
                  </label>
                  <Button onClick={addClient} size="sm" variant="outline">
                    Add Client
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {clients.map((client, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <Input
                      placeholder="Client Name"
                      value={client.name}
                      onChange={(e) => updateClient(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Phone"
                      value={client.phone}
                      onChange={(e) => updateClient(index, 'phone', e.target.value)}
                    />
                    <Input
                      placeholder="Email (optional)"
                      value={client.email}
                      onChange={(e) => updateClient(index, 'email', e.target.value)}
                    />
                    {clients.length > 1 && (
                      <Button
                        onClick={() => removeClient(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Yards */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-bold">Yards</Label>
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, 'yards')}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    <Button size="sm" variant="outline" asChild disabled={uploadingFile}>
                      <span>
                        {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        Upload CSV
                      </span>
                    </Button>
                  </label>
                  <Button onClick={addYard} size="sm" variant="outline">
                    Add Yard
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {yards.map((yard, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <Input
                      placeholder="Yard Name"
                      value={yard.name}
                      onChange={(e) => updateYard(index, 'name', e.target.value)}
                    />
                    <Textarea
                      placeholder="Address"
                      value={yard.address}
                      onChange={(e) => updateYard(index, 'address', e.target.value)}
                    />
                    {yards.length > 1 && (
                      <Button
                        onClick={() => removeYard(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Horses */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-bold">Horses</Label>
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, 'horses')}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    <Button size="sm" variant="outline" asChild disabled={uploadingFile}>
                      <span>
                        {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        Upload CSV
                      </span>
                    </Button>
                  </label>
                  <Button onClick={addHorse} size="sm" variant="outline">
                    Add Horse
                  </Button>
                </div>
              </div>
              {horses.map((horse, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-sm">Horse Name</Label>
                      <Input
                        value={horse.name}
                        onChange={(e) => updateHorse(index, 'name', e.target.value)}
                        placeholder="e.g., Thunder"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Age</Label>
                      <Input
                        value={horse.age}
                        onChange={(e) => updateHorse(index, 'age', e.target.value)}
                        placeholder="e.g., 8"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Discipline</Label>
                      <Input
                        value={horse.discipline}
                        onChange={(e) => updateHorse(index, 'discipline', e.target.value)}
                        placeholder="e.g., Dressage"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Owner Name</Label>
                      <Input
                        value={horse.owner_name}
                        onChange={(e) => updateHorse(index, 'owner_name', e.target.value)}
                        placeholder="Match client name"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Yard Name</Label>
                      <Input
                        value={horse.yard_name}
                        onChange={(e) => updateHorse(index, 'yard_name', e.target.value)}
                        placeholder="Match yard name"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <Label className="text-sm">Medical Notes</Label>
                    <Textarea
                      value={horse.medical_notes}
                      onChange={(e) => updateHorse(index, 'medical_notes', e.target.value)}
                      placeholder="Any medical history..."
                      rows={2}
                    />
                  </div>
                  {horses.length > 1 && (
                    <Button
                      onClick={() => removeHorse(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setStep(1);
                  setInvitedEmail('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createDataMutation.mutate()}
                disabled={createDataMutation.isPending}
                className="flex-1"
                size="lg"
              >
                {createDataMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Create Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}