import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  FileJson,
  Users,
  Calendar,
  Stethoscope,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';

export default function AdminImport() {
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [idMaps, setIdMaps] = useState({
    clientIdMap: {},
    horseIdMap: {},
    appointmentTypeIdMap: {},
    appointmentIdMap: {}
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const steps = [
    { name: 'Appointment Types', icon: Calendar, key: 'appointment_types' },
    { name: 'Clients', icon: Users, key: 'clients' },
    { name: 'Horses', icon: Stethoscope, key: 'horses' },
    { name: 'Appointments', icon: Calendar, key: 'appointments' },
    { name: 'Treatments', icon: Stethoscope, key: 'treatments' },
    { name: 'Settings', icon: Settings, key: 'settings' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(event.target.result);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const runImport = async () => {
    if (!importData) {
      setError('Please paste or upload the import data first');
      return;
    }

    let data;
    try {
      data = JSON.parse(importData);
    } catch (e) {
      setError('Invalid JSON data');
      return;
    }

    setImporting(true);
    setError(null);
    setResults([]);
    setCurrentStep(0);

    const newIdMaps = { ...idMaps };

    try {
      // Step 1: Import Appointment Types
      setCurrentStep(1);
      if (data.appointment_types?.length > 0) {
        const result = await base44.functions.invoke('importClinikoData', {
          action: 'import_appointment_types',
          data: data.appointment_types
        });
        newIdMaps.appointmentTypeIdMap = result.data.idMap || {};
        setResults(prev => [...prev, { step: 'Appointment Types', success: true, count: result.data.imported }]);
      } else {
        setResults(prev => [...prev, { step: 'Appointment Types', success: true, count: 0, skipped: true }]);
      }

      // Step 2: Import Clients
      setCurrentStep(2);
      if (data.clients?.length > 0) {
        const result = await base44.functions.invoke('importClinikoData', {
          action: 'import_clients',
          data: data.clients
        });
        newIdMaps.clientIdMap = result.data.idMap || {};
        setResults(prev => [...prev, { step: 'Clients', success: true, count: result.data.imported }]);
      } else {
        setResults(prev => [...prev, { step: 'Clients', success: true, count: 0, skipped: true }]);
      }

      // Step 3: Import Horses
      setCurrentStep(3);
      if (data.horses?.length > 0) {
        const result = await base44.functions.invoke('importClinikoData', {
          action: 'import_horses',
          data: {
            horses: data.horses,
            clientIdMap: newIdMaps.clientIdMap
          }
        });
        newIdMaps.horseIdMap = result.data.idMap || {};
        setResults(prev => [...prev, { step: 'Horses', success: true, count: result.data.imported }]);
      } else {
        setResults(prev => [...prev, { step: 'Horses', success: true, count: 0, skipped: true }]);
      }

      // Step 4: Import Appointments
      setCurrentStep(4);
      if (data.appointments?.length > 0) {
        const result = await base44.functions.invoke('importClinikoData', {
          action: 'import_appointments',
          data: {
            appointments: data.appointments,
            clientIdMap: newIdMaps.clientIdMap,
            horseIdMap: newIdMaps.horseIdMap,
            appointmentTypeIdMap: newIdMaps.appointmentTypeIdMap
          }
        });
        newIdMaps.appointmentIdMap = result.data.idMap || {};
        setResults(prev => [...prev, { step: 'Appointments', success: true, count: result.data.imported }]);
      } else {
        setResults(prev => [...prev, { step: 'Appointments', success: true, count: 0, skipped: true }]);
      }

      // Step 5: Import Treatments
      setCurrentStep(5);
      if (data.treatments?.length > 0) {
        const result = await base44.functions.invoke('importClinikoData', {
          action: 'import_treatments',
          data: {
            treatments: data.treatments,
            horseIdMap: newIdMaps.horseIdMap
          }
        });
        setResults(prev => [...prev, { step: 'Treatments', success: true, count: result.data.imported }]);
      } else {
        setResults(prev => [...prev, { step: 'Treatments', success: true, count: 0, skipped: true }]);
      }

      // Step 6: Import Settings
      setCurrentStep(6);
      if (data.settings) {
        const result = await base44.functions.invoke('importClinikoData', {
          action: 'import_settings',
          data: data.settings
        });
        setResults(prev => [...prev, { step: 'Settings', success: true, count: 1 }]);
      } else {
        setResults(prev => [...prev, { step: 'Settings', success: true, count: 0, skipped: true }]);
      }

      setIdMaps(newIdMaps);
      setCurrentStep(7); // Complete

    } catch (err) {
      setError(err.message || 'Import failed');
      setResults(prev => [...prev, { step: steps[currentStep - 1]?.name || 'Unknown', success: false, error: err.message }]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="Import Cliniko Data"
        backTo="Settings"
      />

      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-blue-600" size={24} />
            <div>
              <p className="font-semibold text-blue-900">Importing as: {user?.email}</p>
              <p className="text-sm text-blue-700">All imported data will be assigned to this account</p>
            </div>
          </div>
        </div>

        {/* Data Input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-base font-bold text-gray-900 mb-4 block">
            Import Data
          </Label>
          
          <div className="space-y-4">
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-cvs-blue hover:bg-blue-50 transition-colors">
                <FileJson size={24} className="text-gray-400" />
                <span className="text-gray-600 font-medium">
                  Upload physio_app_import.json
                </span>
              </div>
            </label>

            <div className="text-center text-gray-500">or paste JSON below</div>

            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='Paste the contents of physio_app_import.json here...'
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </div>

        {/* Import Progress */}
        {(importing || results.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Import Progress</h3>
            
            <div className="space-y-3">
              {steps.map((step, index) => {
                const result = results.find(r => r.step === step.name);
                const isActive = currentStep === index + 1;
                const isComplete = currentStep > index + 1 || result;
                const Icon = step.icon;

                return (
                  <div 
                    key={step.key}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-colors
                      ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
                      ${isComplete && result?.success ? 'bg-green-50' : ''}
                      ${result && !result.success ? 'bg-red-50' : ''}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-blue-100' : 'bg-gray-100'}
                      ${isComplete && result?.success ? 'bg-green-100' : ''}
                      ${result && !result.success ? 'bg-red-100' : ''}
                    `}>
                      {isActive && importing ? (
                        <Loader2 size={20} className="animate-spin text-blue-600" />
                      ) : result?.success ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : result && !result.success ? (
                        <XCircle size={20} className="text-red-600" />
                      ) : (
                        <Icon size={20} className="text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{step.name}</p>
                      {result && (
                        <p className="text-sm text-gray-500">
                          {result.skipped ? 'Skipped (no data)' : 
                           result.success ? `Imported ${result.count} records` : 
                           result.error}
                        </p>
                      )}
                    </div>

                    {isComplete && <ChevronRight size={18} className="text-gray-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-600" size={24} />
              <div>
                <p className="font-semibold text-red-900">Import Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {currentStep === 7 && !error && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="font-semibold text-green-900">Import Complete!</p>
                <p className="text-sm text-green-700">All Cliniko data has been imported successfully</p>
              </div>
            </div>
          </div>
        )}

        {/* Cleanup Button */}
        <Button 
          onClick={async () => {
            if (!confirm('This will DELETE ALL data and re-import fresh. Continue?')) return;
            setImporting(true);
            setError(null);
            try {
              const result = await base44.functions.invoke('cleanupAndReimport', {});
              alert('Cleanup complete. Now paste your import data and click Import.');
              setImporting(false);
            } catch (err) {
              setError(err.message);
              setImporting(false);
            }
          }}
          disabled={importing}
          className="w-full"
          size="lg"
          variant="destructive"
        >
          {importing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processing...
            </>
          ) : (
            'Step 1: Delete All & Clean'
          )}
        </Button>

        {/* Import Button */}
        <Button 
          onClick={runImport}
          disabled={!importData || importing}
          className="w-full"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload size={20} />
              Step 2: Start Import
            </>
          )}
        </Button>
      </div>
    </div>
  );
}