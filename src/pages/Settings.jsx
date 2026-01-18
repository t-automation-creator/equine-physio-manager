import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { 
  Save, 
  Settings as SettingsIcon, 
  Upload, 
  Palette, 
  Building2, 
  Image,
  Download
} from 'lucide-react';

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



  // Export functionality
  const handleExport = async () => {
    try {
      const [clientsRes, horsesRes, appointmentsRes, treatmentsRes, appointmentTypesRes] = await Promise.all([
        base44.functions.invoke('getMyData', { entity: 'Client', query: {} }),
        base44.functions.invoke('getMyData', { entity: 'Horse', query: {} }),
        base44.functions.invoke('getMyData', { entity: 'Appointment', query: {} }),
        base44.functions.invoke('getMyData', { entity: 'Treatment', query: {} }),
        base44.functions.invoke('getMyData', { entity: 'AppointmentType', query: {} }),
      ]);

      const exportData = {
        clients: clientsRes.data.data || [],
        horses: horsesRes.data.data || [],
        appointments: appointmentsRes.data.data || [],
        treatments: treatmentsRes.data.data || [],
        appointment_types: appointmentTypesRes.data.data || [],
        settings: settings || formData,
        export_date: new Date().toISOString(),
        summary: {
          total_clients: clientsRes.data.data?.length || 0,
          total_horses: horsesRes.data.data?.length || 0,
          total_appointments: appointmentsRes.data.data?.length || 0,
          total_treatments: treatmentsRes.data.data?.length || 0,
          total_appointment_types: appointmentTypesRes.data.data?.length || 0,
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `physio_app_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data: ' + error.message);
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
        {/* Import/Export Data Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setImportExpanded(!importExpanded)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileJson size={20} className="text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Import / Export Data</h3>
                <p className="text-sm text-gray-500">Import from Cliniko or backup your data</p>
              </div>
            </div>
            {importExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {importExpanded && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-6">
              {/* Import Section */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Upload size={18} />
                  Import Data
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Import data from Cliniko or a previous backup. Upload a JSON file or paste the data below.
                </p>

                <div className="space-y-4">
                  <label className="block">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                      <FileJson size={24} className="text-gray-400" />
                      <span className="text-gray-600 font-medium">
                        {importData ? 'File loaded - Click to change' : 'Click to upload JSON file'}
                      </span>
                    </div>
                  </label>

                  <div className="text-center text-gray-400 text-sm">or paste JSON data</div>

                  <Textarea
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value);
                      setImportError(null);
                      setImportResults([]);
                      setImportComplete(false);
                    }}
                    placeholder='Paste the contents of your import file here...'
                    className="min-h-[120px] font-mono text-xs"
                  />

                  {/* Import Progress */}
                  {importResults.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {importResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-3">
                          {result.status === 'loading' ? (
                            <Loader2 size={16} className="animate-spin text-blue-600" />
                          ) : result.status === 'success' ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <XCircle size={16} className="text-red-600" />
                          )}
                          <span className="text-sm text-gray-700">
                            {result.step}
                            {result.count !== undefined && ` - ${result.count} records`}
                            {result.error && ` - ${result.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error Display */}
                  {importError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                      <XCircle className="text-red-600" size={20} />
                      <span className="text-sm text-red-700">{importError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {importComplete && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-sm text-green-700">Import completed successfully!</span>
                    </div>
                  )}

                  <Button 
                    onClick={runImport}
                    disabled={!importData || importing}
                    className="w-full"
                    variant="default"
                  >
                    {importing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Start Import
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Export Section */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Download size={18} />
                  Export Data
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Download a backup of all your data including clients, horses, appointments, and treatments.
                </p>

                <Button 
                  onClick={handleExport}
                  variant="outline"
                  className="w-full"
                >
                  <Download size={18} />
                  Download Backup
                </Button>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Import Notes:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>All imported data will be assigned to your account</li>
                    <li>Running import multiple times will create duplicate records</li>
                    <li>Supported format: Cliniko export or app backup JSON</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

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