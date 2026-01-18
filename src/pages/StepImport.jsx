import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, Upload, FileJson } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function StepImport() {
  const [importData, setImportData] = useState('');
  const [stepType, setStepType] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Store ID maps in state to use across steps
  const [clientIdMap, setClientIdMap] = useState({});
  const [horseIdMap, setHorseIdMap] = useState({});
  const [appointmentTypeIdMap, setAppointmentTypeIdMap] = useState({});
  const [appointmentIdMap, setAppointmentIdMap] = useState({});

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(event.target.result);
        setError(null);
        setResult(null);
      };
      reader.readAsText(file);
    }
  };

  const runImport = async () => {
    if (!importData || !stepType) {
      setError('Please select a step type and provide data');
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
    setResult(null);

    try {
      let response;

      if (stepType === 'appointment_types') {
        response = await base44.functions.invoke('importClinikoData', {
          action: 'import_appointment_types',
          data: Array.isArray(data) ? data : data.appointment_types,
          target_email: 'annievetphysio@gmail.com'
        });
        if (response.data.idMap) {
          setAppointmentTypeIdMap(response.data.idMap);
        }
      } else if (stepType === 'clients') {
        response = await base44.functions.invoke('importClinikoData', {
          action: 'import_clients',
          data: Array.isArray(data) ? data : data.clients,
          target_email: 'annievetphysio@gmail.com'
        });
        if (response.data.idMap) {
          setClientIdMap(response.data.idMap);
        }
      } else if (stepType === 'horses') {
        response = await base44.functions.invoke('importClinikoData', {
          action: 'import_horses',
          data: {
            horses: Array.isArray(data) ? data : data.horses,
            clientIdMap: clientIdMap
          },
          target_email: 'annievetphysio@gmail.com'
        });
        if (response.data.idMap) {
          setHorseIdMap(response.data.idMap);
        }
      } else if (stepType === 'appointments') {
        response = await base44.functions.invoke('importClinikoData', {
          action: 'import_appointments',
          data: {
            appointments: Array.isArray(data) ? data : data.appointments,
            clientIdMap: clientIdMap,
            horseIdMap: horseIdMap,
            appointmentTypeIdMap: appointmentTypeIdMap
          },
          target_email: 'annievetphysio@gmail.com'
        });
        if (response.data.idMap) {
          setAppointmentIdMap(response.data.idMap);
        }
      } else if (stepType === 'treatments') {
        response = await base44.functions.invoke('importClinikoData', {
          action: 'import_treatments',
          data: {
            treatments: Array.isArray(data) ? data : data.treatments,
            horseIdMap: horseIdMap,
            appointmentIdMap: appointmentIdMap
          },
          target_email: 'annievetphysio@gmail.com'
        });
      } else if (stepType === 'settings') {
        response = await base44.functions.invoke('importClinikoData', {
          action: 'import_settings',
          data: data,
          target_email: 'annievetphysio@gmail.com'
        });
      }

      setResult(response.data);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.response?.data?.error || err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const clearData = () => {
    setImportData('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="Step-by-Step Import"
        subtitle="Import one step at a time"
        backTo="Settings"
      />

      <div className="space-y-6">
        {/* Step Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-base font-bold text-gray-900 mb-3 block">
            Select Import Step
          </Label>
          <Select value={stepType} onValueChange={setStepType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose which data to import..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appointment_types">Step 1: Appointment Types</SelectItem>
              <SelectItem value="clients">Step 2: Clients</SelectItem>
              <SelectItem value="horses">Step 3: Horses</SelectItem>
              <SelectItem value="appointments">Step 4: Appointments</SelectItem>
              <SelectItem value="treatments">Step 5: Treatments</SelectItem>
              <SelectItem value="settings">Step 6: Settings</SelectItem>
            </SelectContent>
          </Select>
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
                  Upload JSON file
                </span>
              </div>
            </label>

            <div className="text-center text-gray-500">or paste JSON below</div>

            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='Paste JSON data here...'
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </div>

        {/* ID Maps Info */}
        {(Object.keys(clientIdMap).length > 0 || Object.keys(horseIdMap).length > 0 || 
          Object.keys(appointmentTypeIdMap).length > 0 || Object.keys(appointmentIdMap).length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h3 className="font-bold text-blue-900 mb-2">ID Mappings Stored</h3>
            <div className="text-sm text-blue-700 space-y-1">
              {Object.keys(appointmentTypeIdMap).length > 0 && <p>✓ Appointment Types: {Object.keys(appointmentTypeIdMap).length} mapped</p>}
              {Object.keys(clientIdMap).length > 0 && <p>✓ Clients: {Object.keys(clientIdMap).length} mapped</p>}
              {Object.keys(horseIdMap).length > 0 && <p>✓ Horses: {Object.keys(horseIdMap).length} mapped</p>}
              {Object.keys(appointmentIdMap).length > 0 && <p>✓ Appointments: {Object.keys(appointmentIdMap).length} mapped</p>}
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-600" size={24} />
              <p className="font-semibold text-green-900">Import Successful!</p>
            </div>
            <p className="text-sm text-green-700">
              Imported {result.imported} records
              {result.skipped > 0 && ` (${result.skipped} skipped)`}
            </p>
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={runImport}
            disabled={!importData || !stepType || importing}
            className="flex-1"
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
                Import
              </>
            )}
          </Button>

          <Button 
            onClick={clearData}
            disabled={importing}
            variant="outline"
            size="lg"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}