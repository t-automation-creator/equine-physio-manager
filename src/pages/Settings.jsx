import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    default_treatment_price: 60,
    default_travel_charge: 0,
    invoice_terms_days: 14,
    invoice_notes: '',
    bank_account_name: 'Annie McAndrew Ltd',
    bank_sort_code: '60-83-71',
    bank_account_number: '58786706'
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { 
        entity: 'Settings', 
        query: {} 
      });
      const settingsData = response.data.data;
      if (settingsData.length === 0) {
        return null;
      }
      return settingsData[0];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        default_treatment_price: settings.default_treatment_price || 60,
        default_travel_charge: settings.default_travel_charge || 0,
        invoice_terms_days: settings.invoice_terms_days || 14,
        invoice_notes: settings.invoice_notes || '',
        bank_account_name: settings.bank_account_name || 'Annie McAndrew Ltd',
        bank_sort_code: settings.bank_sort_code || '60-83-71',
        bank_account_number: settings.bank_account_number || '58786706'
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.Settings.update(settings.id, data);
      } else {
        return base44.entities.Settings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      alert('Settings saved successfully');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title="Practice Settings"
        subtitle="Configure your practice defaults and billing information"
      />

      <div className="space-y-6">
        {/* Pricing Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon size={20} className="text-cvs-blue" />
            <h3 className="font-bold text-gray-900">Default Pricing</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Default Treatment Price (£)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.default_treatment_price}
                onChange={(e) => setFormData({...formData, default_treatment_price: parseFloat(e.target.value) || 0})}
              />
              <p className="text-xs text-gray-500 mt-1">Price per horse treatment</p>
            </div>

            <div>
              <Label>Default Travel Charge (£)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.default_travel_charge}
                onChange={(e) => setFormData({...formData, default_travel_charge: parseFloat(e.target.value) || 0})}
              />
              <p className="text-xs text-gray-500 mt-1">Call-out charge (set to 0 for none)</p>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-5">Invoice Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Payment Terms (Days)</Label>
              <Input
                type="number"
                min="0"
                value={formData.invoice_terms_days}
                onChange={(e) => setFormData({...formData, invoice_terms_days: parseInt(e.target.value) || 0})}
              />
              <p className="text-xs text-gray-500 mt-1">Default days until payment is due</p>
            </div>

            <div>
              <Label>Invoice Notes</Label>
              <Textarea
                value={formData.invoice_notes}
                onChange={(e) => setFormData({...formData, invoice_notes: e.target.value})}
                placeholder="Add default notes that appear on all invoices..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Optional footer text for invoices</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-5">Bank Account Details</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={formData.bank_account_name}
                onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
                placeholder="e.g., Annie McAndrew Ltd"
              />
            </div>

            <div>
              <Label>Sort Code</Label>
              <Input
                value={formData.bank_sort_code}
                onChange={(e) => setFormData({...formData, bank_sort_code: e.target.value})}
                placeholder="e.g., 60-83-71"
              />
            </div>

            <div>
              <Label>Account Number</Label>
              <Input
                value={formData.bank_account_number}
                onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                placeholder="e.g., 58786706"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full"
          size="lg"
        >
          <Save size={20} />
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}