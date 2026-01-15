import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddressPrompt({ user, onDismiss }) {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      onDismiss();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ home_address: address });
  };

  if (user?.home_address) return null;

  return (
    <div className="bg-cvs-green-light rounded-2xl border border-green-200 p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-cvs-green" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              Set Your Home Address
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Help the AI assistant plan your routes by adding your starting location
            </p>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your home or business address..."
                className="flex-1"
              />
              <Button
                onClick={handleSave}
                disabled={!address || updateMutation.isPending}
                variant="success"
              >
                {updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
