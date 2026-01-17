import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, User as UserIcon, Mail, Loader2, Save, ChevronRight, UserPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

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
        <Loader2 className="w-8 h-8 animate-spin text-cvs-blue" />
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
        {/* User Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Account Details</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserIcon size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{user?.full_name || 'Not set'}</p>
                </div>
              </div>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user?.email || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home Address Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cvs-green/10 rounded-lg flex items-center justify-center">
                <MapPin size={18} className="text-cvs-green" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Home/Business Address</h3>
                <p className="text-sm text-gray-500">Used for route planning and travel calculations</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <Label className="mb-2 block text-gray-700 font-medium">Address</Label>
              <Input
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter your home or business address..."
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !homeAddress}
              className="w-full"
              size="lg"
            >
              {updateMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Import Data */}
        <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Upload size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Import Data</h3>
                <p className="text-sm text-gray-600">Import data from Cliniko or other sources</p>
              </div>
            </div>
            
            <Link to={createPageUrl('AdminImport')}>
              <Button variant="outline" className="w-full" size="lg">
                Import Cliniko Data
                <ChevronRight size={18} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Only: Invite User */}
        {user?.role === 'admin' && (
          <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cvs-blue rounded-lg flex items-center justify-center">
                  <UserPlus size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Admin Tools</h3>
                  <p className="text-sm text-gray-600">Manage users and data</p>
                </div>
              </div>
              
              <Link to={createPageUrl('InviteUserSetup')}>
                <Button variant="outline" className="w-full" size="lg">
                  Invite User & Setup Data
                  <ChevronRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}