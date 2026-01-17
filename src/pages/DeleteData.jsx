import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';
import { Trash2, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function DeleteData() {
  const [targetEmail, setTargetEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const handleDelete = async () => {
    if (!targetEmail) {
      setError('Please enter an email address');
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL data for ${targetEmail}? This cannot be undone!`)) {
      return;
    }

    setDeleting(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('deleteAllData', { targetEmail });
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to delete data');
    } finally {
      setDeleting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="pb-6">
        <PageHeader title="Delete Data" backTo="Settings" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h3 className="font-bold text-red-800 mb-2">Admin Access Required</h3>
          <p className="text-red-600 text-sm">Only administrators can delete user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title="Delete All Data"
        subtitle="Remove all data for a specific user"
        backTo="Settings"
      />

      <div className="space-y-6">
        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <p className="font-semibold text-red-900">Danger Zone</p>
              <p className="text-sm text-red-700">This action cannot be undone. All data will be permanently deleted.</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-base font-bold text-gray-900 mb-4 block">
            User Email
          </Label>
          
          <Input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="e.g., annievetphysio@gmail.com"
            className="mb-4"
          />

          <p className="text-sm text-gray-500">
            Enter the email address of the user whose data you want to delete. This will remove:
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside mt-2">
            <li>All clients, horses, yards</li>
            <li>All appointments and treatments</li>
            <li>All invoices and settings</li>
            <li>All appointment types</li>
          </ul>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="text-green-600" size={24} />
              <p className="font-semibold text-green-900">Data Deleted Successfully</p>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              {Object.entries(result.deletedCounts || {}).map(([entity, count]) => (
                <p key={entity}>• {entity}: {count} records deleted</p>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={24} />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Button */}
        <Button 
          onClick={handleDelete}
          disabled={!targetEmail || deleting}
          variant="destructive"
          className="w-full"
          size="lg"
        >
          {deleting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={20} />
              Delete All Data for {targetEmail || 'User'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}