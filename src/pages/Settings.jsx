import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { Save, Settings as SettingsIcon, Upload, Palette, Building2, Image } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    default_treatment_price: 60,
    default_travel_charge: 0,
    invoice_terms_days: 14,
    invoice_notes: '',
    bank_account_name: 'Annie McAndrew Ltd',
    bank_sort_code: '60-83-71',
    bank_account_number: '58786706',
    business_name: 'Annie McAndrew Ltd',
    business_address: 'Corner Barn, Case Lane, Hatton, Warwickshire',
    business_phone: '+44 7946854950',
    business_email: 'annievetphysio@gmail.com',
    business_registration: '15693468',
    logo_url: '',
    color_scheme: 'blue'
  });
  const [uploading, setUploading] = useState(false);

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
        bank_account_number: settings.bank_account_number || '58786706',
        business_name: settings.business_name || 'Annie McAndrew Ltd',
        business_address: settings.business_address || 'Corner Barn, Case Lane, Hatton, Warwickshire',
        business_phone: settings.business_phone || '+44 7946854950',
        business_email: settings.business_email || 'annievetphysio@gmail.com',
        business_registration: settings.business_registration || '15693468',
        logo_url: settings.logo_url || '',
        color_scheme: settings.color_scheme || 'blue'
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (error) {
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const colorSchemes = [
    { value: 'blue', label: 'Classic Blue', primary: '#0066cc', secondary: '#004999' },
    { value: 'green', label: 'Fresh Green', primary: '#059669', secondary: '#047857' },
    { value: 'purple', label: 'Professional Purple', primary: '#7c3aed', secondary: '#6d28d9' },
    { value: 'red', label: 'Bold Red', primary: '#dc2626', secondary: '#b91c1c' },
    { value: 'orange', label: 'Vibrant Orange', primary: '#ea580c', secondary: '#c2410c' },
    { value: 'teal', label: 'Modern Teal', primary: '#0d9488', secondary: '#0f766e' },
  ];

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
        {/* Business Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={20} className="text-cvs-blue" />
            <h3 className="font-bold text-gray-900">Business Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                placeholder="e.g., Annie McAndrew Ltd"
              />
            </div>

            <div>
              <Label>Business Address</Label>
              <Textarea
                value={formData.business_address}
                onChange={(e) => setFormData({...formData, business_address: e.target.value})}
                placeholder="Full business address"
                rows={2}
              />
            </div>

            <div>
              <Label>Business Email</Label>
              <Input
                type="email"
                value={formData.business_email}
                onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                placeholder="e.g., contact@yourpractice.com"
              />
            </div>

            <div>
              <Label>Business Phone</Label>
              <Input
                type="tel"
                value={formData.business_phone}
                onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                placeholder="e.g., +44 1234 567890"
              />
            </div>

            <div>
              <Label>Registration Number (optional)</Label>
              <Input
                value={formData.business_registration}
                onChange={(e) => setFormData({...formData, business_registration: e.target.value})}
                placeholder="e.g., 15693468"
              />
            </div>
          </div>
        </div>

        {/* Invoice Branding */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Image size={20} className="text-cvs-blue" />
            <h3 className="font-bold text-gray-900">Invoice Branding</h3>
          </div>
          
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label>Practice Logo</Label>
              <div className="mt-2">
                {formData.logo_url && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <img 
                      src={formData.logo_url} 
                      alt="Practice Logo" 
                      className="h-20 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Upload size={16} />
                      <span className="text-sm font-medium">
                        {uploading ? 'Uploading...' : formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </div>
                  </label>
                  {formData.logo_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({...formData, logo_url: ''})}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: PNG or JPG, max height 100px, transparent background works best
                </p>
              </div>
            </div>

            {/* Color Scheme */}
            <div>
              <Label className="flex items-center gap-2">
                <Palette size={16} />
                Invoice Color Scheme
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => setFormData({...formData, color_scheme: scheme.value})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.color_scheme === scheme.value
                        ? 'border-cvs-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: scheme.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: scheme.secondary }}
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{scheme.label}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose the primary color for your invoice headers and accents
              </p>
            </div>
          </div>
        </div>

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