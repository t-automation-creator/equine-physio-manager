import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, User as UserIcon, Mail, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';

export default function Profile() {
  const queryClient = useQueryClient();
  const [homeAddress, setHomeAddress] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user?.home_address) {
      setHomeAddress(user.home_address);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ home_address: homeAddress });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title="Profile Settings"
        subtitle="Manage your account information"
      />

      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-800 mb-4">Account Details</h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 flex items-center gap-2 text-stone-600">
                <UserIcon size={16} />
                Full Name
              </Label>
              <Input
                value={user?.full_name || ''}
                disabled
                className="rounded-xl bg-stone-50"
              />
            </div>
            <div>
              <Label className="mb-2 flex items-center gap-2 text-stone-600">
                <Mail size={16} />
                Email
              </Label>
              <Input
                value={user?.email || ''}
                disabled
                className="rounded-xl bg-stone-50"
              />
            </div>
          </div>
        </div>

        {/* Home Address */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600" />
                Home/Business Address
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                Used as your starting point for route planning and travel calculations
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Address</Label>
              <Input
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter your home or business address..."
                className="rounded-xl"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !homeAddress}
              className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12"
            >
              {updateMutation.isPending ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}